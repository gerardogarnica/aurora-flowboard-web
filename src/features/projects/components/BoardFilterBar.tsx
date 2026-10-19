import { ChevronDown, FunnelX, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { getWorkItemTypeConfig } from '@/features/work-items/constants/work-item-display'
import {
  BOARD_FILTER_FIELDS,
  hasActiveBoardFilters,
  type BoardFilterField,
  type BoardFilters,
} from '@/features/projects/constants/board-filters'
import type {
  BoardFilterOption,
  BoardFilterOptionIdentity,
  BoardFilterOptions,
} from '@/features/projects/utils/board-filters'

/** The swimlane identities, one size down: a filter value looks like the lane it would make. */
function OptionIdentity({ identity }: { identity: BoardFilterOptionIdentity }) {
  switch (identity.kind) {
    case 'type': {
      const config = getWorkItemTypeConfig(identity.type)
      const Icon = config.icon
      return <Icon className={cn('w-3.5 h-3.5 shrink-0', config.className)} />
    }
    case 'milestone':
      return (
        <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: resolveSwatchColor(identity.color ?? '') }}
          />
        </span>
      )
    case 'no-milestone':
      return (
        <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
          <span className="w-2 h-2 rounded-full border border-dashed border-muted-foreground/50" />
        </span>
      )
    case 'plain':
      return null
  }
}

function TriggerValue({ label, selected }: { label: string; selected: BoardFilterOption[] }) {
  if (selected.length === 0) return <span className="text-muted-foreground">{label}</span>

  if (selected.length === 1) {
    const [option] = selected
    return (
      <>
        <span className="text-muted-foreground">{label}</span>
        <OptionIdentity identity={option.identity} />
        <span className={cn('max-w-32 truncate font-medium text-foreground', option.isEmptyValue && 'italic')}>
          {option.label}
        </span>
      </>
    )
  }

  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-4 h-4 px-1 rounded-sm bg-primary/10 text-primary text-[10px] font-semibold tabular-nums flex items-center justify-center">
        {selected.length}
      </span>
    </>
  )
}

interface BoardFilterControlProps {
  label: string
  options: BoardFilterOption[]
  value: string[]
  onValueChange: (value: string[]) => void
}

function BoardFilterControl({ label, options, value, onValueChange }: BoardFilterControlProps) {
  const selected = options.filter((option) => value.includes(option.value))
  const isActive = selected.length > 0

  function toggle(optionValue: string, checked: boolean) {
    onValueChange(checked ? [...value, optionValue] : value.filter((v) => v !== optionValue))
  }

  return (
    <Popover>
      <PopoverTrigger
        disabled={options.length === 0}
        aria-label={isActive ? `${label} filter: ${selected.map((o) => o.label).join(', ')}` : `${label} filter`}
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-[min(var(--radius-md),10px)] border border-input bg-transparent pl-2.5 pr-2 text-xs whitespace-nowrap transition-colors outline-none select-none cursor-pointer',
          'hover:bg-muted/60 aria-expanded:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:bg-input/30',
          isActive && 'border-foreground/20',
        )}
      >
        <TriggerValue label={label} selected={selected} />
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-60 gap-0 p-1">
        <div role="group" aria-label={`Filter by ${label.toLowerCase()}`} className="max-h-72 overflow-y-auto flex flex-col">
          {options.map((option) => {
            const isSelected = value.includes(option.value)
            return (
              <label
                key={option.value}
                className="flex h-8 shrink-0 items-center gap-2 rounded-md px-2 cursor-pointer select-none hover:bg-muted has-focus-visible:bg-muted"
              >
                <Checkbox checked={isSelected} onCheckedChange={(checked) => toggle(option.value, checked)} />
                <OptionIdentity identity={option.identity} />
                <span className={cn('min-w-0 flex-1 truncate', option.isEmptyValue && 'italic text-muted-foreground')}>
                  {option.label}
                </span>
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    isSelected ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {option.count}
                </span>
              </label>
            )
          })}
        </div>

        {isActive && (
          <div className="mt-1 border-t border-border/60 pt-1 flex justify-end">
            <Button variant="ghost" size="xs" onClick={() => onValueChange([])}>
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** Shown above the (empty) columns when the filters leave nothing on the board. */
export function BoardNoMatches({ onClearAll, className }: { onClearAll: () => void; className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        'mb-4 flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-2.5',
        className,
      )}
    >
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <FunnelX className="w-4 h-4 shrink-0" />
        No work items match the current filters
      </span>
      <Button variant="outline" size="xs" onClick={onClearAll}>
        Clear filters
      </Button>
    </div>
  )
}

interface BoardFilterBarProps {
  filters: BoardFilters
  options: BoardFilterOptions
  onFilterChange: (field: BoardFilterField, values: string[]) => void
  onClearAll: () => void
}

/** Type / Milestone / Component multi-selects for the board, plus a global "Clear filters". */
export function BoardFilterBar({ filters, options, onFilterChange, onClearAll }: BoardFilterBarProps) {
  return (
    <div className="flex items-center gap-1.5">
      {BOARD_FILTER_FIELDS.map(({ field, label }) => (
        <BoardFilterControl
          key={field}
          label={label}
          options={options[field]}
          value={filters[field]}
          onValueChange={(values) => onFilterChange(field, values)}
        />
      ))}

      {hasActiveBoardFilters(filters) && (
        <Button variant="ghost" size="xs" onClick={onClearAll} className="text-muted-foreground">
          <X />
          Clear filters
        </Button>
      )}
    </div>
  )
}
