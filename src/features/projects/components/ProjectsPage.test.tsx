import { fireEvent, render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/app/store/auth.store'
import { apiUrl, server } from '@/test/msw-server'
import { createTestQueryClient, createWrapper } from '@/test/query-wrapper'
import type { Project } from '../types/project.types'
import { ProjectsPage } from './ProjectsPage'

const PROJECTS_URL = apiUrl('/v1/flowboard/projects')
const ME = 'user-1'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    projectId: 'p1',
    name: 'Payments Platform',
    description: null,
    prefix: 'PAY',
    color: 'blue',
    kind: 'Client',
    status: 'Active',
    openWorkItems: 0,
    closedWorkItems: 4,
    canModifyFlowStates: false,
    canAddOrUpdateWorkItems: true,
    members: [{ userId: ME, fullName: 'Ana Ruiz', initials: 'AR', role: 'Admin' }],
    ...overrides,
  }
}

function renderPage(project: Project) {
  server.use(http.get(PROJECTS_URL, () => HttpResponse.json([project])))
  const Wrapper = createWrapper(createTestQueryClient())
  return render(
    <Wrapper>
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    </Wrapper>,
  )
}

async function openStatusMenu(label: string) {
  const trigger = await screen.findByRole('button', { name: label })
  fireEvent.click(trigger)
  return screen.findByRole('menu')
}

describe('ProjectsPage status menu', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: ME, fullName: 'Ana Ruiz', initials: 'AR', email: 'ana@example.test', role: 'Member' },
      isAuthenticated: true,
    })
  })

  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it('disables Completed and Archived while the project has open items, and says why', async () => {
    renderPage(makeProject({ openWorkItems: 3 }))

    const menu = await openStatusMenu('Active')
    expect(within(menu).getByRole('menuitem', { name: 'Completed' })).toHaveAttribute('aria-disabled', 'true')
    expect(within(menu).getByRole('menuitem', { name: 'Archived' })).toHaveAttribute('aria-disabled', 'true')
    expect(within(menu).getByText('Close or cancel its 3 open items before completing or archiving it.')).toBeInTheDocument()
  })

  it('names only archiving for a kind whose menu offers no Completed', async () => {
    renderPage(makeProject({ kind: 'Product', openWorkItems: 1 }))

    const menu = await openStatusMenu('Active')
    expect(within(menu).getByRole('menuitem', { name: 'Maintenance' })).not.toHaveAttribute('aria-disabled', 'true')
    expect(within(menu).getByText('Close or cancel its 1 open item before archiving it.')).toBeInTheDocument()
  })

  it('enables both once every item is closed', async () => {
    renderPage(makeProject({ openWorkItems: 0 }))

    const menu = await openStatusMenu('Active')
    expect(within(menu).getByRole('menuitem', { name: 'Completed' })).not.toHaveAttribute('aria-disabled', 'true')
    expect(within(menu).getByRole('menuitem', { name: 'Archived' })).not.toHaveAttribute('aria-disabled', 'true')
    expect(within(menu).queryByText(/open item/)).not.toBeInTheDocument()
  })

  it('still lets a Completed project with open items be archived', async () => {
    renderPage(makeProject({ status: 'Completed', openWorkItems: 2 }))

    const menu = await openStatusMenu('Completed')
    expect(within(menu).getByRole('menuitem', { name: 'Archived' })).not.toHaveAttribute('aria-disabled', 'true')
    expect(within(menu).queryByText(/open item/)).not.toBeInTheDocument()
  })
})
