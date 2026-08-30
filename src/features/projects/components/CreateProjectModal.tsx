import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown, Trash2, Plus, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { SWATCH_COLORS, resolveSwatchColor } from '@/shared/constants/colors'
import { PROJECT_ROLES, MAX_ACTIVE_STATES } from '../constants/flow-states'
import { PROJECT_KINDS } from '../constants/project-kinds'
import { useCreateProject } from '../hooks/useCreateProject'
import { useTemplateFlow } from '@/features/template-flows/hooks/useTemplateFlow'
import type { CreateProjectRequest, CreateProjectStep1Data, FlowState, ProjectKind, ProjectRole, StateCategory } from '../types/project.types'

// ─── Color Picker ────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleToggle() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 6, left: rect.left })
    }
    setOpen((o) => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="w-7 h-7 rounded-full border-2 border-border shadow-sm hover:scale-110 transition-transform shrink-0"
        style={{ backgroundColor: value ? resolveSwatchColor(value) : '#e2e8f0' }}
        aria-label="Pick color"
      />
      {open && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-200 bg-popover border border-border rounded-lg shadow-xl p-2 grid grid-cols-8 gap-1 w-max"
          style={{ top: coords.top, left: coords.left }}
        >
          {Object.keys(SWATCH_COLORS).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => { onChange(key); setOpen(false) }}
              title={key}
              className={cn(
                'w-5 h-5 rounded-full border-2 transition-all hover:scale-110',
                value === key ? 'border-primary scale-110' : 'border-transparent',
              )}
              style={{ backgroundColor: resolveSwatchColor(key) }}
            />
          ))}
        </div>,
        document.body,
      )}
    </>
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
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function toggle(role: ProjectRole) {
    if (value.includes(role)) onChange(value.filter((r) => r !== role))
    else onChange([...value, role])
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'h-7 w-20 px-2 rounded-md border border-border text-xs font-medium transition-colors shrink-0',
          'bg-background hover:bg-muted text-foreground text-center',
        )}
      >
        {value.length === 0
          ? 'No roles'
          : value.length === PROJECT_ROLES.length
            ? 'All roles'
            : `${value.length} roles`}
      </button>
      {open && (
        <div className="absolute z-60 top-9 left-0 bg-popover border border-border rounded-lg shadow-xl p-1.5 min-w-35">
          {PROJECT_ROLES.map((role) => (
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
        </div>
      )}
    </div>
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
        className="h-7 flex-1 min-w-0 text-sm border-transparent bg-transparent shadow-none focus-visible:bg-background focus-visible:border-border"
      />

      <select
        value={state.category}
        onChange={(e) => onUpdate({ category: e.target.value as StateCategory })}
        className={cn(
          'h-7 w-28 rounded-md border border-border bg-background px-1.5 text-xs font-medium text-foreground shrink-0',
          'focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer',
        )}
      >
        <option value="Active">Active</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>

      <RolesPicker value={state.roles} onChange={(roles) => onUpdate({ roles })} />

      <ColorPicker value={state.color} onChange={(color) => onUpdate({ color })} />

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
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
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Step 1: General Info ─────────────────────────────────────────────────────

const STEP1_EMPTY: CreateProjectStep1Data = {
  name: '',
  description: '',
  code: '',
  color: '',
  kind: '',
}

function Step1Form({
  data,
  onChange,
  onNext,
  onCancel,
  isNextLoading,
  nextError,
}: {
  data: CreateProjectStep1Data
  onChange: (data: CreateProjectStep1Data) => void
  onNext: () => void
  onCancel: () => void
  isNextLoading: boolean
  nextError: string | null
}) {
  const [errors, setErrors] = useState<{ name?: string; code?: string; kind?: string }>({})

  function validate() {
    const e: typeof errors = {}
    if (!data.name.trim()) e.name = 'Name is required.'
    if (data.code.length !== 3) e.code = 'Code must be exactly 3 letters.'
    if (!data.kind) e.kind = 'Kind is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (validate()) onNext()
  }

  function setField<K extends keyof CreateProjectStep1Data>(key: K, value: CreateProjectStep1Data[K]) {
    onChange({ ...data, [key]: value })
    if (errors[key as keyof typeof errors]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const isValid = data.name.trim().length > 0 && data.code.length === 3 && data.kind !== ''

  return (
    <>
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="proj-name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="proj-name"
            value={data.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="e.g. Payments Platform"
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="proj-description">Description</Label>
          <textarea
            id="proj-description"
            value={data.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Briefly describe this project…"
            rows={3}
            className={cn(
              'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'resize-none',
            )}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 w-28">
            <Label htmlFor="proj-code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="proj-code"
              value={data.code}
              onChange={(e) =>
                setField('code', e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase())
              }
              placeholder="TST"
              maxLength={3}
              className="font-mono tracking-widest text-center uppercase"
              aria-invalid={!!errors.code}
            />
            {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="proj-kind">
              Kind <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.kind}
              onValueChange={(v) => setField('kind', v as ProjectKind)}
            >
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
            {errors.kind && <p className="text-xs text-destructive">{errors.kind}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(SWATCH_COLORS).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setField('color', key)}
                title={key}
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                  data.color === key ? 'border-primary scale-110 ring-2 ring-primary/30' : 'border-transparent',
                )}
                style={{ backgroundColor: resolveSwatchColor(key) }}
              />
            ))}
          </div>
        </div>

        {nextError && !isNextLoading && <p className="text-xs text-destructive">{nextError}</p>}
      </div>

      <div className="-mx-4 -mb-4 flex items-center justify-end gap-2 rounded-b-xl border-t bg-muted/50 px-4 py-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleNext} disabled={!isValid || isNextLoading}>
          {isNextLoading ? 'Loading…' : 'Next'}
        </Button>
      </div>
    </>
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
  const [validationError, setValidationError] = useState<string | null>(null)

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
      roles: [...PROJECT_ROLES],
    }
    const next = [...flowStates]
    next.splice(pos, 0, newState)
    setFlowStates(next)
  }

  function validate() {
    if (flowStates.length === 0) {
      setValidationError('At least one state is required.')
      return false
    }
    const names = flowStates.map((s) => s.name.trim().toLowerCase())
    if (new Set(names).size !== names.length) {
      setValidationError('State names must be unique.')
      return false
    }
    if (names.some((n) => n === '')) {
      setValidationError('All states must have a name.')
      return false
    }
    setValidationError(null)
    return true
  }

  function handleSubmit() {
    if (validate()) onSubmit()
  }

  const pinnedStates = [...completedStates, ...cancelledStates]

  return (
    <>
      <div className="flex flex-col gap-3 overflow-y-auto max-h-105 py-1 pr-0.5">
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

        {(validationError ?? submitError) && (
          <p className="text-xs text-destructive px-1">{validationError ?? submitError}</p>
        )}
      </div>

      <div className="-mx-4 -mb-4 flex items-center justify-end gap-2 rounded-b-xl border-t bg-muted/50 px-4 py-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Creating…' : 'Create Project'}
        </Button>
      </div>
    </>
  )
}

// ─── Modal body (mounts/unmounts with the dialog portal) ─────────────────────

function ModalBody({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [step1Data, setStep1Data] = useState<CreateProjectStep1Data>(STEP1_EMPTY)
  const [flowStates, setFlowStates] = useState<FlowState[]>([])
  const lastFetchedKindRef = useRef<ProjectKind | null>(null)

  const { mutate, isPending, error } = useCreateProject()
  const { mutate: fetchTemplate, isPending: isFetchingTemplate, error: templateError } = useTemplateFlow()

  function handleNext() {
    if (!step1Data.kind) return
    if (flowStates.length > 0 && lastFetchedKindRef.current === step1Data.kind) {
      setStep(2)
      return
    }
    fetchTemplate(step1Data.kind, {
      onSuccess: (template) => {
        lastFetchedKindRef.current = step1Data.kind as ProjectKind
        setFlowStates(template.states.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          color: s.color,
          roles: [...PROJECT_ROLES],
        })))
        setStep(2)
      },
    })
  }

  function handleSubmit() {
    const payload: CreateProjectRequest = {
      name: step1Data.name.trim(),
      description: step1Data.description.trim(),
      prefix: step1Data.code,
      kind: step1Data.kind as ProjectKind,
      ...(step1Data.color ? { color: step1Data.color } : {}),
      flowStates: flowStates.map(({ name, category, color, roles }) => ({
        name, category, color, allowedRoles: roles,
      })),
    }

    mutate(payload, {
      onSuccess: (guid) => {
        onClose()
        navigate(`/projects/${guid}/board`)
      },
    })
  }

  const submitError = error instanceof Error ? error.message : error ? String(error) : null
  const nextError = templateError instanceof Error ? templateError.message : templateError ? String(templateError) : null

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
          data={step1Data}
          onChange={setStep1Data}
          onNext={handleNext}
          onCancel={onClose}
          isNextLoading={isFetchingTemplate}
          nextError={nextError}
        />
      ) : (
        <Step2Form
          flowStates={flowStates}
          setFlowStates={setFlowStates}
          onSubmit={handleSubmit}
          onBack={() => setStep(1)}
          onCancel={onClose}
          isLoading={isPending}
          submitError={submitError}
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
