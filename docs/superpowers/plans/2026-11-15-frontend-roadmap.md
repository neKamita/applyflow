# ApplyFlow Web Frontend Roadmap

> **For agentic workers:** this is a roadmap, not a task-level plan. Each phase below becomes its own
> implementation plan (superpowers:writing-plans) before work on it starts, and is executed with
> superpowers:subagent-driven-development or superpowers:executing-plans. Phases are ordered by dependency.

**Goal:** a production-ready web UI for ApplyFlow that lets a student browse programs, apply, pay the
fee and follow the application until it is paid or declined, and that makes the backend's guarantees
(idempotent submit, asynchronous payment, retries, rate limits) visible instead of hiding them.

**Audience:** portfolio showcase. Real users are the demo accounts (`aziz`, `malika`); reviewers are
engineers and hiring managers reading the code and clicking through the demo.

**Architecture:** a static React SPA served by nginx. nginx proxies `/api/*` and `/auth/*` to the
gateway, so the browser talks to one origin: no CORS changes in the gateway, and the existing trust
boundary (gateway is the only entry point) stays intact.

**Tech stack:** React 19, TypeScript (strict), Vite, TanStack Router, TanStack Query, React Hook Form +
Zod, Tailwind CSS v4 with CSS-variable design tokens, Radix primitives for dialogs/selects/menus,
Sonner for toasts, i18next (en, ru), Vitest + Testing Library, MSW, Playwright + axe-core, Storybook.

**Out of scope:** sign-up and password reset (users live in gateway config), admin UI, real payment
SDK, SSR/SEO, native apps, locales other than en and ru.

## Global Constraints

- Code lives in `frontend/` at the repository root; it is not a Maven module.
- Node 24 LTS, pnpm; versions pinned in `package.json` and `.nvmrc`.
- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`; no `any` in `src/`.
- Every API response is parsed with a Zod schema at the API boundary; components never see raw JSON.
- Money is displayed with `Intl.NumberFormat(locale, { style: 'currency', currency })`; the UI never does
  arithmetic on fees.
- All user-facing strings go through i18next; no hard-coded copy in components. Locales: `en` (default), `ru`.
- WCAG 2.2 AA: contrast, focus visible, keyboard-complete flows, `prefers-reduced-motion` respected.
- Performance budget (CI-enforced): initial JS <= 170 KB gzip, LCP <= 2.5 s and INP <= 200 ms on
  Lighthouse mobile profile against the compose stack.
- The access token is never written to `localStorage` and never appears in URLs or logs.
- No new backend endpoints are required for phases 0-7. Any backend change is listed in "Backend touchpoints".

## Backend contract the UI relies on (read in code)

| Endpoint | Shape / behavior that drives the UI |
|---|---|
| `POST /auth/token` | `{accessToken, tokenType, expiresIn}`; TTL 1 h; no refresh token |
| `GET /api/programs[/{id}]` | `ProgramView{id, university, name, country, degree: BACHELOR\|MASTER\|PHD, applicationFee, currency, deadline}`; public |
| `POST /api/applications` | needs `Idempotency-Key` matching `[A-Za-z0-9-]{8,100}`; `201` new, `200` + `Idempotent-Replayed: true` replay, `409` same key in flight, `422` key reused with another body or deadline passed, `429` rate limit (1/s, burst 5), `400` validation |
| `GET /api/applications[/{id}]` | `ApplicationView{..., status: SUBMITTED\|PAID\|PAYMENT_FAILED, failureReason, createdAt, updatedAt}`; `404` for foreign ids |
| `GET /api/payments/{applicationId}` | `PaymentView{status: COMPLETED\|DECLINED, amount, providerReference, ...}`; `404` until processed |
| `GET /api/notifications/{applicationId}` | list of `{subject, body, sentAt, ...}` |
| Errors | RFC 9457 problem details (`title`, `status`, `detail`) from application-service; gateway `401`/`429` may have empty bodies |
| Payment tokens | `tok_visa` approves, `tok_declined` declines, `tok_unavailable` retries then dead-letters (status stays `SUBMITTED`) |

## Review Focus

Failure modes no happy-path test catches, most likely first. Each one has a test in the owning phase.

1. **Payment never resolves** (`tok_unavailable`, DLQ): status stays `SUBMITTED` forever. Expected: after
   60 s the tracker stops fast polling and shows "taking longer than usual" with a manual refresh, not an
   endless spinner. Owner: Phase 6.
2. **Double submit / retry after timeout**: second click or network retry must reuse the same
   `Idempotency-Key` and land on the same application; `200` replay is treated as success, `409` as
   "still processing" with backoff. Owner: Phase 5.
3. **Token expires mid-session** (1 h TTL, no refresh): any `401` on a protected call clears the session,
   keeps the form draft, and returns the user to the same page after login. Owner: Phase 3.
4. **Deadline passes between catalog view and submit**: `422` maps to a field-level "applications for this
   program are closed" message and the program card updates to closed. Owner: Phase 5.
5. **Rate limited** (`429`, possibly empty body): a clear "too many attempts, try again in a moment"
   message, submit button disabled for a short cooldown, no generic crash screen. Owner: Phase 5.

---

## Phase 0: Product and design foundation

**Skills:** `impeccable init` (PRODUCT.md), `impeccable shape` (flows), `design-taste-frontend`
(direction for the landing surface), `ecc:frontend-design-direction`.

**Deliverables:**
- `PRODUCT.md`: audience, jobs to be done, tone, what the demo must prove.
- Direction contract in `.impeccable/surfaces/frontend-src.md` (chosen world: passport and visa pages;
  signature move: entry stamps for application status).
- Surface mode: Operate for the whole app. No separate landing page; the catalog is the entry.
- Flow map and low-fidelity wireframes for every screen, mobile first, with empty, loading and error
  states: `docs/design/flows.md`.
- `DESIGN.md` is not written here. Impeccable writes it from the built world at the end of Phase 2,
  so the rulebook describes real tokens instead of predicting them.

**Done when:** PRODUCT.md, the direction contract and `docs/design/flows.md` exist, and every screen in
the flow map has its states named.

## Phase 1: Scaffold, tooling, CI

**Skills:** `ecc:vite-patterns`, `ecc:coding-standards`, `superpowers:test-driven-development`.

**Deliverables:**
- `frontend/` with Vite + React + TS, ESLint (typescript-eslint strict, jsx-a11y), Prettier, Vitest,
  Testing Library, MSW, Playwright, Storybook.
- `pnpm dev` proxies `/api` and `/auth` to `http://localhost:8080` (same-origin in dev too).
- CI job `frontend` in `.github/workflows/ci.yml`: install, typecheck, lint, unit tests, build,
  bundle-size check.

**Done when:** a placeholder route renders, all scripts pass locally and in CI.

## Phase 2: Design system

**Skills:** `ecc:design-system`, `impeccable extract`, `emil-design-eng`, `ecc:accessibility`,
`ecc:a11y-architect` (review).

**Deliverables:**
- Tokens as CSS variables generated from DESIGN.md (colour roles, type, spacing, radius, shadow, motion),
  light and dark.
- Components with stories and a11y tests: `Button`, `TextField`, `Select`, `Combobox` (country filter),
  `Card`, `StatusBadge`, `Money`, `RelativeTime`, `Dialog`, `Toast`, `Skeleton`, `EmptyState`,
  `ErrorState`, `Timeline`, `PageShell` (header, locale switch, account menu).
- `StatusBadge` maps each `ApplicationStatus` and `PaymentStatus` to colour, icon and label; colour is
  never the only signal.
- `Stamp`, the signature component from the direction contract: one shape and ink per status.
- `DESIGN.md` generated from the built tokens and components (`impeccable document`).

**Done when:** every component has a Storybook story, keyboard and screen-reader behavior is tested, and
axe reports no violations in Storybook's test runner.

## Phase 3: API layer and session (material: convene the verification court before implementing)

**Skills:** `ecc:frontend-patterns`, `ecc:security-review`, `ecc:error-handling`.

**Deliverables:**
- `src/api/client.ts`: fetch wrapper adding `Authorization`, `X-Correlation-Id` (UUID per request, shown
  in error details so a log `grep` finds it), JSON parsing, problem-details normalisation into a typed
  `ApiError{status, title, detail, correlationId}`.
- `src/api/schemas.ts`: Zod schemas for every view above; parse failures become `ApiError` with
  status `0` and are reported, not swallowed.
- Session: token kept in memory and mirrored to `sessionStorage` (survives reload, not new tabs, cleared
  on tab close); expiry tracked from `expiresIn`; `401` handler clears session and redirects to
  `/login?returnTo=...` with `returnTo` validated as a same-origin path.
- Route guards in TanStack Router; login page with demo-account hint.
- nginx config with CSP (`default-src 'self'`, no inline scripts), `X-Content-Type-Options`,
  `Referrer-Policy`, `frame-ancestors 'none'`.

**Decision to put before the court:** `sessionStorage` vs memory-only token. Memory-only is safer
against XSS persistence but logs the user out on every reload; httpOnly-cookie BFF would be best but
adds a server and is out of scope. Recommendation: `sessionStorage` + strict CSP.

**Done when:** unit tests cover problem-details parsing, empty `401`/`429` bodies, schema mismatch,
expiry, and open-redirect rejection in `returnTo` (Review Focus 3).

## Phase 4: Program catalog

**Skills:** `impeccable shape` (catalog), `ecc:react-patterns`, `break-ui`.

**Deliverables:**
- Catalog data: `scripts/catalog/build_seed.py` reads OpenML 43738 (Parquet) and Hipo
  `world_universities_and_domains.json`, keeps about 30 programs across 10+ countries whose university
  names match Hipo, assigns illustrative fees (25-120 in the local currency) and deadlines (some
  already passed, for the closed state), and writes Flyway migration `V3__expand_program_catalog.sql`.
  The script is committed and the downloads are not. Credits go in the README.
- `/programs`: list with filters (country, degree, open/closed) and text search, state in URL search
  params so filters are shareable; deadline shown as date plus "closes in N days"; closed programs
  visible but marked and not applicable.
- `/programs/$id`: details, fee, deadline, "Apply" CTA (to login if signed out).
- Loading skeletons, empty result, network error with retry.

**Done when:** MSW-backed tests cover filters, closed programs, empty and error states; `break-ui` worst-case
data (long university names, non-Latin text) renders without overflow.

## Phase 5: Apply and pay

**Skills:** `impeccable harden`, `impeccable clarify`, `ecc:react-testing`, `ecc:tdd-workflow`.

**Deliverables:**
- `/programs/$id/apply`: email (prefilled if known), demo payment method picker with three clearly
  labelled options mapped to `tok_visa`, `tok_declined`, `tok_unavailable`, fee summary, submit.
- Idempotency: key generated once per submission attempt (`crypto.randomUUID()`), stored with the draft
  in `sessionStorage`, reused on every retry of the same attempt, discarded after a final response or a
  body change.
- Response matrix: `201`/`200` -> tracker; `409` -> retry with backoff up to 3 times, then "still
  processing" link to the tracker; `422` deadline -> field error; `422` key reused -> new key, ask to
  resubmit; `429` -> cooldown message; `400` -> map `invalid-params` to fields; network error -> retry
  with the same key.
- Submit button disabled while in flight; double click sends one request.

**Done when:** tests pin Review Focus 2, 4 and 5: double click sends one request, a retried attempt
reuses the key, `200` replay navigates like `201`, `422` deadline shows the field error, `429` shows the
cooldown.

## Phase 6: Application tracker and history

**Skills:** `impeccable shape` (tracker), `animate`, `ecc:react-performance`.

**Deliverables:**
- `/applications`: list of the user's applications, newest first, with `StatusBadge`; empty state links
  to the catalog.
- `/applications/$id`: timeline (submitted -> payment -> notifications) built from application, payment
  and notification endpoints; payment `404` while `SUBMITTED` is "pending", not an error.
- Polling with TanStack Query: every 1.5 s while `SUBMITTED`, backing off to 10 s after 60 s with a
  "taking longer than usual" notice and manual refresh; stops on final status and when the tab is hidden.
- Status change announced via an `aria-live="polite"` region and a short, reduced-motion-aware transition.
- Foreign or unknown id (`404`) shows a not-found page, not a crash.

**Done when:** fake-timer tests cover poll -> PAID, poll -> PAYMENT_FAILED with `failureReason`, the 60 s
slow path (Review Focus 1), polling stop on final status, and the `404` page.

## Phase 7: Production hardening

**Skills:** `impeccable audit`, `impeccable polish`, `impeccable adapt`, `mobile-native`,
`ecc:accessibility`, `ecc:i18n-sync`, `improve-animations`, `ecc:browser-qa`.

**Deliverables:**
- i18n complete for `en` and `ru`, including plurals ("closes in N days"), dates and currency per locale;
  locale switch persisted in `localStorage` (a per-viewer preference, not state).
- Responsive pass at 360, 768, 1280 px; safe-area insets; inputs >= 16 px to avoid iOS zoom.
- Global error boundary, offline banner, 404 page, `<title>` per route, focus moved to the page heading
  on navigation.
- Lighthouse and axe in CI against `pnpm preview`; budgets from Global Constraints fail the build.
- `impeccable detect` over `frontend/src` with no unresolved findings.

**Done when:** audit report shows AA compliance, budgets pass, both locales have no missing keys
(`i18n-sync` check in CI).

## Phase 8: Delivery and end-to-end

**Skills:** `ecc:docker-patterns`, `ecc:kubernetes-patterns`, `ecc:e2e-testing`, `ecc:deployment-patterns`.

**Deliverables:**
- `frontend/Dockerfile`: multi-stage build, `nginxinc/nginx-unprivileged`, non-root, read-only root FS.
- `docker-compose.yml`: `web` service on `http://localhost:3000`, depends on gateway health.
- `k8s/services/web.yaml` + NetworkPolicy `web-from-anywhere` on port 8080 (the existing
  `gateway-from-anywhere` already admits nginx's proxied calls); probes, PDB, same security context as
  other services.
- Playwright suite against the compose stack mirroring `scripts/demo.sh`: login, apply with each payment
  token, replayed submit, foreign application `404`, rate limit, locale switch; runs in the existing
  end-to-end CI job.
- README section "Web UI" with screenshots and the run command.

**Done when:** `docker compose up -d --build --wait` then `pnpm -C frontend e2e` passes locally and in
CI, and kubeconform validates the new manifests.

---

## Backend touchpoints

Required: the Flyway seed migration `V3__expand_program_catalog.sql` (Phase 4). It adds data only and
does not change the schema.

Optional, each a separate change:

- Expose `X-RateLimit-Remaining` / `Retry-After` on `429` from the gateway so the cooldown is exact.
- Publish an OpenAPI document (springdoc) to generate the Zod schemas instead of writing them by hand.
- Return problem details from the gateway for `401` and `429`.

## Order and estimates (assumed, for one developer)

| Phase | Depends on | Estimate |
|---|---|---|
| 0 Foundation | - | 2-3 days |
| 1 Scaffold | 0 | 1 day |
| 2 Design system | 0, 1 | 4-5 days |
| 3 API and session | 1 | 2-3 days |
| 4 Catalog | 2, 3 | 2-3 days |
| 5 Apply | 4 | 3-4 days |
| 6 Tracker | 5 | 3 days |
| 7 Hardening | 4-6 | 3-4 days |
| 8 Delivery | 7 | 2-3 days |

Phases 2 and 3 can run in parallel once Phase 1 lands; everything after Phase 4 is sequential.
