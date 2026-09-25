# Issue #12 — Convert New Inspection Form to Multi-Step

**Source:** https://github.com/philvernon/beeapp/issues/12 (open, 2026-08-12)
**Author:** @philvernon

---

## 1. Current-State Evidence

### 1.1 Target file: `app/hives/[id]/new-inspection/page.tsx` (595 lines)

| Evidence              | Detail                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component type        | `"use client"` server+client hybrid page                                                                                                                                                                                                                                                                                                                                                           |
| State hooks           | 28 `useState` calls (lines 23-54): date, queenSeen, queenColour, queenCellsFound, queenCellsRemoved, eggsSeen, broodPatternOk, broodFrameCount, storeFrames, roomFrames, healthOk, chalkBrood, efbSuspected, afbSuspected, varroaLevel, varroaCount, temperament, feedLight, feedHeavy, supersChange, weatherTemp, weatherCondition, notes, plus hiveName, error, fetchError, initialized, loading |
| Data loading          | Client-side `useEffect` calling `/api/hives/${id}` via `safeJsonFetch` (lines 56-81)                                                                                                                                                                                                                                                                                                               |
| Default date          | `new Date().toISOString().split("T")[0]` — UTC-derived, can be wrong at local midnight (line 24-26)                                                                                                                                                                                                                                                                                                |
| Validation            | Manual `InspectionInsert.safeParse()` in `handleSubmit`, errors collapsed to single string: `"${path}: ${message}; ..."` (lines 117-122)                                                                                                                                                                                                                                                           |
| API call              | `fetch("/api/inspections", { POST, body: JSON.stringify(validated.data) })` (line 127)                                                                                                                                                                                                                                                                                                             |
| Label associations    | Some fields have `id`/`htmlFor` (date, queenSeen, queenCellsRemoved, eggsSeen, broodOk, healthOk, notes); others lack `id` entirely (queenColour, queenCellsFound, broodFrameCount, storeFrames, roomFrames, varroaLevel, varroaCount, temperament, feedLight, feedHeavy, supersChange, weatherTemp, weatherCondition)                                                                             |
| Conditional rendering | Queen colour shown only when `queenSeen` is true; disease checkboxes shown only when `!healthOk` — but state values persist in memory even when hidden                                                                                                                                                                                                                                             |
| Imports from schema   | `InspectionInsert`, `queenColourLabels`, `varroaLevelLabels`, `weatherConditionLabels` — imports Drizzle schema module into client (lines 7-12)                                                                                                                                                                                                                                                    |

### 1.2 API route: `app/api/inspections/route.ts` (75 lines)

| Evidence       | Detail                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST handler   | Re-validates with `InspectionInsert.safeParse()` (line 27), then manually maps all 24 fields into `db.insert().values({...})` (lines 38-63), calls `.returning()` without using result (line 64) |
| GET handler    | Lists inspections, filters by `hive_id` query param                                                                                                                                              |
| Error response | Returns `{ error: "Validation failed", details: validated.error.issues }` on 400                                                                                                                 |

### 1.3 Schema: `lib/schema.ts` (227 lines)

| Evidence           | Detail                                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drizzle table      | `inspections` pgTable with 24 columns (lines 80-148)                                                                                                                   |
| Zod schemas        | `InspectionInsert` = `createInsertSchema(inspections).superRefine(inspectionNumericInvariants)`; `InspectionUpdate` = partial omit(id, createdAt) with same invariants |
| Numeric invariants | temperamentScore 1-10; queenCellsFound/storeFrames/broodFrameCount/roomFrames/varroaCount >= 0 (lines 150-179)                                                         |
| Enum helpers       | `queenColours` (W/Y/R/G/B), `varroaLevels` (l/m/h), `weatherConditions` (c/s/r/f) with label maps                                                                      |
| Problem            | Client imports Drizzle schema module + enum labels — single file for DB, validation, and UI                                                                            |

### 1.4 Existing tests

| File                                       | Coverage                                                                                                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/api/__tests__/inspections.test.ts`    | GET/POST /api/inspections — mocks dbInsert, getInspections; tests valid insert, missing hiveId, missing date, temperament out of range, DB error                                    |
| `app/api/__tests__/inspections-id.test.ts` | GET/PUT/DELETE /api/inspections/:id                                                                                                                                                 |
| `lib/__tests__/schema.test.ts`             | InspectionInsert (required fields, enum validation, numeric invariants, default values not applied by Zod v4); InspectionUpdate (partial updates, nullable fields, boundary values) |
| `__tests__/setup.ts`                       | Mocks server-only, next/navigation, next/link, next/font/google                                                                                                                     |
| `vitest.config.mts`                        | jsdom env, React plugin, coverage thresholds 95/90/94/95%, includes lib/* and app/api/*                                                                                             |

### 1.5 Dependencies

- **Not yet installed:** `react-hook-form`, `@hookform/resolvers`
- **Existing:** Zod v4, Drizzle ORM, Drizzle-Zod, Next.js 16, React 19, Vitest, Testing Library, Tailwind CSS v4

---

## 2. Concrete Required Behavior

### 2.1 Multi-step form with 5 steps

| Step                     | Fields                                                                                                                                                       | Validation trigger                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| **1 — Conditions**       | `inspectionDate` (required), `weatherTemperatureC`, `weatherCondition`                                                                                       | Date required; weather optional                     |
| **2 — Colony**           | `queenSeen` (required), `queenColour` (if seen), `queenCellsFound`, `queenCellsRemoved`, `eggsSeen`, `broodPatternOk`, `broodFrameCount`, `temperamentScore` | Queen seen = required; temperament 1-10 if provided |
| **3 — Stores & Actions** | `storeFrames`, `roomFrames`, `feedLitresLightSyrup`, `feedLitresHeavySyrup`, `supersChange`                                                                  | Non-negative integers if provided                   |
| **4 — Health**           | `healthOk` (required), disease flags (if !healthOk), `varroaLevel`, `varroaCount`                                                                            | healthOk required; varroaLevel enum if provided     |
| **5 — Review**           | Summary of all entered data, `notes`, final submit                                                                                                           | Submit triggers full validation + API call          |

### 2.2 Conditional normalization (Zod superRefine)

| Rule                               | When                                  | Action                                                                                   |
| ---------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------- |
| Clear queen colour                 | `queenSeen === false` or not provided | Set `queenColour` to `null`/`""` before validation                                       |
| Clear disease flags                | `healthOk === true`                   | Set `chalkBroodSuspected`, `efbSuspected`, `afbSuspected` to `false`                     |
| (Implicit) Clear queen cells found | `queenSeen === false`                 | Should `queenCellsFound` be cleared? Issue doesn't explicitly state this — **ambiguity** |

### 2.3 Date default

- Use local calendar date: `new Date().toISOString().split("T")[0]` is WRONG (UTC).
- Correct approach: `new Date(Date.now() - Date.now() % 86400000 - new Date().getTimezoneOffset() * 60000).toISOString().split("T')[0]` or equivalent local-date extraction.

### 2.4 API simplification

- Replace manual field-by-field mapping in `POST /api/inspections` with direct spread of validated data: `db.insert(inspections).values(validated.data)`
- Remove unused `.returning()` call (or use result if inspection object is needed for response)

### 2.5 Accessibility

- Every `<input>`, `<select>`, `<textarea>` must have matching `id`/`htmlFor`
- Error summary at top of form listing per-step errors
- Step navigation must expose `aria-current="step"` on active step
- Focus management: first invalid field focused on Next click; first step focused on mount

### 2.6 Schema separation

- Client-safe form schema in a new file (e.g., `lib/inspection-form-schema.ts`) — excludes `id`, `createdAt`
- Enum labels (`queenColourLabels`, etc.) stay in `lib/schema.ts` or move to a dedicated `lib/labels.ts`
- DB schema (`inspections` pgTable, `InspectionInsert`, `InspectionUpdate`) stays in `lib/schema.ts` for server use

---

## 3. Ambiguities Requiring Decisions

| #   | Ambiguity                                                                                               | Context                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | **Should `queenCellsFound` be cleared when queen is not seen?**                                         | Issue says "Clear `queenColour` when the queen was not seen" and "Clear disease flags when `healthOk` is true" but doesn't mention queen cells. The paper form (data.md) shows QC field independent of Q field. **Decision needed.**                                          |
| A2  | **What does the Review step display?**                                                                  | Issue says "notes, summary, and final submission." Summary of what — all entered fields? Only non-null fields? Formatted per NHBKA sheet? **Decision needed.**                                                                                                                |
| A3  | **Should the stepper be a separate component or inline in InspectionForm?**                             | Issue says "lightweight React stepper" — could be `app/hives/[id]/new-inspection/stepper.tsx` or inline. **Recommendation: separate component for testability.**                                                                                                              |
| A4  | **What happens to the existing client-side validation in page.tsx?**                                    | Currently validates with `InspectionInsert.safeParse()` before API call. Should this be removed (API is authoritative) or kept as a safety net? Issue says "Keep authoritative Zod validation in the API route." **Decision: remove client-side re-validation, rely on API.** |
| A5  | **Should feedLitresLightSyrup / feedLitresHeavySyrup accept numeric strings or be coerced to numbers?** | Current code stores as `""` (empty string) and API maps to `null`. DB column is NUMERIC. Form input type="number" with step="0.25". **Decision: coerce empty to null, valid string to number.**                                                                               |
| A6  | **Does the issue want the existing `handleSubmit` error display preserved?**                            | Current error div (lines 170-174) shows combined string. New design should show per-field errors + error summary. **Decision: replace with structured error display.**                                                                                                        |

---

## 4. Proposed Component and Schema Boundaries

```
app/hives/[id]/new-inspection/
├── page.tsx                    # Server component: loads hive name, passes to client form
├── inspection-form.tsx         # Client component: InspectionForm with RHF + stepper
├── stepper.tsx                 # Client component: StepNav (step indicators, prev/next)
└── inspection-form-schema.ts   # Client-safe Zod schema (no Drizzle imports)

lib/
├── schema.ts                   # DB schema + enum helpers (unchanged, server-only consumers)
└── inspection-form-schema.ts   # NEW: client-safe form schema + labels (if separated)

app/api/inspections/
└── route.ts                    # POST simplified: spread validated data, remove .returning()
```

**File-by-file boundaries:**

| File                                 | Role                                                                                 | Exports                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `page.tsx` (server)                  | Load hive name via `getHive()`, render `<InspectionForm hiveName=... />`             | Default export                                 |
| `inspection-form.tsx` (client)       | RHF form with Zod resolver, stepper integration, submission                          | `InspectionForm` component                     |
| `stepper.tsx` (client)               | Step navigation UI, step state management                                            | `Stepper`, `Step` types                        |
| `inspection-form-schema.ts` (client) | Zod schema for form validation, inferred form value type                             | `inspectionFormSchema`, `InspectionFormValues` |
| `route.ts` (server)                  | POST: validate with `InspectionInsert`, insert via spread, return created inspection | `POST`, `GET` handlers                         |

---

## 5. Field-to-Step Table

| Step                     | Form Field             | DB Column                 | Type                | Required     | Notes                              |
| ------------------------ | ---------------------- | ------------------------- | ------------------- | ------------ | ---------------------------------- |
| **1 — Conditions**       | `inspectionDate`       | `inspection_date`         | string (YYYY-MM-DD) | Yes          | Local date default                 |
|                          | `weatherTemperatureC`  | `weather_temperature_c`   | string → number?    | No           | Numeric input, step 0.1            |
|                          | `weatherCondition`     | `weather_condition`       | enum (c/s/r/f)      | No           | Dropdown                           |
| **2 — Colony**           | `queenSeen`            | `queen_seen`              | boolean             | Yes          | Checkbox                           |
|                          | `queenColour`          | `queen_colour`            | enum (W/Y/R/G/B)    | If queenSeen | Conditional: cleared if !queenSeen |
|                          | `queenCellsFound`      | `queen_cells_found`       | number              | No           | Non-negative integer               |
|                          | `queenCellsRemoved`    | `queen_cells_removed`     | boolean             | No           | Checkbox, default false            |
|                          | `eggsSeen`             | `eggs_seen`               | boolean             | No           | Checkbox, default false            |
|                          | `broodPatternOk`       | `brood_pattern_ok`        | boolean             | No           | Checkbox, default true             |
|                          | `broodFrameCount`      | `brood_frame_count`       | number              | No           | Non-negative integer               |
|                          | `temperamentScore`     | `temperament_score`       | number (1-10)       | No           | Integer range                      |
| **3 — Stores & Actions** | `storeFrames`          | `store_frames`            | number              | No           | Non-negative integer               |
|                          | `roomFrames`           | `room_frames`             | number              | No           | Non-negative integer               |
|                          | `feedLitresLightSyrup` | `feed_litres_light_syrup` | string → numeric    | No           | Step 0.25                          |
|                          | `feedLitresHeavySyrup` | `feed_litres_heavy_syrup` | string → numeric    | No           | Step 0.25                          |
|                          | `supersChange`         | `supers_change`           | string → numeric    | No           | Step 0.5, signed                   |
| **4 — Health**           | `healthOk`             | `health_ok`               | boolean             | Yes          | Checkbox, default true             |
|                          | `chalkBroodSuspected`  | `chalk_brood_suspected`   | boolean             | If !healthOk | Cleared if healthOk=true           |
|                          | `efbSuspected`         | `efb_suspected`           | boolean             | If !healthOk | Cleared if healthOk=true           |
|                          | `afbSuspected`         | `afb_suspected`           | boolean             | If !healthOk | Cleared if healthOk=true           |
|                          | `varroaLevel`          | `varroa_level`            | enum (l/m/h)        | No           | Dropdown                           |
|                          | `varroaCount`          | `varroa_count`            | number              | No           | Non-negative integer               |
| **5 — Review**           | `notes`                | `notes`                   | string              | No           | Textarea                           |

---

## 6. Conditional Normalization Rules

All rules implemented via Zod `superRefine` on the client form schema:

1. **Queen colour → null when queen not seen:** If `queenSeen !== true`, set `queenColour = null`.
2. **Disease flags → false when healthOk is true:** If `healthOk === true`, set all of `chalkBroodSuspected`, `efbSuspected`, `afbSuspected` to `false`.
3. **(Pending decision A1) Queen cells found → null when queen not seen?** If `queenSeen !== true`, set `queenCellsFound = null`.

---

## 7. Allowed Files

### Files that MAY be created:

- `app/hives/[id]/new-inspection/inspection-form.tsx` — client form component
- `app/hives/[id]/new-inspection/stepper.tsx` — stepper UI component
- `app/hives/[id]/new-inspection/inspection-form-schema.ts` — client-safe Zod schema
- `app/hives/[id]/new-inspection/__tests__/` — new test directory for form tests

### Files that MAY be modified:

- `app/hives/[id]/new-inspection/page.tsx` — refactor to server component + client form import
- `lib/schema.ts` — extract enum labels if separated (or leave as-is if not needed)
- `app/api/inspections/route.ts` — simplify POST handler
- `vitest.config.mts` — add new file paths to coverage include if needed
- `package.json` — add `react-hook-form`, `@hookform/resolvers`

### Files that MUST NOT be modified:

- `lib/db.ts` — database connection (unchanged)
- `lib/data.ts` — data access layer (unchanged)
- `lib/fetch.ts` — fetch helpers (unchanged)
- `__tests__/setup.ts` — test setup (unchanged)
- Any file not directly related to the inspection form or its API

---

## 8. Non-Goals

- **No redesign of other pages** — only the new-inspection form is in scope
- **No changes to the DB schema** — columns, types, constraints remain as-is
- **No migration files** — existing schema is authoritative
- **No analytics dashboard changes**
- **No hive edit page changes**
- **No API route restructuring** beyond simplifying the POST handler
- **No internationalization** — all labels stay English
- **No mobile responsiveness changes** beyond what the stepper requires

---

## 9. Ordered Implementation Checkpoints

### Phase 1: Foundation

1. Install `react-hook-form` and `@hookform/resolvers` via pnpm
2. Create `lib/inspection-form-schema.ts` — client-safe Zod schema derived from InspectionInsert, excluding id/createdAt, with conditional normalization superRefine rules
3. Extract enum labels (`queenColourLabels`, `varroaLevelLabels`, `weatherConditionLabels`) into a separate export or keep in schema.ts and import selectively

### Phase 2: API Simplification

4. Simplify `POST /api/inspections` — replace manual field mapping with spread of validated data, remove unused `.returning()` call
5. Update `app/api/__tests__/inspections.test.ts` POST tests to match new insert pattern (verify `values()` receives validated data directly)

### Phase 3: Server Page

6. Refactor `page.tsx` — move from client component to server component that loads hive name via `getHive()`, passes it to `<InspectionForm>`
7. Remove client-side `useEffect` hive loading, `safeJsonFetch` import, and all form state logic

### Phase 4: Client Form Component

8. Create `inspection-form.tsx` — `InspectionForm` component using RHF + Zod resolver
9. Implement field registration for all 24 fields with proper input coercion (empty string → null for numbers)
10. Add local calendar date default for inspectionDate

### Phase 5: Stepper

11. Create `stepper.tsx` — lightweight stepper with 5 steps, Previous/Next/Submit buttons
12. Implement per-step validation: only allow Next when current step fields pass schema validation
13. Add accessible step navigation (`aria-current`, `role="navigation"`, step labels)

### Phase 6: Accessibility & UX

14. Add `id`/`htmlFor` to all remaining unlabeled controls
15. Implement error summary at top of form (per-step error listing)
16. Focus management: first invalid field on Next; first step on mount
17. Preserve values when navigating between steps (RHF handles this automatically)

### Phase 7: Tests

18. Add tests for step navigation and per-step validation
19. Add tests for value preservation between steps
20. Add tests for conditional field normalization (queen colour, disease flags)
21. Add tests for schema cross-field invariants
22. Add tests for submission success and server validation failure

### Phase 8: Verification

23. Run full test suite — all existing tests must pass
24. Verify coverage thresholds still met (95/90/94/95)
25. Smoke test: run `pnpm dev`, navigate to a hive, create inspection through all 5 steps

---

## 10. Acceptance Tests and Verification Commands

### Automated tests

```bash
# Run full test suite
pnpm test

# Run with coverage to verify thresholds
pnpm test -- --coverage

# Run only new form tests (if placed in dedicated directory)
pnpm test app/hives/\[id\]/new-inspection/
```

### Manual verification

1. **Step navigation:** Open `/hives/<id>/new-inspection` — see 5 steps, click Next/Previous, verify fields persist
2. **Per-step validation:** Leave required field empty on step 1, click Next — error shown, step doesn't advance
3. **Conditional normalization:** Uncheck "Queen seen" on step 2 — queen colour field clears; check "No disease signs" on step 4 — disease checkboxes clear
4. **Date default:** Verify date input shows local date (not UTC), especially for timezone offset > 0
5. **Submission:** Fill all required fields, submit — redirect to hive detail page, inspection appears in list
6. **Server validation failure:** Submit with temperamentScore=15 — error shown from API response
7. **Accessibility:** Tab through form — every control has a visible label; error summary is announced by screen reader

### Acceptance criteria checklist

- [ ] `page.tsx` is a server component (no `"use client"`, no useState/useEffect for form state)
- [ ] Form uses `react-hook-form` with Zod resolver (no individual useState hooks)
- [ ] 5-step stepper with per-step validation
- [ ] Conditional normalization: queenColour cleared when !queenSeen; disease flags cleared when healthOk
- [ ] Default date is local calendar date, not UTC-derived
- [ ] All controls have id/htmlFor label associations
- [ ] Error summary displayed for validation failures
- [ ] API POST handler uses spread of validated data (no manual field mapping)
- [ ] `.returning()` removed or result used
- [ ] Client does not import Drizzle schema module
- [ ] All existing tests pass
- [ ] New tests cover step navigation, value preservation, conditional normalization, submission

---

## 11. Stop Conditions

Stop implementation when ALL of the following are true:

1. `page.tsx` renders as a server component that loads hive name and passes it to `<InspectionForm>`
2. `InspectionForm` uses RHF + Zod resolver with all 24 fields registered
3. Stepper has exactly 5 steps with per-step validation gating Next button
4. Conditional normalization rules are enforced in the Zod schema (superRefine)
5. Default date uses local calendar date
6. All form controls have accessible label associations
7. API POST handler accepts validated data directly without manual field mapping
8. `.returning()` is removed from the POST handler
9. Client does not import `InspectionInsert` or Drizzle schema from `lib/schema.ts`
10. `pnpm test` passes with no regressions
11. Coverage thresholds (95/90/94/95) are met for all included files

If any ambiguity (A1-A6) remains unresolved, stop and record the decision point rather than inferring behavior.
