/**
 * For queries whose numbers change with time alone: "stalled" and an item's age move even when
 * nobody mutates anything, so the app's 5-minute, no-focus-refetch default would leave them stale.
 */
export const FLOW_QUERY_OPTIONS = { staleTime: 60_000, refetchOnWindowFocus: true } as const
