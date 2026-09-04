'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TripError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          This trip could not be loaded. Please try again.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
          <Link href="/trips">
            <Button variant="ghost">Back to trips</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
