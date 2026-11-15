# Phase 4: Program Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a catalog of about 30 programs built from public data, and the two screens that browse it:
`/programs` (search and filters in the URL) and `/programs/$id`.

**Architecture:** a committed Python script turns two public datasets into one data-only Flyway
migration, so the backend keeps owning the data and the frontend changes nothing about the API. The
frontend fetches the whole catalog once (the API has no filters; 30 rows) and filters in a pure
function, so filtering is instant and unit-testable.

**Tech Stack:** Python 3 standard library (no pandas/pyarrow), Flyway, TanStack Router search params,
TanStack Query `queryOptions`.

**Spec:** roadmap Phase 4, `PRODUCT.md` (Evidence on Hand), `docs/design/flows.md` sections 1-2.

## Backend facts this relies on (read in code)

- `programs(id VARCHAR(64) PK, university VARCHAR(200), name VARCHAR(200), country VARCHAR(80), degree
  VARCHAR(40), fee_amount NUMERIC(10,2) >= 0, currency VARCHAR(3), deadline DATE)`; no city column.
- `degree` is a Java enum `BACHELOR | MASTER | PHD` read with `@Enumerated(STRING)`; any other value
  breaks every catalog read.
- Open means `!today.isAfter(deadline)`: the deadline day itself is still open (`Program.java:45`).
- `GET /api/programs` returns all programs ordered by university, then name; cached in Redis 10 min.
- V1 creates the schema, V2 seeds 5 programs. Applications reference `programs(id)`.

## Decisions

1. **Data-only migration `V3__expand_program_catalog.sql`**, plain `INSERT`s with ids that cannot
   collide with V2 (checked by the script against V2's ids). No `UPDATE`/`DELETE`, no schema change. It
   is generated once and committed; it is never regenerated after it ships (Flyway checksums).
2. **Sources and what is taken from each.**
   - OpenML 43738 (ARFF, labelled CC0, scraped from mastersportal.eu in 2017): university name,
     country, program name. All master's programs, so `degree = 'MASTER'`. Its tuition and deadline
     columns are not used.
   - Hipo university-domains-list (MIT): a program is kept only if its university's normalised name
     matches a Hipo entry in the same country, which drops scraping noise.
   - Credits for both go in the README and the migration header.
3. **Selection (deterministic):** filter to names <= 200 chars with no control characters and no `${`
   (Flyway placeholder syntax), keeping accented Latin letters, then per country take
   up to 3 programs from different universities, ordering candidates by a SHA-256 of
   `university|program`; target 10-12 countries, 30 rows, including at least two names over 70 chars
   (layout stress) and at least one non-English program name if present.
4. **Illustrative values:** fee in the country's currency from a fixed table (EUR, GBP, USD, CHF, SEK,
   DKK, NOK, PLN, CAD, AUD, JPY, KRW), amount from the hash in a per-currency band (EUR 25-120 rounded
   to 5; JPY/KRW in their own scale, 0 decimals); deadlines from the hash between 2026-12-01 and
   2027-09-30, plus exactly 3 rows dated 2026-03..2026-10 so the closed state is visible. All of this is
   labelled illustrative in the migration header, `PRODUCT.md`, the footer credit, and next to the fee
   and deadline on the program page.
   Money is shown with `currencyDisplay: 'symbol'` so currencies that share a narrow symbol stay
   distinct (`$` vs `CA$` vs `A$`, `SEK` vs `DKK`). (Court finding: `narrowSymbol` showed USD, CAD and
   AUD all as `$`.)
5. **Ids:** `<university-slug>-<program-slug>` cut to 64 chars on a word boundary, ASCII lowercase,
   unique within V2+V3.
6. **Frontend filtering:** `filterPrograms(programs, { q, country, degree, open }, today)`; search is
   case- and accent-insensitive over university + program name (`Intl.Collator`-free:
   `normalize('NFD')` + strip combining marks + lower-case); results: open first by deadline, then
   closed by deadline descending. "Closed" means the deadline is before **today's UTC date**, because the
   backend checks `LocalDate.now(Clock.systemUTC())`. (Court finding: the browser's local calendar
   disagreed with the backend for up to 14 hours on the deadline day.) The deadline is labelled as
   "(UTC)" on the program page.
7. **URL state:** `/programs?q=&country=&degree=&open=1`, validated in `validateSearch`; unknown values
   are dropped, not errors. TanStack Router JSON-parses search values, so `open` accepts `1`, `true`,
   `'1'`, `'true'`, and `q` accepts numbers (converted to text).

## Global Constraints

- The migration must apply on a database where V1-V2 ran and on a fresh one.
- No fabricated facts presented as real: fees and deadlines are marked illustrative in the UI footer.
- The catalog page stays in the entry chunk; initial JS stays under 170 KB gzip.

## Review Focus

1. A deadline of today (UTC) shows as open ("closes today"), yesterday as closed, also when the
   browser runs in America/Los_Angeles or Asia/Tashkent.
2. Search for "munchen" finds "München" programs and "informatics" finds "Informatics"; leading and
   trailing spaces ignored.
3. A shared URL with `?degree=DIPLOMA&open=yes` opens the unfiltered catalog instead of an error.
4. Unknown program id: `/programs/nope` shows "This program does not exist" with a link back.
5. Worst-case names (over 150 chars, unbroken words) wrap at 360 px without horizontal scroll.

---

### Task 1: Seed script and migration

**Files:** `scripts/catalog/build_seed.py`, `scripts/catalog/README.md`,
`application-service/src/main/resources/db/migration/V3__expand_program_catalog.sql`,
`application-service/src/test/java/.../ApplicationServiceIntegrationTest.java` (new test).

- [ ] `python3 -I scripts/catalog/build_seed.py --openml <arff> --hipo <json> --out <sql>`; downloads are
  done by hand into an ignored folder, never by the script.
- [ ] Integration test `catalogContainsTheExpandedSeed`: `GET /api/programs` returns >= 30 programs, ids
  unique, every currency 3 letters, and the V2 program `tum-msc-informatics` still present.

### Task 2: Catalog data and filtering

**Files:** `src/features/programs/{api.ts,filter.ts,filter.test.ts,search.ts}`.

- [ ] `programsQuery()`, `programQuery(id)` as `queryOptions` over `apiFetch`.
- [ ] `filterPrograms` and `parseCatalogSearch` with tests for Review Focus 1-3.

### Task 3: Screens

**Files:** `src/features/programs/{CatalogPage.tsx,ProgramRow.tsx,ProgramPage.tsx,*.test.tsx,*.stories.tsx}`,
`src/app/router.tsx`, `src/locales/en.json`.

- [ ] Catalog: filters (search, country from data, degree, open only), count, rows, skeleton, empty,
  error with retry; filters update the URL with `replace`.
- [ ] Program page: details, fee, deadline, Apply link (to `/programs/$id/apply`, a protected
  placeholder until Phase 5), closed state, 404 state.
- [ ] Footer credit line for OpenML and Hipo, with "fees and deadlines are illustrative".
- [ ] Stories with worst-case data; axe in both themes; screenshots at 360 and 1280.

## Court verdict (2026-11-15)

C1, C4, C5 upheld. C2 (currency display) and C3 (deadline time zone) refuted with evidence; decisions 4
and 6 revised above before implementation. Also adopted: accented names allowed, `${` rejected, search
params parsed from numbers, illustrative label next to values. The catalog cache may hide new rows for
up to 10 minutes after rollout; accepted.

## Outcome (2026-11-15)

- V3 adds 32 programs from 11 countries (3 closed, 8 names of 70+ characters); `catalogContainsTheExpandedSeed`
  passes on real PostgreSQL via Testcontainers (Podman socket).
- Deviation: the OpenML ARFF download kept failing mid-transfer, so the script reads the Parquet copy
  with `pyarrow`, declared inline (PEP 723) and run by `uv` in an isolated environment.
- Found while testing: TanStack Router merges the raw parent search into a route's validated search, so
  dropped keys came back unvalidated (`degree=DIPLOMA` emptied the list). `parseCatalogSearch` now
  returns every key, invalid ones as `undefined`.
- Unit tests now run in America/Los_Angeles to catch local/UTC date mix-ups.
- Initial JS 137 KB of 170 KB.
- Not run: the full compose stack with the new migration (covered by the Testcontainers test).
