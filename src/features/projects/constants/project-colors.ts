export const PROJECT_COLORS: Record<string, string> = {
  red: '#EF4444',
  crimson: '#DC2626',
  orange: '#F97316',
  amber: '#F59E0B',
  green: '#22C55E',
  teal: '#14B8A6',
  blue: '#3B82F6',
  indigo: '#6366F1',
  violet: '#8B5CF6',
  pink: '#EC4899',
  navy: '#1E3A5F',
  slate: '#64748B',
  cyan: '#06B6D4',
  emerald: '#10B981',
  rose: '#F43F5E',
  lime: '#84CC16',
}

const FALLBACK_COLOR = '#94A3B8'

export function resolveProjectColor(key: string): string {
  return PROJECT_COLORS[key] ?? FALLBACK_COLOR
}
