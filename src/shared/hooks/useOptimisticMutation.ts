import {
  useMutation,
  useQueryClient,
  type InvalidateQueryFilters,
  type QueryKey,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/shared/lib/error-message'

/** One optimistic edit to one cached query. Build it with `cachePatch` so `update` is typed. */
export interface CachePatch {
  queryKey: QueryKey
  update: (old: unknown) => unknown
}

export function cachePatch<T>(queryKey: QueryKey, update: (old: T) => T): CachePatch {
  return { queryKey, update: update as (old: unknown) => unknown }
}

interface Snapshot {
  queryKey: QueryKey
  data: unknown
}

interface OptimisticMutationOptions<TVars, TData> {
  mutationFn: (vars: TVars) => Promise<TData>
  /** The caches to update before the request, each with the change it gets. */
  patches: (vars: TVars) => CachePatch[]
  /** What to refetch once the request settles — success or error — so the caches resync with the server. */
  invalidate: (vars: TVars) => InvalidateQueryFilters[]
  /** Toast text when the error carries no API message (anything that isn't an `ApiError`). */
  errorMessage?: string
}

/**
 * The optimistic-update cycle every mutation here repeats: cancel in-flight fetches of the
 * patched queries, snapshot them, apply the patches, roll back and toast on error, invalidate
 * on settle.
 *
 * A query that isn't cached yet is left alone rather than seeded: patching `undefined` into
 * `[]` would make its screen flash empty the next time it mounts, with nothing to roll back.
 */
export function useOptimisticMutation<TVars, TData = unknown>({
  mutationFn,
  patches,
  invalidate,
  errorMessage = 'Something went wrong',
}: OptimisticMutationOptions<TVars, TData>) {
  const queryClient = useQueryClient()

  return useMutation<TData, Error, TVars, Snapshot[]>({
    mutationFn,

    onMutate: async (vars) => {
      const toApply = patches(vars)
      await Promise.all(toApply.map(({ queryKey }) => queryClient.cancelQueries({ queryKey })))

      const snapshots: Snapshot[] = []
      for (const { queryKey, update } of toApply) {
        const data = queryClient.getQueryData(queryKey)
        if (data === undefined) continue
        snapshots.push({ queryKey, data })
        queryClient.setQueryData(queryKey, update(data))
      }
      return snapshots
    },

    onError: (err, _vars, snapshots) => {
      snapshots?.forEach(({ queryKey, data }) => queryClient.setQueryData(queryKey, data))
      const reason = getErrorMessage(err, errorMessage)
      toast.error(`${reason} — changes reverted`)
    },

    onSettled: (_data, _error, vars) => {
      invalidate(vars).forEach((filters) => queryClient.invalidateQueries(filters))
    },
  })
}
