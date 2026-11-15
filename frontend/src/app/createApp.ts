import type { RouterHistory } from '@tanstack/react-router'
import { createQueryClient } from './queryClient'
import { createAppRouter, type AppRouter } from './router'

export function createApp(history?: RouterHistory): {
  router: AppRouter
  queryClient: ReturnType<typeof createQueryClient>
} {
  // The router is created after the query client but the handler only runs later, on a 401.
  const holder: { router?: AppRouter } = {}
  const queryClient = createQueryClient(() => {
    const router = holder.router
    if (!router) return
    void router.navigate({
      to: '/login',
      search: { returnTo: router.state.location.href, expired: true },
      replace: true,
    })
  })
  holder.router = createAppRouter(queryClient, history)
  return { router: holder.router, queryClient }
}

export type AppInstance = ReturnType<typeof createApp>
