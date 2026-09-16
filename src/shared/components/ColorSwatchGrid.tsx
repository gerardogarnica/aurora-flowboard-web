import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { SWATCH_COLORS, resolveSwatchColor } from '@/shared/constants/colors'

const SIZE_CLASSES = {
  md: {
    grid: 'gap-2',
    swatch: 'w-6 h-6',
    selected: 'border-primary scale-110 ring-2 ring-primary/30',
  },
  sm: {
    grid: 'gap-1',
    swatch: 'w-5 h-5',
    selected: 'border-primary scale-110',
  },
} as const

/**
 * The SWATCH_COLORS palette as a 10-column grid of selectable swatches. Ten columns, not
 * flex-wrap: the 20 swatches then fill two even rows at any container width. Controlled and
 * form-agnostic — callers wire `onChange` to local state or react-hook-form themselves.
 * Alignment within the parent (e.g. `self-center`) goes through `className`.
 */
export function ColorSwatchGrid({
  value,
  onChange,
  size = 'md',
  className,
}: {
  value: string
  onChange: (color: string) => void
  size?: keyof typeof SIZE_CLASSES
  className?: string
}) {
  const classes = SIZE_CLASSES[size]

  return (
    <TooltipProvider>
      <div className={cn('grid grid-cols-10 w-fit', classes.grid, className)}>
        {Object.keys(SWATCH_COLORS).map((key) => (
          <Tooltip key={key}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => onChange(key)}
                  aria-label={key}
                  aria-pressed={value === key}
                  className={cn(
                    'rounded-full border-2 transition-all hover:scale-110',
                    classes.swatch,
                    value === key ? classes.selected : 'border-transparent',
                  )}
                  style={{ backgroundColor: resolveSwatchColor(key) }}
                />
              }
            />
            <TooltipContent className="capitalize">{key}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
