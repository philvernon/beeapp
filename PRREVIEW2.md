# Code Review: Drizzle ORM Migration + Zod Validation

## Summary

This is a substantial migration from raw `fetch()` → API routes to **Drizzle ORM with type-safe queries**, plus adding client-side Zod validation. The architectural direction is solid — you've eliminated the N+1 problem of server components calling APIs, and you've added a real validation layer. Good work.

Here's what I'd flag at senior level:

---

## 🔴 Critical Issues

### 1. `snakeToCamel` transform is a footgun waiting to happen

```ts
// lib/schema.ts
function snakeToCamel<T extends z.ZodType>(schema: T) {
  return schema.transform((val) => {
    if (typeof val !== "object" || val === null) return val;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(val)) {
      const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      result[camel] = value;
    }
    return result as z.output<T>;
  });
}
```

This transforms **all** snake_case keys to camelCase. But your Drizzle schemas already use camelCase field names (`queenBreed`, `apiaryId`). The transform is applied to the Zod schema, which means:

- If a client sends `{ queen_breed: "Italian" }` → it becomes `{ queenBreed: "Italian" }` ✓
- But if a client sends `{ queenBreed: "Italian" }` (already camel) → no transform needed ✓

The real problem: **this is silently accepting snake_case input from clients while your Drizzle schema expects camelCase**. This creates a contract mismatch. If you ever switch to sending data directly to Drizzle (which you're doing in `lib/data.ts`), the transform will double-convert or fail.

**Recommendation**: Either (a) keep the DB schema in snake_case and let Drizzle handle it, or (b) remove the transform and have clients send camelCase consistently. Don't mix two conventions.

### 2. `getInspections()` has a conditional query build anti-pattern

```ts
// lib/data.ts
export async function getInspections(hiveId?: string) {
  const rows = hiveId
    ? await db.select().from(inspections).leftJoin(...).where(eq(...))
    : await db.select().from(inspections).leftJoin(...);
  // ...
}
```

This is the same pattern repeated in `getApiaryWithHives`, `getHives`, and every API route. You're building two nearly-identical query chains with a ternary. This is error-prone (easy to forget `.where()` or `.orderBy()`) and hard to maintain.

**Recommendation**: Build the query conditionally using Drizzle's builder pattern:

```ts
let query = db.select().from(inspections)
  .leftJoin(hives, eq(inspections.hiveId, hives.id))
  .leftJoin(apiaries, eq(hives.apiaryId, apiaries.id));

if (hiveId) {
  query = query.where(eq(inspections.hiveId, hiveId));
}
const rows = await query;
```

### 3. `parseInt` without validation accepts garbage

Every form handler does:

```ts
onChange={(e) => setStoreFrames(e.target.value === "" ? "" : parseInt(e.target.value))}
```

`parseInt("42abc")` returns `42`. `parseInt("")` returns `NaN` (but you guard against that). However, `parseInt("99999999999999999")` silently truncates. And the Zod schema will catch it server-side, but the client state is already corrupted.

**Recommendation**: Use `Number(e.target.value)` or a regex check before parsing. At minimum, add `isNaN` guards in the submit handler.

---

## 🟡 Medium Issues

### 4. Hardcoded "0 inspections" in hive cards (regression)

```tsx
// app/hives/page.tsx — HiveList component
<p className="text-xs text-secondary mt-2">0 inspections</p>
```

The old code used `h.inspection_count || 0` but the new `getHives()` doesn't return inspection counts. The hive list now always shows "0 inspections" regardless of actual count. This is a **data regression**.

**Fix**: Either add a count query in `getHives()`, or fetch per-hive counts, or use a subquery with Drizzle's `count()`.

### 5. `getApiaryWithHives` does two queries when one would suffice

```ts
const apiaryResult = await db.select().from(apiaries).where(eq(apiaries.id, id)).limit(1);
// ...
const hiveRows = await db.select().from(hives).leftJoin(apiaries, ...).where(eq(hives.apiaryId, id));
```

Two round-trips to the DB for data that could be a single JOIN. The old API route did this in one query too, but now that you're in Drizzle, you can do:

```ts
const result = await db.select()
  .from(apiaries)
  .leftJoin(hives, eq(apiaries.id, hives.apiaryId))
  .where(eq(apiaries.id, id))
  .orderBy(asc(hives.createdAt));
```

### 6. Analytics page loads ALL inspections into memory

```ts
// app/analytics/page.tsx
const queenSeenCount = inspections.filter((i) => i.queen_seen).length;
const eggsSeenCount = inspections.filter((i) => i.eggs_seen).length;
// ... 10+ more .filter() passes over the same array
```

This is O(n×k) where k ≈ 10 filter passes. For a beekeeping app this is fine at current scale, but it's a pattern that will bite you. Consider using `reduce()` for a single pass, or better yet, do aggregations in SQL with Drizzle's `count()`, `sum()`, etc.

### 7. Missing error handling on `r.json()` in client-side fetches

```ts
// app/hives/[id]/new-inspection/page.tsx
useEffect(() => {
  fetch(`/api/hives/${id}`)
    .then((r) => r.json())  // What if response is not JSON?
    .then((data) => { ... })
    .catch(() => router.push("/hives"));
}, []);
```

If the API returns HTML (500 error page), `r.json()` throws. Your `.catch()` handles it, but you lose the actual error. Same pattern in `EditHivePage`, `NewHiveForm`, etc.

**Recommendation**: Check `r.ok` before calling `.json()`, and log the actual response for debugging.

### 8. `InspectionInsert.safeParse(body)` in new-inspection form sends snake_case keys

The form builds a body with snake_case keys (`queen_seen`, `hive_id`, etc.), then passes it through `InspectionInsert` which has the `snakeToCamel` transform. But then it also sends to `/api/inspections` POST which **also** validates with `InspectionInsert.safeParse(body)` — double validation, and the second one receives camelCase (already transformed), so the second parse might fail or be redundant.

Wait — actually looking more carefully, the form sends `body` (snake_case) to the API, and the API route validates it again. The client-side parse is a separate validation that transforms to camelCase before sending. So the API receives camelCase keys, but the API's `InspectionInsert.safeParse(body)` expects snake_case (because of the transform). **This is a contract mismatch.**

### 9. Unused import: `sql` in inspections route

```ts
// app/api/inspections/[id]/route.ts
import { eq } from "drizzle-orm";
// sql is imported but not used here
```

Actually it was removed in the diff — good cleanup. But `app/api/hives/[id]/route.ts` still imports `sql`:

```ts
import { eq, sql } from "drizzle-orm";
```

Used for `count(*)` — that's fine, just noting it.

---

## 🟢 Minor / Style Issues

### 10. Tab indentation mixed with spaces in some files

The diff shows the new code uses tabs (`\t`) for indentation while the old code used spaces. This is consistent within the new code, but verify your linter/formatter is configured for tabs. If not, this will cause CI failures.

### 11. `hi` text in apiaries page (leftover debug)

```tsx
// app/apiaries/page.tsx
if (apiaries.length === 0) {
  return (
    <div className="text-center py-16">
      hi  {/* ← what is this? */}
      <p className="text-secondary mb-4">No apiaries yet</p>
```

### 12. `catch(() => {})` swallows all errors silently

Found in multiple places:

```ts
useEffect(() => {
  fetch("/api/apiaries")
    .then((r) => r.json())
    .then(setApiaries)
    .catch(() => {});  // Swallows network errors, parse errors, everything
}, []);
```

At minimum, log these in dev mode. A silent failure on apiary load means the user sees a broken dropdown with no feedback.

### 13. `InspectionCard` is not memoized

```tsx
// app/hives/[id]/page.tsx
{inspections.map((insp) => (
  <InspectionCard key={insp.id} inspection={insp} />
))}
```

`InspectionCard` is a regular function component defined inside the page. Every render creates a new component, so React can't memoize it. Move it outside the page component or wrap in `React.memo`.

### 14. Date parsing with string concatenation

```ts
new Date(inspection.inspectionDate + "T00:00:00")
```

This works but is fragile. If `inspectionDate` is already a full ISO string, you'll get double time components. Use `new Date(inspection.inspectionDate)` directly — Drizzle's `date()` type returns strings that `Date` constructor handles fine.

---

## ✅ What I liked

- **Drizzle indexes** on `hives.apiaryId` and `inspections.hiveId + inspectionDate` — good performance thinking
- **Zod validation on both client and server** — defense in depth
- **`safeParse` with user-friendly error messages** — much better than raw API errors
- **`onDelete: "cascade"` on inspections** — clean data model
- **`dynamic = "force-dynamic"` on list pages** — correct Next.js config for data that shouldn't be stale-cached at build time
- **`Promise<{ id: string }>` params pattern** — modern Next.js 15+

---

## Prioritized Fix Order

1. **#8** — Verify the snake_case ↔ camelCase contract between client validation and API validation (this could cause silent data loss)
2. **#1** — Audit `snakeToCamel` transform usage across the codebase
3. **#4** — Fix the "0 inspections" hardcoded value in hive cards
4. **#3** — Add `isNaN` guards to all `parseInt`/`parseFloat` handlers
5. **#5, #2** — Refactor query building to avoid duplication
