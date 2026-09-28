/**
 * Client-safe HTTP transport contracts.
 *
 * These Zod schemas describe the shape of data that crosses the API/client
 * boundary.  They are deliberately independent of the database schema
 * (`lib/schema.ts`) — timestamps are strings, joined/derived fields are
 * explicit, and booleans reflect the actual persisted contract (non-null).
 *
 * Rules:
 * - No server-only / DB / query imports.
 * - Timestamps are ISO-8601 strings (JSON transport value), not Date objects.
 * - Joined fields (apiaryName, hiveName, inspectionCount) are modelled explicitly.
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

// ── Apiary transport types ───────────────────────────────────────────────────

/** Minimal apiary shape returned by GET /api/apiaries (list). */
export const ApiaryListSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(), // ISO-8601 timestamp from JSON
});
export type ApiaryList = z.infer<typeof ApiaryListSchema>;

// ── Hive transport types (forward-declared for ApiaryDetail) ────────────────

/** Hive shape with joined apiaryName and inspectionCount. */
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

// ── Serialization helpers (server-side) ──────────────────────────────────────

/** Convert a Date to an ISO-8601 string for JSON transport. */
function toDateStr(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") return val;
  return String(val);
}

/** Serialize a single apiary row to the ApiaryList transport shape. */
export function serializeApiary(row: {
  id: string;
  name: string;
  notes: string | null;
  createdAt: Date | string;
}): ApiaryList {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    createdAt: toDateStr(row.createdAt),
  };
}

/** Serialize an apiary-with-hives response (GET /api/apiaries/:id). */
export function serializeApiaryWithHives(row: {
  id: string;
  name: string;
  notes: string | null;
  createdAt: Date | string;
  hiveCount: number;
  hives: Array<{
    id: string;
    apiaryId: string;
    name: string;
    apiaryName: string | null;
    queenBreed: string | null;
    queenClipped: boolean;
    notes: string | null;
    createdAt: Date | string;
    inspectionCount: number;
  }>;
}): ApiaryDetail {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    createdAt: toDateStr(row.createdAt),
    hiveCount: row.hiveCount,
    hives: row.hives.map((h) => serializeHive(h)),
  };
}

/** Serialize a hive row to the HiveList transport shape.
 *
 * When called from list/detail routes the row includes joined
 * `apiaryName` and `inspectionCount`.  When called from the POST
 * route (raw DB insert) those fields are absent — defaults are used.
 */
export function serializeHive(row: {
  id: string;
  apiaryId: string;
  name: string;
  apiaryName?: string | null;
  queenBreed: string | null;
  queenClipped: boolean;
  notes: string | null;
  createdAt: Date | string;
  inspectionCount?: number;
}): HiveList {
  return {
    id: row.id,
    apiaryId: row.apiaryId,
    name: row.name,
    apiaryName: row.apiaryName ?? null,
    queenBreed: row.queenBreed,
    queenClipped: row.queenClipped,
    notes: row.notes,
    createdAt: toDateStr(row.createdAt),
    inspectionCount: row.inspectionCount ?? 0,
  };
}

/** Serialize an inspection row to the InspectionList transport shape.
 *
 * When called from list/detail routes the row includes joined
 * `hiveName` and `apiaryName`.  When called from the PUT route
 * (raw DB update) those fields are absent — defaults are used.
 */
export function serializeInspection(row: {
  id: string;
  hiveId: string;
  inspectionDate: string;
  queenSeen: boolean;
  queenColour?: string | null | undefined;
  queenCellsFound?: number | null | undefined;
  queenCellsRemoved: boolean;
  eggsSeen: boolean;
  broodPatternOk: boolean;
  broodFrameCount?: number | null | undefined;
  storeFrames?: number | null | undefined;
  roomFrames?: number | null | undefined;
  healthOk: boolean;
  chalkBroodSuspected?: boolean;
  efbSuspected?: boolean;
  afbSuspected?: boolean;
  varroaLevel?: string | null | undefined;
  varroaCount?: number | null | undefined;
  temperamentScore?: number | null | undefined;
  feedLitresLightSyrup?: string | null | undefined;
  feedLitresHeavySyrup?: string | null | undefined;
  supersChange?: string | null | undefined;
  weatherTemperatureC?: string | null | undefined;
  weatherCondition?: string | null | undefined;
  notes?: string | null | undefined;
  createdAt: Date | string;
  hiveName?: string | null | undefined;
  apiaryName?: string | null | undefined;
}): InspectionList {
  return {
    id: row.id,
    hiveId: row.hiveId,
    inspectionDate: row.inspectionDate,
    queenSeen: row.queenSeen,
    queenColour: row.queenColour ?? undefined,
    queenCellsFound: row.queenCellsFound ?? undefined,
    queenCellsRemoved: row.queenCellsRemoved,
    eggsSeen: row.eggsSeen,
    broodPatternOk: row.broodPatternOk,
    broodFrameCount: row.broodFrameCount ?? undefined,
    storeFrames: row.storeFrames ?? undefined,
    roomFrames: row.roomFrames ?? undefined,
    healthOk: row.healthOk,
    chalkBroodSuspected: row.chalkBroodSuspected ?? false,
    efbSuspected: row.efbSuspected ?? false,
    afbSuspected: row.afbSuspected ?? false,
    varroaLevel: row.varroaLevel ?? undefined,
    varroaCount: row.varroaCount ?? undefined,
    temperamentScore: row.temperamentScore ?? undefined,
    feedLitresLightSyrup: row.feedLitresLightSyrup ?? undefined,
    feedLitresHeavySyrup: row.feedLitresHeavySyrup ?? undefined,
    supersChange: row.supersChange ?? undefined,
    weatherTemperatureC: row.weatherTemperatureC ?? undefined,
    weatherCondition: row.weatherCondition ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: toDateStr(row.createdAt),
    hiveName: row.hiveName ?? undefined,
    apiaryName: row.apiaryName ?? undefined,
  };
}

/** Serialize a last-inspection snapshot. */
export function serializeLastInspection(row: {
  id: string;
  inspectionDate: Date | string;
  queenSeen: boolean;
  healthOk: boolean;
}): LastInspection {
  return {
    id: row.id,
    inspectionDate: toDateStr(row.inspectionDate),
    queenSeen: row.queenSeen,
    healthOk: row.healthOk,
  };
}
