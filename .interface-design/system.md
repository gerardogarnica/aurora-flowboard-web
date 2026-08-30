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

## Sidebar Collapse

State lives in `ProtectedLayout` as `useState(false)` — passed as `collapsed` prop to `Sidebar` and `onToggleSidebar` + `collapsed` to `TopNavbar`. No global store needed.

**Widths:** expanded `w-60`, collapsed `w-14`. Animated with `transition-[width] duration-200 ease-in-out` on the `<aside>`.

**Toggle button:** `PanelLeft` Lucide icon in `TopNavbar`, left of the breadcrumb. Same hover style as other navbar controls: `hover:bg-black/[0.04]`.

**Collapsed sidebar rules:**
- Org header: logo only, `flex justify-center`
- Nav items: `justify-center p-2`, icon only — label and badge hidden
- Projects section label + `+` button: hidden
- "All projects" link: `FolderOpen` icon only, centered — same pattern as nav items
- Project rows: glow dot only, centered
- Workspace label: hidden; icons still show via `NavItem collapsed`
- Footer: avatar only, centered

**`title` tooltip:** All collapsed items use `title={collapsed ? label : undefined}` so the browser native tooltip reveals the label on hover — no extra dependency.

**`NavItem` collapsed shape:**
```tsx
collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-1.5'
// label and badge rendered only when !collapsed
```

---

## Top Navbar

**Layout:** `h-11 shrink-0 border-b border-border flex items-center px-5 gap-4` — sits above `<main>` inside a `flex flex-col overflow-hidden` wrapper. The sidebar and this column wrapper are siblings in the root `flex h-screen overflow-hidden` shell.

```tsx
// ProtectedLayout shell
<div className="flex h-screen overflow-hidden">
  <Sidebar />
  <div className="flex-1 flex flex-col overflow-hidden">
    <TopNavbar />
    <main className="flex-1 overflow-auto p-8">
      <Outlet />
    </main>
  </div>
</div>
```

**Breadcrumb (left):** Route-aware via `useLocation`. Map of `pathname → string[]` segments. All but the last segment use `text-muted-foreground`; last uses `text-foreground font-medium`. Separator: `text-muted-foreground/50` slash.

```tsx
const BREADCRUMBS: Record<string, string[]> = {
  '/dashboard':  ['Workspace', 'Home'],
  '/projects':   ['Workspace', 'Projects'],
  // ...
}
```

**Search input (right):** Visual-only — not a real `<input>`, just a styled div with the `Search` Lucide icon. `h-7 px-2.5 rounded-md border border-border bg-muted/40 text-sm text-muted-foreground w-48`. No keyboard shortcut badge.

**User avatar (right):** Identical to sidebar footer — `w-7 h-7 rounded-full bg-secondary`, initials from `useAuthStore` `user.fullName`, `text-[11px] font-semibold text-secondary-foreground`. No role label, no dropdown.

---

## Components Built

| Component | Location | Notes |
|---|---|---|
| LoginPage | `src/features/auth/components/LoginPage.tsx` | Full auth form with aurora backdrop + logomark |
| AuroraLogoMark | Inside LoginPage | Inline SVG, reusable — extract if used elsewhere |
| useLogin | `src/features/auth/hooks/useLogin.ts` | React Query mutation, stores token, navigates on success |
| auth.service | `src/features/auth/services/auth.service.ts` | POST /auth/login via axiosInstance |
| Sidebar | `src/app/layout/Sidebar.tsx` | See sidebar patterns below |
| DashboardPage | `src/features/dashboard/components/DashboardPage.tsx` | Greeting + MyWorkSection + ProjectsOverview |
| MyWorkSection | `src/features/dashboard/components/MyWorkSection.tsx` | Filter tabs + work item list |
| ProjectsOverview | `src/features/dashboard/components/ProjectsOverview.tsx` | 3-col project health cards |
| TopNavbar | `src/app/layout/TopNavbar.tsx` | Breadcrumb + search + user avatar; see top navbar patterns |
| ProjectComponentsSection | `src/features/projects/components/ProjectComponentsSection.tsx` | Components tab content — see "Admin List — Inline Rename + Destructive Confirm" below |
| AddComponentModal | `src/features/projects/components/AddComponentModal.tsx` | Single-field create modal |

---

## Sidebar

**Layout:** `w-60`, `bg-sidebar`, `border-r border-sidebar-border`. Same background as canvas — separation via border only, no color contrast. `flex flex-col h-screen` with user footer pinned via `mt-auto`.

**Hover / active backgrounds:** Neutral dark overlays, not token colors.
- Hover: `hover:bg-black/[0.04]`
- Active: `bg-black/[0.07]` + `font-medium`

This works regardless of sidebar hue and avoids the blue tint that `bg-sidebar-accent` introduces.

**Section labels:** `text-[10px] font-semibold tracking-widest text-muted-foreground uppercase` — whisper-quiet, purely structural.

**Org header:** `w-8 h-8 rounded-lg bg-primary` square with custom SVG icon (not initials). Org name in `text-sm font-semibold`, subtitle in `text-xs text-muted-foreground`.

**User footer:** Avatar circle with user initials from `useAuthStore`, name + email truncated, notification bell with `bg-primary` count badge. Pinned with `mt-auto border-t border-sidebar-border`.

---

## Project Status — Glow Dot

The sidebar project list shows only `active`, `on_hold`, and `draft` statuses. `completed` and `archived` are hidden but counted in "All projects".

**Active** — full glow dot: colored center + 25% opacity ring of same color.
```tsx
<span className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
  <span className="absolute inset-0 rounded-full opacity-25" style={{ backgroundColor: color }} />
  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
</span>
```

**On Hold** — gray dot: same structure but slate-400 replaces project color. Text at `/50` opacity.
```tsx
<span className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
  <span className="absolute inset-0 rounded-full opacity-20 bg-slate-400" />
  <span className="w-2 h-2 rounded-full bg-slate-400" />
</span>
```

**Draft** — hollow dashed ring in project color. Text at `/50` opacity + `italic`.
```tsx
<span className="w-2.5 h-2.5 rounded-full border border-dashed shrink-0" style={{ borderColor: color }} />
```

Text treatment per status on the row:
```tsx
project.status === 'on_hold'  → 'text-sidebar-foreground/50'
project.status === 'draft'    → 'text-sidebar-foreground/50 italic'
default (active)              → 'text-sidebar-foreground/80'
```

---

## Dashboard Layout

**Shell:** `ProtectedLayout` = `Sidebar` (fixed left) + `<main className="flex-1 overflow-auto p-8">`. Content max-width `max-w-5xl` on the dashboard page itself.

**Greeting header:** Time-aware (`Good morning/afternoon/evening, {firstName}`), date via `toLocaleDateString('en-US', { weekday, month, day })`, muted subtitle.

---

## My Work — Filter Tabs

Tabs: In Progress · Due Today · Overdue · Done this week. Client-side filter on `status` field of mock/real work items.

**Active tab:** `border-b-2 border-primary text-foreground font-medium -mb-px` (sits on top of the section's `border-b border-border`).
**Inactive tab:** `border-b-2 border-transparent text-muted-foreground hover:text-foreground`.
**Count pill:** `bg-primary/10 text-primary` when active, `bg-muted text-muted-foreground` when inactive.

Work item row: `priority dot` + `title` + `project tag (dot + name)` + `due date chip`.
- Priority dots: red (high), amber (medium), slate (low) — 8px solid circles.
- Due date chip: `bg-red-50 text-red-600` for overdue, `bg-amber-50 text-amber-700` for today, plain muted for future.

---

## Project Overview Cards

3-column grid, `border border-border rounded-lg p-4` — no shadows (borders-only depth strategy).

Card anatomy:
1. Row: `GlowDot` + project name + `Active` badge (`bg-emerald-50 text-emerald-600 rounded-full text-[10px]`)
2. Stat row: `Open N  Closed N` in `text-xs text-muted-foreground` with value in `text-foreground font-medium tabular-nums`
3. Progress bar: `h-1 bg-muted rounded-full` container, fill `style={{ width: pct%, backgroundColor: project.color }}`
4. Footer: overlapping member avatar initials (`-space-x-1.5`, `border-2 border-background`) + `% done` right-aligned

Avatar initials use rotating color classes: `bg-violet-100 text-violet-700`, `bg-sky-100 text-sky-700`, `bg-emerald-100 text-emerald-700`, `bg-rose-100 text-rose-700`, `bg-amber-100 text-amber-700`.

---

## Permission-Gated Role/Status Control

Pattern for an inline control that changes a sensitive field (role, permission tier) with three viewer-dependent states — used on `PeoplePage` (`src/features/people/components/PeoplePage.tsx`) for role assignment.

**States:**
1. **Editor, editing someone else** — `DropdownMenu` trigger styled as a bordered pill (`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-border cursor-pointer hover:bg-muted/50`) with a `ChevronDown`. Same visual family as `StatusBadge`'s dropdown trigger, but pill-shaped with a visible border instead of a colored badge, since role isn't a status-with-semantic-color.
2. **Editor, editing their own row** — identical pill shape but `cursor-not-allowed`, `border-border/60` (softer), wrapped in a `Tooltip` (locally scoped `TooltipProvider`, not global — see `WorkItemActivitySections` for the same convention) explaining why it's inert. Never hide the control — showing it disabled communicates the boundary better than omitting it.
3. **Non-editor (read-only viewer)** — plain `Badge variant="outline"`, no interactivity, no hover affordance. Visually distinct from state 1 (no border-pill hover, no chevron) so it doesn't look clickable.

**Asymmetric confirmation:** not every value change carries the same weight. Low-consequence transitions (promote/grant) apply immediately with an optimistic update; high-consequence transitions (demote/revoke) route through a confirm `Dialog` (`showCloseButton={false}`, same shape as `StatusBadge`'s status-change dialog) before committing. Decide per-value, not per-control — the same dropdown branches its commit path based on which option was picked:

```tsx
const handlePick = (next: Role) => {
  if (next === current) return
  if (next === 'Member') setPendingValue(next)   // demotion — confirm first
  else onSelect(next)                             // promotion — immediate
}
```

**Loading state:** while the mutation is in flight, swap the control for inert text with a `Loader2` spinner showing the *current* (pre-change) value — don't show the dropdown or a skeleton, so the row doesn't jump.

---

## Tooltip-Labeled Icon Action Button

Pattern for a small icon-only button that performs an action directly (not a menu) — used for "Add member" / "Remove member" in `ProjectDetailsModal.tsx` (`src/features/projects/components/ProjectDetailsModal.tsx`).

**Why a filled resting background:** `variant="ghost"` (transparent until hover) is invisible at rest and reads as decoration, not an affordance — icon-only controls need a resting background so they're discoverable without hovering first.

- **Neutral/add action:** `Button variant="secondary" size="icon-xs"` — filled with the neutral `secondary` token, no new hue introduced.
- **Destructive/remove action:** `Button variant="destructive" size="icon-xs"` — already-defined `bg-destructive/10 text-destructive hover:bg-destructive/20`, semantically correct and visible at rest.
- Never `variant="ghost"` for a standalone icon-only action button — reserve ghost for icon buttons that live inside an already-obvious control cluster (e.g. a dialog's close `X`).

**Tooltip wiring:** wrap the `Button` in `Tooltip` from `@/components/ui/tooltip`, passing the button as `TooltipTrigger`'s `render` prop (no separate `TooltipTrigger` children) — same convention as `SelfRoleControl` in `PeoplePage.tsx`:
```tsx
<Tooltip>
  <TooltipTrigger render={<Button variant="secondary" size="icon-xs" aria-label="Add member" onClick={...}><Plus className="w-3.5 h-3.5" /></Button>} />
  <TooltipContent>Add member</TooltipContent>
</Tooltip>
```
One `TooltipProvider` wraps the whole section that contains these buttons (not one per button) — same convention as `WorkItemActivitySections`. Tooltip text states the action, not a generic label — e.g. `Remove {fullName}`, not just "Remove".

Also used for the project-board header adornment (`ProjectBoardPage.tsx`, `PageHeader`'s `titleAdornment`): `Settings` icon + `Button variant="secondary" size="icon-xs"` + tooltip "Configure project" — opens `ProjectDetailsModal`, admin-only. Replaced the earlier plain `<button>` + native `title` attribute + `Info` icon ("View project details"); the icon and label should always describe what the trigger actually does, not just that it opens "details".

---

## Member Avatar Stack

Reusable component: `MemberAvatarStack` (`src/shared/components/MemberAvatarStack.tsx`). Props: `members: { userId, fullName, initials }[]`, `max?: number` (default 3). Renders overlapping `-space-x-1.5` circles (`w-6 h-6 rounded-full text-[10px] font-semibold`), each colored via `MEMBER_BG[avatarIndex(userId)]` from `src/shared/constants/avatar-colors.ts` — color is a **hash of `userId`**, not list position, so the same person always gets the same color everywhere in the app. Overflow beyond `max` collapses into a `+N` circle (`border-2 border-background bg-muted text-muted-foreground`).

Each avatar's name reveals via the real `Tooltip` component (not a native `title` attribute) — same `render`-prop pattern as the icon action buttons. The component wraps itself in its own local `TooltipProvider` rather than relying on an ambient one, since it's consumed from pages that may not already have one (`ProjectsPage.tsx`'s card grid has none). The `+N` overflow circle also gets a tooltip, listing the hidden members' names comma-separated — it used to have no hover affordance at all.

Used in `ProjectsPage.tsx` (`ProjectCard` footer) and `ProjectBoardPage.tsx` (`PageHeader` subtitle line, next to Kind/Prefix/description/item-count, gated on `project.members.length > 0`). The same `MEMBER_BG`/`avatarIndex` pair also backs the single-avatar `MemberAvatar` (`src/features/work-items/components/MemberAvatar.tsx`) used for work-item assignees — all three consumers now share one color source, so a user's avatar color is consistent across project cards, the board header, and assignee avatars.

**Not migrated:** `ProjectsOverview.tsx` (dashboard) keeps its own local `MEMBER_BG` + positional coloring — it renders mock data (`members: string[]`, initials only, no `userId`), so it doesn't fit `MemberAvatarStack`'s shape. Worth revisiting once the dashboard switches off mock data.

---

## Route Tabs

Reusable component: `RouteTabs` (`src/shared/components/RouteTabs.tsx`). Props: `tabs: { label, path }[]` — each tab is a real route (`NavLink`), not client-only state, so the active tab is deep-linkable/bookmarkable and survives a refresh. Underline style: active `border-b-2 border-primary text-foreground font-medium -mb-px`, inactive `border-b-2 border-transparent text-muted-foreground hover:text-foreground` — same visual language as the (now superseded) "My Work — Filter Tabs" pattern. The tab row sits in its own `px-8 border-b border-border shrink-0` wrapper directly under `PageHeader`, so the active tab's underline appears to cut into that border.

First used on the project page (`ProjectBoardPage.tsx`, route `/projects/:id/:tab`) for "Board" / "Components" / "Milestones". `/projects/:id` with no tab segment redirects to `/projects/:id/board` via `<Navigate to="board" replace />`.

`Board` renders the board columns; `Components` renders `ProjectComponentsSection` (real, see pattern below); `Milestones` still renders a centered `MilestonesPlaceholder` (icon + label + "Coming soon", `py-24`) until its backing endpoints exist — same placeholder shape as the old shared `TabPlaceholder`, just inlined per-tab now that Components graduated out of it.

`PageHeader`'s title/subtitle/avatars/titleAdornment stay identical across all tabs (project-level grounding shouldn't disappear when switching tabs), but its primary `action` button is now **tab-dependent** — this was a deliberate change from the original "PageHeader stays identical across all tabs" rule, made once Components became a real feature with its own primary create action:
```tsx
const headerAction =
  activeTab === 'board'
    ? { label: '+ New issue', onClick: ..., disabled: !canAddWorkItems, title: ... }
    : activeTab === 'components' && isProjectAdmin
      ? { label: '+ Add component', onClick: () => setIsAddComponentOpen(true) }
      : undefined // Milestones: no action until it's real
```

---

## Editable Multiline Field (Textarea Inline-Edit)

Pattern for click-to-edit on a longer, multiline field — used for work-item description in `WorkItemDetailModal.tsx` (`EditableDescription`, alongside the existing single-line `EditableTitle` in the same file).

**Read mode:** plain text (`text-sm text-foreground whitespace-pre-wrap`), same hover affordance as `EditableTitle` when editable — `-mx-1 px-1 rounded-md hover:bg-muted/50 transition-colors cursor-pointer`. Falls back to a muted placeholder sentence (e.g. `"No description provided."`) when empty; the placeholder itself is clickable to start editing, same as real content.

**Edit mode:** shadcn `Textarea` (`min-h-32 max-h-64 resize-none` — fixed height with internal scroll, not auto-grow), `autoFocus` + text pre-selected via `requestAnimationFrame(() => ref.current?.select())`.

**Confirm/cancel keys differ from the single-line pattern** because `Enter` must stay available for inserting a newline:
- `Ctrl+Enter` / `Cmd+Enter` → commit
- `Escape` → cancel, revert to last-saved value
- `onBlur` → commit (same as `EditableTitle`, for users who click away instead of using the shortcut)

**Empty is a valid value** for a multiline field like this (unlike the title, which rejects an empty commit) — clearing the textarea and confirming saves it as an empty string.

**Character counter:** a max-length constant (not enforced via `maxLength` on the element — typing is never blocked) with a small counter (`{draft.length}/{MAX}`) right-aligned under the textarea, `text-xs text-muted-foreground` normally, `text-destructive` once over the limit. The backend is the actual source of truth for the limit; the counter is guidance, not a client-side hard stop.

**Mutation scope:** unlike `EditableTitle` (which also optimistically patches the `project-board` query so the board card's title updates live), a field not shown on board cards only needs to patch its own `['work-item', code]` query — no need to touch `project-board`.

---

## Admin List — Inline Rename + Destructive Confirm

Pattern for a compact admin-managed list where each row has a renamable name, a status pill, and a one-way destructive action — used for `ProjectComponentsSection.tsx` (`src/features/projects/components/`), the Components tab content. The go-to shape whenever a feature needs "a short list of named things an admin creates/renames/retires" — reach for this before inventing a new list treatment.

**Table shell:** same as `PeoplePage` — `border border-border rounded-lg overflow-hidden` wrapping a header row (`bg-muted/30 border-b border-border`, `text-[10px] font-semibold tracking-widest text-muted-foreground uppercase` labels) and `divide-y divide-border/60` rows. Grid template is per-content, not fixed: `ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_104px_100px_40px] items-center gap-4 px-4'` (name flexible, status/date fixed, actions column just wide enough for one icon button).

**Section intro line:** a single `text-sm text-muted-foreground` sentence above the table explaining what the list is for, with 2–3 concrete examples in quotes (e.g. `"Internal API"`, `"Client Portal"`) — always visible, not just in the empty state, since it doubles as the tab's orientation copy. Kept deliberately short (one sentence) so it doesn't compete with the table.

**Status pill:** reuse the exact visual formula from `ProjectsPage`'s `StatusBadge` (`text-xs font-medium px-1.5 py-0.5 rounded-full`, `bg-emerald-50 text-emerald-600` for the "good" state, `bg-muted text-muted-foreground` for the terminal/inactive state) — but render it as a **plain, non-interactive span**, not a dropdown trigger. `StatusBadge` uses a dropdown because a project status has several valid forward transitions; a component only has one, one-way transition (Active → Retired), so that transition gets its own explicit destructive button instead of hiding behind a badge click.

**Inline rename:** click-to-edit directly on the name text, same mechanics as `EditableTitle` (single-line variant) — `-mx-1 px-1 rounded-md hover:bg-muted/50 transition-colors cursor-pointer` hover affordance only when editable, `autoFocus` + select-all on entering edit mode, `Enter` commits, `Escape` cancels, `onBlur` commits. Trimmed-empty or unchanged values are no-ops (don't fire the mutation). Only rendered as editable when the row is both admin-owned and in the "live" status — a retired/terminal row's name renders as plain muted text with no hover treatment, signaling it's no longer actionable.

**Destructive one-way action:** a semantically-named icon (`Archive`, not `Trash`/`X` — this is a soft decommission, not a delete) in a `variant="destructive" size="icon-xs"` button, tooltip reads `Retire {name}`, wrapped in the same confirm-`Dialog` shape as `MemberRow`'s remove button (`showCloseButton={false}`, title asks the yes/no question, description names the row in `font-medium text-foreground` and states the consequence including "This can't be undone"). The action button is omitted entirely (not just disabled) once the row is already in its terminal status — nothing left to do to it.

**Sort:** live/active rows first, then terminal/retired rows, each group newest-created first — so the actionable items surface at the top without needing a client-side filter toggle.

**Date column:** plain `formatDate` (`month: 'short', day: 'numeric', year: 'numeric'`, same helper duplicated locally as in `ProjectDetailsModal`), wrapped in a `Tooltip` that reveals the full `formatDateTime` for both created and updated timestamps on hover — gives fidelity without spending a column on it.

**Data mutations:** list mutations (create/rename/retire) follow the existing optimistic-update convention (`useUpdateProjectStatus`, `useUpdateWorkItemTitle`) — `onMutate` patches the list query directly, `onError` rolls back via the returned `previous` snapshot and shows a toast, `onSettled` invalidates to reconcile with the server. Create doesn't need optimism (the modal's pending state already covers it) — just invalidate on success.

---

## Create Modal — Close Button, Footer, Submit Gating

Baseline convention every "Create X" modal now follows, unified across `CreateUserModal.tsx` (people), `AddComponentModal.tsx` (projects), `CreateWorkItemModal.tsx` (work-items), and `CreateProjectModal.tsx` (projects, multi-step). `AddComponentModal`/`CreateUserModal` were the reference — `CreateProjectModal`/`CreateWorkItemModal` were retrofitted to match; treat any new create modal as needing all three pieces below, not just whichever one is top of mind.

**Close button:** always let `DialogContent` render its default native `X` (top-right, `variant="ghost" size="icon-sm"`, absolutely positioned `top-2 right-2`). Never pass `showCloseButton={false}` on a create/edit modal — that was previously used on `CreateProjectModal`/`CreateWorkItemModal` and made them the odd ones out; the only modals that legitimately hide it are confirm dialogs that need a forced Cancel/Confirm choice (e.g. the retire/remove confirm `Dialog`s in `ProjectComponentsSection.tsx` / `ProjectDetailsModal.tsx`).

**Header content sharing the top-right corner:** if a modal's `DialogHeader` puts something in the top-right (like `CreateProjectModal`'s "Step X of 2" indicator), give that row extra right padding (`pr-8`) — the native close button is absolutely positioned and will otherwise sit at the same coordinates as `DialogContent`'s own `p-4` padding boundary, overlapping any flush-right header content.

**Footer button grouping:** Cancel always sits directly beside the primary action, both right-aligned as one group (`justify-end`) — never split with Cancel pinned to the far left and the primary action(s) pinned to the far right (`justify-between`). This applies even to multi-button wizard footers: `CreateProjectModal`'s Step 2 footer is `Cancel · Back · Create Project` all in one right-aligned row, not `Cancel` isolated on the left. Cancel is `variant="outline"` (never `variant="ghost"` — ghost reads as a low-emphasis text link and was the main visual inconsistency users noticed), and no footer button takes `size="sm"` — all use the `Button` default size, matching `AddComponentModal`/`CreateUserModal` which never pass a `size` prop.

**Submit disabled until required fields are valid** (not just until pending) — `CreateWorkItemModal`'s `isValid = data.title.trim().length > 0` piped into `disabled={!isValid || isPending}` was the reference. Two shapes depending on the form's state management:
- **Plain `useState` form** (`AddComponentModal`, `CreateProjectModal`, `CreateWorkItemModal`): compute a local `isValid` boolean from the raw field state (e.g. `name.trim().length > 0`) and pass it straight into the submit button's `disabled`.
- **react-hook-form + zod form** (`CreateUserModal`): don't flip `mode` to `'onChange'` just to get a live `formState.isValid` — that would also change when inline field errors first appear (currently only after a submit attempt), which is a separate UX decision nobody asked for. Instead watch the whole form with `useWatch({ control })` and re-run the same schema against it: `const isFormValid = createUserSchema.safeParse(allValues).success`, then `disabled={!isFormValid || isPending}`. Keeps submit-gating and error-display timing independently controllable.
