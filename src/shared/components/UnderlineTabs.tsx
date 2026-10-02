import type { ComponentProps, ReactNode } from 'react'
import { Tabs } from '@base-ui/react/tabs'
import { cn } from '@/lib/utils'
import { UNDERLINE_TAB_BASE, UNDERLINE_TAB_IDLE } from './underline-tab-classes'

interface UnderlineTab<T extends string> {
  value: T
  label: ReactNode
}

interface UnderlineTabsProps<T extends string> {
  value: T
  onValueChange: (value: T) => void
  tabs: UnderlineTab<T>[]
  /** Classes for the root wrapper — it sits between the tab bar's parent and the panels. */
  className?: string
  /** Classes for the tab bar (padding, its bottom border's extent). */
  listClassName?: string
  /** The panels: `<UnderlineTabsPanel value=…>` for each tab, anywhere inside. */
  children: ReactNode
}

/**
 * Client-side tabs on Base UI Tabs: arrow keys move between tabs, Home/End jump, and the
 * tab / tabpanel ARIA wiring is done for you. For tabs that are routes, use RouteTabs.
 */
export function UnderlineTabs<T extends string>({
  value,
  onValueChange,
  tabs,
  className,
  listClassName,
  children,
}: UnderlineTabsProps<T>) {
  return (
    <Tabs.Root value={value} onValueChange={(next) => onValueChange(next as T)} className={className}>
      <Tabs.List className={cn('flex items-center gap-5 border-b border-border', listClassName)}>
        {tabs.map((tab) => (
          <Tabs.Tab
            key={tab.value}
            value={tab.value}
            className={cn(
              UNDERLINE_TAB_BASE,
              UNDERLINE_TAB_IDLE,
              'data-[active]:border-primary data-[active]:text-foreground data-[active]:font-medium',
            )}
          >
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {children}
    </Tabs.Root>
  )
}

/**
 * A tab's panel. Inactive panels unmount by default (lazy content stays lazy); pass
 * `keepMounted` to keep them in the DOM, e.g. to preserve an unsaved form draft.
 */
export function UnderlineTabsPanel(props: ComponentProps<typeof Tabs.Panel>) {
  return <Tabs.Panel {...props} />
}
