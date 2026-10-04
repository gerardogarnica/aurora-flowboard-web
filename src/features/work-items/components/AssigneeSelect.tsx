import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { UserAvatar, UnassignedAvatar } from '@/shared/components/UserAvatar'
import type { ProjectMemberSummary } from '@/features/projects/types/project.types'

export function AssigneeSelect({
  members,
  value,
  onValueChange,
  defaultOpen,
  onOpenChange,
  triggerId,
  triggerClassName,
}: {
  members: ProjectMemberSummary[]
  value: string
  onValueChange: (value: string) => void
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  triggerId?: string
  triggerClassName?: string
}) {
  // The backend rejects assigning to a Viewer (400). A current Viewer assignee still labels the
  // trigger through the full `members` list, but can't be picked again once changed.
  const assignable = members.filter((m) => m.role !== 'Viewer')

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
            const member = members.find((m) => m.userId === selected)
            return member ? (
              <>
                <UserAvatar userId={member.userId} initials={member.initials} />
                {member.fullName}
              </>
            ) : (
              <>
                <UnassignedAvatar />
                Unassigned
              </>
            )
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">
          <UnassignedAvatar />
          Unassigned
        </SelectItem>
        {assignable.map((member) => (
          <SelectItem key={member.userId} value={member.userId}>
            <UserAvatar userId={member.userId} initials={member.initials} />
            {member.fullName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
