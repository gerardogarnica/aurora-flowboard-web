import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { makeListItem, makePage } from '@/test/fixtures/dashboard'
import { apiUrl, server } from '@/test/msw-server'
import { createTestQueryClient, createWrapper } from '@/test/query-wrapper'
import { MyIssuesPage } from './MyIssuesPage'

const SEARCH_URL = apiUrl('/v1/flowboard/work-items')

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.search}</output>
}

function renderPage(initial = '/my-issues') {
  const Wrapper = createWrapper(createTestQueryClient())
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[initial]}>
        <MyIssuesPage />
        <LocationProbe />
      </MemoryRouter>
    </Wrapper>,
  )
}

/** Answers with `totalPages` pages of one row, recording every query string. */
function serveSearch(totalPages: number) {
  const queries: URLSearchParams[] = []
  server.use(
    http.get(SEARCH_URL, ({ request }) => {
      const query = new URL(request.url).searchParams
      queries.push(query)
      const page = Number(query.get('page'))
      return HttpResponse.json(
        makePage([makeListItem({ title: `Row of page ${page}` })], {
          page,
          pageSize: 25,
          totalCount: totalPages * 25,
          totalPages,
        }),
      )
    }),
  )
  return queries
}

const search = () => screen.getByTestId('location').textContent

describe('MyIssuesPage', () => {
  it('asks for 25 rows and shows no counts on the tabs', async () => {
    const queries = serveSearch(1)
    renderPage()

    expect(await screen.findByText('Row of page 1')).toBeInTheDocument()
    expect(queries[0].get('pageSize')).toBe('25')
    expect(queries[0].get('assignee')).toBe('me')
    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Stalled' })).toBeInTheDocument()
  })

  it('keeps the page in the URL', async () => {
    serveSearch(3)
    renderPage()

    await screen.findByText('Row of page 1')
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))

    expect(await screen.findByText('Row of page 2')).toBeInTheDocument()
    expect(search()).toBe('?page=2')
  })

  it('starts from the URL page after a refresh', async () => {
    const queries = serveSearch(3)
    renderPage('/my-issues?page=2')

    expect(await screen.findByText('Row of page 2')).toBeInTheDocument()
    expect(queries[0].get('page')).toBe('2')
  })

  it('goes back to page 1 when the tab changes', async () => {
    const queries = serveSearch(3)
    renderPage('/my-issues?page=3')

    await screen.findByText('Row of page 3')
    fireEvent.click(screen.getByRole('tab', { name: 'In flight' }))

    await waitFor(() => expect(queries.at(-1)?.get('stage')).toBe('InFlight'))
    expect(queries.at(-1)?.get('page')).toBe('1')
    expect(search()).toBe('?tab=in-flight')
  })

  it('never asks for a page below 1', async () => {
    const queries = serveSearch(1)
    renderPage('/my-issues?page=0')

    await screen.findByText('Row of page 1')
    expect(queries[0].get('page')).toBe('1')
  })

  it('falls back to the last page when the rows behind this one are gone', async () => {
    serveSearch(2)
    renderPage('/my-issues?page=9')

    await waitFor(() => expect(search()).toBe('?page=2'))
    expect(await screen.findByText('Row of page 2')).toBeInTheDocument()
  })

  it('shows the error state with a working retry', async () => {
    let fail = true
    server.use(
      http.get(SEARCH_URL, () =>
        fail
          ? HttpResponse.json({ detail: 'Search unavailable' }, { status: 500 })
          : HttpResponse.json(makePage([makeListItem()])),
      ),
    )
    renderPage()

    expect(await screen.findByText('Search unavailable')).toBeInTheDocument()
    fail = false
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('link', { name: /PAY-142/ })).toBeInTheDocument()
  })
})
