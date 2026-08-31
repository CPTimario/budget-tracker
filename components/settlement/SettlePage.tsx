'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResponsiveFormModal } from '@/components/ui/responsive-form-modal'
import { MobilePageHeader } from '@/components/shell/MobilePageHeader'
import { Input } from '@/components/ui/input'
import { computeBalances, simplifyDebts } from '@/lib/settlement'
import { formatCurrency } from '@/lib/format'
import { createSettlement } from '@/server/actions/settlements'
import { format } from 'date-fns'
import { ArrowRight, History } from 'lucide-react'
import { CATEGORIES } from '@/lib/categories'
import type { Member, Expense, ExpenseSplit, Settlement, Transfer } from '@/lib/db/schema'

interface Props {
  tripId: string
  currency: string
  initialMembers: Member[]
  initialExpenses: Expense[]
  initialSplits: ExpenseSplit[]
  initialSettlements: Settlement[]
  initialSettlementItems: { settlementId: string; expenseSplitId: string }[]
  initialTransfers: Transfer[]
}

interface DebtItem {
  splitId: string
  expenseId: string
  description: string
  category: string
  date: string
  shareAmount: number
  paidBySettlementId?: string
}

function getDebtBreakdown(
  fromId: string,
  toId: string,
  expenses: Expense[],
  splits: ExpenseSplit[],
  paidSplitIds: Map<string, string>,
): DebtItem[] {
  return expenses
    .filter((e) => e.type === 'shared' && e.paidById === toId)
    .flatMap((e) => {
      const split = splits.find((s) => s.expenseId === e.id && s.memberId === fromId)
      if (!split) return []
      return [{
        splitId: split.id,
        expenseId: e.id,
        description: e.description,
        category: e.category,
        date: e.date,
        shareAmount: Math.round(parseFloat(String(split.shareAmount)) * 100) / 100,
        paidBySettlementId: paidSplitIds.get(split.id),
      }]
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function SettlePage({
  tripId,
  currency,
  initialMembers,
  initialExpenses,
  initialSplits,
  initialSettlements,
  initialSettlementItems,
  initialTransfers,
}: Props) {
  const router = useRouter()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<{ from: string; to: string; amount: number } | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [customAmount, setCustomAmount] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const settlementExpenseMap = useMemo(() => {
    const map = new Map<string, Expense>()
    for (const item of initialSettlementItems) {
      if (!map.has(item.settlementId)) {
        const split = initialSplits.find((s) => s.id === item.expenseSplitId)
        if (split) {
          const expense = initialExpenses.find((e) => e.id === split.expenseId)
          if (expense) map.set(item.settlementId, expense)
        }
      }
    }
    return map
  }, [initialSettlementItems, initialSplits, initialExpenses])

  const balances = initialMembers.length
    ? computeBalances(initialMembers, initialExpenses, initialSplits, initialSettlements, settlementExpenseMap, initialTransfers)
    : {}
  const debts = simplifyDebts(balances)

  const paidSplitIds = useMemo(() =>
    new Map(initialSettlementItems.map((si) => [si.expenseSplitId, si.settlementId])),
    [initialSettlementItems]
  )

  const breakdown = useMemo(() => {
    if (!selectedDebt) return []
    return getDebtBreakdown(selectedDebt.from, selectedDebt.to, initialExpenses, initialSplits, paidSplitIds)
  }, [selectedDebt, initialExpenses, initialSplits, paidSplitIds])

  const unpaidBreakdown = useMemo(() => breakdown.filter((i) => !i.paidBySettlementId), [breakdown])

  const selectedTotal = useMemo(() =>
    unpaidBreakdown
      .filter((item) => selectedItems.has(item.splitId))
      .reduce((sum, item) => sum + item.shareAmount, 0),
    [unpaidBreakdown, selectedItems]
  )

  // When all items are selected, use the pre-calculated net settlement amount (debt.amount)
  // rather than the gross sum of splits — the net accounts for reverse debts.
  const defaultAmount = unpaidBreakdown.length > 0 && selectedItems.size === unpaidBreakdown.length
    ? (selectedDebt?.amount ?? selectedTotal)
    : selectedTotal

  const payAmount = useCustom ? parseFloat(customAmount || '0') : defaultAmount

  function getMemberName(id: string) {
    return initialMembers.find((m) => m.id === id)?.name ?? 'Unknown'
  }

  function openPayment(debt: { from: string; to: string; amount: number }) {
    setSelectedDebt(debt)
    setPayDate(format(new Date(), 'yyyy-MM-dd'))
    setUseCustom(false)
    setCustomAmount('')
    const items = getDebtBreakdown(debt.from, debt.to, initialExpenses, initialSplits, paidSplitIds)
    setSelectedItems(new Set(items.filter((i) => !i.paidBySettlementId).map((i) => i.splitId)))
    setPaymentOpen(true)
  }

  function toggleItem(splitId: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      next.has(splitId) ? next.delete(splitId) : next.add(splitId)
      return next
    })
    setUseCustom(false)
  }

  function toggleAll() {
    if (selectedItems.size === unpaidBreakdown.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(unpaidBreakdown.map((i) => i.splitId)))
    }
    setUseCustom(false)
  }

  async function handlePayment() {
    if (!selectedDebt || payAmount <= 0) return
    setIsSubmitting(true)
    try {
      await createSettlement(tripId, {
        fromMemberId: selectedDebt.from,
        toMemberId: selectedDebt.to,
        amount: payAmount,
        currency,
        date: payDate,
        coveredSplitIds: Array.from(selectedItems),
      })
      setPaymentOpen(false)
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  const allChecked = unpaidBreakdown.length > 0 && selectedItems.size === unpaidBreakdown.length

  return (
    <>
      <MobilePageHeader title="Settle Up" backHref={`/trips/${tripId}`} />
    <div className="p-4 md:p-6">
      <h1 className="hidden md:block text-2xl font-bold mb-6">Settle Up</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Balances</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {initialMembers.map((member) => {
            const balance = balances[member.id] ?? 0
            return (
              <Card key={member.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-full shrink-0" style={{ backgroundColor: member.color }} />
                    <span className="font-medium text-sm truncate">{member.name}</span>
                  </div>
                  <Badge variant={balance >= 0 ? 'default' : 'destructive'}>
                    {balance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(balance), currency)}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Who Owes What</h2>
        {debts.length === 0 ? (
          <p className="text-muted-foreground">All settled up!</p>
        ) : (
          <div className="space-y-3">
            {debts.map((debt, i) => (
              <Card key={i}>
                <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{getMemberName(debt.from)}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getMemberName(debt.to)}</span>
                    <Badge variant="outline">{formatCurrency(debt.amount, currency)}</Badge>
                  </div>
                  <Button size="sm" onClick={() => openPayment(debt)}>Mark Paid</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {initialSettlements.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <History className="h-5 w-5" />
            Settlement History
          </h2>
          <div className="space-y-2">
            {[...initialSettlements]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((settlement) => {
                const coveredSplitIds = initialSettlementItems
                  .filter((si) => si.settlementId === settlement.id)
                  .map((si) => si.expenseSplitId)
                const coveredExpenses = coveredSplitIds
                  .map((splitId) => {
                    const split = initialSplits.find((s) => s.id === splitId)
                    if (!split) return null
                    return initialExpenses.find((e) => e.id === split.expenseId)
                  })
                  .filter(Boolean) as Expense[]

                return (
                  <Card key={settlement.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{getMemberName(settlement.fromMemberId)}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{getMemberName(settlement.toMemberId)}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground">{format(new Date(settlement.date), 'MMM d, yyyy')}</span>
                          <Badge variant="secondary">{formatCurrency(parseFloat(String(settlement.amount)), settlement.currency)}</Badge>
                        </div>
                      </div>
                      {coveredExpenses.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {coveredExpenses.map((e) => (
                            <Badge key={e.id} variant="outline" className="text-xs font-normal">{e.description}</Badge>
                          ))}
                        </div>
                      )}
                      {settlement.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{settlement.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </div>
      )}

      <ResponsiveFormModal open={paymentOpen} onOpenChange={setPaymentOpen} title="Record Settlement">
          {selectedDebt && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {getMemberName(selectedDebt.from)} pays {getMemberName(selectedDebt.to)}
              </p>

              {breakdown.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={allChecked}
                    className="flex items-center gap-3 px-3 py-2 bg-muted/50 cursor-pointer hover:bg-muted transition-colors w-full text-left"
                    onClick={toggleAll}
                  >
                    <span
                      className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${allChecked ? 'bg-primary border-primary' : 'border-input bg-background'}`}
                      aria-hidden
                    >
                      {allChecked && <span className="block h-2 w-2 bg-primary-foreground rounded-sm" />}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">All expenses</span>
                  </button>
                  <div className="divide-y max-h-56 overflow-y-auto">
                    {breakdown.map((item) => {
                      const cat = CATEGORIES[item.category as keyof typeof CATEGORIES]
                      const isPaid = !!item.paidBySettlementId
                      const checked = selectedItems.has(item.splitId)
                      return (
                        <button
                          key={item.splitId}
                          type="button"
                          role="checkbox"
                          aria-checked={isPaid ? false : checked}
                          disabled={isPaid}
                          className={`flex items-center gap-3 px-3 py-2 transition-colors w-full text-left ${
                            isPaid
                              ? 'opacity-50 cursor-not-allowed bg-muted/30'
                              : `cursor-pointer hover:bg-muted/50 ${checked ? '' : 'opacity-60'}`
                          }`}
                          onClick={() => !isPaid && toggleItem(item.splitId)}
                        >
                          <span
                            className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                              !isPaid && checked ? 'bg-primary border-primary' : 'border-input bg-background'
                            }`}
                            aria-hidden
                          >
                            {!isPaid && checked && <span className="block h-2 w-2 bg-primary-foreground rounded-sm" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{item.description}</p>
                              {isPaid && <Badge variant="secondary" className="text-xs shrink-0">Paid</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.date), 'MMM d')} · {cat?.label ?? item.category}
                            </p>
                          </div>
                          <span className="text-sm font-semibold tabular-nums shrink-0">
                            {formatCurrency(item.shareAmount, currency)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="payAmount" className="text-xs text-muted-foreground">Amount</label>
                <Input
                  id="payAmount"
                  type="number"
                  step="0.01"
                  value={useCustom ? customAmount : defaultAmount.toFixed(2)}
                  readOnly={!useCustom}
                  onChange={(e) => { setCustomAmount(e.target.value) }}
                  placeholder="Amount"
                />
                {!useCustom ? (
                  <button
                    type="button"
                    className="text-xs text-primary underline"
                    onClick={() => { setUseCustom(true); setCustomAmount(selectedTotal.toFixed(2)) }}
                  >
                    Enter custom amount
                  </button>
                ) : selectedTotal > 0 ? (
                  <button
                    type="button"
                    className="text-xs text-primary underline"
                    onClick={() => { setUseCustom(false); setCustomAmount('') }}
                  >
                    Reset to selected ({formatCurrency(defaultAmount, currency)})
                  </button>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor="payDate" className="text-sm font-medium">Settlement date</label>
                <Input
                  id="payDate"
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
                <Button onClick={handlePayment} disabled={payAmount <= 0 || isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Record Settlement'}
                </Button>
              </div>
            </div>
          )}
      </ResponsiveFormModal>
    </div>
    </>
  )
}
