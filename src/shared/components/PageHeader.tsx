import { Button } from '@/components/ui/button'

interface PageHeaderAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  disabled?: boolean
  title?: string
}

interface PageHeaderProps {
  title: React.ReactNode
  titleAdornment?: React.ReactNode
  subtitle?: React.ReactNode
  action?: PageHeaderAction
}

export function PageHeader({ title, titleAdornment, subtitle, action }: PageHeaderProps) {
  return (
    <div className="shrink-0 px-8 py-5 border-b border-border flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground truncate">{title}</h1>
          {titleAdornment}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action && (
        <Button
          variant={action.variant ?? 'default'}
          onClick={action.onClick}
          disabled={action.disabled}
          title={action.title}
          className="shrink-0"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
