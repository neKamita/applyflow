import { EXPIRY_MARGIN_MS, createSessionStore } from './session'

const token = { accessToken: 'jwt-1', tokenType: 'Bearer' as const, expiresIn: 3600 }

describe('session store', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-15T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('signs in with an expiry that keeps a safety margin', () => {
    const store = createSessionStore(sessionStorage)
    store.signIn(token, 'aziz')

    expect(store.current()).toEqual({
      accessToken: 'jwt-1',
      username: 'aziz',
      expiresAt: Date.now() + 3600_000 - EXPIRY_MARGIN_MS,
    })
  })

  it('survives a reload of the tab through sessionStorage, never localStorage', () => {
    createSessionStore(sessionStorage).signIn(token, 'aziz')

    expect(createSessionStore(sessionStorage).current()?.username).toBe('aziz')
    expect(localStorage.length).toBe(0)
  })

  it('clears itself and notifies listeners when the token expires', () => {
    const store = createSessionStore(sessionStorage)
    const listener = vi.fn()
    store.subscribe(listener)
    store.signIn(token, 'aziz')
    listener.mockClear()

    vi.advanceTimersByTime(3600_000 - EXPIRY_MARGIN_MS)

    expect(store.current()).toBeNull()
    expect(listener).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem('applyflow.session')).toBeNull()
  })

  it('ignores an expired or corrupt stored session', () => {
    sessionStorage.setItem('applyflow.session', '{not json')
    expect(createSessionStore(sessionStorage).current()).toBeNull()
    expect(sessionStorage.getItem('applyflow.session')).toBeNull()

    sessionStorage.setItem(
      'applyflow.session',
      JSON.stringify({ accessToken: 'old', username: 'aziz', expiresAt: Date.now() - 1 }),
    )
    expect(createSessionStore(sessionStorage).current()).toBeNull()
  })

  it('expires only the token that was rejected, so a stale 401 cannot sign out a newer session', () => {
    const store = createSessionStore(sessionStorage)
    store.signIn(token, 'aziz')
    store.signIn({ ...token, accessToken: 'jwt-2' }, 'aziz')

    store.expire('jwt-1')
    expect(store.current()?.accessToken).toBe('jwt-2')

    store.expire('jwt-2')
    expect(store.current()).toBeNull()
  })

  it('works in memory when storage is unavailable', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
      removeItem: () => {
        throw new Error('denied')
      },
    } as unknown as Storage
    const store = createSessionStore(broken)
    store.signIn(token, 'aziz')
    expect(store.current()?.username).toBe('aziz')
  })
})
