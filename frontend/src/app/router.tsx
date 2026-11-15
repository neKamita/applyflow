import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
  type RouterHistory,
} from '@tanstack/react-router'
import { ApplyPlaceholder } from '../features/apply/ApplyPlaceholder'
import { ApplicationsPlaceholder } from '../features/placeholder/Placeholder'
import { CatalogPage } from '../features/programs/CatalogPage'
import { parseCatalogSearch } from '../features/programs/filter'
import { ProgramPage } from '../features/programs/ProgramPage'
import { session } from '../session/session'
import { safeReturnTo } from '../session/returnTo'
import { AppShell } from './AppShell'
import { NotFoundPage } from './NotFoundPage'

export interface RouterContext {
  queryClient: QueryClient
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: AppShell,
  notFoundComponent: NotFoundPage,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    // TanStack Router redirects by throwing; the rule assumes Error objects.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/programs' })
  },
})

const programsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/programs',
})

const catalogRoute = createRoute({
  getParentRoute: () => programsRoute,
  path: '/',
  validateSearch: parseCatalogSearch,
  component: CatalogPage,
})

const programRoute = createRoute({
  getParentRoute: () => programsRoute,
  path: '$programId',
  component: ProgramPage,
})

interface LoginSearch {
  returnTo?: string
  expired?: boolean
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    ...(typeof search.returnTo === 'string' ? { returnTo: search.returnTo } : {}),
    ...(search.expired === true || search.expired === 'true' ? { expired: true } : {}),
  }),
  beforeLoad: ({ search }) => {
    if (session.current()) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ href: safeReturnTo(search.returnTo, window.location.origin), replace: true })
    }
  },
  component: lazyRouteComponent(() => import('../features/auth/LoginRoute'), 'LoginRoute'),
})

/** Pathless layout: everything under it needs a session. */
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  beforeLoad: ({ location }) => {
    if (!session.current()) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: '/login', search: { returnTo: location.href } })
    }
  },
})

const applyRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/programs/$programId/apply',
  component: ApplyPlaceholder,
})

const applicationsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/applications',
  component: ApplicationsPlaceholder,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  programsRoute.addChildren([catalogRoute, programRoute]),
  loginRoute,
  protectedRoute.addChildren([applyRoute, applicationsRoute]),
])

export function createAppRouter(queryClient: QueryClient, history?: RouterHistory) {
  return createRouter({
    routeTree,
    context: { queryClient },
    ...(history ? { history } : {}),
    defaultPreload: 'intent',
    scrollRestoration: true,
  })
}

export type AppRouter = ReturnType<typeof createAppRouter>

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}
