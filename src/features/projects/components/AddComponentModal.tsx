import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/shared/lib/api-client'
import { useCreateComponent } from '../hooks/useCreateComponent'

function AddComponentForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [name, setName] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const mutation = useCreateComponent(projectId)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setValidationError('Name is required.')
      return
    }
    mutation.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          toast.success('Component added')
          onDone()
        },
      },
    )
  }

  const bannerError =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? 'Something went wrong. Please try again.'
        : null

  const isValid = name.trim().length > 0

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {bannerError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {bannerError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="component-name">Name</Label>
        <Input
          id="component-name"
          autoFocus
          placeholder="e.g. Internal API"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (validationError) setValidationError(null)
          }}
          aria-invalid={!!validationError}
          aria-describedby={validationError ? 'component-name-error' : undefined}
        />
        {validationError && (
          <p id="component-name-error" className="text-xs text-destructive">
            {validationError}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Adding…
            </>
          ) : (
            'Add component'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AddComponentModal({
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add component</DialogTitle>
          <DialogDescription>
            Break this project down into a piece you want to track independently.
          </DialogDescription>
        </DialogHeader>
        {open && <AddComponentForm projectId={projectId} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
