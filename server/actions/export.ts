'use server'

import { db } from '@/lib/db'
import { trips, members, expenses, expenseSplits, payments } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq, and, inArray } from 'drizzle-orm'

export async function exportTrip(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const [trip] = await db.select().from(trips).where(
    and(eq(trips.id, tripId), eq(trips.userId, user.id))
  )
  if (!trip) throw new Error('Unauthorized')

  const [tripMembers, tripExpenses, tripPayments] = await Promise.all([
    db.select().from(members).where(eq(members.tripId, tripId)),
    db.select().from(expenses).where(eq(expenses.tripId, tripId)),
    db.select().from(payments).where(eq(payments.tripId, tripId)),
  ])

  const tripExpenseIds = tripExpenses.map((e) => e.id)
  const splits = tripExpenseIds.length
    ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, tripExpenseIds))
    : []

  return JSON.stringify({ trip, members: tripMembers, expenses: tripExpenses, expenseSplits: splits, payments: tripPayments }, null, 2)
}
