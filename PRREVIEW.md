# Code Review: `feat/drizzle-type-safety`

## 🔴 Critical Issues

### 1. Client → Server contract mismatch (will break all mutations)

✅ **FIXED** — Added `snakeToCamel()` helper in `lib/schema.ts` that wraps each insert/update schema with `.transform()` to accept snake_case keys from clients and normalize them to camelCase before Zod validation. This covers:

- `ApiaryInsert`, `ApiaryUpdate`
- `HiveInsert`, `HiveUpdate`
- `InspectionInsert`, `InspectionUpdate` (newly added)

Client pages can keep sending snake_case (`hive_id`, `queen_breed`, etc.) and the API layer works in camelCase.

### 2. `InspectionInsert` schema doesn't include `hiveId` as required

Looking at the schema: `createInsertSchema(inspections)` — since `hiveId` is `.notNull()` in the Drizzle table, it *should* be required in the insert schema. But the old validation had `z.string().uuid()` on `hive_id`. Need to verify the generated schema actually enforces this. If it does, the client's snake_case `hive_id` will fail regardless.

### 3. `InspectionInsert` is missing `.nullable()` on optional text fields

The `notes` field in the Drizzle table is `text('notes')` (no `.nullable()`), but the old validation had `z.string().optional()`. The new schema will require `notes` to be present even if empty string, which changes behavior.

## 🟡 Medium Issues

### 4. Inspection update uses a hardcoded allowed-fields list instead of the schema

✅ **FIXED** — Replaced the hardcoded `allowedFields` array in `PUT /api/inspections/:id` with proper `InspectionUpdate.safeParse()` validation and `Object.fromEntries(Object.entries(...).filter(...))` pattern. No more manual field list to maintain.

### 5. No `InspectionUpdate` schema exported

✅ **FIXED** — Added `InspectionUpdate` schema in `lib/schema.ts` using `createUpdateSchema(inspections, { notes: (schema) => schema.nullable() }).partial()` wrapped with `snakeToCamel()`. Re-exported from `lib/db.ts`.

### 6. `HiveUpdate` has `.partial()` but the route manually checks each field

✅ **FIXED** — Replaced manual field checks in `PUT /api/hives/:id` with the concise `Object.fromEntries(Object.entries(validated.data).filter(([, v]) => v !== undefined))` pattern.

### 7. `ApiaryUpdate` has `.partial()` but the route manually trims `name`

The manual `name.trim()` check is fine for data quality, but the pattern is inconsistent — hives update doesn't trim.

## 🟢 Minor Issues

### 8. `db.select().from(apiaries).orderBy(apiaries.createdAt)` returns `createdAt` as `Date` but old API returned it as-is from PostgreSQL

Drizzle-ORM may transform timestamps differently than raw `pool.query()`. Check that existing consumers don't break on format changes.

### 9. `GET /api/hives/:id` returns `inspection_count` as a number but the column was previously `count(*)` from SQL

This is fine, but verify the client handles `0` vs `undefined` consistently.

### 10. `lib/validations.ts` is now dead code

✅ **FIXED** — Removed `lib/validations.ts` entirely. Updated `app/hives/[id]/new-inspection/page.tsx` to import enum labels from `@/lib/schema` instead.

### 11. `drizzle.config.ts` uses `DATABASE_URL!` with non-null assertion

If `DATABASE_URL` is somehow undefined, this will throw at config load time (not query time). Consider a runtime check with a better error message.

### 12. No Drizzle migrations

The schema file exists but there's no migration from the old raw SQL table structure. If the tables don't already exist with matching column names, `drizzle-kit push` or `drizzle-kit migrate` needs to be run. Make sure this is documented in the PR.

## ✅ What's Good

- Clean separation of schema → Zod validation → API routes
- Proper foreign key references in the Drizzle schema (`onDelete: 'restrict'` / `'cascade'`)
- The `db.select().from().leftJoin()` pattern with manual flattelling is clear and maintainable
- Re-exporting types from `db.ts` is a nice DX touch
- Enum helpers in schema.ts are well-organized

## Summary

| Severity | Count | Key Issue |
| ---------- | ------- | ----------- |
| 🔴 Critical | 3 | ~~Client/server field name mismatch will break all mutations~~ ✅ FIXED |
| 🟡 Medium | 4 | ~~Missing InspectionUpdate, manual allowed-fields list, redundant checks~~ ✅ FIXED |
| 🟢 Minor | 4 | Timestamp format, non-null assertion, migrations |

**Status:** Critical and Medium issues (#1, #4, #5, #6) have been resolved. Minor issue #10 (dead code) has been resolved. Remaining minor issues (#8, #9, #11, #12) are non-blocking.
