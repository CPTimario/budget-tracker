import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { trips, members, expenses } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { TripDashboard } from '@/components/dashboard/TripDashboard'

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [trip] = await db.select().from(trips).where(and(eq(trips.id, id), eq(trips.userId, user.id)))
  if (!trip) notFound()

  const [tripMembers, tripExpenses] = await Promise.all([
    db.select().from(members).where(eq(members.tripId, id)),
    db.select().from(expenses).where(eq(expenses.tripId, id)),
  ])

  return <TripDashboard trip={trip} members={tripMembers} expenses={tripExpenses} />
}
