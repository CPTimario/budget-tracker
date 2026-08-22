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
import type { Trip, Member, Expense } from '@/lib/db/schema'

interface Props {
  trip: Trip
  members: Member[]
  expenses: Expense[]
}

export function TripDashboard({ trip, members, expenses }: Props) {
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

  return (
    <>
      <MobilePageHeader title={trip.name} backHref="/trips" />
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="hidden md:block text-2xl font-bold">{trip.name}</h1>
        <p className="text-muted-foreground">{trip.destination}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{trip.currency} {totalBudget.toFixed(0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Total Spent</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{trip.currency} {totalSpent.toFixed(0)}</p></CardContent>
        </Card>
        <Card className={remaining >= 0 ? 'ring-1 ring-primary/30 bg-primary/5' : 'ring-1 ring-destructive/30 bg-destructive/5'}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Remaining</CardTitle>
              {remaining >= 0 ? <TrendingUp className="h-4 w-4 text-muted-foreground" /> : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CardHeader>
          <CardContent><p className={`text-2xl font-bold ${remaining >= 0 ? 'text-primary' : 'text-destructive'}`}>{trip.currency} {remaining.toFixed(0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{expenses.length}</p></CardContent>
        </Card>
      </div>

      {totalBudget > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Budget used</span>
            <span>{Math.round((totalSpent / totalBudget) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all bg-primary"
              style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
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
                <div className="h-[200px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                        {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${trip.currency} ${Number(v).toFixed(2)}`} />
                      <Legend />
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
                    <Bar dataKey="amount" fill="#0d9488" radius={[4, 4, 0, 0]} />
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
            <Link href={`/trips/${trip.id}/expenses`}><Button variant="ghost" size="sm">View All</Button></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentExpenses.map(e => (
              <div key={e.id} className="flex items-center justify-between py-1 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{e.description}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(e.date), 'MMM d')} · {CATEGORIES[e.category as keyof typeof CATEGORIES]?.label}</p>
                </div>
                <span className="font-semibold text-sm">{trip.currency} {parseFloat(e.amount).toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
    </>
  )
}
