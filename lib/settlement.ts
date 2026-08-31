import type { Member, Expense, ExpenseSplit, Settlement, Transfer } from '@/lib/db/schema'

export function computeBalances(
  members: Member[],
  expenses: Expense[],
  expenseSplits: ExpenseSplit[],
  settlements: Settlement[],
  settlementExpenseMap: Map<string, Expense>,
  transfers: Transfer[]
): Record<string, number> {
  const balances: Record<string, number> = {}
  members.forEach((m) => { balances[m.id] = 0 })

  for (const expense of expenses) {
    if (expense.type !== 'shared') continue
    const rawAmount = parseFloat(String(expense.amount))
    const rate = expense.exchangeRate ? parseFloat(String(expense.exchangeRate)) : 1
    const amount = expense.currency ? rawAmount * rate : rawAmount
    balances[expense.paidById] = (balances[expense.paidById] || 0) + amount
    for (const split of expenseSplits.filter((s) => s.expenseId === expense.id)) {
      const splitAmount = parseFloat(String(split.shareAmount))
      const converted = expense.currency ? splitAmount * rate : splitAmount
      balances[split.memberId] = (balances[split.memberId] || 0) - converted
    }
  }

  for (const settlement of settlements) {
    const expense = settlementExpenseMap.get(settlement.id)
    const rate = expense?.exchangeRate ? parseFloat(String(expense.exchangeRate)) : 1
    const amount = parseFloat(String(settlement.amount))
    const converted = expense?.currency ? amount * rate : amount
    balances[settlement.fromMemberId] = (balances[settlement.fromMemberId] || 0) + converted
    balances[settlement.toMemberId] = (balances[settlement.toMemberId] || 0) - converted
  }

  for (const transfer of transfers) {
    const rate = transfer.exchangeRateToTrip ? parseFloat(String(transfer.exchangeRateToTrip)) : 1
    const amount = parseFloat(String(transfer.amount))
    const converted = amount * rate
    balances[transfer.fromMemberId] = (balances[transfer.fromMemberId] || 0) + converted
    balances[transfer.toMemberId] = (balances[transfer.toMemberId] || 0) - converted
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
