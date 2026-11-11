import type { ReactNode } from 'react'
import { UnderlineTabs, UnderlineTabsPanel } from '@/shared/components/UnderlineTabs'
import { cn } from '@/lib/utils'
import { MY_WORK_TABS, type MyWorkTab } from '../constants/my-work-tabs'

/** The tab bar of My work and My Issues. A tab without a count shows none. */
export function MyWorkTabs({
  tab,
  onTabChange,
  counts,
  listClassName,
  children,
}: {
  tab: MyWorkTab
  onTabChange: (tab: MyWorkTab) => void
  counts?: Partial<Record<MyWorkTab, number>>
  listClassName?: string
  children: ReactNode
}) {
  return (
    <UnderlineTabs
      value={tab}
      onValueChange={onTabChange}
      listClassName={cn('flex-wrap', listClassName)}
      tabs={MY_WORK_TABS.map(({ value, label }) => {
        const count = counts?.[value]
        return {
          value,
          label: (
            <span className="flex items-center gap-1.5">
              {/* The space keeps a screen reader from reading "All7"; flex layout ignores it. */}
              {label}{' '}
              {count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-px text-[11px] tabular-nums',
                    value === tab ? 'bg-primary/10 font-medium text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              )}
            </span>
          ),
        }
      })}
    >
      {/* One panel: every tab shows the same list with different filters. */}
      <UnderlineTabsPanel value={tab}>{children}</UnderlineTabsPanel>
    </UnderlineTabs>
  )
}
