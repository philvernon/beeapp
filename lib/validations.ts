import { z } from 'zod';

// ── Apiary ──────────────────────────────────────────────
export const apiaryCreateSchema = z.object({
  name: z.string().min(1, 'Apiary name is required').max(200),
  notes: z.string().optional(),
});
export type ApiaryCreateInput = z.infer<typeof apiaryCreateSchema>;

// ── Hive ────────────────────────────────────────────────
export const hiveCreateSchema = z.object({
  apiary_id: z.string().uuid('Invalid apiary ID'),
  name: z.string().min(1, 'Hive name is required').max(200),
  queen_breed: z.string().max(100).optional().or(z.literal('')),
  queen_clipped: z.boolean().default(false),
  notes: z.string().optional(),
});
export type HiveCreateInput = z.infer<typeof hiveCreateSchema>;

export const hiveUpdateSchema = hiveCreateSchema.partial();
export type HiveUpdateInput = z.infer<typeof hiveUpdateSchema>;

// ── Inspection ──────────────────────────────────────────
export const inspectionCreateSchema = z.object({
  hive_id: z.string().uuid('Invalid hive ID'),
  inspection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  queen_seen: z.boolean().optional().default(false),
  queen_colour: z.enum(['W', 'Y', 'R', 'G', 'B']).nullable(),
  queen_cells_found: z.coerce.number().int().min(0).nullable(),
  queen_cells_removed: z.boolean().optional().default(false),
  eggs_seen: z.boolean().optional().default(false),
  brood_pattern_ok: z.boolean().optional().default(true),
  brood_frame_count: z.coerce.number().int().min(0).nullable(),
  store_frames: z.coerce.number().int().min(0).nullable(),
  room_frames: z.coerce.number().int().min(0).nullable(),
  health_ok: z.boolean().optional().default(true),
  chalk_brood_suspected: z.boolean().optional().default(false),
  efb_suspected: z.boolean().optional().default(false),
  afb_suspected: z.boolean().optional().default(false),
  varroa_level: z.enum(['l', 'm', 'h']).nullable(),
  varroa_count: z.coerce.number().int().min(0).nullable(),
  temperament_score: z.coerce.number().int().min(1).max(10).nullable(),
  feed_litres_light_syrup: z.coerce.number().min(0).nullable(),
  feed_litres_heavy_syrup: z.coerce.number().min(0).nullable(),
  supers_change: z.coerce.number().nullable(),
  weather_temperature_c: z.coerce.number().nullable(),
  weather_condition: z.enum(['c', 's', 'r', 'f']).nullable(),
  notes: z.string().optional(),
});
export type InspectionCreateInput = z.infer<typeof inspectionCreateSchema>;

// ── Enums (for UI) ──────────────────────────────────────
export const queenColours = ['W', 'Y', 'R', 'G', 'B'] as const;
export const queenColourLabels: Record<string, string> = {
  W: 'White', Y: 'Yellow', R: 'Red', G: 'Green', B: 'Blue',
};

export const varroaLevels = ['l', 'm', 'h'] as const;
export const varroaLevelLabels: Record<string, string> = {
  l: 'Low', m: 'Medium', h: 'High',
};

export const weatherConditions = ['c', 's', 'r', 'f'] as const;
export const weatherConditionLabels: Record<string, string> = {
  c: 'Cloudy', s: 'Sunny', r: 'Rain', f: 'Fair',
};
