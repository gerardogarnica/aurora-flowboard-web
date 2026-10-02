import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  /** What failed, e.g. "Couldn't load components". */
  title: string
  description?: string
  /** Shows a Retry button. Pass the query's `refetch`. */
  onRetry?: () => void
  /**
   * The query's `isFetching`. Only visible when the query still holds data from an earlier
   * fetch: without data, React Query puts a retried query back to `pending`, and the caller's
   * loading state replaces this component instead.
   */
  isRetrying?: boolean
  className?: string
}

/** A load failure with a way out — never leave a failed query as an empty screen. */
export function ErrorState({
  title,
  description = 'Something went wrong. Please try again.',
  onRetry,
  isRetrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Retrying…
            </>
          ) : (
            'Retry'
          )}
        </Button>
      )}
    </div>
  )
}
