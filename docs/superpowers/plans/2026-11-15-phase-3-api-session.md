# Phase 3: API Layer and Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a typed, validated API client, a session that signs the student in and out safely, route
guards with a safe return path, the sign-in page, and the production security headers.

**Architecture:** `src/api/` owns HTTP: one `apiFetch` that adds headers, parses JSON with Zod and turns
every failure into an `ApiError`. `src/session/` owns the token: an in-memory store mirrored to
`sessionStorage`, readable through `useSession()`. TanStack Router routes check the session in
`beforeLoad`; TanStack Query's caches send any authenticated `401` to one handler that clears the
session and redirects to sign-in. Copy goes through i18next (English now; Russian in Phase 7).

**Tech Stack:** TanStack Router (code-based routes), TanStack Query, Zod, React Hook Form, i18next +
react-i18next, MSW for tests.

**Spec:** roadmap Phase 3 and Review Focus 3, `docs/design/flows.md` section 3, `PRODUCT.md`.

## Backend facts this relies on (read in code)

- `POST /auth/token` `{username, password}` -> `{accessToken, tokenType: "Bearer", expiresIn: 3600}`;
  wrong credentials -> `401` (`ResponseStatusException`, Spring default error body, not problem
  details). Blank fields -> `400`.
- Token is an HS256 JWT, 1 hour, no refresh token, validated by the gateway (issuer checked).
- Gateway accepts a client `X-Correlation-Id` matching `[A-Za-z0-9._-]{1,64}`, otherwise makes one, and
  echoes it on routed requests (`/api/**`). It is absent on `POST /auth/token` (local controller) and on
  `401`s raised by the Spring Security filter (expired or invalid token).
- Gateway `401`/`429` bodies may be empty. application-service errors are RFC 9457 problem details.
- No cookies are used anywhere; CSRF is disabled in the gateway for that reason.

## Decisions

1. **Token storage: memory + `sessionStorage`.** Survives a reload in the same tab, gone when the tab
   closes, not shared with new tabs. Never `localStorage`, never cookies, never in URLs or logs.
   Rejected: memory only (logs out on every reload, breaks the "draft survives re-login" flow);
   httpOnly cookie via a BFF (best XSS posture, but a new server and CSRF handling are out of scope for
   a demo). The XSS risk of a readable token is reduced by a strict CSP (decision 4) and by having no
   third-party scripts.
2. **Expiry:** `expiresAt = receivedAt + expiresIn * 1000 - 30 s` safety margin. An expired session is
   treated as signed out on read; a timer clears it at `expiresAt`. A `401` from any authenticated call
   clears it immediately (covers clock skew and secret rotation).
3. **Return path:** `returnTo` is accepted only if every check passes, otherwise `/programs`:
   the raw value is a string that starts with `/`, has no control characters or backslashes;
   `new URL(value, origin)` parses and its origin equals `origin`; then the **normalised** `pathname`
   (after dot-segment removal) starts with `/` but not `//`, and its percent-decoded form also does not
   start with `//` and contains no backslash. The value written back is `pathname + search + hash`.
   (Court finding: checking only the raw string let `/a/..//evil.example` normalise to `//evil.example`.)
4. **Security headers** (nginx in production, `vite preview` in e2e, from one source
   `frontend/security-headers.json`): `Content-Security-Policy: default-src 'self'; script-src 'self';
   style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none';
   base-uri 'self'; form-action 'self'; frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
5. **Correlation id:** `crypto.randomUUID()` per request in `X-Correlation-Id`; `ApiError.correlationId`
   takes the response header when present and the sent value otherwise (the header is missing on
   `/auth/token` and gateway-level `401`s).
7. **Stale 401s:** the `401` handler clears the session only if the request was sent with the token that
   is still current, so a late `401` from before a new sign-in cannot sign the student out.
6. **Retries:** queries retry network errors and `5xx` twice with backoff; never `4xx`. Mutations never
   retry automatically (submission retries are Phase 5's explicit, idempotent logic).

## Global Constraints

- No `any`; every response parsed by a Zod schema; schema failure is an `ApiError` with `kind: 'schema'`.
- Credentials are never logged, never put in URLs, never kept after the request.
- `returnTo` validation is a pure function with its own tests.

## Review Focus

1. Token expires mid-session: next protected call gets `401`, session cleared, user lands on
   `/login?returnTo=<the page>`, and after sign-in returns there.
2. Open redirect attempts: `//evil.example`, `/\evil.example`, `https://evil.example`,
   `javascript:alert(1)`, `/%2F%2Fevil.example`, `\t//evil`, `/a/..//evil.example`, `/.//evil.example`,
   `/x/%2e%2e//evil.example`, `/a/../\evil.example` all resolve to `/programs`.
3. Empty or HTML error bodies (`401`, `429`, `502` from a proxy) still produce a typed `ApiError`.
4. Two tabs: signing in in one tab does not sign in a fresh tab (sessionStorage is per tab; a duplicated
   tab gets a copy), and signing
   out in one does not break the other.
5. Wrong password shows a form-level message and keeps the username; the password field is cleared.

---

### Task 1: API client and errors

**Files:** `src/api/{errors.ts,client.ts,schemas.ts}`, tests next to each.

- [ ] `class ApiError extends Error { kind: 'http'|'network'|'schema'; status: number; title: string;
  detail?: string; correlationId?: string; invalidParams?: {name: string; reason: string}[] }`.
- [ ] `apiFetch<S extends z.ZodType>(path: string, opts: { method?, body?, schema: S, auth?: boolean,
  headers?, signal? }): Promise<{ data: z.infer<S>; headers: Headers; status: number }>`; `auth: true`
  without a session throws `ApiError{status: 401}` without sending.
- [ ] Schemas: `tokenResponse`, `program`, `application`, `payment`, `notification`, `problemDetail`.
- [ ] Tests: problem details mapped; empty `401`; HTML `502`; network failure; schema mismatch;
  correlation id taken from the response header, and the sent id when the header is absent.

### Task 2: Session and return path

**Files:** `src/session/{session.ts,useSession.ts,returnTo.ts}`, tests.

- [ ] `session.signIn(token: TokenResponse, now = Date.now())`, `session.signOut()`, `session.current()`,
  `session.subscribe(listener)`; key `applyflow.session` in `sessionStorage`; corrupt stored JSON is
  discarded.
- [ ] `safeReturnTo(value: unknown, origin: string): string` with the cases in Review Focus 2.

### Task 3: Router, query client, i18n

**Files:** `src/app/{router.tsx,queryClient.ts,i18n.ts,AppShell.tsx}`, `src/locales/en.json`, `src/main.tsx`.

- [ ] Routes: `/` -> redirect `/programs`; `/programs` placeholder; `/login`; `/applications`
  (protected placeholder); not-found page.
- [ ] Protected `beforeLoad`: no session -> redirect `/login?returnTo=<location.href path>`.
- [ ] Query/mutation cache `onError`: `ApiError` 401 on an authenticated request -> `signOut()` and
  redirect with `returnTo`.
- [ ] `AppShell` uses `PageShell`: wordmark, Programs, My applications (signed in), account Sign in /
  Sign out, footer notice.

### Task 4: Sign-in page

**Files:** `src/features/auth/{LoginPage.tsx,LoginPage.test.tsx}`.

- [ ] Fields username, password (show/hide), submit; `401` -> form-level alert, focus moved to it,
  password cleared; network error -> retry message; success -> `navigate(safeReturnTo(search.returnTo))`.
- [ ] Already signed in -> redirect immediately.

### Task 5: Security headers and e2e

**Files:** `frontend/security-headers.json`, `frontend/nginx/default.conf`, `vite.config.ts`,
`e2e/auth.spec.ts`, `src/test/securityHeaders.test.ts`.

- [ ] `vite preview` sends the headers; nginx conf has the same values (test compares them).
- [ ] E2E with route-mocked API: protected page redirects to login and back; CSP violations fail the
  test (listen for `securitypolicyviolation`).
- [ ] Manual run against the docker compose stack: sign in as `aziz`, reach `/applications`.

## Outcome (2026-11-15)

- Verification court: C2 (returnTo) refuted; dot segments normalised `/a/..//evil.example` into
  `//evil.example`. Decision 3 now re-checks the normalised, decoded path; every court case is a test.
  C4 corrected (no correlation-id echo on `/auth/token` and gateway-level 401s). C1, C3, C5, C6 upheld.
- `ApiError.invalidParams` dropped: the backend does not send field-level errors (Spring's default
  `ProblemDetail` for validation has only `detail`).
- Zod runs with `jitless: true`: its `new Function` probe produced CSP violation reports, caught by
  the e2e CSP check.
- Verified against the docker compose stack through `vite preview` (production build, CSP, proxy):
  real sign-in as `aziz`, wrong password, all real responses pass the schemas, tampered token gets
  `401`, no CSP violations, `localStorage` empty. Base images are now fully qualified
  (`docker.io/library/...`) so Podman can build them.
- Found on the real stack: routed responses carry `X-Correlation-Id` twice (gateway and service), so
  fetch reads "id, id". Fixed in the gateway (`UserContextFilter` sets the header at commit time; the
  integration test stub now echoes the id like the real services). The client still keeps the first
  value as a defence.
- Bundle: full Zod cost about 90 KB gzip; switched to `zod/mini` (6 KB). The sign-in route is lazy.
  Initial JS 122 KB of the 170 KB budget; size-limit now checks the entry chunk and all JS (250 KB).
