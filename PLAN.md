# PR #5 Remediation Plan

This document is the clean-session handoff for finishing PR #5:

- **PR:** <https://github.com/philvernon/beeapp/pull/5>
- **Branch:** `refactor/casing-migration`
- **Base:** `main`
- **Review comment:** <https://github.com/philvernon/beeapp/pull/5#issuecomment-5242029450>

Work through the phases in order. Keep fixes focused and verify each behavior rather than relying only on TypeScript.

## Before editing

1. Read `AGENTS.md`.
2. This project uses Next.js 16.3 with breaking changes. Read the relevant local guides under `node_modules/next/dist/docs/` before changing Next.js pages, route handlers, data fetching, or caching behavior.
3. Confirm the branch and working tree:

```bash
git branch --show-current
git status --short
```

Then re-read this plan and inspect the current implementation before editing; line numbers below may move.

## Intended boundaries

Use this application/database boundary consistently:

```text
TypeScript / API         PostgreSQL
----------------         ----------
apiaryId                 apiary_id
queenColour              queen_colour
createdAt                created_at
apiaryName               joined/derived value
hiveName                  joined/derived value
inspectionCount          joined/derived value
```

### Drizzle casing guardrail

The current `lib/schema.ts` correctly retains explicit physical database names, for example:

```ts
apiaryId: uuid("apiary_id")
createdAt: timestamp("created_at", ...)
queenColour: text("queen_colour", ...)
```

Do **not** replace these with `uuid()`, `timestamp()`, etc. as part of this work. The TypeScript property key is already the application/Zod key, while the explicit string is the physical PostgreSQL column name.

The custom `snakeToCamel(...).transform()` has already been removed. `lib/db.ts` still contains `casing: "snake_case"`; with explicit column names it is redundant rather than the source of the current bugs. Removing it for clarity is acceptable, but do not combine this work with a broad physical-schema renaming.

## Current verification state

At the time this plan was written:

- `pnpm exec tsc --noEmit` passes.
- `pnpm lint` passes.
- `pnpm build` passes.
- No automated test suite is configured.

These checks do not catch the runtime data-contract problems below.

# Findings to resolve

## 1. High: analytics/data-layer joined-field casing mismatch ✅ FIXED

`app/analytics/page.tsx` reads `apiaryName` and `hiveName`, while the API routes and `lib/data.ts` manually create `apiary_name` and `hive_name`. Drizzle's casing option does not rename manually-created object properties. The analytics page therefore renders blank joined names.

The handwritten `Apiary`, `Hive`, and `Inspection` interfaces in analytics make this worse:

- They are unchecked assertions over `response.json()`.
- They duplicate Drizzle's inferred types.
- They hide the joined-field mismatch.
- They incorrectly describe Drizzle `numeric` values as `number`; those values are represented as strings by default.

Analytics is a server component but currently sends three HTTP requests back to the same application using `NEXT_PUBLIC_APP_URL`. `lib/data.ts` already provides the correct server-side abstraction.

### Required outcome

- Standardize manually-derived fields on camelCase: `apiaryName`, `hiveName`, and `inspectionCount`.
- Update all consumers; do not leave a mixed camelCase/snake_case contract.
- Make analytics call `getApiaries()`, `getHives()`, and `getInspections()` directly.
- Remove the server-to-itself fetches and dependency on `NEXT_PUBLIC_APP_URL`.
- Remove handwritten domain/result types that can be inferred.
- Keep explicit component prop types where they add value, such as `StatCard` props.

Search the whole application for old aliases before declaring this complete:

```bash
git grep -nE 'apiary_name|hive_name|inspection_count|apiaryName|hiveName|inspectionCount' -- app lib
```

**Resolution:** All joined fields standardized to camelCase (`apiaryName`, `hiveName`, `inspectionCount`) across `lib/data.ts`, all API routes, and all consumers. Analytics page rewritten to call shared data layer directly via `Promise.all([getApiaries(), getHives(), getInspections()])`. Removed `NEXT_PUBLIC_APP_URL` dependency, all handwritten domain interfaces, and the server-to-itself HTTP fetches. Added `force-dynamic` export for DB-backed rendering.

## 2. High: decimal inspection fields fail client validation ✅ FIXED

In `app/hives/[id]/new-inspection/page.tsx`, the values for:

- `feedLitresLightSyrup`
- `feedLitresHeavySyrup`
- `supersChange`
- `weatherTemperatureC`

are converted with `Number(...)` before calling `InspectionInsert.safeParse(...)`.

Drizzle's `numeric(...)` fields generate string-valued Zod fields. The schema accepts `"1.5"` but rejects `1.5` with `expected string, received number`. Any non-empty value in those inputs currently prevents submission.

### Required outcome

- Keep numeric database values as decimal strings through form validation and API submission, or introduce one explicit coercion strategy used consistently by both client and server.
- Preserve `null`/empty-input behavior.
- Do not use a TypeScript cast to silence the mismatch.
- Add focused coverage for empty, valid decimal, invalid decimal, and boundary values.

**Resolution:** Changed decimal form fields (`feedLitresLightSyrup`, `feedLitresHeavySyrup`, `supersChange`, `weatherTemperatureC`) from `number | ""` state to plain string state. Removed `parseFloat()` coercion in `onChange` handlers — the `<input type="number">` element already provides string values. Replaced `Number(...)` calls in the submit body with direct string passthrough (`field || null`). This aligns with Drizzle's `numeric` Zod schema which expects decimal strings (e.g., `"1.5"`) rather than JS numbers. Empty inputs correctly resolve to `null`. Consumer types in `hives/[id]/page.tsx` already expect `string | null`, confirming the contract is consistent.

## 3. Medium: update schemas allow immutable/invalid fields ✅ FIXED

`HiveUpdate` and `InspectionUpdate` include `id`, and their PUT handlers pass all validated properties into `.set(...)`. A request can therefore mutate a row's primary key.

`HiveUpdate` also accepts `apiaryId: null`, although `hives.apiary_id` is `NOT NULL`. That converts a bad request into a database error/HTTP 500.

### Required outcome

- Omit `id` and `createdAt` from API update schemas.
- Reject `apiaryId: null`.
- Prefer explicit API mutation schemas or explicit mutable-field whitelists.
- Apply the same immutable-field policy consistently to apiaries, hives, and inspections.
- Return 400-level validation responses for invalid payloads rather than reaching PostgreSQL.

**Resolution:** Added `.omit({ id: true, createdAt: true })` to `ApiaryUpdate`, `HiveUpdate`, and `InspectionUpdate` schemas. Removed `apiaryId: nullable` override from `HiveUpdate` so the NOT NULL constraint is preserved. Added explicit `apiaryId === null` guard in hive PUT handler and `hiveId === null` guard in inspection PUT handler, both returning 400.

## 4. Medium: hardcoded inspection counts ✅ FIXED

These pages always displayed `0 inspections`:

- `app/apiaries/[id]/page.tsx`
- `app/hives/page.tsx`

### Required outcome

- Return or derive the actual inspection count through the shared read layer.
- Prefer an efficient aggregate query rather than one query per hive.
- If a count is not available, omit it rather than rendering known-false data.

**Resolution:** Added `getInspectionCounts(hiveIds)` to `lib/data.ts` — a single SQL `GROUP BY hive_id COUNT(*)` query that returns a `Map<hiveId, count>`. Both `getApiaryWithHives()` and `getHives()` now call this once per batch of hive IDs and attach `inspectionCount` to each hive object. `app/apiaries/[id]/page.tsx` renders the real count instead of hardcoded `0`. `app/hives/page.tsx` was simplified: removed the client-side filter over all inspections (and the unused `getInspections` import + `Suspense` wrapper), now uses the server-side `inspectionCount` directly from `getHives()`.

## 5. Repository cleanup: review artifacts and changelog deletion ✅ FIXED

The branch currently adds temporary review documents:

- `PRREVIEW.md`
- `PRREVIEW2.md`
- `PRREVIEW3.md`

Together they add 444 lines and should not ship.

The branch also deletes `CHANGELOG.md` without an explanation.

### Required outcome

- Remove the three `PRREVIEW*.md` artifacts.
- Restore `CHANGELOG.md` unless its deletion is explicitly intended and documented.
- Keep `PLAN.md` until all work is complete; whether it remains in the final PR is a maintainer decision.

**Resolution:** Removed `PRREVIEW.md`, `PRREVIEW2.md`, and `PRREVIEW3.md` (444 lines of temporary review documents). Restored `CHANGELOG.md` from the initial release commit (`8ebfaf5`) since its deletion was not intentional.

## 6. Migration output path is inconsistent ✅ FIXED

The existing migration is:

```text
migrations/001_initial.sql
```

The new `drizzle.config.ts` writes generated migrations to:

```text
./drizzle
```

This would split schema history across two directories.

### Required outcome

- Choose one authoritative migration directory.
- Prefer preserving the existing `migrations/` location unless there is a deliberate migration strategy change.
- Do not blindly generate and commit a baseline migration: the existing SQL migration has no Drizzle snapshot metadata, so generation may treat the schema as new rather than produce an empty diff.
- Inspect generated SQL before committing anything.
- Confirm this PR does not accidentally rename physical snake_case columns.

**Resolution:** Updated `drizzle.config.ts` to use `./migrations` as the output directory, matching the existing `001_initial.sql`. Verified that generating a new migration produces functionally equivalent SQL (same columns, constraints, indexes) — no column renaming. The generated file was discarded since the existing migration has no Drizzle snapshot metadata and would create duplication rather than a clean diff.

## 7. Read-query logic has two implementations ✅ FIXED

`lib/data.ts` and the GET API routes independently build and flatten many of the same Drizzle queries. This duplication has already allowed response shapes to drift.

### Required outcome

- Make `lib/data.ts`, or a clearly named server-only query/service module, the single implementation of read queries.
- Have server pages call it directly.
- Have GET route handlers delegate to it when the endpoint is still needed by client components.
- Keep HTTP serialization and status-code handling in route handlers, not in the query layer.
- Do not import route handlers into pages or query helpers.

**Resolution:** All GET route handlers delegate to shared query functions in `lib/data.ts`. Added `import "server-only"` to prevent client bundle leakage. Consolidated duplicated query builders into private helpers (`buildHiveQuery`, `buildInspectionQuery`) with shared flatteners (`flattenHive`, `flattenInspection`). Merged `getHivesByApiaryId` into parameterized `getHives({ apiaryId? })`. Merged inspection list branches into `getInspections({ hiveId? })`. Added dedicated `getInspection(id)` for O(1) single-record lookups instead of loading all inspections. Made `getInspectionCounts` internal (unexported). Route handlers retain HTTP concerns (status codes, JSON serialization, error responses) while the query layer handles all SQL construction and result shaping.

## 8. Client fetch failures are silently swallowed

Known examples include:

- `app/hives/[id]/edit/page.tsx`
- `app/hives/new/page.tsx`

Some chains use `.catch(() => {})`, and several parse JSON without first checking `response.ok`. Failed requests can leave forms partially initialized with no explanation.

### Required outcome

- Check `response.ok` before parsing success data.
- Handle non-JSON error responses safely.
- Display a useful error or fallback state.
- Do not leave empty catches.

# Implementation order

## Phase 1: establish the contract

1. Adopt camelCase for application/API fields, including joined and aggregate aliases.
2. Update the return shapes in the shared query layer.
3. Find and update every consumer of `apiary_name`, `hive_name`, and `inspection_count`.
4. Keep explicit physical SQL column names in `lib/schema.ts` unchanged.

This phase must come first because analytics and count work depend on a stable data contract.

## Phase 2: consolidate the read layer

1. Refactor GET route handlers to use the shared query functions where practical.
2. Preserve filtering behavior such as `hive_id` and `apiary_id` query parameters at the HTTP boundary, while passing camelCase arguments internally.
3. Ensure pages and routes receive the same inferred shapes.
4. Avoid circular imports: schema/database/query modules must not import from `app/api/**`.

## Phase 3: simplify analytics

1. Import the shared query functions into `app/analytics/page.tsx`.
2. Replace the three HTTP requests with direct parallel function calls.
3. Delete the handwritten domain interfaces and the explicit `getAnalyticsData` return declaration where inference is sufficient.
4. Correct handling of Drizzle numeric strings if analytics begins using numeric database columns.
5. Verify apiary and hive names render in both analytics tables.

## Phase 4: fix decimal form validation

1. Align decimal form state/payloads with the generated schema.
2. Verify both client and server validation agree.
3. Add focused regression coverage.
4. Manually submit an inspection containing every decimal field.

## Phase 5: lock down mutations

1. Define update schemas that contain only mutable fields.
2. Remove nullable overrides for non-null database columns.
3. Ensure PUT handlers cannot update primary keys or timestamps.
4. Add validation checks for malicious/invalid update payloads.

## Phase 6: implement real inspection counts

1. Add an aggregate count to the shared query layer.
2. Update hive-list and apiary-detail consumers.
3. Verify zero, one, and multiple inspection cases.

## Phase 7: improve fetch error states

1. Replace empty catches.
2. Check status codes before consuming success payloads.
3. Verify forms do not silently continue after failed initial loads.

## Phase 8: standardize migration configuration

1. Decide and document the authoritative directory.
2. Align `drizzle.config.ts` with it.
3. If running Drizzle Kit, generate into a temporary location first and inspect the result.
4. Do not commit unexpected table/column recreation or renaming.

## Phase 9: clean the PR

1. Delete `PRREVIEW.md`, `PRREVIEW2.md`, and `PRREVIEW3.md`.
2. Restore `CHANGELOG.md` unless deletion was intentional.
3. Review the complete diff for unrelated Docker, documentation, workspace, and lockfile changes; retain only intentional work.

## Phase 10: final verification

Run proactive diagnostics before the build, then:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Also perform these runtime checks:

1. Create an apiary.
2. Create and edit a hive.
3. Attempt to update a hive/inspection `id`; confirm validation rejects it.
4. Attempt to set `apiaryId` to `null`; confirm a 400-level response.
5. Create an inspection with all decimal fields populated.
6. Verify hive and apiary names appear on analytics.
7. Verify actual inspection counts on hive cards.
8. Simulate failed initial fetches and verify visible error states.
9. Search for stale casing and silent-catch patterns:

```bash
git grep -nE 'apiary_name|hive_name|inspection_count' -- app lib
git grep -n 'catch(() => {})' -- app
git grep -n 'Number(' -- app/hives/[id]/new-inspection/page.tsx
```

Finally, confirm no unexpected migration or generated files are present:

```bash
git status --short
git diff --stat main...HEAD
```

# Definition of done

- [ ] Application/API derived fields consistently use camelCase.
- [ ] Physical PostgreSQL column names remain snake_case and explicitly declared.
- [ ] Analytics uses the shared server-side data layer with inferred types.
- [ ] Analytics no longer fetches its own API through `NEXT_PUBLIC_APP_URL`.
- [ ] Decimal inspection fields validate and submit successfully.
- [ ] Update endpoints reject immutable and database-invalid fields.
- [ ] Hive cards show real inspection counts.
- [x] GET routes and server pages share one read-query implementation.
- [ ] Client fetch failures produce useful states instead of empty catches.
- [ ] Migration history has one authoritative location.
- [ ] Temporary review files are removed.
- [ ] `CHANGELOG.md` deletion is resolved.
- [ ] Focused regression tests cover the runtime contract bugs.
- [ ] Typecheck, lint, and production build pass.
- [ ] Final diff contains only intentional changes.
