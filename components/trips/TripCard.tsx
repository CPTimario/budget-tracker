'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users } from 'lucide-react'
import type { Trip } from '@/lib/db/schema'
import { format, isAfter, isBefore, parseISO } from 'date-fns'

interface TripCardProps {
  trip: Trip
  memberCount?: number
}

function getTripStatus(startDate: string, endDate: string) {
  const now = new Date()
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  if (isBefore(now, start)) return { label: 'Upcoming', className: 'bg-primary/10 text-primary border-primary/20' }
  if (isAfter(now, end)) return { label: 'Completed', className: 'bg-muted text-muted-foreground border-border' }
  return { label: 'Active', className: 'bg-success/10 text-success border-success/20' }
}

export function TripCard({ trip, memberCount = 0 }: TripCardProps) {
  const status = getTripStatus(trip.startDate, trip.endDate)

  return (
    <Link href={`/trips/${trip.id}`} aria-label={`View trip: ${trip.name}`}>
      <Card className="cursor-pointer overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-border">
        <div className="h-1.5 w-full bg-primary/70 group-hover:bg-primary transition-colors" />
        <CardContent className="pt-4 pb-4 px-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-base leading-snug truncate">{trip.name}</h3>
              <p className="text-sm text-muted-foreground truncate mt-0.5">{trip.destination}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant="outline" className="text-xs font-semibold">{trip.currency}</Badge>
              <Badge variant="outline" className={`text-xs ${status.className}`}>{status.label}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {format(parseISO(trip.startDate), 'MMM d')} – {format(parseISO(trip.endDate), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {memberCount}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
