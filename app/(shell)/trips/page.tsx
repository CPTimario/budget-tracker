import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { trips, members } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { TripList } from '@/components/trips/TripList'

export default async function TripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [userTrips, counts] = await Promise.all([
    db.select().from(trips).where(eq(trips.userId, user.id)),
    db.select({ tripId: members.tripId, count: count() }).from(members).groupBy(members.tripId),
  ])

  const memberCounts = Object.fromEntries(counts.map((c) => [c.tripId, Number(c.count)]))

  return (
    <div className="p-4 md:p-6">
      <TripList trips={userTrips} memberCounts={memberCounts} />
    </div>
  )
}
