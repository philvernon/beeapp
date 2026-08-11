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
} from "drizzle-orm/pg-core";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";

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
	(val) => !("name" in val) || val.name === undefined || val.name.trim().length > 0,
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
		queenClipped: boolean("queen_clipped").default(false),
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
	.partial();

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
		queenSeen: boolean("queen_seen").default(false),
		queenColour: text("queen_colour", { enum: ["W", "Y", "R", "G", "B"] }),

		// Queen cells
		queenCellsFound: integer("queen_cells_found"),
		queenCellsRemoved: boolean("queen_cells_removed").default(false),

		// Brood
		eggsSeen: boolean("eggs_seen").default(false),
		broodPatternOk: boolean("brood_pattern_ok").default(true),
		broodFrameCount: integer("brood_frame_count"),

		// Stores & Space
		storeFrames: integer("store_frames"),
		roomFrames: integer("room_frames"),

		// Health
		healthOk: boolean("health_ok").default(true),
		chalkBroodSuspected: boolean("chalk_brood_suspected").default(false),
		efbSuspected: boolean("efb_suspected").default(false),
		afbSuspected: boolean("afb_suspected").default(false),

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
	],
);

export const InspectionInsert = createInsertSchema(inspections).refine(
	(val) => val.temperamentScore == null || (val.temperamentScore >= 1 && val.temperamentScore <= 10),
	{ message: "Temperament score must be between 1 and 10", path: ["temperamentScore"] },
).refine(
	(val) => val.queenCellsFound == null || val.queenCellsFound >= 0,
	{ message: "Queen cells found must not be negative", path: ["queenCellsFound"] },
).refine(
	(val) => val.storeFrames == null || val.storeFrames >= 0,
	{ message: "Store frames must not be negative", path: ["storeFrames"] },
).refine(
	(val) => val.broodFrameCount == null || val.broodFrameCount >= 0,
	{ message: "Brood frame count must not be negative", path: ["broodFrameCount"] },
).refine(
	(val) => val.roomFrames == null || val.roomFrames >= 0,
	{ message: "Room frames must not be negative", path: ["roomFrames"] },
).refine(
	(val) => val.varroaCount == null || val.varroaCount >= 0,
	{ message: "Varroa count must not be negative", path: ["varroaCount"] },
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
	.partial();

// ── Enum helpers (for UI dropdowns) ───────────────────────
export const queenColours = ["W", "Y", "R", "G", "B"] as const;
export const queenColourLabels: Record<string, string> = {
	W: "White",
	Y: "Yellow",
	R: "Red",
	G: "Green",
	B: "Blue",
};

export const varroaLevels = ["l", "m", "h"] as const;
export const varroaLevelLabels: Record<string, string> = {
	l: "Low",
	m: "Medium",
	h: "High",
};

export const weatherConditions = ["c", "s", "r", "f"] as const;
export const weatherConditionLabels: Record<string, string> = {
	c: "Cloudy",
	s: "Sunny",
	r: "Rain",
	f: "Fair",
};
