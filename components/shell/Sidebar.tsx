'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Receipt, Users, ArrowLeftRight, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/trips', label: 'Trips', icon: MapPin },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function TripNavItems({ tripId }: { tripId?: string }) {
  const pathname = usePathname()
  if (!tripId) return null

  const items = [
    { href: `/trips/${tripId}`, label: 'Dashboard', icon: MapPin },
    { href: `/trips/${tripId}/expenses`, label: 'Expenses', icon: Receipt },
    { href: `/trips/${tripId}/members`, label: 'Members', icon: Users },
    { href: `/trips/${tripId}/settle`, label: 'Settle Up', icon: ArrowLeftRight },
  ]

  return (
    <div className="mt-2 border-t pt-2">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link key={item.href} href={item.href}>
            <div className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}>
              <Icon className="h-4 w-4" />
              {item.label}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const tripId = pathname.match(/\/trips\/([^/]+)/)?.[1]
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0">
      <div className="p-4 border-b">
        <h1 className="font-bold text-lg">Budget Tracker</h1>
        <p className="text-xs text-muted-foreground">Mission Trip Expenses</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}>
                <Icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          )
        })}
        <TripNavItems tripId={tripId} />
      </nav>

      <div className="p-3 border-t">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
