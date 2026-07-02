import { PRIORITY_BARS } from '../constants/work-item-display'
import type { Priority } from '../types/work-item.types'

export function PriorityBars({ priority }: { priority: Priority }) {
  const { filled, color, label } = PRIORITY_BARS[priority] ?? PRIORITY_BARS.Low
  const empty = '#e2e8f0'

  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0" role="img" aria-label={`Priority: ${label}`}>
      <title>Priority: {label}</title>
      <rect x="0"   y="8" width="3" height="4"  rx="0.5" fill={filled >= 1 ? color : empty} />
      <rect x="4.5" y="4" width="3" height="8"  rx="0.5" fill={filled >= 2 ? color : empty} />
      <rect x="9"   y="0" width="3" height="12" rx="0.5" fill={filled >= 3 ? color : empty} />
    </svg>
  )
}
