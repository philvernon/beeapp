## Post-PR follow-ups

The remaining items are non-blocking follow-ups and should not delay PR #5. Larger migration and HTTP-contract work is also tracked in GitHub issues #6 and #7.

### 3. Validate numeric inputs at the API boundary

The decimal form mismatch is fixed: the form now correctly submits Drizzle `numeric(...)` values as strings. However, the generated inspection schemas do not enforce all of the application's numeric rules:

- Decimal fields are only checked as strings, without validating syntax, range, precision, or scale.
- Count/frame fields do not reject negative integers.
- `temperamentScore` does not enforce the intended `1–10` range.
- Client handlers still use `parseInt(...)`; browser input constraints are not a substitute for API validation.

Direct API requests currently pass validation with values such as:

- `""`
- `"abc"`
- `"-1"`
- `"999.999"`
- `"1000"`
- `"1e3"`

Browser number-input constraints prevent some of these through the normal form, but callers can bypass the browser and cause invalid values to reach PostgreSQL.

#### Required fix

Add explicit API/schema validation for:

- Valid decimal-string syntax
- PostgreSQL precision and scale limits
- Empty values normalized to `null` or rejected consistently
- Non-negative queen-cell, frame, and varroa counts
- `temperamentScore` values from 1 through 10
- Any field-specific negative ranges that are intentionally allowed, such as weather temperature or `supersChange`

Keep valid decimal values as strings rather than converting them to JavaScript numbers. Invalid requests should return a 400 validation response instead of becoming database errors.

#### Acceptance criteria

- Valid decimal strings and `null` are accepted.
- Empty and non-numeric strings are handled consistently.
- Negative counts, invalid temperament scores, out-of-range decimals, and excess precision are rejected before querying PostgreSQL.
- Direct API requests cannot bypass validation enforced by the form.
- Client parsing cannot silently turn malformed or unsafe integer input into a different submitted value.
- Typecheck, lint, and build pass.

### 4. Remove redundant null guards from update routes

`HiveUpdate` already rejects `apiaryId: null`, and `InspectionUpdate` already rejects `hiveId: null` because those fields map to `NOT NULL` columns. The explicit checks later in the PUT handlers are therefore unreachable after successful schema validation:

```ts
if (updates.apiaryId === null) { /* ... */ }
if (updates.hiveId === null) { /* ... */ }
```

#### Required fix

Remove the redundant route-level guards and keep nullability enforcement in the update schemas as the single source of truth.

#### Acceptance criteria

- `apiaryId: null` and `hiveId: null` still return 400 validation responses.
- The invalid values never reach PostgreSQL.
- No duplicate nullability checks remain after schema validation.
- Typecheck, lint, and build pass.

### 5. Strictly reject immutable and unknown update fields

The update schemas omit `id` and `createdAt`, which prevents those fields from reaching the database. However, Zod strips omitted/unknown keys by default. A payload such as:

```json
{ "id": "<another UUID>", "name": "Updated hive" }
```

currently succeeds by silently ignoring `id` and applying `name`. This is secure against primary-key mutation, but it can hide client bugs and make callers believe the entire payload was accepted.

#### Required fix

Make API update validation strict so immutable and unknown fields return a 400 response rather than being silently discarded. Keep `id` and `createdAt` omitted from the mutable schema.

If shared client-side schemas should remain permissive, define strict API-specific update schemas rather than changing unrelated consumers.

#### Acceptance criteria

- Payloads containing `id` or `createdAt` return 400, even when valid mutable fields are also present.
- Other unknown fields return 400 with useful validation details.
- Valid partial updates continue to succeed.
- Immutable fields never reach `.set(...)`.
- Typecheck, lint, and build pass.

### 6. Avoid redundant inspection-count queries

`getHives()` and `getHive()` now fetch inspection counts unconditionally. This is correct for consumers that display the count, but it creates redundant database work for consumers that already load inspections:

- Analytics calls `getHives()` and `getInspections()`, then computes its own per-hive counts.
- The hive-detail page calls `getHive()` alongside `getInspections(hiveId)` and does not use `hive.inspectionCount`.

The aggregate query is batched rather than N+1, so this is a performance/API-shaping issue rather than a correctness bug.

#### Required fix

During data-layer consolidation, avoid loading counts for consumers that do not need them. Suitable approaches include:

- Separate explicitly named functions for summaries with counts
- An `includeInspectionCount` option
- Reusing already-loaded inspections where appropriate
- Updating consumers to use returned counts instead of recomputing them

Keep the API explicit; do not make every hive read progressively accumulate unrelated joins and aggregates.

#### Acceptance criteria

- Hive-list and apiary-detail pages still receive accurate counts.
- Analytics does not issue an aggregate count query and then independently recount the same inspections.
- Hive detail does not fetch an unused count alongside its inspection list.
- No N+1 query pattern is introduced.
- Typecheck, lint, and build pass.

### 8. Define the inspection-create response contract

`POST /api/inspections` calls `.returning()` but discards the returned row and responds with only `{ "success": true }`. The current form redirects after success and does not require the row, so this is not presently a correctness bug, but the endpoint contract is unclear and performs unused database-return work.

#### Required decision

Choose and implement one explicit contract:

- Return the created inspection (or at least its ID) and keep `.returning()`, or
- Keep the success-only response and remove the unused `.returning()` result.

Document or test the selected response shape so future consumers do not guess.

#### Acceptance criteria

- The query and HTTP response agree about whether the created row is needed.
- Existing form submission and redirect behavior still works.

### 9. Make apiary ordering intentional

The pre-Drizzle API listed apiaries newest-first. `getApiaries()` now orders by `createdAt ASC`, which is deterministic but reverses the previous behavior.

#### Required decision

Confirm whether the UI should show oldest-first or newest-first, then encode that choice in `getApiaries()` and add focused coverage. Prefer preserving newest-first unless the product intentionally changed.

#### Acceptance criteria

- Apiary ordering is deterministic and intentional.
- The API route and server page share the same ordering through `getApiaries()`.

### 10. Review apiary-detail query round trips

`getApiaryWithHives()` currently performs separate queries for the apiary, its hives, and inspection counts. This is correct and avoids N+1 behavior, but it is more round trips than the old review expected and should be an explicit data-layer choice.

#### Required decision

Measure or reason about the expected data size and choose between the current clear multi-query implementation and a joined/aggregated query. Do not replace it with a complex join solely to reduce the query count if that worsens correctness or maintainability.

#### Acceptance criteria

- The chosen implementation has no N+1 query pattern.
- Empty apiaries and hives with zero inspections retain the correct shape and counts.

### 11. Establish an analytics scaling boundary

Analytics currently loads every inspection and performs multiple in-memory passes. This is acceptable for a small dataset but has unbounded database transfer and server-memory cost as inspection history grows.

#### Required decision

Document the expected scale. If the dataset can grow materially, move aggregate metrics to SQL and bound the recent-inspections query; otherwise explicitly accept the current implementation until a defined threshold.

#### Acceptance criteria

- The intended operating scale is recorded.
- If SQL aggregation is adopted, all existing rates, averages, per-hive counts, and recent-inspection results remain equivalent.

### 12. Fail fast when database configuration is missing

`drizzle.config.ts` uses `process.env.DATABASE_URL!`. The assertion only affects TypeScript and does not provide a useful runtime error when Drizzle Kit is invoked without configuration.

#### Required fix

Validate `DATABASE_URL` before exporting the configuration and throw a clear setup error when it is absent.

#### Acceptance criteria

- Drizzle Kit commands fail immediately with an actionable message when `DATABASE_URL` is missing.
- Valid configured commands continue to use the same connection URL.

## Legacy review notes intentionally closed or deferred

The following observations from `PRREVIEW.md`, `PRREVIEW2.md`, and `PRREVIEW3.md` do not need separate fixes:

- The snake/camel API contract, nullable inspection update fields, analytics casing, hardcoded inspection counts, duplicated GET-route reads, fetch error handling, silent catches, and unused imports have been fixed.
- Conditional Drizzle query construction has been consolidated behind shared helpers; the small remaining conditional branches preserve Drizzle's inferred query types.
- `InspectionCard` is already a top-level server component; memoizing it is unnecessary.
- Appending `T00:00:00` when displaying a PostgreSQL date-only string is intentional and avoids UTC date shifts. Replacing it with `new Date("YYYY-MM-DD")` would be riskier.
- Mixed indentation is non-blocking while the configured linter, typecheck, and build pass. A formatter can be introduced separately if desired.
- Explicit inspection insert-field mapping and schema re-exports from `lib/db.ts` are currently accepted design choices; there is no demonstrated circular dependency. Revisit them only as part of a broader mutation/module cleanup.
