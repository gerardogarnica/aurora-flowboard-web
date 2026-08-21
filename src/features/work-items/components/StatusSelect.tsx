import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { resolveSwatchColor } from '@/shared/constants/colors'
import type { WorkItemTransition } from '../types/work-item.types'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

function StatusDot({ color }: { color?: string }) {
  return (
    <span
      className="w-2.5 h-2.5 rounded-full shrink-0"
      style={{ backgroundColor: color ?? '#94a3b8' }}
    />
  )
}

export function StatusSelect({
  transitions,
  columns,
  value,
  currentStateName,
  currentStateColor,
  onValueChange,
  defaultOpen,
  onOpenChange,
  triggerId,
  triggerClassName,
}: {
  transitions: WorkItemTransition[]
  columns: ProjectBoardColumn[]
  value: string
  currentStateName: string
  currentStateColor?: string
  onValueChange: (transition: WorkItemTransition) => void
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  triggerId?: string
  triggerClassName?: string
}) {
  function colorFor(stateId: string): string | undefined {
    const column = columns.find((c) => c.flowStateId === stateId)
    return column ? resolveSwatchColor(column.color) : undefined
  }

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const transition = transitions.find((t) => t.toStateId === v)
        if (transition) onValueChange(transition)
      }}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger id={triggerId} className={cn('w-full', triggerClassName)}>
        <SelectValue>
          {(selected: string) => {
            const transition = transitions.find((t) => t.toStateId === selected)
            const name = transition ? transition.toStateName : currentStateName
            const color = transition ? colorFor(transition.toStateId) : currentStateColor
            return (
              <>
                <StatusDot color={color} />
                {name}
              </>
            )
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {transitions.map((transition) => (
          <SelectItem key={transition.toStateId} value={transition.toStateId}>
            <StatusDot color={colorFor(transition.toStateId)} />
            {transition.toStateName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
