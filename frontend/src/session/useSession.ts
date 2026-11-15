import { useSyncExternalStore } from 'react'
import { session, type Session } from './session'

export function useSession(): Session | null {
  return useSyncExternalStore(session.subscribe, session.current, session.current)
}
