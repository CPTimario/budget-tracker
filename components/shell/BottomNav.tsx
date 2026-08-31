'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Receipt, Users, ArrowLeftRight, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()
  const tripId = pathname.match(/\/trips\/([^/]+)/)?.[1]

  const items = tripId
    ? [
        { href: `/trips/${tripId}`, label: 'Dashboard', icon: MapPin },
        { href: `/trips/${tripId}/expenses`, label: 'Expenses', icon: Receipt },
        { href: `/trips/${tripId}/members`, label: 'Members', icon: Users },
        { href: `/trips/${tripId}/settle`, label: 'Settle Up', icon: ArrowLeftRight },
      ]
    : [
        { href: '/trips', label: 'Trips', icon: MapPin },
        { href: '/settings', label: 'Settings', icon: Settings },
      ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50" aria-label="Main navigation">
      <div className="flex" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {items.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (tripId != null && item.href !== `/trips/${tripId}` && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex-1 flex flex-col items-center py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isActive && <span className="absolute top-0 inset-x-2 h-0.5 bg-primary rounded-full" />}
              <Icon className="h-5 w-5 mb-1" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
