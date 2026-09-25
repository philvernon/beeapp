# Beehive Tracker — Code Audit & Review

## Overall Assessment

This is a well-structured, focused beekeeping management app. The codebase is **reasonably concise** with clear separation between data layer, API routes, and UI. However, there are several patterns worth addressing.

---

## Backend: Libs & Schemas

### `lib/schema.ts` (134 lines) — **Good, with minor issues**

**Strengths:**

- Clean Drizzle + Zod integration using `createInsertSchema`/`createUpdateSchema`
- Shared numeric invariant helper avoids repetition across insert/update
- Enum helpers for UI dropdowns are well organized

**Issues:**

1. **Redundant refine logic** — The `ApiaryUpdate` and `HiveUpdate` both have nearly identical name-refine logic. Extract to a shared helper:

   ```ts
   function nonEmptyName(val: Record<string, unknown>) {
     if (!("name" in val) || val.name === undefined || val.name === null)
       return;
     // ...
   }
   ```

2. **`inspectionNumericInvariants` is a god-function** — 18 lines of `if` checks doing the same thing. Could be data-driven:

   ```ts
   const numericRules = [
     { key: "temperamentScore", min: 1, max: 10 },
     { key: "queenCellsFound", min: 0 },
     // ...
   ];
   for (const rule of numericRules) {
     if (val[rule.key] != null) {
       if (rule.min != null && val[rule.key] < rule.min) ctx.addIssue(...);
       if (rule.max != null && val[rule.key] > rule.max) ctx.addIssue(...);
     }
   }
   ```

3. **`HiveUpdate` has a confusing refine** — `val.apiaryId !== null` should be `val.apiaryId == null` (the refine fires when apiaryId IS null, but the condition reads backwards).

### `lib/data.ts` (240 lines) — **Solid, some optimization opportunities**

**Strengths:**

- Good use of `server-only`
- Helper functions for query building and flattening reduce duplication
- Batch inspection counts avoids N+1 queries

**Issues:**

1. **`getInspectionCounts` is called multiple times in hot paths** — In `getApiaryWithHives`, it's called once for all hives, but `getHive()` calls it per-hive inside a map. Consider caching or batching.

2. **`getLatestInspections` loads ALL inspections then dedupes in JS** — A SQL `DISTINCT ON` or window function would be cleaner:

   ```ts
   db.select().from(inspections)
     .where(inArray(...))
     .orderBy(inspections.hiveId, desc(inspections.inspectionDate))
   ```

   The current approach works but is less efficient at scale.

3. **`getHive()` does a separate count query per hive** — This is the biggest perf concern. If you're fetching one hive, you're doing 2 queries (join + count). Consider returning the count from the join query itself or using a subquery.

### `lib/db.ts` (17 lines) — **Clean**

- No issues. Standard pool setup with HMR guard.

### `lib/fetch.ts` (45 lines) — **Good**

- `parseErrorBody` is reused by both `safeJsonFetch` and `getErrorMessage` — good DRY.
- Minor: `safeJsonFetch` returns `{ data: null, error }` but the type says `data: unknown`. The `null` case should be `data: T | null` with generics for better typing.

### `lib/inspection-wizard-schema.ts` (63 lines) — **Well-scoped**

- Good separation from DB schema
- `formBoolean` and `nullableNumber` helpers are clean
- Minor: `feedLitresLightSyrup` etc. use `z.string().optional().nullable()` instead of `nullableNumber` like other numeric fields. Inconsistent — should use the same helper.

### API Routes — **Consistent pattern, minor issues**

**Issues:**

1. **Inspection POST is verbose** — The `.values({...})` block manually maps every field. Could be simplified:

   ```ts
   const { hiveId, inspectionDate, ...rest } = validated.data;
   await db.insert(inspections).values({
     hive_id: hiveId,
     inspection_date: inspectionDate,
     ...Object.fromEntries(
       Object.entries(rest).map(([k, v]) => [snakeCase(k), v]),
     ),
   });
   ```

2. **Error responses are inconsistent** — Some return `{ error }`, some return `{ success, deleted }`. Standardize.

3. **`DELETE /api/hives/[id]` doesn't check cascading** — It relies on DB `ON DELETE CASCADE` silently. Consider returning the cascade count or at least logging it.

---

## Frontend: Pages & Components

### Form Pages (New/Edit Apiary, New/Edit Hive) — **DRY violation**

The four form pages (`new-apiary`, `edit-apiary`, `new-hive`, `edit-hive`) share an almost identical pattern:

- `useState` for each field
- `useEffect` with cancellation for data loading
- Form validation → fetch → redirect
- Error state handling

**Recommendation:** Extract a `useFormState` hook or a generic `CrudForm` component that handles the loading/validation/error/redirect cycle. The form-specific parts (fields, schema) can be passed as props. This would reduce ~200 lines of duplicated boilerplate to ~50 lines of shared code.

### `app/page.tsx` (AnalyticsPage) — **Too much logic in the view**

**Issues:**

1. **Computes everything server-side in the render function** — Queen seen rate, eggs rate, health rate, varroa breakdown, averages, hive stats, recent inspections — all computed inline. This makes the component hard to test and read. Extract to a `computeAnalytics()` helper function.

2. **`recentInspections` uses `.slice(0, 10)` on an unsorted array** — The data is ordered by date in `data.ts`, but this relies on that implicit ordering. Add explicit sorting or limit at the DB level.

3. **Date formatting repeated** — `new Date(...).toLocaleDateString("en-GB", ...)` appears 4+ times. Extract a utility.

### `components/apiary-hives.tsx` — **Good separation**

- Clean split between server wrapper and presentational component
- Testable list component

### Inspection Wizard (`groups/*.tsx`) — **DRY violation**

The `stringToBoolean` helper is **copied verbatim** into 4 files (`queen-fields.tsx`, `colony-fields.tsx`, `health-fields.tsx`, `notes-fields.tsx`). Move to a shared utility.

Each boolean field follows the same pattern:

```tsx
<Controller
  name="..."
  control={control}
  render={({ field, fieldState }) => (
    <RadioGroup
      value={field.value == null ? "" : String(field.value)}
      onValueChange={(value) => {
        field.onChange(stringToBoolean(value));
      }}
    >
      <Field data-invalid={fieldState.invalid}>
        <Label>
          <SelectionBox>
            <RadioGroupItem value="true" />
            <span>Yes</span>
          </SelectionBox>
        </Label>
        <Label>
          <SelectionBox>
            <RadioGroupItem value="false" />
            <span>No</span>
          </SelectionBox>
        </Label>
      </Field>
    </RadioGroup>
  )}
/>
```

**Recommendation:** Create a `<BooleanField name="..." label="..." />` component. This would eliminate ~60 lines of repeated boilerplate across the wizard groups.

### `inspection-form.tsx` — **Debug code left in**

Contains multiple `console.log()` calls that should be removed:

- Line: `console.log(data);`
- Line: `console.log("parse", parsed.data);`
- Line: `console.log("validate", validated);`
- Line: `console.log(res);`
- Line: `console.log(hiveId);`

### `components/ui/field.tsx` (170 lines) — **Over-engineered**

This is a shadcn-generated component with 11 sub-components (`Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldContent`, `FieldTitle`). Most of your app only uses `Field`, `FieldGroup`, `FieldLabel`, and `FieldSet`.

**Issues:**

1. **Massive overkill for your usage** — You use ~4 of 11 exported components. The remaining 7 (`FieldError`, `FieldSeparator`, `FieldLegend`, `FieldContent`, `FieldTitle`) are dead weight in production.

2. **`FieldLabel` has an absurdly long className** — The CVA-based class string is hundreds of characters. This is a shadcn artifact that's hard to maintain.

3. **Recommendation:** Either strip this down to what you actually use, or accept the shadcn trade-off if you plan to use more components later.

### `app/hive-scan/page.tsx` — **Good**

- Clean QR scanner implementation
- Proper URL parsing with regex

---

## Summary of Actionable Items

| Priority   | Issue                                              | Location                          | Effort  |
| ---------- | -------------------------------------------------- | --------------------------------- | ------- |
| **High**   | Extract shared `BooleanField` component            | Wizard groups                     | 30 min  |
| **High**   | Remove `console.log` debug statements              | `inspection-form.tsx`             | 5 min   |
| **High**   | Deduplicate form page boilerplate                  | All CRUD pages                    | 1-2 hrs |
| **Medium** | Data-drive `inspectionNumericInvariants`           | `lib/schema.ts`                   | 30 min  |
| **Medium** | Extract analytics computation from view            | `app/page.tsx`                    | 30 min  |
| **Medium** | Use `nullableNumber` consistently in wizard schema | `lib/inspection-wizard-schema.ts` | 10 min  |
| **Low**    | Simplify `field.tsx` to used components            | `components/ui/field.tsx`         | 1 hr    |
| **Low**    | Fix backwards refine condition in `HiveUpdate`     | `lib/schema.ts`                   | 5 min   |
| **Low**    | Standardize API error response format              | All routes                        | 30 min  |

**Overall verdict:** The codebase is **not sprawling** — it's focused and well-organized. The main issues are repetitive patterns (form pages, wizard fields) and a few debug artifacts. No architectural problems detected.
