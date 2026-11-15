import type { TokenResponse } from '../api/schemas'

export interface Session {
  accessToken: string
  username: string
  /** Epoch milliseconds after which the token is treated as expired. */
  expiresAt: number
}

/** Expire a little early so a request is not sent with a token that dies in flight. */
export const EXPIRY_MARGIN_MS = 30_000
const STORAGE_KEY = 'applyflow.session'

type Listener = () => void

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.accessToken === 'string' &&
    typeof candidate.username === 'string' &&
    typeof candidate.expiresAt === 'number'
  )
}

/**
 * The signed-in session: kept in memory and mirrored to sessionStorage, so it survives a reload of
 * the tab and disappears when the tab closes. Never localStorage, cookies or URLs.
 */
export function createSessionStore(storage: Storage | null, now: () => number = Date.now) {
  let current: Session | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  const listeners = new Set<Listener>()

  function persist(value: Session | null) {
    try {
      if (value) storage?.setItem(STORAGE_KEY, JSON.stringify(value))
      else storage?.removeItem(STORAGE_KEY)
    } catch {
      // Storage can be unavailable (private mode, quota); the in-memory session still works.
    }
  }

  function set(value: Session | null) {
    current = value
    persist(value)
    clearTimeout(timer)
    if (value) {
      timer = setTimeout(
        () => {
          set(null)
        },
        Math.max(0, value.expiresAt - now()),
      )
    }
    listeners.forEach((listener) => {
      listener()
    })
  }

  function restore() {
    let raw: string | null = null
    try {
      raw = storage?.getItem(STORAGE_KEY) ?? null
    } catch {
      return
    }
    if (!raw) return
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isSession(parsed) && parsed.expiresAt > now()) set(parsed)
      else persist(null)
    } catch {
      persist(null)
    }
  }

  restore()

  return {
    // Arrow properties so the methods can be passed around unbound (useSyncExternalStore does).
    current: (): Session | null => (current && current.expiresAt > now() ? current : null),
    signIn: (token: TokenResponse, username: string) => {
      set({
        accessToken: token.accessToken,
        username,
        expiresAt: now() + token.expiresIn * 1000 - EXPIRY_MARGIN_MS,
      })
    },
    signOut: () => {
      set(null)
    },
    /** Called on a 401: clears the session only if it still holds the token that was rejected. */
    expire: (rejectedToken: string) => {
      if (current?.accessToken === rejectedToken) set(null)
    },
    subscribe: (listener: Listener): (() => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export type SessionStore = ReturnType<typeof createSessionStore>

function browserStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export const session = createSessionStore(browserStorage())
