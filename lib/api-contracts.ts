/**
 * Client-safe HTTP transport contracts.
 *
 * Entity schemas are derived from the Drizzle-generated select schemas
 * (`lib/schema.ts`) via `.extend()` — only genuine HTTP differences are
 * added or overridden:
 *   - createdAt: Date → string (ISO-8601)
 *   - Joined fields: apiaryName, hiveName
 *   - Derived fields: inspectionCount, hiveCount
 *   - Endpoint-specific shapes: success envelopes
 *
 * If a DB column is added/removed or its nullability changes, the Zod
 * schema follows automatically.  The only handwritten pieces are things
 * that do not exist in the database.
 *
 * Rules:
 * - No server-only / DB / query imports.
 * - Nullable DB fields stay nullable (never coerced to undefined).
 */

import { z } from "zod";
import {
  ApiarySelect,
  HiveSelect,
  InspectionSelect,
} from "./schema.js";

// ── Shared error contracts ───────────────────────────────────────────────────

/** Standard API error: { error: string } */
export const ApiErrorSchema = z.object({
  error: z.string(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Validation-detail error: { error: "Validation failed", details: ZodIssue[] } */
export const ApiValidationErrorSchema = z.object({
  error: z.literal("Validation failed"),
  details: z.array(z.unknown()),
});
export type ApiValidationError = z.infer<typeof ApiValidationErrorSchema>;

// ── Apiary transport schemas ─────────────────────────────────────────────────

/**
 * Base apiary schema derived from Drizzle, with createdAt as string.
 */
const ApiaryTransportSchema = ApiarySelect.extend({
  createdAt: z.string(),
});

/** Minimal apiary shape returned by GET /api/apiaries (list). */
export const ApiaryListSchema = ApiaryTransportSchema;
export type ApiaryList = z.infer<typeof ApiaryListSchema>;

// ── Hive transport schemas ───────────────────────────────────────────────────

/**
 * Hive schema derived from Drizzle, with createdAt as string.
 */
const HiveTransportSchema = HiveSelect.extend({
  createdAt: z.string(),
});

/**
 * Hive shape with joined apiaryName and inspectionCount.
 * These fields come from the query layer (LEFT JOIN + aggregate), not the DB table.
 */
export const HiveListSchema = HiveTransportSchema.extend({
  apiaryName: z.string().nullable(),
  inspectionCount: z.number(),
});
export type HiveList = z.infer<typeof HiveListSchema>;

/** Hive detail — same shape as list (GET /api/hives/:id returns the same fields). */
export const HiveDetailSchema = HiveListSchema;
export type HiveDetail = z.infer<typeof HiveDetailSchema>;

/** Full apiary shape returned by GET /api/apiaries/:id (detail with hives). */
export const ApiaryDetailSchema = ApiaryTransportSchema.extend({
  hiveCount: z.number(),
  hives: z.array(HiveListSchema),
});
export type ApiaryDetail = z.infer<typeof ApiaryDetailSchema>;

// ── Inspection transport schemas ─────────────────────────────────────────────

/**
 * Base inspection schema derived from Drizzle, with createdAt as string.
 *
 * All boolean fields are non-null because the DB schema enforces NOT NULL
 * with defaults (queenSeen, healthOk, queenCellsRemoved, eggsSeen,
 * broodPatternOk, chalkBroodSuspected, efbSuspected, afbSuspected).
 */
const InspectionTransportSchema = InspectionSelect.extend({
  createdAt: z.string(),
});

/**
 * Inspection shape with joined hiveName and apiaryName.
 * These fields come from the query layer (LEFT JOINs), not the DB table.
 */
export const InspectionListSchema = InspectionTransportSchema.extend({
  hiveName: z.string().nullable().optional(),
  apiaryName: z.string().nullable().optional(),
});
export type InspectionList = z.infer<typeof InspectionListSchema>;

/** Inspection detail — same shape as list. */
export const InspectionDetailSchema = InspectionListSchema;
export type InspectionDetail = z.infer<typeof InspectionDetailSchema>;

// ── Success / flag responses ─────────────────────────────────────────────────

/** POST /api/inspections returns { success: true } on creation. */
export const InspectionCreatedSchema = z.object({
  success: z.literal(true),
});
export type InspectionCreated = z.infer<typeof InspectionCreatedSchema>;

// ── Last-inspection shape (embedded in apiary hives) ─────────────────────────

/** Minimal last-inspection snapshot embedded in apiary hive objects. */
export const LastInspectionSchema = z.object({
  id: z.string().uuid(),
  inspectionDate: z.string(),
  queenSeen: z.boolean(),
  healthOk: z.boolean(),
});
export type LastInspection = z.infer<typeof LastInspectionSchema>;
