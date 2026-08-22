'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResponsiveFormModal } from '@/components/ui/responsive-form-modal'
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { MobilePageHeader } from '@/components/shell/MobilePageHeader'
import { Plus, Trash2, Pencil, Receipt } from 'lucide-react'
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

  function getMemberName(id: string) {
    return members.find(m => m.id === id)?.name ?? 'Unknown'
  }

  async function handleDelete() {
    if (!pendingDeleteId) return
    await deleteExpense(pendingDeleteId, tripId)
    setExpenses(prev => prev.filter(e => e.id !== pendingDeleteId))
    setPendingDeleteId(null)
    router.refresh()
  }

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
          <h1 className="text-2xl font-bold">Expenses</h1>
          <Button onClick={() => { setEditExpense(null); setOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" /> Add Expense
          </Button>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="mb-2">No expenses yet.</p>
            <Button onClick={() => { setEditExpense(null); setOpen(true) }}>Add Expense</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => {
              const cat = CATEGORIES[expense.category as keyof typeof CATEGORIES]
              const Icon = cat?.icon
              return (
                <div key={expense.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: cat?.color + '20' }}>
                    {Icon && <Icon className="h-4 w-4" style={{ color: cat?.color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{expense.description}</p>
                      <span className="font-semibold tabular-nums shrink-0">
                        {formatCurrency(parseFloat(expense.amount), currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(expense.date), 'MMM d')} · {getMemberName(expense.paid_by_id)}
                      </p>
                      <Badge variant={expense.type === 'shared' ? 'secondary' : 'outline'} className="text-xs">
                        {expense.type}
                      </Badge>
                      <div className="ml-auto flex items-center gap-1">
                        <Button variant="ghost" size="icon-xl" aria-label="Edit expense" onClick={() => { setEditExpense(expense); setOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-xl" aria-label="Delete expense" onClick={() => setPendingDeleteId(expense.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
