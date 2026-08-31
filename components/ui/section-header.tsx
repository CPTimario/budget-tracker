interface SectionHeaderProps {
  title: string
  action?: React.ReactNode
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  )
}
