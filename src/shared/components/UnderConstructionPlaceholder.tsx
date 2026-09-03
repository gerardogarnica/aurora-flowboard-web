import { Construction } from 'lucide-react'

interface UnderConstructionPlaceholderProps {
  title?: string
  description?: string
}

export function UnderConstructionPlaceholder({
  title = 'Under construction',
  description = "This section isn't ready yet. Check back soon.",
}: UnderConstructionPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
      <Construction className="w-8 h-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
