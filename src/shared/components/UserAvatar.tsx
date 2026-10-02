import type { ComponentProps } from 'react'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MEMBER_BG, avatarIndex } from '@/shared/constants/avatar-colors'

type AvatarSize = 'sm' | 'md' | 'lg'

const SIZE: Record<AvatarSize, { circle: string; icon: string }> = {
  sm: { circle: 'w-6 h-6 text-[10px]', icon: 'w-3 h-3' },   // cards, rows, comments
  md: { circle: 'w-7 h-7 text-[11px]', icon: 'w-3.5 h-3.5' }, // sidebar footer
  lg: { circle: 'w-10 h-10 text-sm', icon: 'w-5 h-5' },      // profile header
}

const CIRCLE = 'rounded-full font-semibold flex items-center justify-center select-none shrink-0'

interface UserAvatarProps extends ComponentProps<'span'> {
  /** Picks the color: a hash of the id, so a person has the same color on every screen. */
  userId: string
  /** From the API (`<role>Initials`) — never derived from the full name. */
  initials: string
  size?: AvatarSize
}

/**
 * A person's initials on their color. Spreads extra props onto the span so it can be a
 * Tooltip trigger (`render={<UserAvatar … />}`).
 */
export function UserAvatar({ userId, initials, size = 'sm', className, ...rest }: UserAvatarProps) {
  return (
    <span {...rest} className={cn(CIRCLE, SIZE[size].circle, MEMBER_BG[avatarIndex(userId)], className)}>
      {initials}
    </span>
  )
}

/** The one neutral avatar: nobody is assigned. */
export function UnassignedAvatar({ size = 'sm', className, ...rest }: ComponentProps<'span'> & { size?: AvatarSize }) {
  return (
    <span {...rest} className={cn(CIRCLE, SIZE[size].circle, 'bg-muted border border-border', className)}>
      <User className={cn(SIZE[size].icon, 'text-muted-foreground')} />
    </span>
  )
}
