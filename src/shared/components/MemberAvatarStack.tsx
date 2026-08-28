import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MEMBER_BG, avatarIndex } from '@/shared/constants/avatar-colors'

interface StackMember {
  userId: string
  fullName: string
  initials: string
}

export function MemberAvatarStack({
  members,
  max = 3,
}: {
  members: StackMember[]
  max?: number
}) {
  const visibleMembers = members.slice(0, max)
  const overflowMembers = members.slice(max)

  return (
    <TooltipProvider>
      <div className="flex -space-x-1.5 shrink-0">
        {visibleMembers.map((m) => (
          <Tooltip key={m.userId}>
            <TooltipTrigger
              render={
                <span
                  className={cn(
                    'w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center select-none shrink-0',
                    MEMBER_BG[avatarIndex(m.userId)],
                  )}
                >
                  {m.initials}
                </span>
              }
            />
            <TooltipContent>{m.fullName}</TooltipContent>
          </Tooltip>
        ))}
        {overflowMembers.length > 0 && (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center border-2 border-background bg-muted text-muted-foreground select-none shrink-0">
                  +{overflowMembers.length}
                </span>
              }
            />
            <TooltipContent>{overflowMembers.map((m) => m.fullName).join(', ')}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
