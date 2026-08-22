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
        <h1 className="text-2xl font-bold">My Trips</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Trip
        </Button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg mb-2">No trips yet</p>
          <p className="text-sm mb-4">Create your first trip to start tracking expenses</p>
          <Button onClick={() => setOpen(true)}>Create Trip</Button>
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
