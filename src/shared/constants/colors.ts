export const SWATCH_COLORS: Record<string, string> = {
  red: '#EF4444',
  crimson: '#DC2626',
  rose: '#F43F5E',
  pink: '#EC4899',
  orange: '#F97316',
  amber: '#F59E0B',
  green: '#22C55E',
  emerald: '#10B981',
  lime: '#84CC16',
  teal: '#14B8A6',
  cyan: '#06B6D4',
  blue: '#3B82F6',
  indigo: '#6366F1',
  violet: '#8B5CF6',
  navy: '#1E3A5F',
  slate: '#64748B'
}

const FALLBACK_COLOR = '#94A3B8'

export function resolveSwatchColor(key: string): string {
  return SWATCH_COLORS[key] ?? FALLBACK_COLOR
}
