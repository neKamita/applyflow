import type { Preview } from '@storybook/react-vite'
import '../src/styles/global.css'

// Set by the Vitest projects so axe runs every story in both themes; absent in the Storybook UI.
declare const __STORYBOOK_THEME__: string | undefined
const forcedTheme = typeof __STORYBOOK_THEME__ === 'string' ? __STORYBOOK_THEME__ : undefined

const preview: Preview = {
  parameters: {
    layout: 'padded',
    a11y: { test: 'error' },
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: { title: 'Theme', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.theme = forcedTheme ?? String(context.globals.theme ?? 'light')
      return Story()
    },
  ],
}

export default preview
