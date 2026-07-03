import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useWorkItem } from '../hooks/useWorkItem'
import { WORK_ITEM_TYPE_CONFIG } from '../constants/work-item-display'
import { WorkItemSidebar } from './WorkItemSidebar'
import { WorkItemActivitySections } from './WorkItemActivitySections'
import type { FlowStateBoardResponse, WorkItemSummaryResponse } from '@/features/projects/types/board.types'

function DetailSkeleton() {
  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 p-6 flex flex-col gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <Separator orientation="vertical" />
      <div className="w-64 shrink-0 p-6 flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
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

function ModalBody({
  code,
  workItems,
  columns,
  isBoardLoading,
  onClose,
}: {
  code: string
  workItems: WorkItemSummaryResponse[]
  columns: FlowStateBoardResponse[]
  isBoardLoading: boolean
  onClose: () => void
}) {
  const match = workItems.find((w) => w.code === code)
  const { data: item, isLoading, isError, error } = useWorkItem(match?.workItemId)

  if (!match) {
    if (isBoardLoading) return <DetailSkeleton />
    return (
      <StatusMessage
        title="Work item not found"
        message={`No work item with code "${code}" was found on this board.`}
        onClose={onClose}
      />
    )
  }

  if (isLoading) return <DetailSkeleton />

  if (isError) {
    return (
      <StatusMessage
        title="Couldn't load work item"
        message={error instanceof Error ? error.message : 'Something went wrong.'}
        onClose={onClose}
      />
    )
  }

  if (!item) return null

  const typeConfig = WORK_ITEM_TYPE_CONFIG[item.type]
  const TypeIcon = typeConfig.icon
  const isCancelled = columns.find((col) => col.flowStateId === item.flowStateId)?.category === 'Cancelled'

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 gap-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
          <TypeIcon className={cn('w-3.5 h-3.5', typeConfig.className)} />
          <span>{match.code}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <DialogTitle className="text-lg">{item.title}</DialogTitle>
          <Badge variant="secondary" className="shrink-0">{item.flowStateName}</Badge>
        </div>
      </DialogHeader>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {item.description || <span className="text-muted-foreground">No description provided.</span>}
          </p>
          <WorkItemActivitySections item={item} />
        </div>
        <Separator orientation="vertical" />
        <div className="w-64 shrink-0 overflow-y-auto p-6">
          <WorkItemSidebar key={item.workItemId} item={item} isCancelled={isCancelled} />
        </div>
      </div>
    </div>
  )
}

export function WorkItemDetailModal({
  code,
  workItems,
  columns,
  isBoardLoading,
  onClose,
}: {
  code: string | null
  workItems: WorkItemSummaryResponse[]
  columns: FlowStateBoardResponse[]
  isBoardLoading: boolean
  onClose: () => void
}) {
  const open = !!code

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-4xl w-full p-0 gap-0 flex flex-col max-h-[85vh] overflow-hidden">
        {open && (
          <ModalBody
            code={code}
            workItems={workItems}
            columns={columns}
            isBoardLoading={isBoardLoading}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
