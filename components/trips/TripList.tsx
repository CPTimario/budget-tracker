'use client'

import { useState } from 'react'
import { TripCard } from './TripCard'
import { TripForm } from './TripForm'
import { Button } from '@/components/ui/button'
import { ResponsiveFormModal } from '@/components/ui/responsive-form-modal'
import { Plus, MapPin } from 'lucide-react'
import type { Trip } from '@/lib/db/schema'

export function TripList({ trips, memberCounts = {} }: { trips: Trip[]; memberCounts?: Record<string, number> }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Trips</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{trips.length} {trips.length === 1 ? 'trip' : 'trips'}</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Trip
        </Button>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No trips yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">Create your first trip to start tracking group expenses together.</p>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Trip
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} memberCount={memberCounts[trip.id] ?? 0} />
          ))}
        </div>
      )}

      <ResponsiveFormModal open={open} onOpenChange={setOpen} title="Create New Trip">
        <TripForm onCancel={() => setOpen(false)} />
      </ResponsiveFormModal>
    </div>
  )
}
