import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CHANGE_TYPE_LABELS, formatDateTime, formatUserRef } from '../constants/work-item-display'
import type { WorkItemDetailResponse } from '../types/work-item.types'

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

export function WorkItemActivitySections({ item }: { item: WorkItemDetailResponse }) {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <Section title="Comments" count={item.comments.length}>
          {item.comments.length === 0 ? (
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
          )}
        </Section>

        <Section title="Time Entries" count={item.timeEntries.length}>
          {item.timeEntries.length === 0 ? (
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
          )}
        </Section>

        <Section title="State History" count={item.stateHistory.length}>
          {item.stateHistory.length === 0 ? (
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
          )}
        </Section>

        <Section title="Change Log" count={item.changeLogs.length}>
          {item.changeLogs.length === 0 ? (
            <EmptyState message="No changes recorded." />
          ) : (
            <div className="flex flex-col gap-1.5">
              {item.changeLogs.map((log) => (
                <div key={log.changeLogId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserRef id={log.changedById} />
                  <span>{CHANGE_TYPE_LABELS[log.changeType]} · {formatDateTime(log.changedOnUtc)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </TooltipProvider>
  )
}
