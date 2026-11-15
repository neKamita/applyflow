import { createMemoryHistory } from '@tanstack/react-router'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import * as z from 'zod/mini'
import { apiFetch } from '../api/client'
import { session } from '../session/session'
import { server } from '../test/server'
import { App } from './App'
import { createApp } from './createApp'

const token = { accessToken: 'jwt-1', tokenType: 'Bearer', expiresIn: 3600 }

function renderAt(path: string) {
  const app = createApp(createMemoryHistory({ initialEntries: [path] }))
  render(<App app={app} />)
  return app
}

beforeEach(() => {
  session.signOut()
  sessionStorage.clear()
})

describe('sign-in and route guards', () => {
  it('sends a signed-out visitor from a protected page to sign-in and back after signing in', async () => {
    let body: unknown
    server.use(
      http.post('*/auth/token', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(token)
      }),
    )
    const app = renderAt('/applications')

    await screen.findByRole('heading', { name: 'Sign in to apply' })
    expect(app.router.state.location.search).toEqual({ returnTo: '/applications' })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Username'), 'aziz')
    await user.type(screen.getByLabelText('Password'), 'aziz-demo-pass')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await screen.findByRole('heading', { name: 'My applications' })
    expect(app.router.state.location.pathname).toBe('/applications')
    expect(body).toEqual({ username: 'aziz', password: 'aziz-demo-pass' })
    expect(session.current()?.username).toBe('aziz')
    expect(screen.getByText('Signed in as aziz')).toBeInTheDocument()
  })

  it('keeps the username, clears the password and focuses the message on a wrong password', async () => {
    server.use(
      http.post('*/auth/token', () =>
        HttpResponse.json(
          { status: 401, error: 'Unauthorized', message: 'Invalid username or password' },
          { status: 401 },
        ),
      ),
    )
    renderAt('/login')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Username'), 'aziz')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The username or password is not correct.')
    expect(alert).toHaveFocus()
    expect(screen.getByLabelText('Username')).toHaveValue('aziz')
    expect(screen.getByLabelText('Password')).toHaveValue('')
    expect(session.current()).toBeNull()
  })

  it('asks for missing fields without calling the server', async () => {
    renderAt('/login')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter your username.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true')
  })

  it('ignores an unsafe returnTo after signing in', async () => {
    server.use(http.post('*/auth/token', () => HttpResponse.json(token)))
    const app = renderAt('/login?returnTo=%2Fa%2F..%2F%2Fevil.example')
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Username'), 'aziz')
    await user.type(screen.getByLabelText('Password'), 'aziz-demo-pass')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/programs')
    })
  })

  it('returns to the page with an explanation when the session expires mid-visit', async () => {
    session.signIn({ accessToken: 'jwt-1', tokenType: 'Bearer', expiresIn: 3600 }, 'aziz')
    server.use(http.get('*/api/applications', () => new HttpResponse(null, { status: 401 })))
    const app = renderAt('/applications')
    await screen.findByRole('heading', { name: 'My applications' })

    await act(async () => {
      await app.queryClient
        .query({
          queryKey: ['applications'],
          queryFn: () => apiFetch('/api/applications', { schema: z.array(z.unknown()), auth: true }),
        })
        .catch(() => undefined)
    })

    await screen.findByRole('heading', { name: 'Sign in to apply' })
    expect(app.router.state.location.search).toEqual({ returnTo: '/applications', expired: true })
    expect(screen.getByRole('status')).toHaveTextContent('Your session ended.')
    expect(session.current()).toBeNull()
  })

  it('shows a not-found page for unknown routes', async () => {
    renderAt('/nowhere')
    expect(await screen.findByRole('heading', { name: 'This page does not exist' })).toBeInTheDocument()
  })

  it('signs out and hides the applications link', async () => {
    session.signIn({ accessToken: 'jwt-1', tokenType: 'Bearer', expiresIn: 3600 }, 'aziz')
    server.use(http.get('*/api/programs', () => HttpResponse.json([])))
    renderAt('/applications')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Sign out' }))

    await screen.findByRole('heading', { name: 'Find a program' })
    expect(session.current()).toBeNull()
    expect(screen.queryByRole('link', { name: 'My applications' })).not.toBeInTheDocument()
  })
})
