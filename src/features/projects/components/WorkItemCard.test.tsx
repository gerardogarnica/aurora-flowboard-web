import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { makeBoardItem } from '@/test/fixtures/board'
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
