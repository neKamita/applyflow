import { getRouteApi } from '@tanstack/react-router'
import { LoginPage } from './LoginPage'

const route = getRouteApi('/login')

/** Route entry, loaded lazily: the form library is only needed on this page. */
export function LoginRoute() {
  const search = route.useSearch()
  return <LoginPage returnTo={search.returnTo} expired={search.expired === true} />
}
