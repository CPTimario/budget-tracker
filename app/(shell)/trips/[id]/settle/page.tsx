import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { trips, members, expenses, expenseSplits, payments, paymentExpenseSplits } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { SettlePage } from '@/components/settlement/SettlePage'

export default async function TripSettlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [[trip], tripMembers, tripExpenses, tripPayments] = await Promise.all([
    db.select().from(trips).where(and(eq(trips.id, id), eq(trips.userId, user.id))),
    db.select().from(members).where(eq(members.tripId, id)),
    db.select().from(expenses).where(eq(expenses.tripId, id)),
    db.select().from(payments).where(eq(payments.tripId, id)),
  ])

  if (!trip) return null

  const expenseIds = tripExpenses.map(e => e.id)
  const splits = expenseIds.length
    ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds))
    : []

  const paymentIds = tripPayments.map(p => p.id)
  const paymentSplitLinks = paymentIds.length
    ? await db.select().from(paymentExpenseSplits).where(inArray(paymentExpenseSplits.paymentId, paymentIds))
    : []

  return (
    <SettlePage
      tripId={id}
      currency={trip.currency}
      initialMembers={tripMembers}
      initialExpenses={tripExpenses}
      initialSplits={splits}
      initialPayments={tripPayments}
      initialPaymentSplits={paymentSplitLinks}
    />
  )
}
