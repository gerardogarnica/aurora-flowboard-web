import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { formatChangeLogEntry, formatDateTime } from '../constants/work-item-display'
import type { WorkItemDetailResponse, WorkItemStateTransition } from '../types/work-item.types'
import type { ProjectBoardColumn } from '@/features/projects/types/project.types'

type ActivityTabId = 'comments' | 'timeEntries' | 'stateHistory' | 'changeLog'

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground/70 py-2">{message}</p>
}

function StateHistoryTimeline({
  transitions,
  columns,
}: {
  transitions: WorkItemStateTransition[]
  columns: ProjectBoardColumn[]
}) {
  const colorByStateId = new Map(columns.map((col) => [col.flowStateId, resolveSwatchColor(col.color)]))
  const colorFor = (stateId: string) => colorByStateId.get(stateId) ?? resolveSwatchColor('')

  const sorted = [...transitions].sort(
    (a, b) => new Date(b.changedOnUtc).getTime() - new Date(a.changedOnUtc).getTime(),
  )

  return (
    <div className="flex flex-col">
      {sorted.map((transition, index) => {
        const toColor = colorFor(transition.toStateId)
        const fromColor = transition.fromStateId ? colorFor(transition.fromStateId) : undefined
        const isLast = index === sorted.length - 1

        return (
          <div key={transition.stateTransitionId} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className="w-2.5 h-2.5 rounded-full ring-4 ring-background shrink-0 mt-1"
                style={{ backgroundColor: toColor }}
              />
              {!isLast && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className={cn('flex-1 min-w-0', !isLast && 'pb-4')}>
              <div className="flex items-center gap-1.5 flex-wrap">
                {transition.fromStateName && fromColor && (
                  <>
                    <Badge
                      variant="outline"
                      className="font-normal"
                      style={{ borderColor: fromColor, color: fromColor }}
                    >
                      {transition.fromStateName}
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  </>
                )}
                <Badge className="text-white" style={{ backgroundColor: toColor }}>
                  {transition.toStateName}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">
                {transition.changedByFullName} · {formatDateTime(transition.changedOnUtc)}
              </div>
              {transition.reason && <p className="text-sm text-foreground mt-1">{transition.reason}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function WorkItemActivitySections({
  item,
  columns,
}: {
  item: WorkItemDetailResponse
  columns: ProjectBoardColumn[]
}) {
  const [activeTab, setActiveTab] = useState<ActivityTabId>('comments')

  const tabs: { id: ActivityTabId; label: string; count: number }[] = [
    { id: 'comments', label: 'Comments', count: item.comments.length },
    { id: 'timeEntries', label: 'Time Entries', count: item.timeEntries.length },
    { id: 'stateHistory', label: 'State History', count: item.stateHistory.length },
    { id: 'changeLog', label: 'Change Log', count: item.changeLogs.length },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex items-center gap-5 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'text-sm pb-2.5 border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label} <span className="font-normal">· {tab.count}</span>
          </button>
        ))}
      </div>

      {activeTab === 'comments' && (
        item.comments.length === 0 ? (
          <EmptyState message="No comments yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {[...item.comments]
              .sort((a, b) => new Date(b.createdOnUtc).getTime() - new Date(a.createdOnUtc).getTime())
              .map((comment) => (
                <div key={comment.commentId} className="rounded-lg border border-border p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{comment.authorFullName}</span>
                    <span>{formatDateTime(comment.createdOnUtc)}</span>
                    {comment.updatedOnUtc && <span>(edited)</span>}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
          </div>
        )
      )}

      {activeTab === 'timeEntries' && (
        item.timeEntries.length === 0 ? (
          <EmptyState message="No time logged." />
        ) : (
          <div className="flex flex-col gap-2">
            {[...item.timeEntries]
              .sort((a, b) => new Date(b.loggedOnUtc).getTime() - new Date(a.loggedOnUtc).getTime())
              .map((entry) => (
                <div key={entry.timeEntryId} className="flex items-start justify-between gap-3 text-sm border-b border-border/60 pb-2 last:border-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-foreground">{entry.description ?? 'Time logged'}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.loggedByFullName} · {formatDateTime(entry.loggedOnUtc)}
                    </span>
                  </div>
                  <span className="text-muted-foreground tabular-nums shrink-0">{entry.hours}h</span>
                </div>
              ))}
          </div>
        )
      )}

      {activeTab === 'stateHistory' && (
        item.stateHistory.length === 0 ? (
          <EmptyState message="No state transitions yet." />
        ) : (
          <StateHistoryTimeline transitions={item.stateHistory} columns={columns} />
        )
      )}

      {activeTab === 'changeLog' && (
        item.changeLogs.length === 0 ? (
          <EmptyState message="No changes recorded." />
        ) : (
          <div className="flex flex-col gap-1.5">
            {[...item.changeLogs]
              .sort((a, b) => new Date(b.changedOnUtc).getTime() - new Date(a.changedOnUtc).getTime())
              .map((log) => (
                <div key={log.changeLogId} className="text-xs text-muted-foreground">
                  {formatChangeLogEntry(log)} · {formatDateTime(log.changedOnUtc)}
                </div>
              ))}
          </div>
        )
      )}
    </div>
  )
}
