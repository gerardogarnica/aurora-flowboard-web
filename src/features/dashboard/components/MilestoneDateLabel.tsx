import { cn } from '@/lib/utils'
import type { MilestoneDate, MilestoneDateTone } from '../utils/milestone-date'

const PILL_TONE: Record<MilestoneDateTone, string> = {
  overdue: 'bg-red-50 font-semibold text-red-600',
  soon: 'bg-amber-50 font-semibold text-amber-700',
  neutral: 'text-muted-foreground',
}

const INLINE_TONE: Record<MilestoneDateTone, string> = {
  overdue: 'font-semibold text-red-600',
  soon: 'font-semibold text-amber-700',
  neutral: '',
}

/** `pill` stands alone in the Milestones card; `inline` follows the progress next to the Portfolio's milestone pill. */
export function MilestoneDateLabel({ date, variant }: { date: MilestoneDate; variant: 'pill' | 'inline' }) {
  return (
    <span
      data-tone={date.tone}
      className={cn(
        'shrink-0 tabular-nums',
        variant === 'pill' ? ['rounded-full px-1.5 py-px text-[11px]', PILL_TONE[date.tone]] : INLINE_TONE[date.tone],
      )}
    >
      {date.label}
    </span>
  )
}
