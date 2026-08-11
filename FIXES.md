# Remaining Fixes

Follow-up issues discovered while reviewing the remediation commits for `PLAN.md`.

## 1. Make inspection ordering deterministic (Fixed)

`lib/data.ts#getInspections()` does not specify an order, but analytics assumes the first inspection is the latest:

- `hiveInspections[0]` is displayed as the hive's last inspection.
- `inspections.slice(0, 10)` is displayed as recent inspections.

PostgreSQL does not guarantee row order without `ORDER BY`.

### Required fix

Order inspections by:

1. `inspectionDate DESC`
2. `createdAt DESC`
3. `id DESC` as a stable final tie-breaker

Apply the ordering consistently whether or not `hiveId` filtering is used.

### Acceptance criteria

- Recent inspections display newest first.
- Each hive's `lastInspection` uses its newest inspection.
- Multiple inspections on the same date have deterministic ordering.
- Typecheck, lint, and build pass.

## 2. Restore the high-varroa progress bar

The analytics rewrite accidentally removed the inner colored bar for the high-varroa row. At `app/analytics/page.tsx:128`, percentage width is currently applied to the grey track itself:

```tsx
<div
  className="w-full bg-zinc-100 h-2"
  style={{ width: `${percentage}%` }}
/>
```

This differs from the low and medium rows and causes a visual regression.

### Required fix

Restore the same track-and-fill structure used by the other rows:

```tsx
<div className="w-full bg-zinc-100 h-2">
  <div
    className="bg-primary/40 h-2"
    style={{ width: `${percentage}%` }}
  />
</div>
```

Use the existing high-varroa percentage expression in place of `percentage`.

### Acceptance criteria

- The track remains full width.
- The colored fill reflects the high-varroa percentage.
- Zero inspections produce a zero-width fill.
- Low, medium, and high bars use the same DOM structure.
- Typecheck, lint, and build pass.

## 3. Validate numeric strings at the API boundary

The decimal form mismatch is fixed: the form now correctly submits Drizzle `numeric(...)` values as strings. However, the generated `InspectionInsert` schema only checks that these values are strings; it does not validate their numeric syntax, range, precision, or scale.

Direct API requests currently pass validation with values such as:

- `""`
- `"abc"`
- `"-1"`
- `"999.999"`
- `"1000"`
- `"1e3"`

Browser number-input constraints prevent some of these through the normal form, but callers can bypass the browser and cause invalid values to reach PostgreSQL.

### Required fix

Add explicit API/schema validation for:

- Valid decimal-string syntax
- Allowed negative/non-negative ranges per field
- PostgreSQL precision and scale limits
- Empty values normalized to `null` or rejected consistently

Keep valid decimal values as strings rather than converting them to JavaScript numbers. Invalid requests should return a 400 validation response instead of becoming database errors.

### Acceptance criteria

- Valid decimal strings and `null` are accepted.
- Empty and non-numeric strings are handled consistently.
- Out-of-range and excess-precision values are rejected before querying PostgreSQL.
- Direct API requests cannot bypass the validation enforced by the form.
- Typecheck, lint, and build pass.

## 4. Remove redundant null guards from update routes

`HiveUpdate` already rejects `apiaryId: null`, and `InspectionUpdate` already rejects `hiveId: null` because those fields map to `NOT NULL` columns. The explicit checks later in the PUT handlers are therefore unreachable after successful schema validation:

```ts
if (updates.apiaryId === null) { /* ... */ }
if (updates.hiveId === null) { /* ... */ }
```

### Required fix

Remove the redundant route-level guards and keep nullability enforcement in the update schemas as the single source of truth.

### Acceptance criteria

- `apiaryId: null` and `hiveId: null` still return 400 validation responses.
- The invalid values never reach PostgreSQL.
- No duplicate nullability checks remain after schema validation.
- Typecheck, lint, and build pass.

## 5. Strictly reject immutable and unknown update fields

The update schemas omit `id` and `createdAt`, which prevents those fields from reaching the database. However, Zod strips omitted/unknown keys by default. A payload such as:

```json
{ "id": "<another UUID>", "name": "Updated hive" }
```

currently succeeds by silently ignoring `id` and applying `name`. This is secure against primary-key mutation, but it can hide client bugs and make callers believe the entire payload was accepted.

### Required fix

Make API update validation strict so immutable and unknown fields return a 400 response rather than being silently discarded. Keep `id` and `createdAt` omitted from the mutable schema.

If shared client-side schemas should remain permissive, define strict API-specific update schemas rather than changing unrelated consumers.

### Acceptance criteria

- Payloads containing `id` or `createdAt` return 400, even when valid mutable fields are also present.
- Other unknown fields return 400 with useful validation details.
- Valid partial updates continue to succeed.
- Immutable fields never reach `.set(...)`.
- Typecheck, lint, and build pass.

## 6. Avoid redundant inspection-count queries

`getHives()` and `getHive()` now fetch inspection counts unconditionally. This is correct for consumers that display the count, but it creates redundant database work for consumers that already load inspections:

- Analytics calls `getHives()` and `getInspections()`, then computes its own per-hive counts.
- The hive-detail page calls `getHive()` alongside `getInspections(hiveId)` and does not use `hive.inspectionCount`.

The aggregate query is batched rather than N+1, so this is a performance/API-shaping issue rather than a correctness bug.

### Required fix

During data-layer consolidation, avoid loading counts for consumers that do not need them. Suitable approaches include:

- Separate explicitly named functions for summaries with counts
- An `includeInspectionCount` option
- Reusing already-loaded inspections where appropriate
- Updating consumers to use returned counts instead of recomputing them

Keep the API explicit; do not make every hive read progressively accumulate unrelated joins and aggregates.

### Acceptance criteria

- Hive-list and apiary-detail pages still receive accurate counts.
- Analytics does not issue an aggregate count query and then independently recount the same inspections.
- Hive detail does not fetch an unused count alongside its inspection list.
- No N+1 query pattern is introduced.
- Typecheck, lint, and build pass.
