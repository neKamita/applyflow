# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + TypeScript + Vite single-page app in `frontend/`, served by nginx that proxies `/api` and
`/auth` to the gateway. Chosen by the user; details in
`docs/superpowers/plans/2026-11-15-frontend-roadmap.md`.

## Users

A student applying to a university program abroad. They browse programs, pick one, pay a small
application fee, and then wait, often anxiously, to learn whether the payment went through and the
application was received. They may be on a phone with an unreliable connection.

The demo is shown to engineers and hiring managers as a portfolio piece, but the interface is written
for the student only. It contains no engineering panels, event logs or system internals; the
engineering story stays in the README.

## Product Purpose

Let a student go from "which program?" to "my application is in and paid" in one short, calm flow, and
always know the current state of every application they submitted.

Success: the student never wonders whether they were charged twice, whether the submission went through,
or what to do next.

## Positioning

The status the student sees is the system's real state, not an optimistic guess. The UI waits for the
asynchronous payment result and says so honestly: "processing", "paid", or "declined, here is why".
A repeated tap on Submit never creates a second application or a second charge.

## Operating Context

- Sign-in with a username and password; demo accounts are `aziz` and `malika`. No sign-up.
- Program catalog is public; applying and tracking need sign-in.
- Payment is simulated. The apply form offers three demo payment methods: approved, declined, and
  provider unavailable. They must be labelled as demo payment methods, never as real cards.
- Payment outcome arrives seconds after submit; in the provider-unavailable case it may never arrive.
- Interface languages: English (default) and Russian.

## Capabilities and Constraints

- Browse programs: university, program name, country, degree (Bachelor, Master, PhD), application fee
  with currency, deadline.
- Apply to an open program with an email address and a demo payment method.
- Track applications: Submitted, Paid, Payment failed (with reason); payment receipt; notifications sent
  to the student.
- Closed programs (deadline passed) are visible but cannot be applied to.
- Session lasts one hour; there is no refresh.
- Catalog data (decided 2026-11-15): expand the seed with a new migration built from two public
  datasets, see Evidence on Hand. Application fees and deadlines remain illustrative demo values.

## Brand Commitments

- Name: ApplyFlow. No existing logo, palette or typeface; the visual identity is delegated and will be
  created in DESIGN.md.
- Voice: calm, plain and precise. The student is spending money and waiting on an outcome, so copy
  states facts and next steps, avoids hype, and never blames the user.

## Evidence on Hand

- Program seed: `application-service/src/main/resources/db/migration/V2__seed_programs.sql`, five
  programs at real universities with illustrative fees and deadlines.
- Catalog migration `application-service/src/main/resources/db/migration/V3__expand_program_catalog.sql`,
  built by `scripts/catalog/build_seed.py` (32 programs, 11 countries).
- OpenML dataset 43738 "Masters-Degrees--Programs-(mastersportal.eu)": 60442 master's programs,
  labelled CC0 by the uploader, scraped from mastersportal.eu around 2017. Usable for university,
  country, city and program names. Its tuition is tuition, not an application fee, and its deadlines
  are years out of date, so neither is shown as fact. Provenance is a scrape, so only a curated subset
  of names is used and the source is credited.
- Hipo university-domains-list (MIT): university names, countries and web domains, used to check
  university names and countries. Credited in the README.
- No testimonials, customer logos, statistics, partner universities or press exist. Do not invent any.
  University logos must not be used. The UI must state that this is a demo with no affiliation to the
  listed universities.

## Product Principles

1. Show the true state. Never display "Paid" before the payment service confirms it.
2. One action, one result. Retries and double taps are safe and the UI makes that visible by landing on
   the same application.
3. Always a next step. Every state, including errors and slow payments, tells the student what happens
   now and what they can do.
4. Calm under waiting. Pending states are informative, not alarming, and never an endless spinner.
5. Honest demo. Simulated parts are labelled as simulated.

## Accessibility & Inclusion

WCAG 2.2 AA. Status is never conveyed by colour alone. Status changes are announced to screen readers.
Full keyboard operation. Reduced-motion preference respected. Usable at 360 px width.
