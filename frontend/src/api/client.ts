import type * as z from 'zod/mini'
import { session as defaultSession, type SessionStore } from '../session/session'
import { ApiError } from './errors'
import { errorBody } from './schemas'

const CORRELATION_HEADER = 'X-Correlation-Id'

export interface RequestOptions<S extends z.ZodMiniType> {
  method?: 'GET' | 'POST'
  body?: unknown
  schema: S
  /** Send the session token. Without a session the request is not sent and a 401 is thrown. */
  auth?: boolean
  headers?: Record<string, string>
  signal?: AbortSignal
}

export interface ApiResponse<T> {
  data: T
  status: number
  headers: Headers
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text || !(response.headers.get('content-type') ?? '').includes('json')) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

export function createApiClient(
  session: SessionStore,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
) {
  return async function apiFetch<S extends z.ZodMiniType>(
    path: string,
    options: RequestOptions<S>,
  ): Promise<ApiResponse<z.infer<S>>> {
    const { method = 'GET', body, schema, auth = false, headers = {}, signal } = options
    const correlationId = crypto.randomUUID()
    const token = auth ? session.current()?.accessToken : undefined

    if (auth && !token) {
      throw new ApiError({
        kind: 'http',
        status: 401,
        title: 'Not signed in',
        correlationId,
        authenticated: true,
      })
    }

    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      [CORRELATION_HEADER]: correlationId,
      ...headers,
    }
    if (body !== undefined) requestHeaders['Content-Type'] = 'application/json'
    if (token) requestHeaders.Authorization = `Bearer ${token}`

    let response: Response
    try {
      response = await fetchImpl(path, {
        method,
        headers: requestHeaders,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        ...(signal ? { signal } : {}),
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      throw new ApiError({
        kind: 'network',
        status: 0,
        title: 'Network error',
        correlationId,
        authenticated: auth,
      })
    }

    // The gateway echoes the id on routed requests; /auth/token and gateway-level 401s do not.
    // Routed responses carry the header twice (gateway and service both set it), which fetch joins
    // as "id, id"; keep the first value.
    const echoed = response.headers.get(CORRELATION_HEADER)?.split(',')[0]?.trim()
    const responseCorrelationId = echoed !== undefined && echoed !== '' ? echoed : correlationId
    const json = await readJson(response)

    if (!response.ok) {
      if (response.status === 401 && token) session.expire(token)
      const parsed = errorBody.safeParse(json)
      const problem = parsed.success ? parsed.data : {}
      throw new ApiError({
        kind: 'http',
        status: response.status,
        title: problem.title ?? problem.error ?? (response.statusText || `HTTP ${String(response.status)}`),
        detail: problem.detail ?? problem.message,
        correlationId: responseCorrelationId,
        authenticated: auth,
      })
    }

    const parsed = schema.safeParse(json)
    if (!parsed.success) {
      throw new ApiError({
        kind: 'schema',
        status: response.status,
        title: 'Unexpected response',
        detail: parsed.error.issues
          .slice(0, 3)
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; '),
        correlationId: responseCorrelationId,
        authenticated: auth,
      })
    }

    return { data: parsed.data, status: response.status, headers: response.headers }
  }
}

export const apiFetch = createApiClient(defaultSession)
