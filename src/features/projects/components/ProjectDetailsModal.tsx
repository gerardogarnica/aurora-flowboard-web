import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { ColorSwatchGrid } from '@/shared/components/ColorSwatchGrid'
import { ApiError } from '@/shared/lib/api-client'
import { useAuthStore } from '@/app/store/auth.store'
import { useUsers } from '@/features/people/hooks/useUsers'
import { formatDate, formatDateTime } from '@/shared/lib/date-format'
import { useProjectDetail } from '../hooks/useProjectDetail'
import { useAddProjectMember } from '../hooks/useAddProjectMember'
import { useRemoveProjectMember } from '../hooks/useRemoveProjectMember'
import { useUpdateProject } from '../hooks/useUpdateProject'
import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  projectSchema,
  type ProjectFormValues,
} from '../schemas/project.schema'
import { PROJECT_KIND_CONFIG } from '../constants/project-kinds'
import { PROJECT_ROLES } from '../constants/flow-states'
import { formatProjectChangeLogEntry } from '../constants/project-change-log'
import type { ProjectChangeLog, ProjectDetailResponse, ProjectKind, ProjectMember, ProjectRole } from '../types/project.types'

type DetailTabId = 'general' | 'members' | 'changeLog'

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

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground/70 py-2">{message}</p>
}

// ─── General tab ──────────────────────────────────────────────────────────────

/** A project property that can't be edited here — label styled apart from the form's <Label>. */
function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{label}</span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

/**
 * Kind as a glyph + label, the same shape as ColorValue — no badge chrome. Both read as plain
 * metadata wherever they appear, so neither one boxes itself off from the line it sits in.
 */
function KindValue({ kind, iconClass = 'w-3.5 h-3.5' }: { kind: ProjectKind; iconClass?: string }) {
  const KindIcon = PROJECT_KIND_CONFIG[kind].icon

  return (
    <span className="inline-flex items-center gap-1.5">
      <KindIcon className={cn('shrink-0', iconClass)} />
      {kind}
    </span>
  )
}

/** Prefix and kind: fixed for the life of the project, so they render as properties, not fields. */
function FixedProperties({ data }: { data: ProjectDetailResponse }) {
  return (
    <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
      <PropertyRow label="Prefix">
        <span className="font-mono">{data.prefix}</span>
      </PropertyRow>
      <PropertyRow label="Kind">
        <KindValue kind={data.kind} />
      </PropertyRow>
    </div>
  )
}

function ColorValue({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 capitalize">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: resolveSwatchColor(color) }} />
      {color}
    </span>
  )
}

function GeneralReadOnly({ data, notice }: { data: ProjectDetailResponse; notice?: string }) {
  return (
    <div className="flex flex-col gap-4">
      {notice && <p className="text-xs text-muted-foreground">{notice}</p>}
      <PropertyRow label="Name">{data.name}</PropertyRow>
      <PropertyRow label="Description">
        <span className="whitespace-pre-wrap">
          {data.description || <span className="text-muted-foreground">No description provided.</span>}
        </span>
      </PropertyRow>
      <PropertyRow label="Color">
        <ColorValue color={data.color} />
      </PropertyRow>
      <FixedProperties data={data} />
    </div>
  )
}

function GeneralForm({ data, projectId }: { data: ProjectDetailResponse; projectId: string }) {
  const mutation = useUpdateProject()

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    // The form starts pre-filled and valid, so an inline error only ever shows up after the
    // user actively clears a field — there it's what explains the disabled Save button.
    mode: 'onChange',
    defaultValues: {
      name: data.name,
      description: data.description ?? '',
      color: data.color,
    },
  })

  const values = useWatch({ control })
  const isFormValid = projectSchema.safeParse(values).success
  const selectedColor = values.color ?? data.color

  function onSubmit(formValues: ProjectFormValues) {
    const name = formValues.name.trim()
    const description = formValues.description.trim()

    mutation.mutate(
      { projectId, payload: { name, description: description || null, color: formValues.color } },
      {
        onSuccess: () => {
          toast.success('Project updated')
          // Re-baseline the form so isDirty drops back to false and both buttons disable again.
          reset({ name, description, color: formValues.color })
        },
      },
    )
  }

  const bannerError = mutation.error
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : 'Something went wrong. Please try again.'
    : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {bannerError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {bannerError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="project-name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="project-name"
          maxLength={PROJECT_NAME_MAX_LENGTH}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'project-name-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="project-name-error" className="text-xs text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="project-description">
          Description <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="project-description"
          rows={3}
          maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
          placeholder="Briefly describe this project…"
          {...register('description')}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Color</Label>
        <ColorSwatchGrid
          value={selectedColor}
          onChange={(color) => setValue('color', color, { shouldDirty: true, shouldValidate: true })}
          className="self-center"
        />
      </div>

      <FixedProperties data={data} />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={!isDirty || mutation.isPending}
        >
          Discard
        </Button>
        <Button type="submit" disabled={!isDirty || !isFormValid || mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </div>
    </form>
  )
}

function GeneralPanel({
  data,
  projectId,
  canEdit,
  notice,
}: {
  data: ProjectDetailResponse
  projectId: string
  canEdit: boolean
  notice?: string
}) {
  if (!canEdit) return <GeneralReadOnly data={data} notice={notice} />

  return <GeneralForm data={data} projectId={projectId} />
}

// ─── Members tab ──────────────────────────────────────────────────────────────

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
              <SelectValue>
                {(selected: string) => users?.find((u) => u.userId === selected)?.fullName ?? 'Select user'}
              </SelectValue>
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

function MembersPanel({
  data,
  projectId,
  canManageMembers,
  currentUserId,
  notice,
}: {
  data: ProjectDetailResponse
  projectId: string
  canManageMembers: boolean
  currentUserId: string | undefined
  notice?: string
}) {
  const [isAdding, setIsAdding] = useState(false)
  const existingUserIds = new Set(data.members.map((m) => m.userId))

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              People who can access this project, and what they can do in it.
            </p>
            {notice && <p className="text-xs text-muted-foreground">{notice}</p>}
          </div>
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

// ─── Change Log tab ───────────────────────────────────────────────────────────

/** Same row shape as the work-item Change Log tab: one muted sentence, then the timestamp. */
function ChangeLogPanel({ logs, members }: { logs: ProjectChangeLog[]; members: ProjectMember[] }) {
  if (logs.length === 0) return <EmptyState message="No changes recorded." />

  return (
    <div className="flex flex-col gap-1.5">
      {logs.map((log) => (
        <div key={log.id} className="text-xs text-muted-foreground">
          {formatProjectChangeLogEntry(log, members)} · {formatDateTime(log.changedOnUtc)}
        </div>
      ))}
    </div>
  )
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function ModalBody({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { data, isLoading, isError, error } = useProjectDetail(projectId)
  const currentUser = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<DetailTabId>('general')

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
  const sortedChangeLogs = [...data.changeLogs].sort(
    (a, b) => new Date(b.changedOnUtc).getTime() - new Date(a.changedOnUtc).getTime(),
  )
  const currentMembership = data.members.find((m) => m.userId === currentUser?.id)
  const isProjectAdmin = currentMembership?.role === 'Admin'

  // One rule for both editable tabs: the backend answers 400
  // Project.OperationNotAllowedInCurrentStatus to the project update AND to member add/remove
  // once the project leaves Active/Maintenance (verified against the real backend, 2026-09-13).
  const isEditableStatus = data.status === 'Active' || data.status === 'Maintenance'
  const canEditProject = isProjectAdmin && isEditableStatus
  // Only an admin is told *why* the status blocks editing — for everyone else the operative
  // restriction is their role, not the project's status.
  const statusNotice =
    isProjectAdmin && !isEditableStatus ? `${data.status} projects can't be edited.` : undefined

  const tabs: { id: DetailTabId; label: string; count?: number }[] = [
    { id: 'general', label: 'General' },
    { id: 'members', label: 'Members', count: data.members.length },
    { id: 'changeLog', label: 'Change Log', count: sortedChangeLogs.length },
  ]

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
          <KindValue kind={data.kind} iconClass="w-3 h-3" />
          <span className="text-muted-foreground/50">·</span>
          <ColorValue color={data.color} />
        </div>
      </DialogHeader>

      <div role="tablist" className="flex items-center gap-5 pt-2 px-6 border-b border-border shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`project-detail-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`project-detail-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'text-sm pb-2.5 border-b-2 -mb-px transition-colors cursor-pointer',
              activeTab === tab.id
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {tab.count !== undefined && <span className="text-muted-foreground font-normal"> · {tab.count}</span>}
          </button>
        ))}
      </div>

      {/*
        Panels stay mounted and toggle with `hidden` instead of unmounting, unlike
        WorkItemActivitySections — all three read from the same cached ProjectDetailResponse,
        so there's no per-tab request to save, and keeping them mounted preserves an unsaved
        General draft while the user looks at another tab.
      */}
      {/* min-h matches the tallest panel — General's form, 367px of content plus this p-6 —
          so switching tabs doesn't resize and re-center the dialog, which would slide the tab
          bar out from under the pointer between clicks. Change Log grows past this and scrolls. */}
      <div className="flex-1 min-h-104 overflow-y-auto p-6">
        <div role="tabpanel" id="project-detail-panel-general" aria-labelledby="project-detail-tab-general" hidden={activeTab !== 'general'}>
          <GeneralPanel data={data} projectId={projectId} canEdit={canEditProject} notice={statusNotice} />
        </div>

        <div role="tabpanel" id="project-detail-panel-members" aria-labelledby="project-detail-tab-members" hidden={activeTab !== 'members'}>
          <MembersPanel
            data={data}
            projectId={projectId}
            canManageMembers={canEditProject}
            currentUserId={currentUser?.id}
            notice={statusNotice}
          />
        </div>

        <div role="tabpanel" id="project-detail-panel-changeLog" aria-labelledby="project-detail-tab-changeLog" hidden={activeTab !== 'changeLog'}>
          <ChangeLogPanel logs={sortedChangeLogs} members={data.members} />
        </div>
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
