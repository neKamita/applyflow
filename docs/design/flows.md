# ApplyFlow web UI: flow map and wireframes

Low-fidelity, mobile first (360 px). Product truth lives in `PRODUCT.md`; the visual direction in
`.impeccable/surfaces/frontend-src.md`. Copy here is placeholder wording for structure, final copy is
written with the i18n keys in Phase 7.

## Flow map

```text
/programs ──► /programs/:id ──► (signed out) /login?returnTo=/programs/:id/apply
    ▲               │                              │
    │               └──────────(signed in)─────────┴──► /programs/:id/apply
    │                                                        │ submit (201 / 200 replay)
    │                                                        ▼
    └──── empty state ◄── /applications ◄──────────── /applications/:id  (tracker, polls)
```

- Header on every page: wordmark (to `/programs`), Programs, My applications (signed in), locale
  switch EN/RU, account menu (Sign in / Sign out).
- Any `401` on a protected page: session cleared, draft kept, redirect to `/login?returnTo=<path>`.
- Unknown route: 404 page with a link to `/programs`.
- Footer on every page: "Demo project. Not affiliated with the listed universities. Payments are
  simulated." plus data credits (OpenML, Hipo).

## 1. Catalog `/programs`

```text
┌──────────────────────────────────────┐
│ ApplyFlow        Programs  EN|RU  ☰  │  cover-ink bar, guilloche band
├──────────────────────────────────────┤
│ Find a program                       │
│ [ Search university or program    ]  │
│ [Country ▾] [Degree ▾] [x] Open only │
│ 28 programs                          │
├──────────────────────────────────────┤
│ Technical University of Munich       │
│ MSc Informatics                      │
│ Germany · Master                     │
│ Fee €75.00   Closes 31 May 2027      │
│              in 197 days   [Apply]   │
├──────────────────────────────────────┤
│ Politecnico di Milano     [Closed]   │  muted row, no Apply
│ ...                                  │
└──────────────────────────────────────┘
```

Wide screens (>= 1024 px): filters in a left column, rows become a table with sortable Deadline and Fee.

States:
- Loading: 6 skeleton rows, filter row usable.
- Empty filter result: "No programs match these filters" + "Clear filters".
- Error (network or 5xx): "Could not load programs" + Retry; filters kept.
- Filters live in the URL (`?q=&country=&degree=&open=1`).

## 2. Program `/programs/:id`

```text
│ ← All programs                       │
│ MSc Informatics                      │
│ Technical University of Munich       │
│ Munich, Germany · Master             │
│ ┌──────────────────────────────────┐ │
│ │ Application fee   €75.00         │ │
│ │ Deadline          31 May 2027    │ │
│ │                   in 197 days    │ │
│ └──────────────────────────────────┘ │
│ [ Apply for this program ]           │
│ You pay the fee when you submit.     │
```

States: loading skeleton; 404 "This program does not exist" + link to catalog; closed: button replaced
by "Applications closed on <date>".

## 3. Sign in `/login`

```text
│ Sign in to apply                     │
│ Username  [              ]           │
│ Password  [              ] (show)    │
│ [ Sign in ]                          │
│ Demo accounts: aziz, malika          │
│ (passwords in the project README)    │
```

States: wrong credentials (inline, form-level, focus moves to message); network error with retry; already signed in -> redirect to `returnTo` or catalog.
`returnTo` accepts only same-origin paths.

## 4. Apply `/programs/:id/apply`

```text
│ ← MSc Informatics                    │
│ Apply                                │
│ Email for updates                    │
│ [ aziz@example.com            ]      │
│ Demo payment method                  │
│ (•) Approved card     ( ) Declined   │
│ ( ) Provider unavailable             │
│ These are simulated; no money moves. │
│ ┌──────────────────────────────────┐ │
│ │ Application fee        €75.00    │ │
│ └──────────────────────────────────┘ │
│ [ Submit and pay €75.00 ]            │
```

States:
- Submitting: button shows progress, disabled; one request per attempt.
- `201` / `200` replay: go to tracker (replay is not shown as an error).
- `409` in flight: retried with the same key; after 3 tries, "Your application is still being
  processed" + link to My applications.
- `422` deadline: field-level "Applications for this program closed on <date>"; submit disabled.
- `429`: "Too many attempts. Wait a moment and try again." Cooldown on the button.
- `400`: field messages mapped from problem details.
- Network error: "Connection lost. Retry is safe, you will not be charged twice." + Retry (same key).
- Draft (email, method, key) survives reload and re-login in `sessionStorage`.

## 5. Tracker `/applications/:id`

```text
│ ← My applications                    │
│ MSc Informatics                      │
│ Technical University of Munich       │
│ Reference  55740D4E                  │  mono
│ ┌──────────────────────────────────┐ │
│ │        ┌──────────────┐          │ │  stamp area
│ │        │ PAID         │          │ │  green rectangle stamp
│ │        │ 15 NOV 2026  │          │ │
│ │        └──────────────┘          │ │
│ └──────────────────────────────────┘ │
│ Timeline                             │
│ ● Submitted        15 Nov, 14:02     │
│ ● Fee paid €75.00  15 Nov, 14:02     │
│   Receipt  PRV-8F21                  │
│ ● Email sent: "Application fee paid" │
```

States:
- `SUBMITTED`: dashed violet circle "Awaiting payment confirmation"; polling every 1.5 s;
  `aria-live` announces the change.
- After 60 s still `SUBMITTED`: "This is taking longer than usual. Your application is saved; we will
  update this page." + Refresh; polling slows to 10 s.
- `PAID`: green stamp lands (reduced motion: appears without movement), polling stops.
- `PAYMENT_FAILED`: notched vermilion stamp, `failureReason` below, "Apply again" (new attempt, new key).
- Payment `404` while submitted: shown as pending, not as an error.
- `404` application: "We could not find this application" + link to My applications.

## 6. My applications `/applications`

```text
│ My applications                      │
│ ┌──────────────────────────────────┐ │
│ │ MSc Informatics · TUM            │ │
│ │ ▭ Paid · 15 Nov 2026     €75.00  │ │  stamp shape as icon
│ ├──────────────────────────────────┤ │
│ │ MSc AI · KAIST                   │ │
│ │ ◌ Awaiting payment · 2 min ago   │ │
│ └──────────────────────────────────┘ │
```

States: loading skeleton; empty "You have not applied yet" + "Browse programs"; error + Retry. Rows
with `SUBMITTED` refresh while the page is visible.
