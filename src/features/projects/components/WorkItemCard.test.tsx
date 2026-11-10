import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { makeBoardItem } from '@/test/fixtures/board'
import { daysAgo } from '@/test/fixtures/dashboard'
import { WorkItemCard } from './WorkItemCard'

const item = makeBoardItem({ code: 'TST-500', title: 'Drag me' })

function cardElement() {
  // Pragmatic's draggable() marks the card's root with draggable="true".
  return screen.getByRole('button', { name: 'TST-500: Drag me' }).closest('[draggable="true"]')
}

function ui(isDraggable?: boolean) {
  return (
    <TooltipProvider>
      <WorkItemCard item={item} onSelect={vi.fn()} isDraggable={isDraggable} />
    </TooltipProvider>
  )
}

describe('WorkItemCard age', () => {
  function renderAged(days: number | undefined, stage: 'Backlog' | 'InFlight') {
    const aged = { ...item, enteredCurrentStateOnUtc: days === undefined ? undefined : daysAgo(days) }
    render(
      <TooltipProvider>
        <WorkItemCard item={aged} onSelect={vi.fn()} stage={stage} />
      </TooltipProvider>,
    )
  }

  it.each([
    [3, 'neutral'],
    [4, 'warning'],
    [7, 'stalled'],
  ])('an in-flight card with %i days reads %s', (days, level) => {
    renderAged(days, 'InFlight')
    expect(screen.getByText(`${days}d`)).toHaveAttribute('data-age-level', level)
  })

  it('a backlog card stays gray however old it is', () => {
    renderAged(34, 'Backlog')
    expect(screen.getByText('34d')).toHaveAttribute('data-age-level', 'neutral')
  })

  it('shows no age when the backend does not send the field', () => {
    renderAged(undefined, 'InFlight')
    expect(screen.queryByText(/^\d+d$/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'TST-500: Drag me' })).toBeInTheDocument()
  })
})

describe('WorkItemCard dragging', () => {
  it('can be dragged when the board allows it', () => {
    render(ui(true))
    expect(cardElement()).not.toBeNull()
  })

  it('cannot be dragged by default (Viewer, read-only project, move pending)', () => {
    render(ui())
    expect(cardElement()).toBeNull()
  })

  it('stops being draggable when the permission is withdrawn while it is on screen', () => {
    const { rerender } = render(ui(true))
    rerender(ui(false))
    expect(cardElement()).toBeNull()
  })
})
