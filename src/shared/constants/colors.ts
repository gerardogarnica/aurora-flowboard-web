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

const FALLBACK_COLOR = '#94A3B8'

export function resolveSwatchColor(key: string): string {
  return SWATCH_COLORS[key] ?? FALLBACK_COLOR
}
