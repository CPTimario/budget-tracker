import { Sidebar } from '@/components/shell/Sidebar'
import { BottomNav } from '@/components/shell/BottomNav'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
