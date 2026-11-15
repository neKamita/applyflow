# Phase 1: Frontend Scaffold, Tooling, CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** an empty but fully wired `frontend/` app where typecheck, lint, unit tests, e2e smoke test,
Storybook build, production build and bundle-size check all pass locally and in CI.

**Architecture:** Vite + React + TypeScript SPA in `frontend/`, separate from the Maven build. The dev
server proxies `/api` and `/auth` to the gateway on `http://localhost:8080`, so the browser uses one
origin in development as it will in production.

**Tech Stack:** Node 24 LTS, pnpm, Vite, React 19, TypeScript, ESLint (typescript-eslint, jsx-a11y,
react-hooks), Prettier, Vitest + Testing Library + jsdom, MSW, Playwright, Storybook, size-limit.

**Spec:** `docs/superpowers/plans/2026-11-15-frontend-roadmap.md` (Phase 1), `PRODUCT.md`.

## Global Constraints

- TypeScript `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; no `any` in `src/`
  (lint error).
- Exact dependency versions in `package.json` (no `^`/`~`), lockfile committed, `.nvmrc` = `24`.
- `packageManager` field pins pnpm.
- Initial JS budget: 170 KB gzip, enforced by `size-limit` in CI.
- No product UI in this phase: one placeholder page with the product name and the demo notice.
- Root `.dockerignore` excludes `frontend/` so the Java image build context stays small.

## Review Focus

1. Dev proxy actually forwards `/api/programs` to the gateway (checked with the stack running, or
   skipped and reported when it is not).
2. Lint rejects `any` and missing `alt`/labels (a11y plugin wired, not just installed).
3. CI job runs with a frozen lockfile and fails on a size-budget breach.
4. MSW is wired into Vitest so later tests cannot hit the network by accident (`onUnhandledRequest: 'error'`).
5. Playwright smoke test runs against `vite preview`, not the dev server.

---

### Task 1: Scaffold and placeholder page

**Files:** `frontend/{package.json,.nvmrc,index.html,vite.config.ts,tsconfig*.json}`,
`frontend/src/{main.tsx,App.tsx}`, `.dockerignore`, `.gitignore`.

- [ ] `App` renders heading "ApplyFlow" and the demo notice from PRODUCT.md.
- [ ] `vite.config.ts` proxies `/api` and `/auth` to `process.env.GATEWAY_URL ?? 'http://localhost:8080'`.
- [ ] `pnpm typecheck` (`tsc -b`) and `pnpm build` pass.

### Task 2: Lint and format

**Files:** `frontend/eslint.config.js`, `frontend/.prettierrc.json`, `frontend/.prettierignore`.

- [ ] `pnpm lint` passes; a temporary `const x: any = 1` fails it (checked, then removed).

### Task 3: Unit tests with MSW

**Files:** `frontend/vitest.config.ts`, `frontend/src/test/{setup.ts,server.ts}`, `frontend/src/App.test.tsx`.

- [ ] Test `renders the product name and demo notice` asserts heading `ApplyFlow` and text
  `Not affiliated with the listed universities`.
- [ ] MSW server started in setup with `onUnhandledRequest: 'error'`.
- [ ] `pnpm test` passes.

### Task 4: E2E smoke and Storybook

**Files:** `frontend/playwright.config.ts`, `frontend/e2e/smoke.spec.ts`, `frontend/.storybook/{main.ts,preview.ts}`,
`frontend/src/App.stories.tsx`.

- [ ] Smoke test opens `/` on `vite preview` and expects heading `ApplyFlow`.
- [ ] `pnpm e2e` and `pnpm build-storybook` pass.

### Task 5: CI and size budget

**Files:** `frontend/.size-limit.json`, `.github/workflows/ci.yml`.

- [ ] Job `frontend`: checkout, pnpm setup, Node from `.nvmrc`, `pnpm install --frozen-lockfile`,
  typecheck, lint, test, build, size, Playwright chromium + e2e; uploads Playwright report on failure.
- [ ] `pnpm size` passes locally.
