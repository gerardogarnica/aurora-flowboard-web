import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm, useWatch, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronUp, ChevronDown, Trash2, Plus, Check, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { DEFAULT_SWATCH_COLOR, resolveSwatchColor } from '@/shared/constants/colors'
import { ColorSwatchGrid } from '@/shared/components/ColorSwatchGrid'
import { getErrorMessage } from '@/shared/lib/error-message'
import { FLOW_STATE_ROLES, MAX_ACTIVE_STATES } from '../constants/flow-states'
import { PROJECT_KINDS } from '../constants/project-kinds'
import {
  FLOW_STATE_NAME_MAX_LENGTH,
  createProjectSchema,
  flowStatesSchema,
  type CreateProjectDetails,
  type CreateProjectFormValues,
} from '../schemas/project.schema'
import { useCreateProject } from '../hooks/useCreateProject'
import { useTemplateFlow } from '@/features/template-flows/hooks/useTemplateFlow'
import type { CreateProjectRequest, FlowState, ProjectKind, ProjectRole, StateCategory } from '../types/project.types'

const STATE_CATEGORIES: StateCategory[] = ['Active', 'Completed', 'Cancelled']

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  )
}

// ─── Color Picker ────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  // Controlled only so picking a swatch can close the popup — a color is a single choice, so
  // there is nothing left to do here once one is picked.
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="w-7 h-7 rounded-full border-2 border-border shadow-sm hover:scale-110 transition-transform shrink-0"
            style={{ backgroundColor: value ? resolveSwatchColor(value) : '#e2e8f0' }}
            aria-label="Pick color"
          />
        }
      />
      <PopoverContent align="start" sideOffset={6} className="w-auto p-2">
        <ColorSwatchGrid
          size="sm"
          value={value}
          onChange={(color) => { onChange(color); setOpen(false) }}
        />
      </PopoverContent>
    </Popover>
  )
}

// ─── Roles Picker ─────────────────────────────────────────────────────────────

function RolesPicker({
  value,
  onChange,
}: {
  value: ProjectRole[]
  onChange: (roles: ProjectRole[]) => void
}) {
  function toggle(role: ProjectRole) {
    if (value.includes(role)) onChange(value.filter((r) => r !== role))
    else onChange([...value, role])
  }

  // Uncontrolled, unlike ColorPicker: roles are a multi-select, so the popup stays open across
  // clicks and only Escape, a click outside or the trigger closes it.
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            // The backend rejects a state no role can move items into, so an empty pick is
            // flagged right on the trigger, not only in the submit error.
            aria-invalid={value.length === 0}
            className={cn(
              'h-7 w-20 px-2 rounded-md border border-border text-xs font-medium transition-colors shrink-0',
              'bg-background hover:bg-muted text-foreground text-center',
              'aria-invalid:border-destructive aria-invalid:text-destructive',
            )}
          >
            {value.length === 0
              ? 'No roles'
              : value.length === FLOW_STATE_ROLES.length
                ? 'All roles'
                : `${value.length} roles`}
          </button>
        }
      />
      <PopoverContent align="start" sideOffset={6} className="w-auto min-w-35 gap-0 p-1.5">
        {FLOW_STATE_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => toggle(role)}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors"
          >
            <span
              className={cn(
                'w-4 h-4 rounded border border-border flex items-center justify-center shrink-0',
                value.includes(role) ? 'bg-primary border-primary' : 'bg-background',
              )}
            >
              {value.includes(role) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
            </span>
            {role}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

// ─── Flow State Card ──────────────────────────────────────────────────────────

function FlowStateCard({
  state,
  canMoveUp,
  canMoveDown,
  canDelete,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  state: FlowState
  canMoveUp: boolean
  canMoveDown: boolean
  canDelete: boolean
  onUpdate: (changes: Partial<FlowState>) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}) {
  const isActive = state.category === 'Active'
  const label = state.name.trim() || 'state'

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors group">
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: resolveSwatchColor(state.color) }}
      />

      <Input
        value={state.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="State name"
        aria-label="State name"
        maxLength={FLOW_STATE_NAME_MAX_LENGTH}
        className="h-7 flex-1 min-w-0 text-sm border-transparent bg-transparent shadow-none focus-visible:bg-background focus-visible:border-border"
      />

      <Select value={state.category} onValueChange={(v) => onUpdate({ category: v as StateCategory })}>
        <SelectTrigger size="sm" aria-label={`Category of ${label}`} className="w-28 shrink-0 text-xs font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATE_CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <RolesPicker value={state.roles} onChange={(roles) => onUpdate({ roles })} />

      <ColorPicker value={state.color} onChange={(color) => onUpdate({ color })} />

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          aria-label={`Move ${label} up`}
          className={cn(
            'p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors',
            !isActive && 'invisible',
          )}
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label={`Move ${label} down`}
          className={cn(
            'p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors',
            !isActive && 'invisible',
          )}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          aria-label={`Delete ${label}`}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Step 1: General Info ─────────────────────────────────────────────────────

const STEP1_DEFAULTS: CreateProjectFormValues = {
  name: '',
  description: '',
  code: '',
  // Color is required, and a project with no color reads as broken in the sidebar and on the
  // board card — so the picker starts on a real swatch instead of on nothing.
  color: DEFAULT_SWATCH_COLOR,
  kind: '',
}

type CreateProjectForm = UseFormReturn<CreateProjectFormValues, unknown, CreateProjectDetails>

function Step1Form({
  form,
  onNext,
  onCancel,
  isNextLoading,
  nextError,
}: {
  form: CreateProjectForm
  onNext: (details: CreateProjectDetails) => void
  onCancel: () => void
  isNextLoading: boolean
  nextError: string | null
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form

  const allValues = useWatch({ control })
  const isFormValid = createProjectSchema.safeParse(allValues).success

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="flex flex-col gap-4">
      {nextError && !isNextLoading && <ErrorBanner message={nextError} />}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="proj-name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="proj-name"
          autoFocus
          placeholder="e.g. Payments Platform"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'proj-name-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="proj-name-error" className="text-xs text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="proj-description">Description</Label>
        <Textarea
          id="proj-description"
          rows={3}
          placeholder="Briefly describe this project…"
          className="resize-none max-h-40"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'proj-description-error' : undefined}
          {...register('description')}
        />
        {errors.description && (
          <p id="proj-description-error" className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1.5 w-28">
          <Label htmlFor="proj-code">
            Code <span className="text-destructive">*</span>
          </Label>
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <Input
                id="proj-code"
                ref={field.ref}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                // Letters only, uppercased as typed: the field can't hold anything the
                // schema would reject except a code shorter than 3.
                onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase())}
                placeholder="TST"
                maxLength={3}
                className="font-mono tracking-widest text-center uppercase"
                aria-invalid={!!errors.code}
                aria-describedby={errors.code ? 'proj-code-error' : undefined}
              />
            )}
          />
          {errors.code && (
            <p id="proj-code-error" className="text-xs text-destructive">
              {errors.code.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="proj-kind">
            Kind <span className="text-destructive">*</span>
          </Label>
          <Controller
            control={control}
            name="kind"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                <SelectTrigger id="proj-kind" className="w-full" aria-invalid={!!errors.kind}>
                  <SelectValue>
                    {(selected: ProjectKind | '') => selected || <span className="text-muted-foreground">Select a kind</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_KINDS.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {kind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.kind && <p className="text-xs text-destructive">{errors.kind.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          Color <span className="text-destructive">*</span>
        </Label>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <ColorSwatchGrid value={field.value} onChange={field.onChange} className="self-center" />
          )}
        />
        {/* Centered to sit under the swatch grid, which is itself centered — not left-aligned
            like the errors that hang off a full-width input. Unreachable through the UI today
            (the grid starts on a swatch and always sets another), but the rule stays in the
            schema in case a "clear color" affordance ever appears. */}
        {errors.color && <p className="text-xs text-destructive self-center">{errors.color.message}</p>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!isFormValid || isNextLoading}>
          {isNextLoading ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Loading…
            </>
          ) : (
            'Next'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Step 2: Flow States ──────────────────────────────────────────────────────

function Step2Form({
  flowStates,
  setFlowStates,
  onSubmit,
  onBack,
  onCancel,
  isLoading,
  submitError,
}: {
  flowStates: FlowState[]
  setFlowStates: (states: FlowState[]) => void
  onSubmit: () => void
  onBack: () => void
  onCancel: () => void
  isLoading: boolean
  submitError: string | null
}) {
  // Rules are checked from the first submit attempt on, then live, so the message clears as
  // soon as the list is fixed instead of waiting for another click.
  const [showValidation, setShowValidation] = useState(false)
  const validation = flowStatesSchema.safeParse(flowStates)
  const validationError = showValidation && !validation.success ? validation.error.issues[0].message : null

  const activeStates = flowStates.filter((s) => s.category === 'Active')
  const completedStates = flowStates.filter((s) => s.category === 'Completed')
  const cancelledStates = flowStates.filter((s) => s.category === 'Cancelled')

  function updateState(id: string, changes: Partial<FlowState>) {
    let updated = flowStates.map((s) => (s.id === id ? { ...s, ...changes } : s))
    if (changes.category) {
      const active = updated.filter((s) => s.category === 'Active')
      const completed = updated.filter((s) => s.category === 'Completed')
      const cancelled = updated.filter((s) => s.category === 'Cancelled')
      updated = [...active, ...completed, ...cancelled]
    }
    setFlowStates(updated)
  }

  function moveState(id: string, dir: 'up' | 'down') {
    const idx = flowStates.findIndex((s) => s.id === id)
    if (idx === -1) return
    const activeIdx = activeStates.findIndex((s) => s.id === id)
    if (dir === 'up' && activeIdx === 0) return
    if (dir === 'down' && activeIdx === activeStates.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const next = [...flowStates]
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    setFlowStates(next)
  }

  function deleteState(id: string) {
    setFlowStates(flowStates.filter((s) => s.id !== id))
  }

  function addState() {
    if (activeStates.length >= MAX_ACTIVE_STATES) return
    const insertAt = flowStates.findIndex((s) => s.category !== 'Active')
    const pos = insertAt === -1 ? flowStates.length : insertAt
    const newState: FlowState = {
      id: crypto.randomUUID(),
      name: '',
      category: 'Active',
      color: 'indigo',
      roles: [...FLOW_STATE_ROLES],
    }
    const next = [...flowStates]
    next.splice(pos, 0, newState)
    setFlowStates(next)
  }

  function handleSubmit() {
    setShowValidation(true)
    if (validation.success) onSubmit()
  }

  const pinnedStates = [...completedStates, ...cancelledStates]
  const bannerError = validationError ?? submitError

  return (
    <>
      <div className="flex flex-col gap-3 overflow-y-auto max-h-105 py-1 pr-0.5">
        {bannerError && <ErrorBanner message={bannerError} />}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Active States{' '}
              <span className="text-foreground/60">({activeStates.length}/{MAX_ACTIVE_STATES})</span>
            </p>
            <button
              type="button"
              onClick={addState}
              disabled={activeStates.length >= MAX_ACTIVE_STATES}
              className={cn(
                'flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors',
                'disabled:opacity-40 disabled:pointer-events-none',
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              Add state
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {activeStates.map((state, i) => (
              <FlowStateCard
                key={state.id}
                state={state}
                canMoveUp={i > 0}
                canMoveDown={i < activeStates.length - 1}
                canDelete={flowStates.length > 1}
                onUpdate={(changes) => updateState(state.id, changes)}
                onMoveUp={() => moveState(state.id, 'up')}
                onMoveDown={() => moveState(state.id, 'down')}
                onDelete={() => deleteState(state.id)}
              />
            ))}
            {activeStates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active states. Add one above.
              </p>
            )}
          </div>
        </div>

        {pinnedStates.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Pinned States
            </p>
            <div className="flex flex-col gap-1">
              {pinnedStates.map((state) => (
                <FlowStateCard
                  key={state.id}
                  state={state}
                  canMoveUp={false}
                  canMoveDown={false}
                  canDelete={flowStates.length > 1}
                  onUpdate={(changes) => updateState(state.id, changes)}
                  onMoveUp={() => {}}
                  onMoveDown={() => {}}
                  onDelete={() => deleteState(state.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>Back</Button>
        <Button type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            'Create Project'
          )}
        </Button>
      </DialogFooter>
    </>
  )
}

// ─── Modal body (mounts/unmounts with the dialog portal) ─────────────────────

function ModalBody({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  // Step 1's form lives here, not in Step1Form, so going Back finds the fields as they were.
  const form = useForm<CreateProjectFormValues, unknown, CreateProjectDetails>({
    resolver: zodResolver(createProjectSchema),
    mode: 'onChange',
    defaultValues: STEP1_DEFAULTS,
  })
  const [details, setDetails] = useState<CreateProjectDetails | null>(null)
  const [flowStates, setFlowStates] = useState<FlowState[]>([])
  const lastFetchedKindRef = useRef<ProjectKind | null>(null)

  const { mutate, isPending, error } = useCreateProject()
  const { mutate: fetchTemplate, isPending: isFetchingTemplate, error: templateError } = useTemplateFlow()

  function handleNext(values: CreateProjectDetails) {
    setDetails(values)
    if (flowStates.length > 0 && lastFetchedKindRef.current === values.kind) {
      setStep(2)
      return
    }
    fetchTemplate(values.kind, {
      onSuccess: (template) => {
        lastFetchedKindRef.current = values.kind
        setFlowStates(template.states.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          color: s.color,
          roles: [...FLOW_STATE_ROLES],
        })))
        setStep(2)
      },
    })
  }

  function handleSubmit() {
    if (!details) return
    const payload: CreateProjectRequest = {
      name: details.name,
      description: details.description.trim(),
      prefix: details.code,
      kind: details.kind,
      color: details.color,
      flowStates: flowStates.map(({ name, category, color, roles }) => ({
        name: name.trim(), category, color, allowedRoles: roles,
      })),
    }

    mutate(payload, {
      onSuccess: (guid) => {
        onClose()
        navigate(`/projects/${guid}/board`)
      },
    })
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between pr-8">
          <DialogTitle>Create New Project</DialogTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            Step {step} of 2
          </span>
        </div>
        <div className="flex gap-1 mt-1">
          <div className={cn('h-1 flex-1 rounded-full transition-colors', step >= 1 ? 'bg-primary' : 'bg-muted')} />
          <div className={cn('h-1 flex-1 rounded-full transition-colors', step >= 2 ? 'bg-primary' : 'bg-muted')} />
        </div>
      </DialogHeader>

      {step === 1 ? (
        <Step1Form
          form={form}
          onNext={handleNext}
          onCancel={onClose}
          isNextLoading={isFetchingTemplate}
          nextError={templateError ? getErrorMessage(templateError, "Couldn't load the flow template for this kind.") : null}
        />
      ) : (
        <Step2Form
          flowStates={flowStates}
          setFlowStates={setFlowStates}
          onSubmit={handleSubmit}
          onBack={() => setStep(1)}
          onCancel={onClose}
          isLoading={isPending}
          submitError={error ? getErrorMessage(error) : null}
        />
      )}
    </>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function CreateProjectModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent
        className="md:max-w-168 gap-3"
      >
        {open && <ModalBody onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
