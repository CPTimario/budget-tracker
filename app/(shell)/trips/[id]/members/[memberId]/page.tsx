import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { trips, members, expenses, expenseSplits, payments } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { MemberDetail } from '@/components/members/MemberDetail'

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id, memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [[trip], tripMembers, tripExpenses, tripPayments] = await Promise.all([
    db.select().from(trips).where(and(eq(trips.id, id), eq(trips.userId, user.id))),
    db.select().from(members).where(eq(members.tripId, id)),
    db.select().from(expenses).where(eq(expenses.tripId, id)),
    db.select().from(payments).where(eq(payments.tripId, id)),
  ])

  if (!trip) notFound()

  const member = tripMembers.find(m => m.id === memberId)
  if (!member) notFound()

  const expenseIds = tripExpenses.map(e => e.id)
  const tripExpenseSplits = expenseIds.length
    ? await db.select().from(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds))
    : []

  return (
    <MemberDetail
      trip={trip}
      member={member}
      allMembers={tripMembers}
      expenses={tripExpenses}
      expenseSplits={tripExpenseSplits}
      payments={tripPayments}
    />
  )
}
