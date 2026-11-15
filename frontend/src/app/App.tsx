import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { useState } from 'react'
import { createApp, type AppInstance } from './createApp'
import './i18n'

export function App({ app }: { app?: AppInstance }) {
  const [{ router, queryClient }] = useState(() => app ?? createApp())
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
