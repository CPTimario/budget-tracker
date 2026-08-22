import { Sidebar } from '@/components/shell/Sidebar'
import { BottomNav } from '@/components/shell/BottomNav'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-background focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to content
      </a>
      <Sidebar />
      <main
        id="main-content"
        aria-label="Main content"
        className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
