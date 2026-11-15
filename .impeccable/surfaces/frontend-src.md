---
version: 1
slug: "frontend-src"
primary_target: "frontend/src"
related_targets: []
---

# Surface: ApplyFlow web app (frontend/src)

Scope: the whole student app: catalog, program, sign-in, apply, applications list, application tracker.
Mode: Operate. Build path: code-led (working screens).

Audience and job: a student applying abroad, often on a phone, who pays a fee and wants certainty
about the outcome. Task frequency: a few visits per application; the tracker is reopened while waiting.

Constraints: PRODUCT.md principles; en and ru (Cyrillic coverage required for every face); WCAG 2.2 AA;
standard web controls only.

## Direction contract

THESIS: an application is a document that collects verified marks, like a passport collects entry
stamps. The UI shows a mark only when the backend has confirmed it. Refuses the category default of a
grey SaaS dashboard with a green "success" pill and a progress bar.

OWN-WORLD: shell in passport-cover ink (deep blue-green field) with a fine generated guilloche band;
work areas on cool security-paper tint, never cream; status carried by stamp inks: violet (submitted,
pending), deep green (paid), vermilion (payment failed); each stamp has its own shape (dashed circle,
solid rectangle, notched rectangle) so colour is never the only signal. Golos Text for UI, PT Mono for
reference numbers and dates on stamps.

STORY: the student finds a program, applies once, and watches their application page receive its
stamps; they trust what they see because nothing is stamped early.

FIRST VIEWPORT: catalog. Cover-ink top bar (wordmark, Programs, My applications, locale, account).
Filter row (search, country, degree, open only) above a dense list of program rows: university,
program, country, degree, fee, deadline with "closes in N days"; closed rows muted with a "Closed"
mark. Primary action "Apply" on each open row and on the program page. Tracker: a document page
whose stamp area receives the payment stamp when it lands.

FORM: passport and visa pages; grounded list position 1 (pick card, chosen over assigned 6, campus
wayfinding). seed:80993265006e6405

FINISH: unreviewed and undocumented is unfinished; DESIGN.md is written from the built world after
Phase 2, and the build is reviewed against this contract.

## Signature move

The entry stamp: when the tracker sees PAID, a rectangular green stamp with the payment date and
program code lands on the application document (short press-in scale, 180 ms; reduced motion: appears
without movement). PAYMENT_FAILED lands a notched vermilion stamp with the reason beneath. SUBMITTED
shows a dashed violet circle "Awaiting payment confirmation".

## Unresolved

- Exact token values and dark theme mapping: decided during Phase 2 build, then documented.
- Guilloche generation (static SVG vs. canvas): Phase 2.
