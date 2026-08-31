'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MobilePageHeader } from '@/components/shell/MobilePageHeader'
import { EmptyState } from '@/components/ui/empty-state'
import { Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { Trip, Member, MemberBalance } from '@/lib/db/schema'

interface Props {
  trip: Trip
  members: Member[]
  balances: MemberBalance[]
}

export function WalletPage({ trip, members, balances }: Props) {
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const byCurrency = useMemo(() => {
    const map = new Map<string, MemberBalance[]>()
    for (const b of balances) {
      const list = map.get(b.currency) ?? []
      list.push(b)
      map.set(b.currency, list)
    }
    return map
  }, [balances])

  const currencies = useMemo(() => {
    const rest = Array.from(byCurrency.keys()).filter((c) => c !== trip.currency).sort()
    return byCurrency.has(trip.currency) ? [trip.currency, ...rest] : rest
  }, [byCurrency, trip.currency])

  return (
    <>
      <MobilePageHeader title="Wallet" backHref={`/trips/${trip.id}`} />
      <div className="p-4 md:p-6 space-y-4 md:space-y-5">
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Cash on hand per member</p>
        </div>

        {currencies.length === 0 ? (
          <EmptyState
            icon={Wallet}
            heading="No wallet entries yet"
            body="Record cash on hand for each member to get started."
          />
        ) : (
          currencies.map((currency) => {
            const rows = byCurrency.get(currency)!
            const total = rows.reduce((sum, b) => sum + parseFloat(b.balance), 0)
            return (
              <Card key={currency} className="border-border">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{currency}</CardTitle>
                    <span className={`text-sm font-bold tabular-nums ${total >= 0 ? 'text-success' : 'text-destructive'}`}>
                      Total: {formatCurrency(total, currency)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-1">
                  {rows.map((b, idx) => {
                    const member = memberById.get(b.memberId)
                    const amt = parseFloat(b.balance)
                    return (
                      <div
                        key={b.memberId}
                        className={`flex items-center justify-between py-2.5 ${idx < rows.length - 1 ? 'border-b border-border' : ''}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ring-1 ring-white dark:ring-card"
                            style={{ backgroundColor: member?.color ?? '#6366f1' }}
                          >
                            {(member?.name ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{member?.name ?? 'Unknown'}</span>
                        </div>
                        <p className={`text-sm font-bold tabular-nums ${amt >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(amt, currency)}
                        </p>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </>
  )
}
