import type { Member, Expense, ExpenseSplit, Payment } from '@/lib/db/schema'

export function computeBalances(
  members: Member[],
  expenses: Expense[],
  expenseSplits: ExpenseSplit[],
  payments: Payment[]
): Record<string, number> {
  const balances: Record<string, number> = {}
  members.forEach((m) => { balances[m.id] = 0 })

  for (const expense of expenses) {
    const amount = parseFloat(String(expense.amount))
    if (expense.type === 'personal') {
      balances[expense.paidById] = (balances[expense.paidById] || 0) - amount
    } else {
      const splits = expenseSplits.filter((s) => s.expenseId === expense.id)
      balances[expense.paidById] = (balances[expense.paidById] || 0) + amount
      for (const split of splits) {
        balances[split.memberId] = (balances[split.memberId] || 0) - parseFloat(String(split.shareAmount))
      }
    }
  }

  for (const payment of payments) {
    const amount = parseFloat(String(payment.amount))
    balances[payment.fromMemberId] = (balances[payment.fromMemberId] || 0) + amount
    balances[payment.toMemberId] = (balances[payment.toMemberId] || 0) - amount
  }

  return balances
}

export function simplifyDebts(balances: Record<string, number>): { from: string; to: string; amount: number }[] {
  const creditors: { id: string; amount: number }[] = []
  const debtors: { id: string; amount: number }[] = []

  for (const [id, balance] of Object.entries(balances)) {
    if (balance > 0.01) creditors.push({ id, amount: balance })
    else if (balance < -0.01) debtors.push({ id, amount: -balance })
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const transactions: { from: string; to: string; amount: number }[] = []

  let i = 0, j = 0
  while (i < creditors.length && j < debtors.length) {
    const settle = Math.min(creditors[i].amount, debtors[j].amount)
    transactions.push({ from: debtors[j].id, to: creditors[i].id, amount: Math.round(settle * 100) / 100 })
    creditors[i].amount -= settle
    debtors[j].amount -= settle
    if (creditors[i].amount < 0.01) i++
    if (debtors[j].amount < 0.01) j++
  }

  return transactions
}
