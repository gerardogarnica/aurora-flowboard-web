export const SWATCH_COLORS: Record<string, string> = {
  cyan: '#06B6D4',
  sky: '#0EA5E9',
  emerald: '#10B981',
  teal: '#14B8A6',
  navy: '#1E3A5F',
  green: '#22C55E',
  blue: '#3B82F6',
  indigo: '#6366F1',
  slate: '#64748B',
  stone: '#78716C',
  lime: '#84CC16',
  violet: '#8B5CF6',
  fuchsia: '#D946EF',
  crimson: '#DC2626',
  yellow: '#EAB308',
  pink: '#EC4899',
  red: '#EF4444',
  rose: '#F43F5E',
  amber: '#F59E0B',
  orange: '#F97316'
}

/**
 * The readable ink of each swatch — this catalog's own "-600" row, for text and icons sitting on a
 * pale tint of the same color (the soft-filled pill formula, `bg-*-50 text-*-600`).
 *
 * The raw hexes can't be used as text: on a 12% tint of themselves `yellow` reads at 1.77:1 and
 * `lime` at 1.82:1, far below AA. Each value here is the swatch darkened until it clears 5:1 on that
 * tint — precomputed, so nothing measures contrast at render time. `navy` is already dark enough and
 * stays as-is.
 */
export const SWATCH_INK: Record<string, string> = {
  cyan: '#047284',
  sky: '#096E9B',
  emerald: '#0A7552',
  teal: '#0D7469',
  navy: '#1E3A5F',
  green: '#157739',
  blue: '#2D63BC',
  indigo: '#5456CC',
  slate: '#58667A',
  stone: '#6A6460',
  lime: '#4B740D',
  violet: '#724BCA',
  fuchsia: '#9F33B0',
  crimson: '#BF2121',
  yellow: '#846505',
  pink: '#B03672',
  red: '#B73434',
  rose: '#B83047',
  amber: '#925E07',
  orange: '#A74D0F'
}

/** What a color picker starts on when nothing has been chosen yet — the first swatch in the catalog. */
export const DEFAULT_SWATCH_COLOR = Object.keys(SWATCH_COLORS)[0]

/** Alpha suffix for the pale tint a swatch gets as a chip background (12% over white). */
export const SWATCH_TINT_ALPHA = '1F'

const FALLBACK_COLOR = '#94A3B8'
const FALLBACK_INK = '#556070'

export function resolveSwatchColor(key: string): string {
  return SWATCH_COLORS[key] ?? FALLBACK_COLOR
}

export function resolveSwatchInk(key: string): string {
  return SWATCH_INK[key] ?? FALLBACK_INK
}
