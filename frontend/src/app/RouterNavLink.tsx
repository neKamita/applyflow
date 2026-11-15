import { createLink } from '@tanstack/react-router'
import { NavLink } from '../ui/NavLink'

/** Header link wired to the router; the router sets aria-current on the active route. */
export const RouterNavLink = createLink(NavLink)
