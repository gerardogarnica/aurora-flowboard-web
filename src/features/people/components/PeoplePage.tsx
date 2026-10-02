import { useState } from 'react'
import { Loader2, ChevronDown, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorState } from '@/shared/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
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
import type { SystemUser } from '@/features/people/types/people.types'
import type { UserRole } from '@/shared/types/user-role.types'
import { useIsAdministrator } from '@/features/auth/hooks/useIsAdministrator'

const ROLE_OPTIONS: UserRole[] = ['Administrator', 'Member']

const ROW_GRID = 'grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_112px_168px] items-center gap-4 px-4'

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

      <ConfirmDialog
        open={pendingRole !== null}
        onOpenChange={(open) => { if (!open) setPendingRole(null) }}
        title="Remove administrator access?"
        description={
          <>
            <span className="font-medium text-foreground">{user.fullName}</span> will be changed from{' '}
            <span className="font-medium text-foreground">Administrator</span> to{' '}
            <span className="font-medium text-foreground">Member</span>, and will lose access to
            workspace-wide administration.
          </>
        }
        confirmLabel="Change to Member"
        variant="destructive"
        onConfirm={handleConfirm}
      />
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

  return (
    <div className={cn(ROW_GRID, 'py-2.5')}>
      <div className="flex items-center gap-2.5 min-w-0">
        <UserAvatar userId={user.userId} initials={user.initials} />
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

export function PeoplePage() {
  const currentUser = useAuthStore((s) => s.user)
  const { data: users = [], isLoading, isError, isFetching, refetch } = useUsers()
  const updateRole = useUpdateUserRole()
  const [createUserOpen, setCreateUserOpen] = useState(false)

  const isAdministrator = useIsAdministrator()

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
        <DataTable
          gridClassName={ROW_GRID}
          columns={[{ label: 'Name' }, { label: 'Email' }, { label: 'Status' }, { label: 'Role', align: 'end' }]}
          isLoading={isLoading}
          isError={isError}
          isEmpty={users.length === 0}
          skeletonRow={<SkeletonRow />}
          skeletonCount={6}
          error={<ErrorState title="Couldn't load users" onRetry={() => refetch()} isRetrying={isFetching} />}
          empty={
            <EmptyState title="No users yet" description="Users will appear here once they're added to the workspace." />
          }
        >
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
        </DataTable>
      </div>

      <CreateUserModal
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
      />
    </>
  )
}
