import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'jsdom',
            // Not UTC on purpose: code that mixes local and UTC dates fails here instead of in production.
            env: { TZ: 'America/Los_Angeles' },
            globals: true,
            setupFiles: ['./src/test/setup.ts'],
            include: ['src/**/*.test.{ts,tsx}'],
            restoreMocks: true,
          },
        },
        {
          // Every story is rendered in real Chromium and checked with axe, contrast included.
          extends: true,
          define: { __STORYBOOK_THEME__: JSON.stringify('light') },
          plugins: [storybookTest({ configDir: '.storybook' })],
          // Pre-bundle up front: a dependency discovered mid-run reloads the browser and fails the run.
          optimizeDeps: { include: ['clsx', 'lucide-react', 'storybook/test', 'react-dom/client'] },
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: [{ browser: 'chromium' }],
            },
            setupFiles: ['./.storybook/vitest.setup.ts'],
          },
        },
        {
          // The same stories again in the dark theme, so contrast is checked in both.
          extends: true,
          define: { __STORYBOOK_THEME__: JSON.stringify('dark') },
          plugins: [storybookTest({ configDir: '.storybook' })],
          // Pre-bundle up front: a dependency discovered mid-run reloads the browser and fails the run.
          optimizeDeps: { include: ['clsx', 'lucide-react', 'storybook/test', 'react-dom/client'] },
          test: {
            name: 'storybook-dark',
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: [{ browser: 'chromium' }],
            },
            setupFiles: ['./.storybook/vitest.setup.ts'],
          },
        },
      ],
    },
  }),
)
