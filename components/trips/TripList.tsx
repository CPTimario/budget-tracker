'use client'

import { useState } from 'react'
import { TripCard } from './TripCard'
import { TripForm } from './TripForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
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
          <p className="text-lg mb-2">No trips yet</p>
          <p className="text-sm">Create your first trip to start tracking expenses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} memberCount={memberCounts[trip.id] ?? 0} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Trip</DialogTitle>
          </DialogHeader>
          <TripForm onCancel={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
