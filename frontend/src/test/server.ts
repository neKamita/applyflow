import { setupServer } from 'msw/node'

// Tests register their own handlers with server.use(...). There are no defaults on purpose:
// an unmocked request fails the test instead of silently reaching the network.
export const server = setupServer()
