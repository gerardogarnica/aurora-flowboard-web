import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { useProjectDetail } from '../hooks/useProjectDetail'
import { PROJECT_KIND_CONFIG } from '../constants/project-kinds'
import type { ProjectChangeLog, ProjectMember } from '../types/project.types'

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

function MemberRow({ member }: { member: ProjectMember }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <Avatar size="sm">
          <AvatarFallback>{member.initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm text-foreground truncate">{member.fullName}</span>
      </div>
      <Badge variant="outline" className="shrink-0">{member.role}</Badge>
    </div>
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

        <Section title="Members" count={data.members.length}>
          {data.members.length === 0 ? (
            <EmptyState message="No members." />
          ) : (
            <div className="flex flex-col divide-y divide-border/60">
              {data.members.map((member) => (
                <MemberRow key={member.userId} member={member} />
              ))}
            </div>
          )}
        </Section>

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
