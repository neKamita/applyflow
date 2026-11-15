import { createMemoryHistory } from '@tanstack/react-router'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { Program } from '../../api/schemas'
import { App } from '../../app/App'
import { createApp } from '../../app/createApp'
import { session } from '../../session/session'
import { server } from '../../test/server'

const program = (overrides: Partial<Program>): Program => ({
  id: 'tum-msc-informatics',
  university: 'Technical University of Munich',
  name: 'MSc Informatics',
  country: 'Germany',
  degree: 'MASTER',
  applicationFee: 75,
  currency: 'EUR',
  deadline: '2099-05-31',
  ...overrides,
})

const catalog = [
  program({}),
  program({
    id: 'ubc-cs',
    university: 'University of British Columbia',
    name: 'MSc Computer Science',
    country: 'Canada',
    currency: 'CAD',
    applicationFee: 100,
  }),
  program({
    id: 'polimi-bsc-ce',
    university: 'Politecnico di Milano',
    name: 'BSc Computer Engineering',
    country: 'Italy',
    degree: 'BACHELOR',
    deadline: '2020-04-15',
  }),
]

/** The i-th element, failing the test clearly if it is missing. */
function at(list: HTMLElement[], index: number): HTMLElement {
  const element = list[index]
  if (!element) throw new Error(`Expected at least ${String(index + 1)} elements, got ${String(list.length)}`)
  return element
}

function renderAt(path: string) {
  const app = createApp(createMemoryHistory({ initialEntries: [path] }))
  render(<App app={app} />)
  return app
}

beforeEach(() => {
  session.signOut()
})

describe('catalog', () => {
  it('lists open programs first with fee and deadline, and closed ones without an apply link', async () => {
    server.use(http.get('*/api/programs', () => HttpResponse.json(catalog)))
    renderAt('/programs')

    const rows = await screen.findAllByRole('article')
    expect(rows.map((row) => within(row).getByRole('heading').textContent)).toEqual([
      'MSc Informatics',
      'MSc Computer Science',
      'BSc Computer Engineering',
    ])
    expect(within(at(rows, 1)).getByText('Fee CA$100.00')).toBeInTheDocument()
    expect(within(at(rows, 0)).getByRole('link', { name: 'Apply to MSc Informatics' })).toHaveAttribute(
      'href',
      '/programs/tum-msc-informatics/apply',
    )
    expect(within(at(rows, 2)).queryByRole('link', { name: /Apply/ })).not.toBeInTheDocument()
    expect(within(at(rows, 2)).getByText('Closed')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('3 programs')
  })

  it('keeps filters in the URL and applies them', async () => {
    server.use(http.get('*/api/programs', () => HttpResponse.json(catalog)))
    const app = renderAt('/programs')
    const user = userEvent.setup()
    await screen.findAllByRole('article')

    await user.selectOptions(screen.getByLabelText('Country'), 'Canada')
    await user.click(screen.getByLabelText('Open programs only'))

    await waitFor(() => {
      expect(app.router.state.location.search).toEqual({ country: 'Canada', open: true })
    })
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('1 program')
  })

  it('opens a shared link with its filters, ignoring invalid ones', async () => {
    server.use(http.get('*/api/programs', () => HttpResponse.json(catalog)))
    renderAt('/programs?q=%22munich%22&degree=%22DIPLOMA%22&open=%22yes%22')

    const rows = await screen.findAllByRole('article')
    expect(rows).toHaveLength(1)
    expect(within(at(rows, 0)).getByRole('heading')).toHaveTextContent('MSc Informatics')
    expect(screen.getByLabelText('Search university or program')).toHaveValue('munich')
    expect(screen.getByLabelText('Degree')).toHaveValue('')
  })

  it('shows an empty state with a way back to every program', async () => {
    server.use(http.get('*/api/programs', () => HttpResponse.json(catalog)))
    const app = renderAt('/programs?country=%22Narnia%22')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Clear filters' }))

    await waitFor(() => {
      expect(app.router.state.location.search).toEqual({})
    })
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('shows an error with retry when the catalog cannot be loaded', async () => {
    let calls = 0
    server.use(
      http.get('*/api/programs', () => {
        calls += 1
        return calls <= 3 ? HttpResponse.error() : HttpResponse.json(catalog)
      }),
    )
    renderAt('/programs')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Retry' }, { timeout: 10_000 }))

    expect(await screen.findAllByRole('article')).toHaveLength(3)
  })
})

describe('program page', () => {
  it('shows the fee, the UTC deadline, the demo note and the apply link', async () => {
    server.use(http.get('*/api/programs/tum-msc-informatics', () => HttpResponse.json(catalog[0])))
    renderAt('/programs/tum-msc-informatics')

    expect(await screen.findByRole('heading', { level: 1, name: 'MSc Informatics' })).toBeInTheDocument()
    expect(screen.getByText('€75.00')).toBeInTheDocument()
    expect(screen.getByText('May 31, 2099 (UTC)')).toBeInTheDocument()
    expect(screen.getByText(/Demo value/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Apply for this program' })).toHaveAttribute(
      'href',
      '/programs/tum-msc-informatics/apply',
    )
  })

  it('says applications are closed after the deadline', async () => {
    server.use(http.get('*/api/programs/polimi-bsc-ce', () => HttpResponse.json(catalog[2])))
    renderAt('/programs/polimi-bsc-ce')

    expect(await screen.findByText('Applications closed on Apr 15, 2020.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Apply for this program' })).not.toBeInTheDocument()
  })

  it('shows a not-found state for an unknown program', async () => {
    server.use(
      http.get('*/api/programs/nope', () =>
        HttpResponse.json(
          { title: 'Not Found', status: 404, detail: 'Program nope not found' },
          { status: 404 },
        ),
      ),
    )
    renderAt('/programs/nope')

    expect(await screen.findByRole('heading', { name: 'This program does not exist' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'All programs' })).toHaveAttribute('href', '/programs')
  })

  it('sends a signed-out visitor from Apply to sign-in and back to the form', async () => {
    server.use(http.get('*/api/programs/tum-msc-informatics', () => HttpResponse.json(catalog[0])))
    const app = renderAt('/programs/tum-msc-informatics')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('link', { name: 'Apply for this program' }))

    await screen.findByRole('heading', { name: 'Sign in to apply' })
    expect(app.router.state.location.search).toEqual({ returnTo: '/programs/tum-msc-informatics/apply' })
  })
})
