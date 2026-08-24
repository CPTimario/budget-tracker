'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResponsiveFormModal } from '@/components/ui/responsive-form-modal'
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { MobilePageHeader } from '@/components/shell/MobilePageHeader'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { createMember, updateMember, deleteMember } from '@/server/actions/members'
import type { Member as DBMember } from '@/lib/db/schema'
import { formatCurrency } from '@/lib/format'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#3b82f6', '#0ea5e9', '#6366f1', '#64748b', '#78716c',
  '#1d4ed8', '#be185d', '#b45309', '#15803d', '#0e7490',
]

const memberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  initialBudget: z.number().min(0, 'Budget must be 0 or more'),
  isSelf: z.boolean(),
  color: z.string(),
})

type MemberFormData = z.infer<typeof memberSchema>

interface Member {
  id: string
  name: string
  initialBudget: string
  isSelf: boolean
  color: string
}

function toMember(m: DBMember): Member {
  return { id: m.id, name: m.name, initialBudget: m.initialBudget, isSelf: m.isSelf, color: m.color }
}

export function MembersPage({ tripId, initialMembers = [], currency = 'PHP' }: { tripId: string; initialMembers?: DBMember[]; currency?: string }) {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>(initialMembers.map(toMember))
  const [open, setOpen] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [pendingDeleteMemberId, setPendingDeleteMemberId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: '', initialBudget: 0, isSelf: false, color: PRESET_COLORS[0] },
  })

  const watchedColor = watch('color')

  function openAdd() {
    setEditMember(null)
    const colorIndex = members.length % PRESET_COLORS.length
    reset({ name: '', initialBudget: 0, isSelf: members.length === 0, color: PRESET_COLORS[colorIndex] })
    setOpen(true)
  }

  function openEdit(m: Member) {
    setEditMember(m)
    reset({ name: m.name, initialBudget: parseFloat(m.initialBudget || '0'), isSelf: m.isSelf, color: m.color })
    setOpen(true)
  }

  async function onSubmit(data: MemberFormData) {
    if (editMember) {
      await updateMember(editMember.id, tripId, {
        name: data.name,
        initialBudget: data.initialBudget,
        isSelf: data.isSelf,
        color: data.color,
      })
    } else {
      await createMember(tripId, {
        name: data.name,
        initialBudget: data.initialBudget,
        isSelf: data.isSelf,
        color: data.color,
      })
    }
    setOpen(false)
    router.refresh()
  }

  function handleDelete() {
    if (!pendingDeleteMemberId) return
    startTransition(async () => {
      await deleteMember(pendingDeleteMemberId, tripId)
      setMembers(prev => prev.filter(m => m.id !== pendingDeleteMemberId))
      setPendingDeleteMemberId(null)
      router.refresh()
    })
  }

  return (
    <>
      <MobilePageHeader
        title="Members"
        backHref={`/trips/${tripId}`}
        action={
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        }
      />

      <div className="p-4 md:p-6">
        <div className="hidden md:flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Members</h1>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" /> Add Member
          </Button>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="mb-2">No members yet. Add people to this trip.</p>
            <Button onClick={openAdd}>Add Member</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: member.color }}>
                      {member.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.name}</span>
                        {member.isSelf && <Badge variant="secondary">You</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">Budget: {formatCurrency(parseFloat(member.initialBudget || '0'), currency)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-xl" aria-label="Edit member" onClick={() => openEdit(member)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-xl" aria-label="Remove member" onClick={() => setPendingDeleteMemberId(member.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ResponsiveFormModal
        open={open}
        onOpenChange={setOpen}
        title={editMember ? 'Edit Member' : 'Add Member'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 md:p-0">
          <div className="space-y-1">
            <Input placeholder="Name" {...register('name')} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Input type="number" placeholder="Initial Budget" {...register('initialBudget', { valueAsNumber: true })} aria-invalid={!!errors.initialBudget} />
            {errors.initialBudget && <p className="text-xs text-destructive">{errors.initialBudget.message}</p>}
          </div>
          <div>
            <label className="text-sm mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Select color ${c}`}
                  aria-pressed={watchedColor === c}
                  onClick={() => setValue('color', c)}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${watchedColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('isSelf')} />
            <span className="text-sm">This is me (Self)</span>
          </label>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </ResponsiveFormModal>

      <AlertDialog open={pendingDeleteMemberId !== null} onOpenChange={(o) => { if (!o) setPendingDeleteMemberId(null) }}>
        <AlertDialogContent>
          <AlertDialogTitle>Remove member?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
