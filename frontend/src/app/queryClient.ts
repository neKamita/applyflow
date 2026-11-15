import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { isApiError } from '../api/errors'

const MAX_RETRIES = 2

/**
 * Queries retry only failures that may pass on a second try (network, 5xx). Mutations never retry
 * on their own: submitting an application has its own idempotent retry logic.
 */
export function createQueryClient(onSessionExpired: () => void): QueryClient {
  const handle = (error: unknown) => {
    if (isApiError(error) && error.isSessionExpired) onSessionExpired()
  }

  return new QueryClient({
    queryCache: new QueryCache({ onError: handle }),
    mutationCache: new MutationCache({ onError: handle }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) =>
          failureCount < MAX_RETRIES &&
          isApiError(error) &&
          (error.kind === 'network' || error.status >= 500),
      },
      mutations: { retry: false },
    },
  })
}
