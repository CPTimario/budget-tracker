import type { Expense, ExpenseSplit, Settlement, Transfer } from '@/lib/db/schema'

export type WalletTransaction = {
  id: string
  date: string
  type: 'expense_paid' | 'expense_split' | 'settlement_sent' | 'settlement_received' | 'transfer_sent' | 'transfer_received'
  description: string
  amount: number
  currency: string
  amountInTrip?: number
  tripCurrency: string
  counterpartMemberId?: string
  category?: string
}

export function buildTransactionHistory(
  memberId: string,
  expenses: Expense[],
  expenseSplits: ExpenseSplit[],
  settlements: Settlement[],
  transfers: Transfer[],
  tripCurrency: string
): WalletTransaction[] {
  const txns: WalletTransaction[] = []

  for (const expense of expenses) {
    const expCurrency = expense.currency ?? tripCurrency
    const rate = expense.exchangeRate ? parseFloat(String(expense.exchangeRate)) : 1
    const amount = parseFloat(String(expense.amount))

    if (expense.paidById === memberId) {
      txns.push({
        id: `expense_paid_${expense.id}`,
        date: expense.date,
        type: 'expense_paid',
        description: expense.description,
        amount,
        currency: expCurrency,
        amountInTrip: expCurrency !== tripCurrency ? amount * rate : undefined,
        tripCurrency,
        category: expense.category,
      })
    } else {
      const split = expenseSplits.find((s) => s.expenseId === expense.id && s.memberId === memberId)
      if (split) {
        const splitAmount = parseFloat(String(split.shareAmount))
        txns.push({
          id: `expense_split_${split.id}`,
          date: expense.date,
          type: 'expense_split',
          description: expense.description,
          amount: splitAmount,
          currency: expCurrency,
          amountInTrip: expCurrency !== tripCurrency ? splitAmount * rate : undefined,
          tripCurrency,
          counterpartMemberId: expense.paidById,
          category: expense.category,
        })
      }
    }
  }

  for (const settlement of settlements) {
    const amount = parseFloat(String(settlement.amount))
    if (settlement.fromMemberId === memberId) {
      txns.push({
        id: `settlement_sent_${settlement.id}`,
        date: settlement.date,
        type: 'settlement_sent',
        description: settlement.notes ?? 'Settlement',
        amount,
        currency: settlement.currency,
        tripCurrency,
        counterpartMemberId: settlement.toMemberId,
      })
    } else if (settlement.toMemberId === memberId) {
      txns.push({
        id: `settlement_received_${settlement.id}`,
        date: settlement.date,
        type: 'settlement_received',
        description: settlement.notes ?? 'Settlement',
        amount,
        currency: settlement.currency,
        tripCurrency,
        counterpartMemberId: settlement.fromMemberId,
      })
    }
  }

  for (const transfer of transfers) {
    const amount = parseFloat(String(transfer.amount))
    const rate = transfer.exchangeRateToTrip ? parseFloat(String(transfer.exchangeRateToTrip)) : 1
    if (transfer.fromMemberId === memberId) {
      txns.push({
        id: `transfer_sent_${transfer.id}`,
        date: transfer.date,
        type: 'transfer_sent',
        description: transfer.notes ?? 'Transfer',
        amount,
        currency: transfer.currency,
        amountInTrip: transfer.currency !== tripCurrency ? amount * rate : undefined,
        tripCurrency,
        counterpartMemberId: transfer.toMemberId,
      })
    } else if (transfer.toMemberId === memberId) {
      txns.push({
        id: `transfer_received_${transfer.id}`,
        date: transfer.date,
        type: 'transfer_received',
        description: transfer.notes ?? 'Transfer',
        amount,
        currency: transfer.currency,
        amountInTrip: transfer.currency !== tripCurrency ? amount * rate : undefined,
        tripCurrency,
        counterpartMemberId: transfer.fromMemberId,
      })
    }
  }

  return txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
