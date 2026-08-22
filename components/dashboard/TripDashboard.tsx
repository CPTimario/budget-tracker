'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { CATEGORIES } from '@/lib/categories'
import { format, eachDayOfInterval, parseISO } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MobilePageHeader } from '@/components/shell/MobilePageHeader'
import { Receipt, Users, ArrowLeftRight, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import type { Trip, Member, Expense, ExpenseSplit, Payment } from '@/lib/db/schema'
import { computeBalances } from '@/lib/settlement'
import { formatCurrency } from '@/lib/format'

interface Props {
  trip: Trip
  members: Member[]
  expenses: Expense[]
  expenseSplits: ExpenseSplit[]
  payments: Payment[]
}

export function TripDashboard({ trip, members, expenses, expenseSplits, payments }: Props) {
  const totalBudget = useMemo(() => members.reduce((sum, m) => sum + parseFloat(m.initialBudget || '0'), 0), [members])
  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0), [expenses])
  const remaining = totalBudget - totalSpent

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach(e => {
      map[e.category] = (map[e.category] ?? 0) + parseFloat(e.amount)
    })
    return Object.entries(map).map(([key, value]) => ({
      name: CATEGORIES[key as keyof typeof CATEGORIES]?.label ?? key,
      value: Math.round(value * 100) / 100,
      color: CATEGORIES[key as keyof typeof CATEGORIES]?.color ?? '#6b7280',
    }))
  }, [expenses])

  const dailyData = useMemo(() => {
    try {
      const tripStart = parseISO(trip.startDate)
      const tripEnd = parseISO(trip.endDate)
      const expenseDates = expenses.map(e => parseISO(e.date))
      const start = expenseDates.length ? expenseDates.reduce((a, b) => a < b ? a : b, tripStart) : tripStart
      const end = expenseDates.length ? expenseDates.reduce((a, b) => a > b ? a : b, tripEnd) : tripEnd
      const days = eachDayOfInterval({ start, end })
      return days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const total = expenses.filter(e => e.date === dateStr).reduce((sum, e) => sum + parseFloat(e.amount), 0)
        return { date: format(day, 'MMM d'), amount: Math.round(total * 100) / 100 }
      })
    } catch {
      return []
    }
  }, [trip, expenses])

  const memberSpendingData = useMemo(() =>
    members.map(m => ({
      name: m.name,
      spent: Math.round(expenses.filter(e => e.paidById === m.id).reduce((sum, e) => sum + parseFloat(e.amount), 0) * 100) / 100,
      color: m.color,
    }))
  , [members, expenses])

  const recentExpenses = useMemo(() =>
    [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
  , [expenses])

  const balances = useMemo(() => computeBalances(members, expenses, expenseSplits, payments), [members, expenses, expenseSplits, payments])

  const memberSummaries = useMemo(() =>
    members.map(m => {
      const personalSpent = expenses
        .filter(e => e.paidById === m.id && e.type === 'personal')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0)
      const splitConsumed = expenseSplits
        .filter(s => s.memberId === m.id)
        .reduce((sum, s) => sum + parseFloat(s.shareAmount), 0)
      return {
        member: m,
        consumed: personalSpent + splitConsumed,
        balance: balances[m.id] ?? 0,
      }
    })
  , [members, expenses, expenseSplits, balances])

  const budgetPct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0
  const isEmpty = members.length === 0 && expenses.length === 0

  return (
    <>
      <MobilePageHeader title={trip.name} backHref="/trips" />
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="hidden md:block text-2xl font-bold">{trip.name}</h1>
        <p className="text-muted-foreground">{trip.destination}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent><p className="text-xl md:text-2xl font-bold">{formatCurrency(totalBudget, trip.currency)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Total Spent</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent><p className="text-xl md:text-2xl font-bold">{formatCurrency(totalSpent, trip.currency)}</p></CardContent>
        </Card>
        <Card className={remaining >= 0 ? 'ring-1 ring-primary/30 bg-primary/5' : 'ring-1 ring-destructive/30 bg-destructive/5'}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Remaining</CardTitle>
              {remaining >= 0 ? <TrendingUp className="h-4 w-4 text-muted-foreground" /> : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CardHeader>
          <CardContent><p className={`text-xl md:text-2xl font-bold ${remaining >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(remaining, trip.currency)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent><p className="text-xl md:text-2xl font-bold">{expenses.length}</p></CardContent>
        </Card>
      </div>

      {totalBudget > 0 && (
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
              className="h-full rounded-full transition-all bg-primary"
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="mb-1 font-medium">No members yet</p>
          <p className="text-sm mb-4">Start by adding your trip members</p>
          <Link href={`/trips/${trip.id}/members`}><Button>Add Members</Button></Link>
        </div>
      ) : (
        <>
          {memberSummaries.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold">Members</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {memberSummaries.map(({ member, consumed, balance }) => (
                  <Link key={member.id} href={`/trips/${trip.id}/members/${member.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-4 pb-3 px-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ backgroundColor: member.color }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{member.name}</p>
                            {member.isSelf && (
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">You</span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Budget</span>
                            <span className="font-medium text-foreground">{formatCurrency(parseFloat(member.initialBudget || '0'), trip.currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Consumed</span>
                            <span className="font-medium text-foreground">{formatCurrency(consumed, trip.currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Net balance</span>
                            <span className={`font-semibold ${balance > 0 ? 'text-emerald-600' : balance < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {balance > 0 ? `Owed ${formatCurrency(balance, trip.currency)}` : balance < 0 ? `Owes ${formatCurrency(Math.abs(balance), trip.currency)}` : 'Settled'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="hidden md:flex gap-3 flex-wrap">
            <Link href={`/trips/${trip.id}/expenses`}><Button variant="outline" size="sm"><Receipt className="h-4 w-4 mr-2" />Expenses</Button></Link>
            <Link href={`/trips/${trip.id}/members`}><Button variant="outline" size="sm"><Users className="h-4 w-4 mr-2" />Members</Button></Link>
            <Link href={`/trips/${trip.id}/settle`}><Button variant="outline" size="sm"><ArrowLeftRight className="h-4 w-4 mr-2" />Settle</Button></Link>
          </div>

          <Tabs defaultValue="category">
            <TabsList>
              <TabsTrigger value="category">By Category</TabsTrigger>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="member">By Member</TabsTrigger>
            </TabsList>

            <TabsContent value="category">
              <Card>
                <CardHeader><CardTitle>Spending by Category</CardTitle></CardHeader>
                <CardContent>
                  {categoryData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No expenses yet</p>
                  ) : (
                    <div className="h-[240px] md:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                            {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(Number(v), trip.currency)} />
                          <Legend wrapperStyle={{ paddingTop: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="daily">
              <Card>
                <CardHeader><CardTitle>Daily Spending</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[200px] md:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData}>
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => `${trip.currency} ${Number(v).toFixed(2)}`} />
                        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="member">
              <Card>
                <CardHeader><CardTitle>Spending by Member</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[200px] md:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={memberSpendingData} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => `${trip.currency} ${Number(v).toFixed(2)}`} />
                        <Bar dataKey="spent" radius={[0, 4, 4, 0]}>
                          {memberSpendingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {recentExpenses.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Expenses</CardTitle>
                <Link href={`/trips/${trip.id}/expenses`}>
                  <Button variant="ghost" size="sm" aria-label="View all expenses">View All</Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentExpenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between py-1 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{e.description}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(e.date), 'MMM d')} · {CATEGORIES[e.category as keyof typeof CATEGORIES]?.label}</p>
                    </div>
                    <span className="font-semibold text-sm">{formatCurrency(parseFloat(e.amount), trip.currency)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

    </div>
    </>
  )
}
