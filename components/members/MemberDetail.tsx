'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CATEGORIES } from '@/lib/categories'
import { computeBalances } from '@/lib/settlement'
import { formatCurrency } from '@/lib/format'
import { MobilePageHeader } from '@/components/shell/MobilePageHeader'
import type { Trip, Member, Expense, ExpenseSplit, Payment } from '@/lib/db/schema'

interface Props {
  trip: Trip
  member: Member
  allMembers: Member[]
  expenses: Expense[]
  expenseSplits: ExpenseSplit[]
  payments: Payment[]
}

export function MemberDetail({ trip, member, allMembers, expenses, expenseSplits, payments }: Props) {
  const balances = useMemo(
    () => computeBalances(allMembers, expenses, expenseSplits, payments),
    [allMembers, expenses, expenseSplits, payments]
  )

  const consumed = useMemo(() => {
    const personalSpent = expenses
      .filter(e => e.paidById === member.id && e.type === 'personal')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0)
    const splitConsumed = expenseSplits
      .filter(s => s.memberId === member.id)
      .reduce((sum, s) => sum + parseFloat(s.shareAmount), 0)
    return personalSpent + splitConsumed
  }, [expenses, expenseSplits, member.id])

  const budget = parseFloat(member.initialBudget || '0')
  const balance = balances[member.id] ?? 0
  const budgetPct = budget > 0 ? Math.min(100, (consumed / budget) * 100) : 0

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.filter(e => e.paidById === member.id && e.type === 'personal').forEach(e => {
      map[e.category] = (map[e.category] ?? 0) + parseFloat(e.amount)
    })
    const expenseById = new Map(expenses.map(e => [e.id, e]))
    expenseSplits.filter(s => s.memberId === member.id).forEach(s => {
      const expense = expenseById.get(s.expenseId)
      if (expense) {
        map[expense.category] = (map[expense.category] ?? 0) + parseFloat(s.shareAmount)
      }
    })
    return Object.entries(map).map(([key, value]) => ({
      name: CATEGORIES[key as keyof typeof CATEGORIES]?.label ?? key,
      amount: Math.round(value * 100) / 100,
      color: CATEGORIES[key as keyof typeof CATEGORIES]?.color ?? '#6b7280',
    }))
  }, [expenses, expenseSplits, member.id])

  const splitMap = useMemo(() => {
    const m: Record<string, number> = {}
    expenseSplits.filter(s => s.memberId === member.id).forEach(s => {
      m[s.expenseId] = parseFloat(s.shareAmount)
    })
    return m
  }, [expenseSplits, member.id])

  const memberSplitIds = useMemo(
    () => new Set(expenseSplits.filter(s => s.memberId === member.id).map(s => s.expenseId)),
    [expenseSplits, member.id]
  )

  const relevantExpenses = useMemo(
    () =>
      expenses
        .filter(e => e.paidById === member.id || memberSplitIds.has(e.id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, member.id, memberSplitIds]
  )

  const memberByIdMap = useMemo(() => new Map(allMembers.map(m => [m.id, m])), [allMembers])

  const paymentsMade = useMemo(
    () => payments.filter(p => p.fromMemberId === member.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [payments, member.id]
  )
  const paymentsReceived = useMemo(
    () => payments.filter(p => p.toMemberId === member.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [payments, member.id]
  )
  const hasSettlements = paymentsMade.length > 0 || paymentsReceived.length > 0

  return (
    <>
      <MobilePageHeader title={member.name} backHref={`/trips/${trip.id}/members`} />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="hidden md:flex items-center gap-3">
          <Link href={`/trips/${trip.id}/members`} aria-label="Back to members" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: member.color }}
          >
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{member.name}</h1>
              {member.isSelf && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">You</span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{trip.name}</p>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs text-muted-foreground">Budget</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <p className="text-sm md:text-lg font-bold">{formatCurrency(budget, trip.currency)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs text-muted-foreground">Consumed</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <p className="text-sm md:text-lg font-bold">{formatCurrency(consumed, trip.currency)}</p>
            </CardContent>
          </Card>
          <Card className={budget > 0 && budget - consumed < 0 ? 'ring-1 ring-destructive/30 bg-destructive/5' : ''}>
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs text-muted-foreground">Remaining</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              {budget > 0 ? (
                <p className={`text-sm md:text-lg font-bold ${budget - consumed < 0 ? 'text-destructive' : ''}`}>
                  {formatCurrency(budget - consumed, trip.currency)}
                </p>
              ) : (
                <p className="text-sm md:text-lg font-bold text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
          <Card className={balance > 0 ? 'ring-1 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10' : balance < 0 ? 'ring-1 ring-destructive/30 bg-destructive/5' : ''}>
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs text-muted-foreground">Settlement</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <p className={`text-sm md:text-lg font-bold ${balance > 0 ? 'text-emerald-600' : balance < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {balance > 0 ? `+${formatCurrency(balance, trip.currency)}` : balance < 0 ? `-${formatCurrency(Math.abs(balance), trip.currency)}` : 'Settled up'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {balance > 0 ? 'owed by group' : balance < 0 ? 'owes group' : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budget progress */}
        {budget > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Budget used</span>
              <span>{Math.round(budgetPct)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                role="progressbar"
                aria-valuenow={Math.round(budgetPct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Budget used"
                className="h-full rounded-full transition-all"
                style={{
                  width: `${budgetPct}%`,
                  backgroundColor: budgetPct >= 100 ? '#ef4444' : member.color,
                }}
              />
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {categoryData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Spending by Category</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[200px] md:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v), trip.currency)} />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settlements */}
        {hasSettlements && (
          <Card>
            <CardHeader><CardTitle>Settlements</CardTitle></CardHeader>
            <CardContent className="space-y-0">
              {paymentsMade.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="min-w-0 mr-2">
                    <p className="font-medium text-sm">Paid {memberByIdMap.get(p.toMemberId)?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(p.date), 'MMM d')}
                      {p.notes ? ` · ${p.notes}` : ''}
                    </p>
                  </div>
                  <span className="font-semibold text-sm text-destructive whitespace-nowrap">
                    -{formatCurrency(parseFloat(p.amount), trip.currency)}
                  </span>
                </div>
              ))}
              {paymentsReceived.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="min-w-0 mr-2">
                    <p className="font-medium text-sm">Received from {memberByIdMap.get(p.fromMemberId)?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(p.date), 'MMM d')}
                      {p.notes ? ` · ${p.notes}` : ''}
                    </p>
                  </div>
                  <span className="font-semibold text-sm text-emerald-600 whitespace-nowrap">
                    +{formatCurrency(parseFloat(p.amount), trip.currency)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Expense list */}
        {relevantExpenses.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Expenses</CardTitle></CardHeader>
            <CardContent className="space-y-0">
              {relevantExpenses.map(e => {
                const paid = e.paidById === member.id
                const splitAmount = splitMap[e.id]
                return (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="min-w-0 mr-2">
                      <p className="font-medium text-sm truncate">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(e.date), 'MMM d')} · {CATEGORIES[e.category as keyof typeof CATEGORIES]?.label}
                        {paid && e.type === 'shared' && <span className="ml-1 text-emerald-600">(fronted)</span>}
                        {paid && e.type === 'personal' && <span className="ml-1 text-muted-foreground">(personal)</span>}
                        {!paid && splitAmount != null && (
                          <span className="ml-1 text-muted-foreground">(share: {formatCurrency(splitAmount, trip.currency)})</span>
                        )}
                      </p>
                    </div>
                    <span className="font-semibold text-sm whitespace-nowrap">
                      {formatCurrency(parseFloat(e.amount), trip.currency)}
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {relevantExpenses.length === 0 && !hasSettlements && (
          <p className="text-center text-muted-foreground py-8">No activity for this member yet.</p>
        )}
      </div>
    </>
  )
}
