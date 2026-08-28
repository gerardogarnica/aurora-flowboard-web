import { useState } from 'react'
import { Loader2, ChevronDown, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/shared/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuthStore } from '@/app/store/auth.store'
import { useUsers } from '@/features/people/hooks/useUsers'
import { useUpdateUserRole } from '@/features/people/hooks/useUpdateUserRole'
import { CreateUserModal } from '@/features/people/components/CreateUserModal'
import type { SystemUser, UserRole } from '@/features/people/types/people.types'

const ROLE_OPTIONS: UserRole[] = ['Administrator', 'Member']

const ROW_GRID = 'grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_112px_168px] items-center gap-4 px-4'

const AVATAR_BG = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
]

function avatarClassFor(userId: string) {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  return AVATAR_BG[hash % AVATAR_BG.length]
}

function StatusPill({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap w-fit',
        isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-muted text-muted-foreground',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-muted-foreground/50')} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {role === 'Administrator' && <ShieldCheck className="w-3 h-3" />}
      {role}
    </span>
  )
}

function RoleControl({
  user,
  isUpdating,
  onSelect,
}: {
  user: SystemUser
  isUpdating: boolean
  onSelect: (role: UserRole) => void
}) {
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null)

  const handlePick = (role: UserRole) => {
    if (role === user.role) return
    if (role === 'Member') {
      setPendingRole(role)
    } else {
      onSelect(role)
    }
  }

  const handleConfirm = () => {
    if (pendingRole) onSelect(pendingRole)
    setPendingRole(null)
  }

  if (isUpdating) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground px-2 py-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        {user.role}
      </span>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-border cursor-pointer hover:bg-muted/50 transition-colors select-none">
          <RoleBadge role={user.role} />
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-32">
          {ROLE_OPTIONS.map((role) => (
            <DropdownMenuItem
              key={role}
              className="gap-2 cursor-pointer"
              disabled={role === user.role}
              onClick={() => handlePick(role)}
            >
              <RoleBadge role={role} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={pendingRole !== null} onOpenChange={(open) => { if (!open) setPendingRole(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove administrator access?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{user.fullName}</span> will be changed from{' '}
              <span className="font-medium text-foreground">Administrator</span> to{' '}
              <span className="font-medium text-foreground">Member</span>, and will lose access to
              workspace-wide administration.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRole(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Change to Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SelfRoleControl({ role }: { role: UserRole }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground px-2 py-1 rounded-md border border-border/60 cursor-not-allowed select-none">
              <RoleBadge role={role} />
            </span>
          }
        />
        <TooltipContent>You can't change your own role</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function UserRow({
  user,
  isSelf,
  canEditRoles,
  isUpdating,
  onRoleChange,
}: {
  user: SystemUser
  isSelf: boolean
  canEditRoles: boolean
  isUpdating: boolean
  onRoleChange: (role: UserRole) => void
}) {
  const avatarClass = avatarClassFor(user.userId)

  return (
    <div className={cn(ROW_GRID, 'py-2.5')}>
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar size="sm">
          <AvatarFallback className={avatarClass}>{user.initials}</AvatarFallback>
        </Avatar>
        <p className="text-sm font-medium text-foreground truncate">
          {user.firstName} {user.lastName}
          {isSelf && <span className="ml-1.5 text-xs text-muted-foreground font-normal">(you)</span>}
        </p>
      </div>

      <span className="text-sm text-muted-foreground truncate">{user.email}</span>

      <StatusPill isActive={user.isActive} />

      <div className="justify-self-end">
        {!canEditRoles ? (
          <Badge variant="outline">
            <RoleBadge role={user.role} />
          </Badge>
        ) : isSelf ? (
          <SelfRoleControl role={user.role} />
        ) : (
          <RoleControl user={user} isUpdating={isUpdating} onSelect={onRoleChange} />
        )}
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className={cn(ROW_GRID, 'py-2.5')}>
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="h-3.5 w-32" />
      </div>
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="h-4 w-14 rounded-full" />
      <Skeleton className="h-6 w-24 rounded-md justify-self-end" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
      <p className="text-sm font-medium text-foreground">No users yet</p>
      <p className="text-sm text-muted-foreground">Users will appear here once they're added to the workspace.</p>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm font-medium text-foreground">Couldn't load users</p>
      <p className="text-sm text-muted-foreground">Something went wrong. Please try again.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

export function PeoplePage() {
  const currentUser = useAuthStore((s) => s.user)
  const { data: users = [], isLoading, isError, refetch } = useUsers()
  const updateRole = useUpdateUserRole()
  const [createUserOpen, setCreateUserOpen] = useState(false)

  const isAdministrator = currentUser?.role === 'Administrator'

  return (
    <>
      <PageHeader
        title="People & roles"
        subtitle="Everyone with access to this workspace, and the role they hold."
        action={
          isAdministrator
            ? { label: '+ New user', onClick: () => setCreateUserOpen(true) }
            : undefined
        }
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="border border-border rounded-lg overflow-hidden">
          <div className={cn(ROW_GRID, 'py-2 border-b border-border bg-muted/30')}>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Name</span>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Email</span>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Status</span>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase justify-self-end">
              Role
            </span>
          </div>

          {isLoading ? (
            <div className="divide-y divide-border/60">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : users.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-border/60">
              {users.map((user) => (
                <UserRow
                  key={user.userId}
                  user={user}
                  isSelf={user.userId === currentUser?.id}
                  canEditRoles={isAdministrator}
                  isUpdating={updateRole.isPending && updateRole.variables?.userId === user.userId}
                  onRoleChange={(role) => updateRole.mutate({ userId: user.userId, role })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateUserModal
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
      />
    </>
  )
}
