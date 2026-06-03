import { Button } from '@/components/ui/button'

interface PageHeaderAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
}

interface PageHeaderProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: PageHeaderAction
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="-mx-8 -mt-8 mb-8 px-8 py-5 border-b border-border flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action && (
        <Button
          variant={action.variant ?? 'default'}
          onClick={action.onClick}
          className="shrink-0"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
