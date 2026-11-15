export type ApiErrorKind = 'http' | 'network' | 'schema'

export interface ApiErrorInit {
  kind: ApiErrorKind
  status: number
  title: string
  detail?: string | undefined
  correlationId?: string | undefined
  /** True when the request carried the session token. Only these 401s mean "session expired". */
  authenticated: boolean
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number
  readonly title: string
  readonly detail: string | undefined
  readonly correlationId: string | undefined
  readonly authenticated: boolean

  constructor(init: ApiErrorInit) {
    super(init.detail ? `${init.title}: ${init.detail}` : init.title)
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status
    this.title = init.title
    this.detail = init.detail
    this.correlationId = init.correlationId
    this.authenticated = init.authenticated
  }

  get isSessionExpired(): boolean {
    return this.status === 401 && this.authenticated
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
