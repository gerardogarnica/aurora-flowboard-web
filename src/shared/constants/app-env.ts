/**
 * Deployment environment of the running bundle.
 *
 * Resolved at **build time** from `VITE_APP_ENV` — the site ships as static
 * files behind nginx, so there is no runtime configuration to read. Note that
 * `import.meta.env.MODE` cannot be used for this: the Dockerfile runs
 * `pnpm run build` for every environment, so MODE is `production` in staging too.
 *
 * An absent or unrecognized value resolves to `development` on purpose — a
 * non-production site that forgets the variable should fail *visibly*, never
 * silently pass itself off as production.
 */
export type AppEnv = 'development' | 'staging' | 'production'

const RAW = import.meta.env.VITE_APP_ENV

export const APP_ENV: AppEnv =
  RAW === 'production' ? 'production' : RAW === 'staging' ? 'staging' : 'development'

export const IS_NON_PRODUCTION = import.meta.env.VITE_APP_ENV !== 'production'

interface EnvRibbonTheme {
  /** Label rendered in the ribbon. Uppercased by CSS, not by the string. */
  label: string
  /** Prefix prepended to `document.title` so background tabs are telling too. */
  titlePrefix: string
  ariaLabel: string
  /** Surface + text + border, borders-only depth per the design system. */
  surface: string
  /** Glow-dot fill — the sidebar's status vocabulary, reused. */
  dot: string
}

/**
 * Amber for staging (shared environment — caution), violet for development
 * (workbench — no alarm). Red is deliberately unused: it already means
 * destructive/overdue elsewhere in the app. Aurora teal is unused too: the
 * design system reserves it for atmosphere, never structural chrome.
 */
export const ENV_RIBBON: Record<Exclude<AppEnv, 'production'>, EnvRibbonTheme> = {
  staging: {
    label: 'Entorno de pruebas · Staging',
    titlePrefix: '[STAGING]',
    ariaLabel: 'Entorno de pruebas (staging). Este no es el sitio de producción.',
    surface: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  development: {
    label: 'Entorno de desarrollo · Local',
    titlePrefix: '[DEV]',
    ariaLabel: 'Entorno de desarrollo local. Este no es el sitio de producción.',
    surface: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
  },
}
