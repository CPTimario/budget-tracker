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
import { createPayment } from '@/server/actions/payments'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { CATEGORIES } from '@/lib/categories'
import type { Member, Expense, ExpenseSplit, Payment } from '@/lib/db/schema'

interface Props {
  tripId: string
  currency: string
  initialMembers: Member[]
  initialExpenses: Expense[]
  initialSplits: ExpenseSplit[]
  initialPayments: Payment[]
}

interface DebtItem {
  splitId: string
  expenseId: string
  description: string
  category: string
  date: string
  shareAmount: number
}

function getDebtBreakdown(
  fromId: string,
  toId: string,
  expenses: Expense[],
  splits: ExpenseSplit[],
): DebtItem[] {
  // shared expenses paid by `to` where `from` has a split
  return expenses
    .filter(e => e.type === 'shared' && e.paidById === toId)
    .flatMap(e => {
      const split = splits.find(s => s.expenseId === e.id && s.memberId === fromId)
      if (!split) return []
      return [{
        splitId: split.id,
        expenseId: e.id,
        description: e.description,
        category: e.category,
        date: e.date,
        shareAmount: Math.round(parseFloat(String(split.shareAmount)) * 100) / 100,
      }]
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function SettlePage({ tripId, currency, initialMembers, initialExpenses, initialSplits, initialPayments }: Props) {
  const router = useRouter()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<{ from: string; to: string; amount: number } | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [customAmount, setCustomAmount] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [payDate, setPayDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const balances = initialMembers.length
    ? computeBalances(initialMembers, initialExpenses, initialSplits, initialPayments)
    : {}
  const debts = simplifyDebts(balances)

  const breakdown = useMemo(() => {
    if (!selectedDebt) return []
    return getDebtBreakdown(selectedDebt.from, selectedDebt.to, initialExpenses, initialSplits)
  }, [selectedDebt, initialExpenses, initialSplits])

  const selectedTotal = useMemo(() =>
    breakdown
      .filter(item => selectedItems.has(item.splitId))
      .reduce((sum, item) => sum + item.shareAmount, 0),
    [breakdown, selectedItems]
  )

  const payAmount = useCustom ? parseFloat(customAmount || '0') : selectedTotal

  function getMemberName(id: string) {
    return initialMembers.find(m => m.id === id)?.name ?? 'Unknown'
  }

  function openPayment(debt: { from: string; to: string; amount: number }) {
    setSelectedDebt(debt)
    setPayDate(format(new Date(), 'yyyy-MM-dd'))
    setUseCustom(false)
    setCustomAmount('')
    // pre-select all breakdown items
    const items = getDebtBreakdown(debt.from, debt.to, initialExpenses, initialSplits)
    setSelectedItems(new Set(items.map(i => i.splitId)))
    setPaymentOpen(true)
  }

  function toggleItem(splitId: string) {
    setSelectedItems(prev => {
      const next = new Set(prev)
      next.has(splitId) ? next.delete(splitId) : next.add(splitId)
      return next
    })
    setUseCustom(false)
  }

  function toggleAll() {
    if (selectedItems.size === breakdown.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(breakdown.map(i => i.splitId)))
    }
    setUseCustom(false)
  }

  async function handlePayment() {
    if (!selectedDebt || payAmount <= 0) return
    await createPayment(tripId, {
      fromMemberId: selectedDebt.from,
      toMemberId: selectedDebt.to,
      amount: payAmount,
      date: payDate,
    })
    setPaymentOpen(false)
    router.refresh()
  }

  return (
    <>
      <MobilePageHeader title="Settle Up" backHref={`/trips/${tripId}`} />
    <div className="p-4 md:p-6">
      <h1 className="hidden md:block text-2xl font-bold mb-6">Settle Up</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Balances</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {initialMembers.map(member => {
            const balance = balances[member.id] ?? 0
            return (
              <Card key={member.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-full" style={{ backgroundColor: member.color }} />
                    <span className="font-medium text-sm">{member.name}</span>
                  </div>
                  <Badge variant={balance >= 0 ? 'default' : 'destructive'}>
                    {balance >= 0 ? '+' : ''}{balance.toFixed(2)}
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
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{getMemberName(debt.from)}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getMemberName(debt.to)}</span>
                    <Badge variant="outline">{currency} {debt.amount.toFixed(2)}</Badge>
                  </div>
                  <Button size="sm" onClick={() => openPayment(debt)}>Mark Paid</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ResponsiveFormModal open={paymentOpen} onOpenChange={setPaymentOpen} title="Record Payment">
          {selectedDebt && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {getMemberName(selectedDebt.from)} pays {getMemberName(selectedDebt.to)}
              </p>

              {breakdown.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center gap-3 px-3 py-2 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={toggleAll}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={selectedItems.size === breakdown.length}
                      className="pointer-events-none"
                    />
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">All expenses</span>
                  </div>
                  <div className="divide-y max-h-56 overflow-y-auto">
                    {breakdown.map(item => {
                      const cat = CATEGORIES[item.category as keyof typeof CATEGORIES]
                      const checked = selectedItems.has(item.splitId)
                      return (
                        <div
                          key={item.splitId}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${checked ? '' : 'opacity-50'}`}
                          onClick={() => toggleItem(item.splitId)}
                        >
                          <input type="checkbox" readOnly checked={checked} className="pointer-events-none shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.date), 'MMM d')} · {cat?.label ?? item.category}
                            </p>
                          </div>
                          <span className="text-sm font-semibold tabular-nums shrink-0">
                            {currency} {item.shareAmount.toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={useCustom ? customAmount : selectedTotal.toFixed(2)}
                  onChange={e => { setUseCustom(true); setCustomAmount(e.target.value) }}
                  placeholder="Amount"
                />
                {useCustom && selectedTotal > 0 && (
                  <button
                    type="button"
                    className="text-xs text-primary underline"
                    onClick={() => { setUseCustom(false); setCustomAmount('') }}
                  >
                    Reset to selected ({currency} {selectedTotal.toFixed(2)})
                  </button>
                )}
              </div>

              <Input
                type="date"
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
              />

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
                <Button onClick={handlePayment} disabled={payAmount <= 0}>Record Payment</Button>
              </div>
            </div>
          )}
      </ResponsiveFormModal>
    </div>
    </>
  )
}
