import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { makeDashboard, makeListItem, makePage, makePortfolioProject, daysAgo } from '@/test/fixtures/dashboard'
import { apiUrl, server } from '@/test/msw-server'
import { createTestQueryClient, createWrapper } from '@/test/query-wrapper'
import { DashboardPage } from './DashboardPage'

const DASHBOARD_URL = apiUrl('/v1/flowboard/dashboard')
const SEARCH_URL = apiUrl('/v1/flowboard/work-items')

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>
}

function renderPage(initial = '/dashboard') {
  const Wrapper = createWrapper(createTestQueryClient())
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={null} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </Wrapper>,
  )
}

const currentUrl = () => screen.getByTestId('location').textContent

describe('DashboardPage', () => {
  it('shows both KPI groups and the stalled summary, with no create button and no link on the numbers', async () => {
    server.use(
      http.get(DASHBOARD_URL, () => HttpResponse.json(makeDashboard())),
      http.get(SEARCH_URL, () => HttpResponse.json(makePage([]))),
    )
    renderPage()

    const you = await screen.findByRole('group', { name: 'You' })
    await within(you).findByText('7')
    expect(within(you).getByText('My open items')).toBeInTheDocument()
    expect(within(you).queryByRole('link')).not.toBeInTheDocument()

    const projects = screen.getByRole('group', { name: 'Your projects' })
    expect(within(projects).getByText('Closed last 7 days')).toBeInTheDocument()
    expect(within(projects).getByText('12')).toBeInTheDocument()
    expect(within(projects).queryByRole('link')).not.toBeInTheDocument()

    expect(screen.getByText(/1 of your items has stopped moving · 5 across your projects\./)).toBeInTheDocument()
    expect(screen.queryByText(/create issue/i)).not.toBeInTheDocument()
  })

  it('words the summary for none and for several', async () => {
    server.use(
      http.get(DASHBOARD_URL, () =>
        HttpResponse.json(makeDashboard({ me: { open: 1, stalled: 0, inFlight: 0, criticalHigh: 0 } })),
      ),
      http.get(SEARCH_URL, () => HttpResponse.json(makePage([]))),
    )
    renderPage()
    expect(await screen.findByText(/None of your items has stopped moving/)).toBeInTheDocument()
  })

  it('asks for 10 items of the All tab, sorted, and opens a row on the board', async () => {
    let query: URLSearchParams | undefined
    server.use(
      http.get(DASHBOARD_URL, () => HttpResponse.json(makeDashboard())),
      http.get(SEARCH_URL, ({ request }) => {
        query = new URL(request.url).searchParams
        return HttpResponse.json(makePage([makeListItem()], { totalCount: 14, totalPages: 2 }))
      }),
    )
    renderPage()

    const title = await screen.findByRole('link', { name: 'PAY-142: Refund webhook drops events on retry' })
    expect(query?.get('assignee')).toBe('me')
    expect(query?.get('sort')).toBe('stageThenTimeInState')
    expect(query?.get('pageSize')).toBe('10')
    expect(screen.getByText('Showing 1 of 14 open items')).toBeInTheDocument()

    fireEvent.click(title)
    expect(currentUrl()).toBe('/projects/p1/board?selected=PAY-142')
  })

  it('opens the board when the row itself is clicked', async () => {
    server.use(
      http.get(DASHBOARD_URL, () => HttpResponse.json(makeDashboard())),
      http.get(SEARCH_URL, () => HttpResponse.json(makePage([makeListItem()]))),
    )
    renderPage()

    fireEvent.click(await screen.findByText('Code Review'))
    expect(currentUrl()).toBe('/projects/p1/board?selected=PAY-142')
  })

  it('colors a backlog item gray however old it is, and a stalled one red', async () => {
    server.use(
      http.get(DASHBOARD_URL, () => HttpResponse.json(makeDashboard())),
      http.get(SEARCH_URL, () =>
        HttpResponse.json(
          makePage([
            makeListItem({ workItemId: 'a', code: 'A-1', enteredCurrentStateOnUtc: daysAgo(7) }),
            makeListItem({ workItemId: 'b', code: 'B-1', stage: 'Backlog', enteredCurrentStateOnUtc: daysAgo(34) }),
          ]),
        ),
      ),
    )
    renderPage()

    expect(await screen.findByText('7d')).toHaveAttribute('data-age-level', 'stalled')
    expect(screen.getByText('34d')).toHaveAttribute('data-age-level', 'neutral')
  })

  it('moves the tab into the URL, sends its filters and keeps the count off Reported by me', async () => {
    const queries: URLSearchParams[] = []
    server.use(
      http.get(DASHBOARD_URL, () => HttpResponse.json(makeDashboard())),
      http.get(SEARCH_URL, ({ request }) => {
        queries.push(new URL(request.url).searchParams)
        return HttpResponse.json(makePage([]))
      }),
    )
    renderPage()

    expect(await screen.findByRole('tab', { name: 'All 7' })).toBeInTheDocument()
    const reported = screen.getByRole('tab', { name: 'Reported by me' })

    fireEvent.click(screen.getByRole('tab', { name: 'Critical & high 2' }))
    await waitFor(() => expect(queries.at(-1)?.get('priority')).toBe('High,Critical'))
    expect(currentUrl()).toBe('/dashboard?tab=critical-high')
    expect(await screen.findByText('No critical or high priority items')).toBeInTheDocument()

    fireEvent.click(reported)
    await waitFor(() => expect(queries.at(-1)?.get('createdBy')).toBe('me'))
    expect(queries.at(-1)?.get('assignee')).toBeNull()
    expect(screen.getByRole('link', { name: 'Open My Issues →' })).toHaveAttribute('href', '/my-issues?tab=reported')
  })

  it('treats an unknown tab as All', async () => {
    server.use(
      http.get(DASHBOARD_URL, () => HttpResponse.json(makeDashboard())),
      http.get(SEARCH_URL, () => HttpResponse.json(makePage([]))),
    )
    renderPage('/dashboard?tab=nope')
    expect(await screen.findByRole('tab', { name: 'All 7', selected: true })).toBeInTheDocument()
    expect(await screen.findByText('Nothing assigned to you')).toBeInTheDocument()
  })

  it('renders the aging buckets and links the oldest item', async () => {
    server.use(
      http.get(DASHBOARD_URL, () => HttpResponse.json(makeDashboard())),
      http.get(SEARCH_URL, () => HttpResponse.json(makePage([]))),
    )
    renderPage()

    expect(await screen.findByText('15 items in flight, by time in state')).toBeInTheDocument()
    expect(screen.getByText('0–3 days')).toBeInTheDocument()
    expect(screen.getByText('14+ days')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'MKT-31 · 18 days' })).toHaveAttribute(
      'href',
      '/projects/p2/board?selected=MKT-31',
    )
  })

  it('hides the oldest item when there is none, and says so when no milestone is active', async () => {
    const base = makeDashboard()
    server.use(
      http.get(DASHBOARD_URL, () =>
        HttpResponse.json({ ...base, aging: { ...base.aging, oldestInFlight: null }, milestones: [] }),
      ),
      http.get(SEARCH_URL, () => HttpResponse.json(makePage([]))),
    )
    renderPage()

    expect(await screen.findByText('No active milestones')).toBeInTheDocument()
    expect(screen.queryByText('Oldest in flight')).not.toBeInTheDocument()
  })

  it('shows a milestone with its progress and opens the project milestones', async () => {
    server.use(
      http.get(DASHBOARD_URL, () =>
        HttpResponse.json(
          makeDashboard({
            milestones: [
              {
                id: 'm1',
                projectId: 'p1',
                projectName: 'Payments Platform',
                name: 'Q4 Payouts',
                color: 'indigo',
                targetEndDate: null,
                linkedTotal: 12,
                linkedClosed: 8,
                linkedStalled: 0,
              },
            ],
          }),
        ),
      ),
      http.get(SEARCH_URL, () => HttpResponse.json(makePage([]))),
    )
    renderPage()

    fireEvent.click(await screen.findByRole('link', { name: 'Q4 Payouts' }))
    expect(currentUrl()).toBe('/projects/p1/milestones')
  })

  it('lists the portfolio in API order, with the flow bar in board order and no empty segments', async () => {
    server.use(
      http.get(DASHBOARD_URL, () =>
        HttpResponse.json(
          makeDashboard({
            portfolio: [makePortfolioProject(), makePortfolioProject({ projectId: 'p2', name: 'Admin Console', open: 2, stalled: 0 })],
          }),
        ),
      ),
      http.get(SEARCH_URL, () => HttpResponse.json(makePage([]))),
    )
    renderPage()

    expect(await screen.findByText('5 open · 1 stalled across 2 projects')).toBeInTheDocument()
    const names = screen.getAllByRole('link').map((link) => link.textContent)
    expect(names.indexOf('Payments Platform')).toBeLessThan(names.indexOf('Admin Console'))

    const row = screen.getByRole('link', { name: 'Payments Platform' }).closest('li') as HTMLElement
    expect(within(row).getByLabelText('Backlog: 1')).toBeInTheDocument()
    expect(within(row).getByLabelText('In Progress: 2')).toBeInTheDocument()
    expect(within(row).queryByLabelText('Code Review: 0')).not.toBeInTheDocument()
  })

  it('shows an active project with no open items as an empty gray row', async () => {
    server.use(
      http.get(DASHBOARD_URL, () =>
        HttpResponse.json(
          makeDashboard({
            portfolio: [
              makePortfolioProject({
                projectId: 'quiet',
                name: 'Old Client',
                kind: 'Client',
                status: 'Active',
                open: 0,
                stalled: 0,
                distribution: [{ flowStateId: 'a', name: 'Doing', color: 'blue', count: 0 }],
                activeMilestone: null,
              }),
            ],
          }),
        ),
      ),
      http.get(SEARCH_URL, () => HttpResponse.json(makePage([]))),
    )
    renderPage()

    const row = (await screen.findByRole('link', { name: 'Old Client' })).closest('li') as HTMLElement
    expect(within(row).getByTestId('empty-flow-bar')).toBeInTheDocument()
    expect(within(row).getByText('0 open')).toBeInTheDocument()
    expect(within(row).getByText('No open milestone')).toBeInTheDocument()
  })

  it('shows an error in the KPIs, rail and portfolio but keeps My work when /dashboard fails', async () => {
    server.use(
      http.get(DASHBOARD_URL, () => HttpResponse.json({ detail: 'Dashboard unavailable' }, { status: 500 })),
      http.get(SEARCH_URL, () => HttpResponse.json(makePage([makeListItem()]))),
    )
    renderPage()

    expect(await screen.findByText("Couldn't load your metrics")).toBeInTheDocument()
    expect(screen.getByText("Couldn't load aging and milestones")).toBeInTheDocument()
    expect(screen.getByText("Couldn't load your portfolio")).toBeInTheDocument()
    expect(screen.getAllByText('Dashboard unavailable')).toHaveLength(3)
    expect(await screen.findByRole('link', { name: /PAY-142/ })).toBeInTheDocument()
  })

  it('shows the error only in the list when /work-items fails', async () => {
    server.use(
      http.get(DASHBOARD_URL, () => HttpResponse.json(makeDashboard())),
      http.get(SEARCH_URL, () => HttpResponse.json({ detail: 'Search unavailable' }, { status: 500 })),
    )
    renderPage()

    expect(await screen.findByText("Couldn't load your work items")).toBeInTheDocument()
    expect(screen.getByText('My open items')).toBeInTheDocument()
    expect(screen.queryByText("Couldn't load your metrics")).not.toBeInTheDocument()
  })

  it('shows an empty state and no sections for a user without active projects', async () => {
    server.use(
      http.get(DASHBOARD_URL, () => HttpResponse.json(makeDashboard({ portfolio: [] }))),
      http.get(SEARCH_URL, () => HttpResponse.json(makePage([]))),
    )
    renderPage()

    expect(await screen.findByText('No active projects')).toBeInTheDocument()
    expect(screen.getByText('Completed and archived projects are on the Projects page.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Go to projects' }))
    expect(currentUrl()).toBe('/projects')
    expect(screen.queryByText('My open items')).not.toBeInTheDocument()
    expect(screen.queryByText('Portfolio')).not.toBeInTheDocument()
  })
})
