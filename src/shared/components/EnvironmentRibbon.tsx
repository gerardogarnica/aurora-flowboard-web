import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { APP_ENV, ENV_RIBBON } from '@/shared/constants/app-env'

/**
 * A 24px strip pinned above the whole app — shell and login alike — marking the
 * site as non-production. It is a real layout row (`shrink-0` + `border-b`), not
 * an overlay: nothing is covered and no sticky/negative-margin trickery is used.
 *
 * Never rendered in production builds; the caller gates on `IS_NON_PRODUCTION`,
 * which folds to `false` at build time so this module is dropped from the bundle.
 */
export function EnvironmentRibbon() {
  const theme = ENV_RIBBON[APP_ENV === 'staging' ? 'staging' : 'development']
  const { titlePrefix } = theme

  useEffect(() => {
    if (!document.title.startsWith(titlePrefix)) {
      document.title = `${titlePrefix} ${document.title}`
    }
  }, [titlePrefix])

  return (
    <div
      role="status"
      aria-label={theme.ariaLabel}
      className={cn(
        'h-6 shrink-0 flex items-center justify-center gap-2 border-b select-none',
        theme.surface,
      )}
    >
      {/* Same glow-dot shape as the sidebar's project status marks */}
      <span
        aria-hidden="true"
        className="relative flex items-center justify-center w-3 h-3 shrink-0"
      >
        <span className={cn('absolute inset-0 rounded-full opacity-25', theme.dot)} />
        <span className={cn('w-1.5 h-1.5 rounded-full', theme.dot)} />
      </span>
      <span className="text-[10px] font-semibold tracking-widest uppercase leading-none">
        {theme.label}
      </span>
    </div>
  )
}
