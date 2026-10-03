import { Loader2 } from 'lucide-react'

/**
 * Shown on the first load while the matched page's chunk downloads. The spinner fades in only
 * after 300ms, so a fast load is just a blank frame instead of a flash.
 */
export function RouteFallback() {
  return (
    <div className="h-full flex items-center justify-center bg-background" role="status" aria-label="Loading">
      <span className="animate-in fade-in fill-mode-both delay-300 duration-300">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </span>
    </div>
  )
}
