import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import securityHeaders from './security-headers.json' with { type: 'json' }

// The browser always talks to one origin: in development Vite forwards API calls to the
// gateway, in production nginx does. No CORS configuration is needed in the gateway.
const gatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: gatewayUrl, changeOrigin: true },
      '/auth': { target: gatewayUrl, changeOrigin: true },
    },
  },
  // Preview serves the production build with the production headers, so e2e catches CSP breaks.
  preview: {
    headers: securityHeaders,
    proxy: {
      '/api': { target: gatewayUrl, changeOrigin: true },
      '/auth': { target: gatewayUrl, changeOrigin: true },
    },
  },
})
