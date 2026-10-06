import { useRef } from 'react'
import { Accordion } from '@base-ui/react/accordion'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { resolveSwatchColor } from '@/shared/constants/colors'
import { getWorkItemTypeConfig } from '@/features/work-items/constants/work-item-display'
import { UserAvatar, UnassignedAvatar } from '@/shared/components/UserAvatar'
import type { ProjectBoardColumn, ProjectBoardWorkItem } from '@/features/projects/types/project.types'
import type { BoardGroup, BoardGroupIdentity } from '@/features/projects/utils/group-board-items'
import { useBoardDrag } from '@/features/projects/hooks/useBoardDrag'
import { useColumnDropTarget } from '@/features/projects/hooks/useColumnDropTarget'
import { WorkItemCard } from './WorkItemCard'
import { CountPill, FlowStateHeading } from './FlowStateHeading'
import { boardDropClassName, dropRingStyle } from './board-drop-classes'

function gridTemplate(columnCount: number) {
  return { gridTemplateColumns: `repeat(${columnCount}, minmax(12rem, 1fr))` }
}

function LaneIdentity({ identity }: { identity: BoardGroupIdentity }) {
  switch (identity.kind) {
    case 'assignee':
      return <UserAvatar userId={identity.userId} initials={identity.initials} />
    case 'unassigned':
      return <UnassignedAvatar />
    case 'type': {
      const config = getWorkItemTypeConfig(identity.type)
      const Icon = config.icon
      return (
        <span className="w-6 h-6 flex items-center justify-center shrink-0">
          <Icon className={cn('w-4 h-4', config.className)} />
        </span>
      )
    }
    case 'milestone':
      return (
        <span className="w-6 h-6 flex items-center justify-center shrink-0">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: resolveSwatchColor(identity.color ?? '') }}
          />
        </span>
      )
    case 'no-milestone':
      return (
        <span className="w-6 h-6 flex items-center justify-center shrink-0">
          <span className="w-2.5 h-2.5 rounded-full border border-dashed border-muted-foreground/50" />
        </span>
      )
    case 'plain':
      return null
  }
}

/**
 * A collapsed lane's progress at a glance: one segment per flow state that holds items,
 * sized by count and painted in that state's color.
 */
function FlowStrip({ group, columns }: { group: BoardGroup; columns: ProjectBoardColumn[] }) {
  const segments = columns
    .map((col) => ({ col, count: group.cells[col.flowStateId]?.length ?? 0 }))
    .filter((s) => s.count > 0)

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="ml-auto flex h-1.5 w-32 shrink-0 gap-px overflow-hidden rounded-full bg-muted">
            {segments.map(({ col, count }) => (
              <span
                key={col.flowStateId}
                className="h-full"
                style={{ flexGrow: count, backgroundColor: resolveSwatchColor(col.color) }}
              />
            ))}
          </span>
        }
      />
      <TooltipContent>
        {segments.map(({ col, count }) => `${col.flowStateName} ${count}`).join(' · ')}
      </TooltipContent>
    </Tooltip>
  )
}

/** One lane × column cell: a drop target that only takes cards from its own lane. */
function SwimlaneCell({
  column,
  laneKey,
  items,
  onSelectItem,
}: {
  column: ProjectBoardColumn
  laneKey: string
  items: ProjectBoardWorkItem[]
  onSelectItem: (code: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const dropState = useColumnDropTarget(ref, { stateId: column.flowStateId, laneKey })
  const { enabled, pendingIds } = useBoardDrag()

  return (
    <div
      ref={ref}
      style={dropRingStyle(resolveSwatchColor(column.color))}
      className={cn('bg-sidebar rounded-lg p-2 flex flex-col gap-2 min-h-12', boardDropClassName(dropState))}
    >
      {items.map((item) => (
        <WorkItemCard
          key={item.workItemId}
          item={item}
          onSelect={onSelectItem}
          dragLaneKey={laneKey}
          isDraggable={enabled && !pendingIds.has(item.workItemId)}
        />
      ))}
    </div>
  )
}

interface BoardSwimlanesProps {
  columns: ProjectBoardColumn[]
  groups: BoardGroup[]
  openKeys: string[]
  onOpenKeysChange: (keys: string[]) => void
  onSelectItem: (code: string) => void
}

/** Grouped board: column headers once (sticky), then one collapsible lane per group. Needs a `TooltipProvider` above it. */
export function BoardSwimlanes({ columns, groups, openKeys, onOpenKeysChange, onSelectItem }: BoardSwimlanesProps) {
  const template = gridTemplate(columns.length)

  if (groups.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No work items to group.</p>
  }

  return (
    <div className="min-w-fit pb-6">
      <div className="sticky top-0 z-10 bg-background grid gap-3 pt-4 pb-3" style={template}>
        {columns.map((col) => (
          <div key={col.flowStateId} className="bg-sidebar border border-border rounded-lg overflow-hidden">
            <div className="h-0.75" style={{ backgroundColor: resolveSwatchColor(col.color) }} />
            <FlowStateHeading column={col} className="px-3 py-2" />
          </div>
        ))}
      </div>

      <Accordion.Root
        multiple
        value={openKeys}
        onValueChange={(value) => onOpenKeysChange(value as string[])}
        className="flex flex-col"
      >
        {groups.map((group) => {
          const isOpen = openKeys.includes(group.key)

          return (
            <Accordion.Item key={group.key} value={group.key} className="border-t border-border/60">
              <Accordion.Header className="m-0">
                <Accordion.Trigger className="w-full h-10 my-1 px-2 flex items-center gap-2 rounded-md text-left hover:bg-black/[0.04] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out',
                      isOpen && 'rotate-90',
                    )}
                  />
                  <LaneIdentity identity={group.identity} />
                  <span
                    className={cn(
                      'min-w-0 truncate text-sm',
                      group.isEmptyValue ? 'italic text-muted-foreground' : 'font-medium text-foreground',
                    )}
                  >
                    {group.label}
                  </span>
                  {group.isCurrentUser && <span className="text-xs text-muted-foreground shrink-0">(you)</span>}
                  <CountPill count={group.total} />
                  {!isOpen && <FlowStrip group={group} columns={columns} />}
                </Accordion.Trigger>
              </Accordion.Header>

              <Accordion.Panel className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-starting-style:h-0 data-ending-style:h-0">
                <div className="grid gap-3 pb-4" style={template}>
                  {columns.map((col) => (
                    <SwimlaneCell
                      key={col.flowStateId}
                      column={col}
                      laneKey={group.key}
                      items={group.cells[col.flowStateId] ?? []}
                      onSelectItem={onSelectItem}
                    />
                  ))}
                </div>
              </Accordion.Panel>
            </Accordion.Item>
          )
        })}
      </Accordion.Root>
    </div>
  )
}
