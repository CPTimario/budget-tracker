'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResponsiveFormModal } from '@/components/ui/responsive-form-modal'
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { MobilePageHeader } from '@/components/shell/MobilePageHeader'
import { Plus, Trash2, Pencil, Receipt } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { deleteExpense } from '@/server/actions/expenses'
import { CATEGORIES } from '@/lib/categories'
import { formatCurrency } from '@/lib/format'
import { format } from 'date-fns'
import { ExpenseForm } from './ExpenseForm'
import type { Trip, Member, Expense, ExpenseSplit } from '@/lib/db/schema'

interface LocalExpense {
  id: string
  description: string
  amount: string
  category: string
  paid_by_id: string
  type: string
  date: string
  splitMemberIds: string[]
}

function toLocal(e: Expense, splitMap: Map<string, string[]>): LocalExpense {
  return {
    id: e.id,
    description: e.description,
    amount: e.amount,
    category: e.category,
    paid_by_id: e.paidById,
    type: e.type,
    date: e.date,
    splitMemberIds: splitMap.get(e.id) ?? [],
  }
}

interface Props {
  tripId: string
  initialTrip: Trip
  initialMembers: Member[]
  initialExpenses: Expense[]
  initialExpenseSplits: ExpenseSplit[]
}

export function ExpensesPage({ tripId, initialTrip, initialMembers, initialExpenses, initialExpenseSplits }: Props) {
  const router = useRouter()
  const splitMap = new Map<string, string[]>()
  initialExpenseSplits.forEach(s => {
    const arr = splitMap.get(s.expenseId) ?? []
    arr.push(s.memberId)
    splitMap.set(s.expenseId, arr)
  })
  const [expenses, setExpenses] = useState<LocalExpense[]>(initialExpenses.map(e => toLocal(e, splitMap)))
  const members = initialMembers.map(m => ({ id: m.id, name: m.name, color: m.color, isSelf: m.isSelf }))
  const currency = initialTrip.currency
  const [open, setOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<LocalExpense | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function getMemberName(id: string) {
    return members.find(m => m.id === id)?.name ?? 'Unknown'
  }

  function handleDelete() {
    if (!pendingDeleteId) return
    startTransition(async () => {
      await deleteExpense(pendingDeleteId, tripId)
      setExpenses(prev => prev.filter(e => e.id !== pendingDeleteId))
      setPendingDeleteId(null)
      router.refresh()
    })
  }

  const grouped = Object.entries(
    expenses.reduce<Record<string, typeof expenses>>((groups, expense) => {
      const key = expense.date
      groups[key] = groups[key] ?? []
      groups[key].push(expense)
      return groups
    }, {})
  ).sort(([a], [b]) => b.localeCompare(a))

  return (
    <>
      <MobilePageHeader
        title="Expenses"
        backHref={`/trips/${tripId}`}
        action={
          <Button size="sm" onClick={() => { setEditExpense(null); setOpen(true) }}>
            <Plus className="h-4 w-4" />
          </Button>
        }
      />

      <div className="p-4 md:p-6">
        <div className="hidden md:flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</p>
          </div>
          <Button onClick={() => { setEditExpense(null); setOpen(true) }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>

        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            heading="No expenses yet"
            body="Log your first expense to start tracking"
            action={{ label: 'Add Expense', onClick: () => { setEditExpense(null); setOpen(true) } }}
          />
        ) : (
          <div className="space-y-5">
            {grouped.map(([date, group]) => {
              const dayTotal = group.reduce((sum, e) => sum + parseFloat(e.amount), 0)
              return (
                <div key={date}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {format(new Date(date), 'EEEE, MMM d')}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {formatCurrency(dayTotal, currency)}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {group.map((expense) => {
                      const cat = CATEGORIES[expense.category as keyof typeof CATEGORIES]
                      const Icon = cat?.icon
                      return (
                        <div
                          key={expense.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
                        >
                          <div
                            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: cat?.color + '18' }}
                          >
                            {Icon && <Icon className="h-4 w-4" style={{ color: cat?.color }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm truncate">{expense.description}</p>
                              <span className="font-bold text-sm tabular-nums shrink-0">
                                {formatCurrency(parseFloat(expense.amount), currency)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-muted-foreground truncate">
                                {getMemberName(expense.paid_by_id)}
                              </p>
                              <Badge
                                variant={expense.type === 'shared' ? 'secondary' : 'outline'}
                                className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                              >
                                {expense.type}
                              </Badge>
                              <div className="ml-auto flex items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon-xl"
                                  aria-label="Edit expense"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => { setEditExpense(expense); setOpen(true) }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xl"
                                  aria-label="Delete expense"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => setPendingDeleteId(expense.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ResponsiveFormModal
        open={open}
        onOpenChange={setOpen}
        title={editExpense ? 'Edit Expense' : 'Log Expense'}
      >
        <ExpenseForm
          key={editExpense?.id ?? 'new'}
          tripId={tripId}
          members={members}
          currency={currency}
          expense={editExpense}
          onSuccess={() => { setOpen(false); router.refresh() }}
          onCancel={() => setOpen(false)}
        />
      </ResponsiveFormModal>

      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(o) => { if (!o) setPendingDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete expense?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
