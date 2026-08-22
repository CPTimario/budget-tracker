'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { members, trips } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq, and } from 'drizzle-orm'

const memberSchema = z.object({
  name: z.string().min(1),
  initialBudget: z.coerce.number().min(0),
  isSelf: z.boolean().default(false),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

async function verifyTripOwnership(tripId: string, userId: string) {
  const [trip] = await db.select().from(trips).where(
    and(eq(trips.id, tripId), eq(trips.userId, userId))
  )
  if (!trip) throw new Error('Trip not found or unauthorized')
  return trip
}

export async function createMember(tripId: string, data: z.infer<typeof memberSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await verifyTripOwnership(tripId, user.id)
  const parsed = memberSchema.parse(data)

  await db.insert(members).values({ tripId, ...parsed, initialBudget: String(parsed.initialBudget) })
  revalidatePath(`/trips/${tripId}/members`)
}

export async function updateMember(id: string, tripId: string, data: Partial<z.infer<typeof memberSchema>>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await verifyTripOwnership(tripId, user.id)
  const { initialBudget, ...rest } = data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.update(members).set({
    ...rest,
    ...(initialBudget !== undefined ? { initialBudget: String(initialBudget) } : {}),
  } as any).where(eq(members.id, id))
  revalidatePath(`/trips/${tripId}/members`)
}

export async function deleteMember(id: string, tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await verifyTripOwnership(tripId, user.id)
  await db.delete(members).where(eq(members.id, id))
  revalidatePath(`/trips/${tripId}/members`)
}
