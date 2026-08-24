import { Skeleton } from '@/components/ui/skeleton'

export default function ExpensesLoading() {
  return (
    <>
      <header className="md:hidden sticky top-0 z-40 h-[52px] border-b bg-background/95 backdrop-blur" />
      <div className="p-4 md:p-6">
        <div className="hidden md:flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Skeleton className="h-9 w-9 rounded-full shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
