import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { PRIORITY_BARS } from '../constants/work-item-display'
import { PriorityBars } from './PriorityBars'
import type { Priority } from '../types/work-item.types'

export function PrioritySelect({
  value,
  onValueChange,
  defaultOpen,
  onOpenChange,
  triggerId,
  triggerClassName,
}: {
  value: Priority
  onValueChange: (value: Priority) => void
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  triggerId?: string
  triggerClassName?: string
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as Priority)}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger id={triggerId} className={cn('w-full', triggerClassName)}>
        <SelectValue>
          {(selected: Priority) => (
            <>
              <PriorityBars priority={selected} />
              {PRIORITY_BARS[selected].label}
            </>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PRIORITY_BARS).map(([itemValue, cfg]) => (
          <SelectItem key={itemValue} value={itemValue}>
            <PriorityBars priority={itemValue as Priority} />
            {cfg.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
