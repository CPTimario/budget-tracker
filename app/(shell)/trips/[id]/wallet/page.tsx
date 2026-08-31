import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { trips, members, memberBalances } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { WalletPage } from '@/components/wallet/WalletPage'

export default async function TripWalletPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [[trip], tripMembers] = await Promise.all([
    db.select().from(trips).where(and(eq(trips.id, id), eq(trips.userId, user.id))),
    db.select().from(members).where(eq(members.tripId, id)),
  ])

  if (!trip) notFound()

  const memberIds = tripMembers.map((m) => m.id)
  const balances = memberIds.length
    ? await db.select().from(memberBalances).where(inArray(memberBalances.memberId, memberIds))
    : []

  return <WalletPage trip={trip} members={tripMembers} balances={balances} />
}
