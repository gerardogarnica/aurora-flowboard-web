/**
 * The underline-tab look, shared by UnderlineTabs (Base UI tabs, active via `data-active`) and
 * RouteTabs (NavLinks, active via `isActive`) so the two can't drift. Its own file because the
 * react-refresh lint rule doesn't allow non-component exports next to components.
 */
export const UNDERLINE_TAB_BASE =
  'text-sm pb-2.5 border-b-2 -mb-px transition-colors cursor-pointer outline-none rounded-t-sm focus-visible:ring-3 focus-visible:ring-ring/50'
export const UNDERLINE_TAB_ACTIVE = 'border-primary text-foreground font-medium'
export const UNDERLINE_TAB_IDLE = 'border-transparent text-muted-foreground hover:text-foreground'
