import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { trips, members, expenses } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { ExpensesPage } from '@/components/expenses/ExpensesPage'

export default async function TripExpensesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [[trip], tripMembers, tripExpenses] = await Promise.all([
    db.select().from(trips).where(and(eq(trips.id, id), eq(trips.userId, user.id))),
    db.select().from(members).where(eq(members.tripId, id)),
    db.select().from(expenses).where(eq(expenses.tripId, id)).orderBy(desc(expenses.date)),
  ])

  if (!trip) return null

  return <ExpensesPage tripId={id} initialTrip={trip} initialMembers={tripMembers} initialExpenses={tripExpenses} />
}
