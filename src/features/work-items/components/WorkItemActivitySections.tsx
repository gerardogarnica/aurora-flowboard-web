import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatChangeType, formatDateTime, formatUserRef } from '../constants/work-item-display'
import type { WorkItemDetailResponse } from '../types/work-item.types'

type ActivityTabId = 'comments' | 'timeEntries' | 'stateHistory' | 'changeLog'

function UserRef({ id }: { id: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="font-mono text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
        {formatUserRef(id)}
      </TooltipTrigger>
      <TooltipContent>{id}</TooltipContent>
    </Tooltip>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground/70 py-2">{message}</p>
}

export function WorkItemActivitySections({ item }: { item: WorkItemDetailResponse }) {
  const [activeTab, setActiveTab] = useState<ActivityTabId>('comments')

  const tabs: { id: ActivityTabId; label: string; count: number }[] = [
    { id: 'comments', label: 'Comments', count: item.comments.length },
    { id: 'timeEntries', label: 'Time Entries', count: item.timeEntries.length },
    { id: 'stateHistory', label: 'State History', count: item.stateHistory.length },
    { id: 'changeLog', label: 'Change Log', count: item.changeLogs.length },
  ]

  return (
    <TooltipProvider>
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
              {item.comments.map((comment) => (
                <div key={comment.commentId} className="rounded-lg border border-border p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UserRef id={comment.authorId} />
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
              {item.timeEntries.map((entry) => (
                <div key={entry.timeEntryId} className="flex items-start justify-between gap-3 text-sm border-b border-border/60 pb-2 last:border-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-foreground">{entry.description ?? 'Time logged'}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <UserRef id={entry.userId} /> · {formatDateTime(entry.loggedOnUtc)}
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
            <div className="flex flex-col gap-2">
              {item.stateHistory.map((transition) => (
                <div key={transition.stateTransitionId} className="text-sm">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserRef id={transition.changedById} />
                    <span>changed state · {formatDateTime(transition.changedOnUtc)}</span>
                  </div>
                  {transition.reason && <p className="text-sm text-foreground mt-0.5">{transition.reason}</p>}
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'changeLog' && (
          item.changeLogs.length === 0 ? (
            <EmptyState message="No changes recorded." />
          ) : (
            <div className="flex flex-col gap-1.5">
              {item.changeLogs.map((log) => (
                <div key={log.changeLogId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserRef id={log.changedById} />
                  <span>{formatChangeType(log.changeType)} · {formatDateTime(log.changedOnUtc)}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </TooltipProvider>
  )
}
