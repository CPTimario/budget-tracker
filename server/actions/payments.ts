'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { payments, trips } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq, and } from 'drizzle-orm'

const paymentSchema = z.object({
  fromMemberId: z.string().uuid(),
  toMemberId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  date: z.string(),
  notes: z.string().optional(),
})

export async function createPayment(tripId: string, data: z.infer<typeof paymentSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const [trip] = await db.select().from(trips).where(
    and(eq(trips.id, tripId), eq(trips.userId, user.id))
  )
  if (!trip) throw new Error('Unauthorized')

  const parsed = paymentSchema.parse(data)

  await db.insert(payments).values({
    tripId,
    fromMemberId: parsed.fromMemberId,
    toMemberId: parsed.toMemberId,
    amount: String(parsed.amount),
    date: parsed.date,
    notes: parsed.notes,
  })

  revalidatePath(`/trips/${tripId}/settle`)
  revalidatePath(`/trips/${tripId}`)
}
