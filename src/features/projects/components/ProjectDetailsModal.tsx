import { useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { useAuthStore } from '@/app/store/auth.store'
import { useUsers } from '@/features/people/hooks/useUsers'
import { useProjectDetail } from '../hooks/useProjectDetail'
import { useAddProjectMember } from '../hooks/useAddProjectMember'
import { useRemoveProjectMember } from '../hooks/useRemoveProjectMember'
import { PROJECT_KIND_CONFIG } from '../constants/project-kinds'
import { PROJECT_ROLES } from '../constants/flow-states'
import type { ProjectChangeLog, ProjectDetailResponse, ProjectMember, ProjectRole } from '../types/project.types'

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-6 pb-4 border-b border-border shrink-0 flex flex-col gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3.5 w-56" />
      </div>
      <div className="flex-1 p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/6" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </div>
  )
}

function StatusMessage({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  return (
    <div className="p-6 flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onClose} className="self-start">
        Close
      </Button>
    </div>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground">
        {title} <span className="text-muted-foreground font-normal">· {count}</span>
      </h3>
      {children}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground/70 py-2">{message}</p>
}

function AddMemberForm({
  projectId,
  existingUserIds,
  onDone,
}: {
  projectId: string
  existingUserIds: Set<string>
  onDone: () => void
}) {
  const { data: users, isLoading: usersLoading } = useUsers()
  const addMutation = useAddProjectMember()
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<ProjectRole | ''>('')

  const availableUsers = (users ?? []).filter((u) => !existingUserIds.has(u.userId))

  function handleAdd() {
    if (!userId || !role) return
    addMutation.mutate({ projectId, userId, role }, { onSuccess: onDone })
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3">
      {!usersLoading && availableUsers.length === 0 ? (
        <p className="text-xs text-muted-foreground">All users are already members of this project.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={userId}
            onValueChange={(value) => setUserId(value ?? '')}
            disabled={usersLoading || addMutation.isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((u) => (
                <SelectItem key={u.userId} value={u.userId}>
                  {u.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={role}
            onValueChange={(value) => setRole((value as ProjectRole) ?? '')}
            disabled={addMutation.isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onDone} disabled={addMutation.isPending}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleAdd} disabled={!userId || !role || addMutation.isPending}>
          {addMutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Adding…
            </>
          ) : (
            'Add'
          )}
        </Button>
      </div>
    </div>
  )
}

function MemberRow({
  member,
  projectId,
  canRemove,
}: {
  member: ProjectMember
  projectId: string
  canRemove: boolean
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const removeMutation = useRemoveProjectMember()

  function handleConfirmRemove() {
    removeMutation.mutate({ projectId, userId: member.userId }, { onSuccess: () => setConfirmOpen(false) })
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <Avatar size="sm">
          <AvatarFallback>{member.initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm text-foreground truncate">{member.fullName}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge variant="outline">{member.role}</Badge>
        {canRemove && (
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="destructive"
                    size="icon-xs"
                    onClick={() => setConfirmOpen(true)}
                    aria-label={`Remove ${member.fullName}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                }
              />
              <TooltipContent>Remove {member.fullName}</TooltipContent>
            </Tooltip>
            <Dialog
              open={confirmOpen}
              onOpenChange={(open) => { if (!removeMutation.isPending) setConfirmOpen(open) }}
            >
              <DialogContent showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>Remove member</DialogTitle>
                  <DialogDescription>
                    Remove <span className="font-medium text-foreground">{member.fullName}</span> from this project?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={removeMutation.isPending}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleConfirmRemove} disabled={removeMutation.isPending}>
                    {removeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Removing…
                      </>
                    ) : (
                      'Remove'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  )
}

function MembersSection({
  data,
  projectId,
  canManageMembers,
  currentUserId,
}: {
  data: ProjectDetailResponse
  projectId: string
  canManageMembers: boolean
  currentUserId: string | undefined
}) {
  const [isAdding, setIsAdding] = useState(false)
  const existingUserIds = new Set(data.members.map((m) => m.userId))

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Members <span className="text-muted-foreground font-normal">· {data.members.length}</span>
          </h3>
          {canManageMembers && !isAdding && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="secondary" size="icon-xs" onClick={() => setIsAdding(true)} aria-label="Add member">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                }
              />
              <TooltipContent>Add member</TooltipContent>
            </Tooltip>
          )}
        </div>

        {isAdding && (
          <AddMemberForm projectId={projectId} existingUserIds={existingUserIds} onDone={() => setIsAdding(false)} />
        )}

        {data.members.length === 0 ? (
          <EmptyState message="No members." />
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {data.members.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                projectId={projectId}
                canRemove={canManageMembers && member.userId !== currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

function ChangeLogRow({ log }: { log: ProjectChangeLog }) {
  return (
    <div className="text-xs text-muted-foreground py-1">
      <span className="text-foreground font-medium">{log.changedByFullName}</span>
      {' '}
      {log.changeType}
      {log.newStatus ? <> → <span className="text-foreground">{log.newStatus}</span></> : null}
      {' · '}
      {formatDateTime(log.changedOnUtc)}
    </div>
  )
}

function ModalBody({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { data, isLoading, isError, error } = useProjectDetail(projectId)
  const currentUser = useAuthStore((state) => state.user)

  if (isLoading) return <DetailSkeleton />

  if (isError) {
    return (
      <StatusMessage
        title="Couldn't load project details"
        message={error instanceof Error ? error.message : 'Something went wrong.'}
        onClose={onClose}
      />
    )
  }

  if (!data) return null

  const colorHex = resolveSwatchColor(data.color)
  const KindIcon = PROJECT_KIND_CONFIG[data.kind].icon
  const sortedChangeLogs = [...data.changeLogs].sort(
    (a, b) => new Date(b.changedOnUtc).getTime() - new Date(a.changedOnUtc).getTime(),
  )
  const currentMembership = data.members.find((m) => m.userId === currentUser?.id)
  const canManageMembers = currentMembership?.role === 'Admin'

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorHex }} />
          <DialogTitle className="text-lg truncate">{data.name}</DialogTitle>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{data.prefix}</span>
          <span className="text-muted-foreground/50">·</span>
          <Badge variant="outline" className="text-[11px] gap-1">
            <KindIcon className="w-3 h-3" />
            {data.kind}
          </Badge>
          <span className="text-muted-foreground/50">·</span>
          <span className="flex items-center gap-1.5 capitalize">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorHex }} />
            {data.color}
          </span>
        </div>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <p className="text-sm text-foreground whitespace-pre-wrap">
          {data.description || <span className="text-muted-foreground">No description provided.</span>}
        </p>

        <MembersSection
          data={data}
          projectId={projectId}
          canManageMembers={canManageMembers}
          currentUserId={currentUser?.id}
        />

        <Section title="Change Log" count={sortedChangeLogs.length}>
          {sortedChangeLogs.length === 0 ? (
            <EmptyState message="No changes recorded." />
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {sortedChangeLogs.map((log) => (
                <ChangeLogRow key={log.id} log={log} />
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="shrink-0 border-t border-border bg-muted/30 px-6 py-3 flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span className="truncate">Created by {data.createdByFullName} on {formatDate(data.createdOnUtc)}</span>
        <span className="shrink-0">{data.updatedOnUtc ? `Updated ${formatDate(data.updatedOnUtc)}` : 'Never updated'}</span>
      </div>
    </div>
  )
}

export function ProjectDetailsModal({
  projectId,
  open,
  onClose,
}: {
  projectId: string
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-lg w-full p-0 gap-0 flex flex-col max-h-[85vh] overflow-hidden">
        {open && <ModalBody projectId={projectId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
