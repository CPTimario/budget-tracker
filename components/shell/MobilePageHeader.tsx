import type { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

interface Props {
  title: string
  backHref?: string
  action?: ReactNode
}

export function MobilePageHeader({ title, backHref, action }: Props) {
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center px-3 py-2 border-b bg-background/95 backdrop-blur">
      {backHref ? (
        <Link href={backHref}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
      ) : (
        <div className="w-9" />
      )}
      <h1 className="flex-1 text-center font-semibold text-base truncate">{title}</h1>
      {action ?? <div className="w-9" />}
    </header>
  )
}
