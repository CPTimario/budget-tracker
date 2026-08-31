import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  heading: string
  body?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, heading, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <Icon className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <p className="font-medium mb-1">{heading}</p>
      {body && <p className="text-sm text-muted-foreground mb-5 max-w-xs">{body}</p>}
      {action && !body && <div className="mb-0 mt-4" />}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
