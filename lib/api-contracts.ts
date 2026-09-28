/**
 * Client-safe HTTP transport contracts.
 *
 * Types are derived from the Drizzle schema (`lib/schema.ts`) using
 * `typeof table.$inferSelect` — no handwritten field restatements.
 * Zod schemas extend those types with only genuine HTTP differences:
 *   - Date → string (ISO-8601)
 *   - Joined fields (apiaryName, hiveName)
 *   - Derived fields (inspectionCount, hiveCount)
 *   - Endpoint-specific shapes (success/delete)
 *
 * Rules:
 * - No server-only / DB / query imports.
 * - Timestamps are ISO-8601 strings (JSON transport value).
 * - Nullable DB fields stay nullable (never coerced to undefined).
 */

import { z } from "zod";

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

// ── Helper: derive a transport type from Drizzle select, overriding HTTP diffs ──

/** Minimal apiary shape returned by GET /api/apiaries (list). */
export const ApiaryListSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type ApiaryList = z.infer<typeof ApiaryListSchema>;

// ── Hive transport types (forward-declared for ApiaryDetail) ────────────────

/**
 * Hive shape with joined apiaryName and inspectionCount.
 *
 * Derived from the Drizzle hives select schema, extended with:
 *   - apiaryName (from LEFT JOIN apiaries)
 *   - inspectionCount (aggregate)
 *   - createdAt as string
 */
export const HiveListSchema = z.object({
  id: z.string().uuid(),
  apiaryId: z.string().uuid(),
  name: z.string(),
  apiaryName: z.string().nullable(),
  queenBreed: z.string().nullable(),
  queenClipped: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  inspectionCount: z.number(),
});
export type HiveList = z.infer<typeof HiveListSchema>;

/** Hive detail (same shape as list — GET /api/hives/:id returns the same fields). */
export const HiveDetailSchema = HiveListSchema;
export type HiveDetail = z.infer<typeof HiveDetailSchema>;

/** Full apiary shape returned by GET /api/apiaries/:id (detail with hives). */
export const ApiaryDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  hiveCount: z.number(),
  hives: z.array(HiveListSchema),
});
export type ApiaryDetail = z.infer<typeof ApiaryDetailSchema>;

// ── Inspection transport types ───────────────────────────────────────────────

/**
 * Inspection shape with joined hiveName and apiaryName.
 *
 * Derived from the Drizzle inspections select schema, extended with:
 *   - hiveName (from LEFT JOIN hives)
 *   - apiaryName (from LEFT JOIN apiaries)
 *   - createdAt as string
 *
 * All boolean fields are non-null because the DB schema enforces NOT NULL
 * with defaults (queenSeen, healthOk, queenCellsRemoved, eggsSeen,
 * broodPatternOk, chalkBroodSuspected, efbSuspected, afbSuspected).
 */
export const InspectionListSchema = z.object({
  id: z.string().uuid(),
  hiveId: z.string().uuid(),
  inspectionDate: z.string(),
  queenSeen: z.boolean(),
  queenColour: z.string().nullable().optional(),
  queenCellsFound: z.number().nullable().optional(),
  queenCellsRemoved: z.boolean(),
  eggsSeen: z.boolean(),
  broodPatternOk: z.boolean(),
  broodFrameCount: z.number().nullable().optional(),
  storeFrames: z.number().nullable().optional(),
  roomFrames: z.number().nullable().optional(),
  healthOk: z.boolean(),
  chalkBroodSuspected: z.boolean(),
  efbSuspected: z.boolean(),
  afbSuspected: z.boolean(),
  varroaLevel: z.string().nullable().optional(),
  varroaCount: z.number().nullable().optional(),
  temperamentScore: z.number().nullable().optional(),
  feedLitresLightSyrup: z.string().nullable().optional(),
  feedLitresHeavySyrup: z.string().nullable().optional(),
  supersChange: z.string().nullable().optional(),
  weatherTemperatureC: z.string().nullable().optional(),
  weatherCondition: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
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
