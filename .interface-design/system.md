# Aurora Flowboard — Interface Design System

## Product Intent

**Who:** Professionals (developers, PMs, team leads) managing projects and work items. Purposeful, context-switching from other tools. Not leisure browsing — goal-oriented arrival.

**Feel:** Luminous and precise. Like the product name: Aurora (cool, ethereal clarity) + Flowboard (purposeful motion, structured streams). Not warm/cozy, not cold/sterile — focused and luminous.

---

## Direction

The visual identity sits at the intersection of a technical tool and a luminous brand. The neutral gray token foundation (shadcn default) is preserved — aurora color only appears as atmospheric accent, never as structural chrome. Color means something here; it is not decoration.

---

## Color World

Aurora borealis at midnight: deep near-black, cool teal (~210°), soft violet (~272°), crisp white, silver-gray.

### Aurora Accent Values (OKLCH)
```
Teal glow:   oklch(0.88 0.07 210 / 0.42)  — background radial, 22% 65%
Violet glow: oklch(0.86 0.05 272 / 0.34)  — background radial, 78% 22%
Wave teal:   oklch(0.78 0.10 205)          — SVG logomark arc 1
Wave violet: oklch(0.75 0.08 268)          — SVG logomark arc 2
```

### Token System
All structural tokens use the existing shadcn neutral palette (see `src/index.css`). Aurora values are applied only as:
- Background atmosphere on full-page views (radial gradients)
- The SVG logomark strokes

---

## Signature Element

**Aurora backdrop:** Two overlapping radial gradients (teal + violet, ~35–42% opacity) on the page background. Barely visible — felt rather than seen. Evokes the product name at key threshold screens (login, onboarding, empty states).

```css
background: radial-gradient(ellipse at 22% 65%, oklch(0.88 0.07 210 / 0.42) 0%, transparent 52%),
            radial-gradient(ellipse at 78% 22%, oklch(0.86 0.05 272 / 0.34) 0%, transparent 48%),
            oklch(0.985 0 0);
```

**SVG Logomark:** Two aurora-wave arcs on a dark (oklch(0.205 0 0)) rounded-square (rx=9). Arc 1 is teal, Arc 2 is violet at 0.65 opacity. 36×36px display size.

```tsx
function AuroraLogoMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="36" height="36" rx="9" fill="oklch(0.205 0 0)" />
      <path
        d="M8 22 Q11 12 16 15 Q21 18 26 9"
        stroke="oklch(0.78 0.1 205)"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M8 27 Q12 19 16 21.5 Q20 24 26 16"
        stroke="oklch(0.75 0.08 268)"
        strokeWidth="1.25"
        strokeLinecap="round"
        fill="none"
        opacity="0.65"
      />
    </svg>
  )
}
```

---

## Depth Strategy

**Borders-only** — `ring-1 ring-foreground/10` (already on Card component). Appropriate for a dense, technical tool. No drop shadows on cards. Single `shadow-sm` allowed on full-page cards (login, modals) for minimal lift.

---

## Typography

**Font:** Geist Variable (`@fontsource-variable/geist`) — technical, precise, contemporary. Already loaded globally.

- Headings: `text-xl tracking-tight font-medium` (CardTitle defaults handle weight)
- Body / labels: default sans
- Field errors: `text-xs text-destructive`

---

## Spacing

Base unit: **4px (Tailwind default)**

| Context | Value |
|---|---|
| Label → input gap | `space-y-1.5` |
| Field → field gap | `space-y-4` |
| Card content top padding | `pt-4` / `pt-6` |
| Error banner bottom margin | `mb-5` |

---

## Error & State Patterns

### API Error Banner
```tsx
<div className="mb-5 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
  {bannerError}
</div>
```
- 401 → `'Invalid email or password'`
- Other → `'Something went wrong. Please try again.'`

### Inline Field Error
```tsx
<p id="{field}-error" className="text-xs text-destructive">{error}</p>
```
With `aria-describedby` and `aria-invalid` on the input for accessibility.

### Loading Button
```tsx
<Button type="submit" className="w-full" disabled={isPending}>
  {isPending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Signing in…
    </>
  ) : (
    'Sign In'
  )}
</Button>
```
Label changes during load — not just a spinner swap.

---

## Border Radius

From `--radius: 0.625rem` base:
- Inputs / buttons: `radius-sm` (calc × 0.6)
- Cards: `radius-lg` (base)
- Modals / large overlays: `radius-xl` (calc × 1.4)

---

## Full-Page Centered Layout (Login / Onboarding)

```tsx
<div className="min-h-screen flex items-center justify-center px-4" style={{ background: AURORA_BACKGROUND }}>
  <Card className="w-full max-w-sm shadow-sm">
    ...
  </Card>
</div>
```

- `max-w-sm` for single-column auth/onboarding forms
- `px-4` ensures mobile padding
- Aurora backdrop applied via inline `style` (not Tailwind arbitrary — gradient is too complex)

---

## Components Built

| Component | Location | Notes |
|---|---|---|
| LoginPage | `src/features/auth/components/LoginPage.tsx` | Full auth form with aurora backdrop + logomark |
| AuroraLogoMark | Inside LoginPage | Inline SVG, reusable — extract if used elsewhere |
| useLogin | `src/features/auth/hooks/useLogin.ts` | React Query mutation, stores token, navigates on success |
| auth.service | `src/features/auth/services/auth.service.ts` | POST /auth/login via axiosInstance |
