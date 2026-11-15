# Phase 2: Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** tokens and the components the six screens in `docs/design/flows.md` need, in the passport
world from `.impeccable/surfaces/frontend-src.md`, each with a Storybook story that passes axe in a real
browser, then `DESIGN.md` generated from what was built.

**Architecture:** design tokens are CSS custom properties in `src/styles/tokens.css` (light, dark via
`prefers-color-scheme` and `[data-theme]`), exposed to Tailwind v4 through `@theme inline`. Components
live in `src/ui/`, one file each, presentational only: they take already-translated text and a locale,
and know nothing about the API.

**Tech Stack:** Tailwind CSS v4 (`@tailwindcss/vite`), self-hosted `@fontsource/golos-text` and
`@fontsource/pt-mono` (Latin + Cyrillic), `lucide-react` icons, `clsx`, Storybook `addon-a11y` +
`addon-vitest` (Vitest browser mode on Playwright Chromium).

**Spec:** roadmap Phase 2, `PRODUCT.md`, the direction contract, `docs/design/flows.md`.

## Global Constraints

- WCAG 2.2 AA: text contrast >= 4.5:1 (>= 3:1 for large text and UI boundaries) in both themes; visible
  focus ring on every interactive element; status never by colour alone.
- Fonts are self-hosted, no third-party requests (the Phase 3 CSP is `default-src 'self'`).
- Inputs render at >= 16px to avoid iOS zoom.
- Motion: one authored moment (the stamp landing); everything respects `prefers-reduced-motion`.
- No modal, toast or combobox in this phase: no screen in the flow map needs one yet (see Deviations).

## Review Focus

1. Long and non-Latin content (university names, Russian labels) wraps without overflow at 360px.
2. Dark theme keeps every status ink above 4.5:1.
3. `Money` with a currency the locale has no symbol for (e.g. UZS) still renders a readable code.
4. A disabled or loading `Button` cannot be activated by keyboard and announces its busy state.
5. `Stamp` with reduced motion appears without any transform animation.

## Deviations from the roadmap

- Native `<select>` styled instead of Radix Select: the filters have short option lists, and the native
  control is the most accessible and best on mobile.
- No `Combobox`, `Dialog` or `Toast` yet: nothing in the flow map uses them. They are added in the
  phase whose screen needs them (Sonner in Phase 3 if session expiry needs a toast).

## Tasks

### Task 1: Fonts, Tailwind and tokens

**Files:** `src/styles/{tokens.css,global.css}`, `vite.config.ts`, `src/main.tsx`, `.storybook/preview.ts`.

- [ ] Colour roles: `cover`, `on-cover`, `paper`, `panel`, `ink`, `ink-muted`, `line`, `focus`,
  `stamp-submitted`, `stamp-paid`, `stamp-failed` (+ `-soft` backgrounds), light and dark.
- [ ] Type: Golos Text 400/500/600 for UI, PT Mono 400 for references and stamp text; scale 13/14/16/18/22/28.
- [ ] Browser surfaces themed: selection, caret, focus ring, scrollbar, tabular numerals.
- [ ] Contrast of every text/ground pair checked by `src/styles/contrast.test.ts` (WCAG formula over
  the token values).

### Task 2: Base components

**Files:** `src/ui/{Button,TextField,Select,Checkbox,RadioGroup,Panel,Skeleton,EmptyState,ErrorState}.tsx`.

- [ ] `Button({ variant: 'primary'|'secondary'|'ghost', size?: 'md'|'sm', loading?, ...button props })`:
  `loading` sets `aria-busy` and `aria-disabled` and swallows clicks.
- [ ] `TextField({ label, hint?, error?, ...input props })` and `Select({ label, options, ... })`: label
  wired by `useId`, hint and error via `aria-describedby`, error sets `aria-invalid`.
- [ ] `RadioGroup({ legend, name, options: {value,label,description?}[], value, onChange })` on
  `fieldset`/`legend`.
- [ ] `EmptyState({ title, body?, action? })`, `ErrorState({ title, body?, onRetry?, retryLabel? })` with
  `role="alert"` only on `ErrorState`.

### Task 3: Domain display components

**Files:** `src/ui/{Money,DateText,StatusBadge,Stamp,Timeline,PageShell,Guilloche}.tsx`.

- [ ] `Money({ amount: number, currency: string, locale })` via `Intl.NumberFormat`,
  `currencyDisplay: 'narrowSymbol'`.
- [ ] `DateText({ value: string, locale, mode: 'date'|'datetime'|'relative-days' })`.
- [ ] `StatusBadge({ status: 'SUBMITTED'|'PAID'|'PAYMENT_FAILED', label })`: stamp shape icon + label.
- [ ] `Stamp({ status, title, date?, code?, animate? })`: dashed circle / rectangle / notched rectangle
  in the status ink; lands with a 180 ms press-in when `animate` and motion is allowed.
- [ ] `Timeline({ items: {id, title, meta?, state: 'done'|'pending'|'failed'}[] })` as an ordered list.
- [ ] `PageShell({ nav, actions, children, footer })`: cover-ink header with `Guilloche` band, skip link,
  `main` landmark.

### Task 4: Stories, a11y and visual check

- [ ] One story file per component with its states (default, hover via play, disabled, loading, error,
  long content, Russian copy).
- [ ] Storybook Vitest project runs every story in Chromium with axe; violations fail (`a11y.test: 'error'`).
- [ ] Screenshots at 360px and 1280px in light and dark reviewed; fixes applied in one batch.

### Task 5: DESIGN.md

- [ ] `impeccable document` writes `DESIGN.md` from the built tokens and components.
- [ ] `impeccable detect --json src` reports no unresolved findings.
