import {
	pgTable,
	uuid,
	text,
	boolean,
	integer,
	numeric,
	timestamp,
	date,
} from "drizzle-orm/pg-core";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

// Helper: accept snake_case keys and transform to camelCase for Drizzle.
// This lets client pages keep sending snake_case while the API layer works in camelCase.
function snakeToCamel<T extends z.ZodType>(
	schema: T,
): ReturnType<typeof schema.transform<z.output<T>>> {
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

// ── Apiaries ──────────────────────────────────────────────
export const apiaries = pgTable("apiaries", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	notes: text("notes"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const ApiaryInsert = snakeToCamel(createInsertSchema(apiaries));
export const ApiarySelect = createSelectSchema(apiaries);
export const ApiaryUpdate = snakeToCamel(
	createUpdateSchema(apiaries, {
		notes: (schema) => schema.nullable(),
	}).partial(),
);

// ── Hives ─────────────────────────────────────────────────
export const hives = pgTable("hives", {
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
});

export const HiveInsert = snakeToCamel(createInsertSchema(hives));
export const HiveSelect = createSelectSchema(hives);
export const HiveUpdate = snakeToCamel(
	createUpdateSchema(hives, {
		apiaryId: (schema) => schema.nullable(),
		queenBreed: (schema) => schema.nullable(),
		notes: (schema) => schema.nullable(),
	}).partial(),
);

// ── Inspections ───────────────────────────────────────────
export const inspections = pgTable("inspections", {
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
});

export const InspectionInsert = snakeToCamel(createInsertSchema(inspections));
export const InspectionSelect = createSelectSchema(inspections);
export const InspectionUpdate = snakeToCamel(
	createUpdateSchema(inspections, {
		notes: (schema) => schema.nullable(),
	}).partial(),
);

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
