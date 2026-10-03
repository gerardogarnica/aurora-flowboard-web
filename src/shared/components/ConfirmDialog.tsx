import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The yes/no question, e.g. "Retire component?". */
  title: string
  /** Names the thing (in `font-medium text-foreground`) and states the consequence. */
  description: ReactNode
  confirmLabel: string
  /** `destructive` for actions that remove or revoke something. */
  variant?: 'default' | 'destructive'
  onConfirm: () => void
  /**
   * For a confirm that waits for the server before closing: disables both buttons, blocks
   * dismissal (Escape, outside click) and shows `pendingLabel` with a spinner. Leave it unset
   * for optimistic actions, which close the dialog right away.
   */
  isPending?: boolean
  pendingLabel?: string
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  variant = 'default',
  onConfirm,
  isPending = false,
  pendingLabel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isPending) onOpenChange(next) }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={isPending}>
            {isPending && pendingLabel ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {pendingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
