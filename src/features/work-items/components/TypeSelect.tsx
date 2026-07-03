import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { WORK_ITEM_TYPE_CONFIG } from '../constants/work-item-display'
import type { WorkItemType } from '../types/work-item.types'

export function TypeSelect({
  value,
  onValueChange,
  defaultOpen,
  onOpenChange,
  triggerId,
  triggerClassName,
}: {
  value: WorkItemType
  onValueChange: (value: WorkItemType) => void
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  triggerId?: string
  triggerClassName?: string
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as WorkItemType)}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger id={triggerId} className={cn('w-full', triggerClassName)}>
        <SelectValue>
          {(selected: WorkItemType) => {
            const cfg = WORK_ITEM_TYPE_CONFIG[selected]
            const Icon = cfg.icon
            return (
              <>
                <Icon className={cn('w-3.5 h-3.5', cfg.className)} />
                {cfg.label}
              </>
            )
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(WORK_ITEM_TYPE_CONFIG).map(([itemValue, cfg]) => {
          const Icon = cfg.icon
          return (
            <SelectItem key={itemValue} value={itemValue}>
              <Icon className={cn('w-3.5 h-3.5', cfg.className)} />
              {cfg.label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
