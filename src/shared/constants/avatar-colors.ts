export const MEMBER_BG = [
  'bg-violet-500 text-white',
  'bg-sky-500 text-white',
  'bg-emerald-500 text-white',
  'bg-rose-500 text-white',
  'bg-amber-500 text-white',
]

export function avatarIndex(id: string): number {
  return id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % MEMBER_BG.length
}
