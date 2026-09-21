import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { MILESTONE_STATUS_BADGE } from '@/features/projects/constants/milestone-status'
import { resolveSwatchColor } from '@/shared/constants/colors'
import type { ProjectMilestone } from '@/features/projects/types/milestone.types'

function labelFor(milestone: ProjectMilestone): string {
  return milestone.status === 'Active'
    ? milestone.name
    : `${milestone.name} (${MILESTONE_STATUS_BADGE[milestone.status].label})`
}

export function MilestoneColorDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn('w-2.5 h-2.5 rounded-full shrink-0', className)}
      style={{ backgroundColor: resolveSwatchColor(color) }}
    />
  )
}

function OptionLabel({ milestone }: { milestone: ProjectMilestone }) {
  return (
    <span className="flex items-center gap-2 min-w-0">
      <MilestoneColorDot color={milestone.color} />
      <span className="truncate">{labelFor(milestone)}</span>
    </span>
  )
}

export function MilestoneSelect({
  milestones,
  value,
  onValueChange,
  defaultOpen,
  onOpenChange,
  triggerId,
  triggerClassName,
}: {
  milestones: ProjectMilestone[]
  value: string
  onValueChange: (value: string) => void
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  triggerId?: string
  triggerClassName?: string
}) {
  const options = milestones.filter((m) => m.status === 'Active' || m.id === value)

  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v ?? '')}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger id={triggerId} className={cn('w-full', triggerClassName)}>
        <SelectValue>
          {(selected: string) => {
            const milestone = milestones.find((m) => m.id === selected)
            return milestone ? <OptionLabel milestone={milestone} /> : 'No milestone'
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">No milestone</SelectItem>
        {options.map((milestone) => (
          <SelectItem key={milestone.id} value={milestone.id}>
            <OptionLabel milestone={milestone} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
