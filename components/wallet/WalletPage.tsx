'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MobilePageHeader } from '@/components/shell/MobilePageHeader'
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
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold">Wallet</h1>
          <p className="text-muted-foreground text-sm">{trip.name}</p>
        </div>

        {currencies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No wallet activity yet.
            </CardContent>
          </Card>
        ) : (
          currencies.map((currency) => {
            const rows = byCurrency.get(currency)!
            return (
              <Card key={currency}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{currency}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {rows.map((b) => {
                    const member = memberById.get(b.memberId)
                    const amt = parseFloat(b.balance)
                    return (
                      <div key={b.memberId} className="flex items-center justify-between py-2.5 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: member?.color ?? '#6366f1' }}
                          >
                            {(member?.name ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{member?.name ?? 'Unknown'}</span>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${amt >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                            {formatCurrency(amt, currency)}
                          </p>
                        </div>
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
