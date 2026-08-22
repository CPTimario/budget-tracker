'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { expenses, expenseSplits, trips } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq, and } from 'drizzle-orm'

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  category: z.enum(['travel', 'food', 'accommodation', 'activities', 'shopping', 'health', 'gifts', 'misc']),
  paidById: z.string().uuid(),
  type: z.enum(['personal', 'shared']),
  date: z.string(),
  splits: z.array(z.object({
    memberId: z.string().uuid(),
    shareAmount: z.coerce.number().positive(),
  })).optional(),
})

async function verifyTripOwnership(tripId: string, userId: string) {
  const [trip] = await db.select().from(trips).where(
    and(eq(trips.id, tripId), eq(trips.userId, userId))
  )
  if (!trip) throw new Error('Trip not found or unauthorized')
  return trip
}

export async function createExpense(tripId: string, data: z.infer<typeof expenseSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await verifyTripOwnership(tripId, user.id)
  const parsed = expenseSchema.parse(data)

  await db.transaction(async (tx) => {
    const [expense] = await tx.insert(expenses).values({
      tripId,
      description: parsed.description,
      amount: String(parsed.amount),
      category: parsed.category,
      paidById: parsed.paidById,
      type: parsed.type,
      date: parsed.date,
    }).returning()

    if (parsed.type === 'shared' && parsed.splits?.length) {
      await tx.insert(expenseSplits).values(
        parsed.splits.map((s) => ({
          expenseId: expense.id,
          memberId: s.memberId,
          shareAmount: String(s.shareAmount),
        }))
      )
    }
  })

  revalidatePath(`/trips/${tripId}/expenses`)
  revalidatePath(`/trips/${tripId}`)
}

export async function updateExpense(id: string, tripId: string, data: z.infer<typeof expenseSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await verifyTripOwnership(tripId, user.id)
  const parsed = expenseSchema.parse(data)

  await db.transaction(async (tx) => {
    await tx.update(expenses).set({
      description: parsed.description,
      amount: String(parsed.amount),
      category: parsed.category,
      paidById: parsed.paidById,
      type: parsed.type,
      date: parsed.date,
    }).where(eq(expenses.id, id))

    await tx.delete(expenseSplits).where(eq(expenseSplits.expenseId, id))

    if (parsed.type === 'shared' && parsed.splits?.length) {
      await tx.insert(expenseSplits).values(
        parsed.splits.map((s) => ({
          expenseId: id,
          memberId: s.memberId,
          shareAmount: String(s.shareAmount),
        }))
      )
    }
  })

  revalidatePath(`/trips/${tripId}/expenses`)
  revalidatePath(`/trips/${tripId}`)
}

export async function deleteExpense(id: string, tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await verifyTripOwnership(tripId, user.id)
  await db.delete(expenses).where(eq(expenses.id, id))
  revalidatePath(`/trips/${tripId}/expenses`)
  revalidatePath(`/trips/${tripId}`)
}
