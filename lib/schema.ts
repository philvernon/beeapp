import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  date,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

// ── Apiaries ──────────────────────────────────────────────
export const apiaries = pgTable("apiaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const ApiaryInsert = createInsertSchema(apiaries).refine(
  (val) => val.name.trim().length > 0,
  { message: "Name must not be empty", path: ["name"] },
);
export const ApiarySelect = createSelectSchema(apiaries);
export const ApiaryUpdate = createUpdateSchema(apiaries, {
  notes: (schema) => schema.nullable(),
})
  .omit({ id: true, createdAt: true })
  .partial()
  .refine(
    (val) =>
      !("name" in val) || val.name === undefined || val.name.trim().length > 0,
    { message: "Name must not be empty", path: ["name"] },
  );

// ── Hives ─────────────────────────────────────────────────
export const hives = pgTable(
  "hives",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    apiaryId: uuid("apiary_id")
      .notNull()
      .references(() => apiaries.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    queenBreed: text("queen_breed"),
    queenClipped: boolean("queen_clipped").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("idx_hives_apiary_id").on(t.apiaryId)],
);

export const HiveInsert = createInsertSchema(hives).refine(
  (val) => val.name.trim().length > 0,
  { message: "Name must not be empty", path: ["name"] },
);
export const HiveSelect = createSelectSchema(hives);
export const HiveUpdate = createUpdateSchema(hives, {
  queenBreed: (schema) => schema.nullable(),
  notes: (schema) => schema.nullable(),
})
  .omit({ id: true, createdAt: true })
  .partial()
  .refine(
    (val) =>
      !("name" in val) || val.name === undefined || val.name.trim().length > 0,
    { message: "Name must not be empty", path: ["name"] },
  )
  .refine((val) => !("apiaryId" in val) || val.apiaryId !== null, {
    message: "Apiary ID is required",
    path: ["apiaryId"],
  });

// ── Inspections ───────────────────────────────────────────
export const inspections = pgTable(
  "inspections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hiveId: uuid("hive_id")
      .notNull()
      .references(() => hives.id, { onDelete: "cascade" }),
    inspectionDate: date("inspection_date").notNull(),

    // Queen
    queenSeen: boolean("queen_seen").notNull().default(false),
    queenColour: text("queen_colour", { enum: ["W", "Y", "R", "G", "B"] }),

    // Queen cells
    queenCellsFound: integer("queen_cells_found"),
    queenCellsRemoved: boolean("queen_cells_removed").notNull().default(false),

    // Brood
    eggsSeen: boolean("eggs_seen").notNull().default(false),
    broodPatternOk: boolean("brood_pattern_ok").notNull().default(true),
    broodFrameCount: integer("brood_frame_count"),

    // Stores & Space
    storeFrames: integer("store_frames"),
    roomFrames: integer("room_frames"),

    // Health
    healthOk: boolean("health_ok").notNull().default(true),
    chalkBroodSuspected: boolean("chalk_brood_suspected")
      .notNull()
      .default(false),
    efbSuspected: boolean("efb_suspected").notNull().default(false),
    afbSuspected: boolean("afb_suspected").notNull().default(false),

    // Varroa
    varroaLevel: text("varroa_level", { enum: ["l", "m", "h"] }),
    varroaCount: integer("varroa_count"),

    // Temperament
    temperamentScore: integer("temperament_score"),

    // Feed
    feedLitresLightSyrup: numeric("feed_litres_light_syrup", {
      precision: 5,
      scale: 2,
    }),
    feedLitresHeavySyrup: numeric("feed_litres_heavy_syrup", {
      precision: 5,
      scale: 2,
    }),

    // Supers
    supersChange: numeric("supers_change", { precision: 5, scale: 2 }),

    // Weather
    weatherTemperatureC: numeric("weather_temperature_c", {
      precision: 4,
      scale: 1,
    }),
    weatherCondition: text("weather_condition", { enum: ["c", "s", "r", "f"] }),

    // Notes
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_inspections_hive_date").on(t.hiveId, t.inspectionDate.desc()),
    check("check_queen_cells_found", sql`${t.queenCellsFound} >= 0`),
    check("check_brood_frame_count", sql`${t.broodFrameCount} >= 0`),
    check("check_store_frames", sql`${t.storeFrames} >= 0`),
    check("check_room_frames", sql`${t.roomFrames} >= 0`),
    check("check_varroa_count", sql`${t.varroaCount} >= 0`),
    check(
      "check_temperament_score",
      sql`${t.temperamentScore} BETWEEN 1 AND 10`,
    ),
    check("check_feed_litres_light_syrup", sql`${t.feedLitresLightSyrup} >= 0`),
    check("check_feed_litres_heavy_syrup", sql`${t.feedLitresHeavySyrup} >= 0`),
    check(
      "check_queen_colour",
      sql`${t.queenColour} IS NULL OR ${t.queenColour} IN ('W', 'Y', 'R', 'G', 'B')`,
    ),
    check(
      "check_varroa_level",
      sql`${t.varroaLevel} IS NULL OR ${t.varroaLevel} IN ('l', 'm', 'h')`,
    ),
    check(
      "check_weather_condition",
      sql`${t.weatherCondition} IS NULL OR ${t.weatherCondition} IN ('c', 's', 'r', 'f')`,
    ),
  ],
);
// Shared numeric invariants for inspections (insert + update)
function inspectionNumericInvariants(
  val: {
    temperamentScore?: number | null;
    queenCellsFound?: number | null;
    storeFrames?: number | null;
    broodFrameCount?: number | null;
    roomFrames?: number | null;
    varroaCount?: number | null;
    feedLitresLightSyrup?: string | null;
    feedLitresHeavySyrup?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  if (
    val.temperamentScore != null &&
    (val.temperamentScore < 1 || val.temperamentScore > 10)
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Temperament score must be between 1 and 10",
      path: ["temperamentScore"],
    });
  }
  if (val.queenCellsFound != null && val.queenCellsFound < 0) {
    ctx.addIssue({
      code: "custom",
      message: "Queen cells found must not be negative",
      path: ["queenCellsFound"],
    });
  }
  if (val.storeFrames != null && val.storeFrames < 0) {
    ctx.addIssue({
      code: "custom",
      message: "Store frames must not be negative",
      path: ["storeFrames"],
    });
  }
  if (val.broodFrameCount != null && val.broodFrameCount < 0) {
    ctx.addIssue({
      code: "custom",
      message: "Brood frame count must not be negative",
      path: ["broodFrameCount"],
    });
  }
  if (val.roomFrames != null && val.roomFrames < 0) {
    ctx.addIssue({
      code: "custom",
      message: "Room frames must not be negative",
      path: ["roomFrames"],
    });
  }
  if (val.varroaCount != null && val.varroaCount < 0) {
    ctx.addIssue({
      code: "custom",
      message: "Varroa count must not be negative",
      path: ["varroaCount"],
    });
  }
  if (
    val.feedLitresLightSyrup != null &&
    Number(val.feedLitresLightSyrup) < 0
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Light syrup quantity must not be negative",
      path: ["feedLitresLightSyrup"],
    });
  }
  if (
    val.feedLitresHeavySyrup != null &&
    Number(val.feedLitresHeavySyrup) < 0
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Heavy syrup quantity must not be negative",
      path: ["feedLitresHeavySyrup"],
    });
  }
}

export const InspectionInsert = createInsertSchema(inspections).superRefine(
  inspectionNumericInvariants,
);
export const InspectionSelect = createSelectSchema(inspections);
export const InspectionUpdate = createUpdateSchema(inspections, {
  queenColour: (schema) => schema.nullable(),
  queenCellsFound: (schema) => schema.nullable(),
  broodFrameCount: (schema) => schema.nullable(),
  storeFrames: (schema) => schema.nullable(),
  roomFrames: (schema) => schema.nullable(),
  varroaLevel: (schema) => schema.nullable(),
  varroaCount: (schema) => schema.nullable(),
  temperamentScore: (schema) => schema.nullable(),
  feedLitresLightSyrup: (schema) => schema.nullable(),
  feedLitresHeavySyrup: (schema) => schema.nullable(),
  supersChange: (schema) => schema.nullable(),
  weatherTemperatureC: (schema) => schema.nullable(),
  weatherCondition: (schema) => schema.nullable(),
  notes: (schema) => schema.nullable(),
})
  .omit({ id: true, createdAt: true })
  .partial()
  .superRefine(inspectionNumericInvariants);

// ── Inspection option type exports (inferred from Drizzle schema) ──
// These types let inspection-options.ts stay compile-time constrained
// by the DB enum definitions without importing at runtime.
export type QueenColour = NonNullable<
  (typeof inspections.$inferSelect)["queenColour"]
>;
export type VarroaLevel = NonNullable<
  (typeof inspections.$inferSelect)["varroaLevel"]
>;
export type WeatherCondition = NonNullable<
  (typeof inspections.$inferSelect)["weatherCondition"]
>;
