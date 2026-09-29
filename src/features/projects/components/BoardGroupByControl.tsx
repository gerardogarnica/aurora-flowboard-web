import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  BOARD_GROUP_BY_OPTIONS,
  getBoardGroupByLabel,
  type BoardGroupBy,
} from '@/features/projects/constants/board-group-by'

interface BoardGroupByControlProps {
  value: BoardGroupBy
  onValueChange: (value: BoardGroupBy) => void
  anyExpanded: boolean
  onToggleAll: () => void
}

export function BoardGroupByControl({ value, onValueChange, anyExpanded, onToggleAll }: BoardGroupByControlProps) {
  const toggleLabel = anyExpanded ? 'Collapse all' : 'Expand all'
  const ToggleIcon = anyExpanded ? ChevronsDownUp : ChevronsUpDown

  return (
    <div className="flex items-center gap-1.5">
      {value !== 'none' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="secondary" size="icon-xs" onClick={onToggleAll} aria-label={toggleLabel}>
                  <ToggleIcon className="w-3.5 h-3.5" />
                </Button>
              }
            />
            <TooltipContent>{toggleLabel}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <Select value={value} onValueChange={(v) => onValueChange((v as BoardGroupBy | null) ?? 'none')}>
        <SelectTrigger size="sm" aria-label="Group by" className="text-xs">
          <SelectValue>
            {(selected: BoardGroupBy) => (
              <>
                <span className="text-muted-foreground">Group by</span>
                <span className="font-medium text-foreground">{getBoardGroupByLabel(selected)}</span>
              </>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          {BOARD_GROUP_BY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
