'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { deleteExpense } from '@/server/actions/expenses'
import { CATEGORIES } from '@/lib/categories'
import { format } from 'date-fns'
import { ExpenseForm } from './ExpenseForm'
import type { Trip, Member, Expense } from '@/lib/db/schema'

// ExpenseForm expects this shape
interface LocalExpense {
  id: string
  description: string
  amount: string
  category: string
  paid_by_id: string
  type: string
  date: string
}

function toLocal(e: Expense): LocalExpense {
  return { id: e.id, description: e.description, amount: e.amount, category: e.category, paid_by_id: e.paidById, type: e.type, date: e.date }
}

interface Props {
  tripId: string
  initialTrip: Trip
  initialMembers: Member[]
  initialExpenses: Expense[]
}

export function ExpensesPage({ tripId, initialTrip, initialMembers, initialExpenses }: Props) {
  const [expenses, setExpenses] = useState<LocalExpense[]>(initialExpenses.map(toLocal))
  const members = initialMembers.map(m => ({ id: m.id, name: m.name, color: m.color, isSelf: m.isSelf }))
  const currency = initialTrip.currency
  const [open, setOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<LocalExpense | null>(null)

  function getMemberName(id: string) {
    return members.find(m => m.id === id)?.name ?? 'Unknown'
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return
    await deleteExpense(id, tripId)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button onClick={() => { setEditExpense(null); setOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Add Expense
        </Button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No expenses yet. Start logging your trip costs.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => {
            const cat = CATEGORIES[expense.category as keyof typeof CATEGORIES]
            const Icon = cat?.icon
            return (
              <div key={expense.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ backgroundColor: cat?.color + '20' }}>
                  {Icon && <Icon className="h-4 w-4" style={{ color: cat?.color }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(expense.date), 'MMM d')} · {getMemberName(expense.paid_by_id)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={expense.type === 'shared' ? 'secondary' : 'outline'}>
                    {expense.type}
                  </Badge>
                  <span className="font-semibold tabular-nums">
                    {currency} {parseFloat(expense.amount).toFixed(2)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditExpense(expense); setOpen(true) }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(expense.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editExpense ? 'Edit Expense' : 'Log Expense'}</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            key={editExpense?.id ?? 'new'}
            tripId={tripId}
            members={members}
            currency={currency}
            expense={editExpense}
            onSuccess={() => { setOpen(false); window.location.reload() }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
