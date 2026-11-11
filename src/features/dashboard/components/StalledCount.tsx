import { cn } from '@/lib/utils'

/** `{n} stalled` on the design's scale: one is amber, more are red, none is a dash. */
export function StalledCount({ count, pill = false, className }: { count: number; pill?: boolean; className?: string }) {
  if (count === 0) return <span className={cn('text-center text-muted-foreground', className)}>—</span>

  const severe = count > 1
  return (
    <span
      className={cn(
        'font-semibold whitespace-nowrap',
        pill && 'rounded-full px-2 py-0.5 text-center',
        pill && (severe ? 'bg-red-50' : 'bg-amber-50'),
        severe ? 'text-red-600' : 'text-amber-700',
        className,
      )}
    >
      {count} stalled
    </span>
  )
}
