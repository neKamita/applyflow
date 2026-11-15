import { http, HttpResponse } from 'msw'
import * as z from 'zod/mini'
import { server } from '../test/server'
import { createSessionStore } from '../session/session'
import { createApiClient } from './client'
import { ApiError } from './errors'
import { program } from './schemas'

const base = 'http://localhost'
const tumProgram = {
  id: 'tum-msc-informatics',
  university: 'Technical University of Munich',
  name: 'MSc Informatics',
  country: 'Germany',
  degree: 'MASTER',
  applicationFee: 75,
  currency: 'EUR',
  deadline: '2027-05-31',
}

function setup(signedIn = false) {
  sessionStorage.clear()
  const store = createSessionStore(sessionStorage)
  if (signedIn) store.signIn({ accessToken: 'jwt-1', tokenType: 'Bearer', expiresIn: 3600 }, 'aziz')
  return { store, apiFetch: createApiClient(store) }
}

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.catch((e: unknown) => e)
  if (!(error instanceof ApiError)) throw new Error(`Expected ApiError, got ${String(error)}`)
  return error
}

describe('apiFetch', () => {
  it('parses a valid response and sends a correlation id', async () => {
    let sent: string | null = null
    server.use(
      http.get(`${base}/api/programs/tum`, ({ request }) => {
        sent = request.headers.get('X-Correlation-Id')
        return HttpResponse.json(tumProgram)
      }),
    )
    const { apiFetch } = setup()

    const { data } = await apiFetch(`${base}/api/programs/tum`, { schema: program })

    expect(data.name).toBe('MSc Informatics')
    expect(sent).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('adds the bearer token only when auth is requested', async () => {
    const seen: (string | null)[] = []
    server.use(
      http.get(`${base}/api/x`, ({ request }) => {
        seen.push(request.headers.get('Authorization'))
        return HttpResponse.json({})
      }),
    )
    const { apiFetch } = setup(true)

    await apiFetch(`${base}/api/x`, { schema: z.object({}) })
    await apiFetch(`${base}/api/x`, { schema: z.object({}), auth: true })

    expect(seen).toEqual([null, 'Bearer jwt-1'])
  })

  it('does not send an authenticated request without a session', async () => {
    const { apiFetch } = setup()
    const error = await failure(apiFetch(`${base}/api/applications`, { schema: z.object({}), auth: true }))
    expect(error.isSessionExpired).toBe(true)
  })

  it('maps RFC 9457 problem details and the echoed correlation id', async () => {
    server.use(
      http.post(`${base}/api/applications`, () =>
        HttpResponse.json(
          { title: 'Unprocessable Content', status: 422, detail: 'Applications for this program are closed' },
          {
            status: 422,
            headers: { 'Content-Type': 'application/problem+json', 'X-Correlation-Id': 'abc-123' },
          },
        ),
      ),
    )
    const { apiFetch } = setup(true)

    const error = await failure(
      apiFetch(`${base}/api/applications`, { method: 'POST', body: {}, schema: z.object({}), auth: true }),
    )

    expect(error).toMatchObject({
      kind: 'http',
      status: 422,
      title: 'Unprocessable Content',
      detail: 'Applications for this program are closed',
      correlationId: 'abc-123',
    })
  })

  it('keeps one correlation id when the gateway and the service both echo it', async () => {
    server.use(
      http.get(`${base}/api/x`, () =>
        HttpResponse.json(
          { title: 'Not Found', status: 404 },
          {
            status: 404,
            headers: [
              ['X-Correlation-Id', 'abc-123'],
              ['X-Correlation-Id', 'abc-123'],
            ],
          },
        ),
      ),
    )
    const { apiFetch } = setup(true)

    const error = await failure(apiFetch(`${base}/api/x`, { schema: z.object({}), auth: true }))

    expect(error.correlationId).toBe('abc-123')
  })

  it('maps the gateway default error body and falls back to the sent correlation id', async () => {
    let sent: string | null = null
    server.use(
      http.post(`${base}/auth/token`, ({ request }) => {
        sent = request.headers.get('X-Correlation-Id')
        return HttpResponse.json(
          { status: 401, error: 'Unauthorized', message: 'Invalid username or password' },
          { status: 401 },
        )
      }),
    )
    const { apiFetch, store } = setup(true)

    const error = await failure(
      apiFetch(`${base}/auth/token`, { method: 'POST', body: {}, schema: z.object({}) }),
    )

    expect(error).toMatchObject({
      status: 401,
      title: 'Unauthorized',
      detail: 'Invalid username or password',
    })
    expect(error.correlationId).toBe(sent)
    expect(error.isSessionExpired).toBe(false)
    expect(store.current()).not.toBeNull()
  })

  it('expires the session on an authenticated 401 with an empty body', async () => {
    server.use(http.get(`${base}/api/applications`, () => new HttpResponse(null, { status: 401 })))
    const { apiFetch, store } = setup(true)

    const error = await failure(apiFetch(`${base}/api/applications`, { schema: z.object({}), auth: true }))

    expect(error.isSessionExpired).toBe(true)
    expect(store.current()).toBeNull()
  })

  it.each([
    [429, new HttpResponse(null, { status: 429 })],
    [
      502,
      new HttpResponse('<html>Bad Gateway</html>', { status: 502, headers: { 'Content-Type': 'text/html' } }),
    ],
    [
      404,
      HttpResponse.json(
        { title: 'Not Found', status: 404, detail: 'Application not found' },
        { status: 404 },
      ),
    ],
  ])('turns a %i into a typed error without touching the session', async (status, response) => {
    server.use(http.get(`${base}/api/x`, () => response))
    const { apiFetch, store } = setup(true)

    const error = await failure(apiFetch(`${base}/api/x`, { schema: z.object({}), auth: true }))

    expect(error.status).toBe(status)
    expect(error.title.length).toBeGreaterThan(0)
    expect(store.current()).not.toBeNull()
  })

  it('reports a network failure', async () => {
    server.use(http.get(`${base}/api/x`, () => HttpResponse.error()))
    const { apiFetch } = setup()
    const error = await failure(apiFetch(`${base}/api/x`, { schema: z.object({}) }))
    expect(error).toMatchObject({ kind: 'network', status: 0 })
  })

  it('reports a response that does not match the schema', async () => {
    server.use(
      http.get(`${base}/api/programs/tum`, () => HttpResponse.json({ ...tumProgram, degree: 'DIPLOMA' })),
    )
    const { apiFetch } = setup()
    const error = await failure(apiFetch(`${base}/api/programs/tum`, { schema: program }))
    expect(error).toMatchObject({ kind: 'schema', status: 200 })
    expect(error.detail).toContain('degree')
  })
})
