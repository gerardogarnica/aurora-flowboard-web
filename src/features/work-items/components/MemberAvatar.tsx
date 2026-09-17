import { User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MEMBER_BG, avatarIndex } from '@/shared/constants/avatar-colors'

export function MemberAvatar({ userId, initials }: { userId: string; initials: string }) {
  return (
    <span
      className={cn(
        'w-6 h-6 rounded-full text-[10px] font-semibold flex items-center justify-center select-none shrink-0',
        MEMBER_BG[avatarIndex(userId)],
      )}
    >
      {initials}
    </span>
  )
}

export function UnassignedAvatar() {
  return (
    <span className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
      <User className="w-3 h-3 text-muted-foreground" />
    </span>
  )
}
