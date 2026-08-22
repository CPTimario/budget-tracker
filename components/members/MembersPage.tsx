'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { createMember, updateMember, deleteMember } from '@/server/actions/members'
import type { Member as DBMember } from '@/lib/db/schema'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#3b82f6', '#0ea5e9', '#6366f1', '#64748b', '#78716c',
  '#1d4ed8', '#be185d', '#b45309', '#15803d', '#0e7490',
]

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
  const [members, setMembers] = useState<Member[]>(initialMembers.map(toMember))
  const [open, setOpen] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [form, setForm] = useState({ name: '', initialBudget: '0', isSelf: false, color: PRESET_COLORS[0] })
  const [loading, setLoading] = useState(false)

  function openAdd() {
    setEditMember(null)
    const colorIndex = members.length % PRESET_COLORS.length
    setForm({ name: '', initialBudget: '0', isSelf: members.length === 0, color: PRESET_COLORS[colorIndex] })
    setOpen(true)
  }

  function openEdit(m: Member) {
    setEditMember(m)
    setForm({ name: m.name, initialBudget: m.initialBudget, isSelf: m.isSelf, color: m.color })
    setOpen(true)
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      if (editMember) {
        await updateMember(editMember.id, tripId, {
          name: form.name,
          initialBudget: parseFloat(form.initialBudget),
          isSelf: form.isSelf,
          color: form.color,
        })
      } else {
        await createMember(tripId, {
          name: form.name,
          initialBudget: parseFloat(form.initialBudget),
          isSelf: form.isSelf,
          color: form.color,
        })
      }
      setOpen(false)
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this member?')) return
    await deleteMember(id, tripId)
    window.location.reload()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Members</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" /> Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No members yet. Add people to this trip.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: member.color }}>
                    {member.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      {member.isSelf && <Badge variant="secondary">You</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">Budget: {currency} {parseFloat(member.initialBudget || '0').toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(member)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMember ? 'Edit Member' : 'Add Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input type="number" placeholder="Initial Budget" value={form.initialBudget} onChange={e => setForm(f => ({ ...f, initialBudget: e.target.value }))} />
            <div>
              <label className="text-sm mb-2 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`h-7 w-7 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isSelf} onChange={e => setForm(f => ({ ...f, isSelf: e.target.checked }))} />
              <span className="text-sm">This is me (Self)</span>
            </label>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
