import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SWATCH_TINT_ALPHA, resolveSwatchColor, resolveSwatchInk } from '@/shared/constants/colors'

/**
 * A work item's milestone as a tinted pill, the same on board cards and in cross-project lists.
 * `className` sizes it for its container. Needs a `TooltipProvider` above it.
 */
export function MilestoneTag({ name, color, className }: { name: string; color: string | null; className?: string }) {
  const hex = resolveSwatchColor(color ?? '')
  const ink = resolveSwatchInk(color ?? '')

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="secondary"
            className={cn('border-transparent font-normal truncate', className)}
            style={{ backgroundColor: `${hex}${SWATCH_TINT_ALPHA}`, color: ink }}
          >
            {name}
          </Badge>
        }
      />
      <TooltipContent>Milestone: {name}</TooltipContent>
    </Tooltip>
  )
}
