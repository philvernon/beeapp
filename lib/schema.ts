import { pgTable, uuid, text, boolean, integer, numeric, timestamp, date } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';

// Helper: coerce numeric strings to numbers for API responses
function numericToNumber(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(n) ? null : n;
}

// ── Apiaries ──────────────────────────────────────────────
export const apiaries = pgTable('apiaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ApiaryInsert = createInsertSchema(apiaries);
export const ApiarySelect = createSelectSchema(apiaries);
export const ApiaryUpdate = createUpdateSchema(apiaries, {
  notes: (schema) => schema.nullable(),
}).partial();

// ── Hives ─────────────────────────────────────────────────
export const hives = pgTable('hives', {
  id: uuid('id').defaultRandom().primaryKey(),
  apiaryId: uuid('apiary_id').notNull().references(() => apiaries.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  queenBreed: text('queen_breed'),
  queenClipped: boolean('queen_clipped').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const HiveInsert = createInsertSchema(hives);
export const HiveSelect = createSelectSchema(hives);
export const HiveUpdate = createUpdateSchema(hives, {
  apiaryId: (schema) => schema.nullable(),
  queenBreed: (schema) => schema.nullable(),
  notes: (schema) => schema.nullable(),
}).partial();

// ── Inspections ───────────────────────────────────────────
export const inspections = pgTable('inspections', {
  id: uuid('id').defaultRandom().primaryKey(),
  hiveId: uuid('hive_id').notNull().references(() => hives.id, { onDelete: 'cascade' }),
  inspectionDate: date('inspection_date').notNull(),

  // Queen
  queenSeen: boolean('queen_seen').default(false),
  queenColour: text('queen_colour').$type<'W' | 'Y' | 'R' | 'G' | 'B' | null>().nullable(),

  // Queen cells
  queenCellsFound: integer('queen_cells_found').min(0).nullable(),
  queenCellsRemoved: boolean('queen_cells_removed').default(false),

  // Brood
  eggsSeen: boolean('eggs_seen').default(false),
  broodPatternOk: boolean('brood_pattern_ok').default(true),
  broodFrameCount: integer('brood_frame_count').min(0).nullable(),

  // Stores & Space
  storeFrames: integer('store_frames').min(0).nullable(),
  roomFrames: integer('room_frames').min(0).nullable(),

  // Health
  healthOk: boolean('health_ok').default(true),
  chalkBroodSuspected: boolean('chalk_brood_suspected').default(false),
  efbSuspected: boolean('efb_suspected').default(false),
  afbSuspected: boolean('afb_suspected').default(false),

  // Varroa
  varroaLevel: text('varroa_level').$type<'l' | 'm' | 'h' | null>().nullable(),
  varroaCount: integer('varroa_count').min(0).nullable(),

  // Temperament
  temperamentScore: integer('temperament_score').min(1).max(10).nullable(),

  // Feed
  feedLitresLightSyrup: numeric('feed_litres_light_syrup', { precision: 5, scale: 2 }).nullable(),
  feedLitresHeavySyrup: numeric('feed_litres_heavy_syrup', { precision: 5, scale: 2 }).nullable(),

  // Supers
  supersChange: numeric('supers_change', { precision: 5, scale: 2 }).nullable(),

  // Weather
  weatherTemperatureC: numeric('weather_temperature_c', { precision: 4, scale: 1 }).nullable(),
  weatherCondition: text('weather_condition').$type<'c' | 's' | 'r' | 'f' | null>().nullable(),

  // Notes
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const InspectionInsert = createInsertSchema(inspections);
export const InspectionSelect = createSelectSchema(inspections);

// ── Enum helpers (for UI dropdowns) ───────────────────────
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
