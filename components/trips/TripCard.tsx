'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Users } from 'lucide-react'
import type { Trip } from '@/lib/db/schema'
import { format } from 'date-fns'

interface TripCardProps {
  trip: Trip
  memberCount?: number
}

export function TripCard({ trip, memberCount = 0 }: TripCardProps) {
  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{trip.name}</CardTitle>
            <Badge variant="outline">{trip.currency}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {trip.destination}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(trip.startDate), 'MMM d')} – {format(new Date(trip.endDate), 'MMM d, yyyy')}
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
