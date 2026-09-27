CREATE TABLE "apiaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"apiary_id" uuid NOT NULL,
	"name" text NOT NULL,
	"queen_breed" text,
	"queen_clipped" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hive_id" uuid NOT NULL,
	"inspection_date" date NOT NULL,
	"queen_seen" boolean DEFAULT false NOT NULL,
	"queen_colour" text,
	"queen_cells_found" integer,
	"queen_cells_removed" boolean DEFAULT false NOT NULL,
	"eggs_seen" boolean DEFAULT false NOT NULL,
	"brood_pattern_ok" boolean DEFAULT true NOT NULL,
	"brood_frame_count" integer,
	"store_frames" integer,
	"room_frames" integer,
	"health_ok" boolean DEFAULT true NOT NULL,
	"chalk_brood_suspected" boolean DEFAULT false NOT NULL,
	"efb_suspected" boolean DEFAULT false NOT NULL,
	"afb_suspected" boolean DEFAULT false NOT NULL,
	"varroa_level" text,
	"varroa_count" integer,
	"temperament_score" integer,
	"feed_litres_light_syrup" numeric(5, 2),
	"feed_litres_heavy_syrup" numeric(5, 2),
	"supers_change" numeric(5, 2),
	"weather_temperature_c" numeric(4, 1),
	"weather_condition" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_queen_cells_found" CHECK ("inspections"."queen_cells_found" >= 0),
	CONSTRAINT "check_brood_frame_count" CHECK ("inspections"."brood_frame_count" >= 0),
	CONSTRAINT "check_store_frames" CHECK ("inspections"."store_frames" >= 0),
	CONSTRAINT "check_room_frames" CHECK ("inspections"."room_frames" >= 0),
	CONSTRAINT "check_varroa_count" CHECK ("inspections"."varroa_count" >= 0),
	CONSTRAINT "check_temperament_score" CHECK ("inspections"."temperament_score" BETWEEN 1 AND 10),
	CONSTRAINT "check_feed_litres_light_syrup" CHECK ("inspections"."feed_litres_light_syrup" >= 0),
	CONSTRAINT "check_feed_litres_heavy_syrup" CHECK ("inspections"."feed_litres_heavy_syrup" >= 0),
	CONSTRAINT "check_queen_colour" CHECK ("inspections"."queen_colour" IS NULL OR "inspections"."queen_colour" IN ('W', 'Y', 'R', 'G', 'B')),
	CONSTRAINT "check_varroa_level" CHECK ("inspections"."varroa_level" IS NULL OR "inspections"."varroa_level" IN ('l', 'm', 'h')),
	CONSTRAINT "check_weather_condition" CHECK ("inspections"."weather_condition" IS NULL OR "inspections"."weather_condition" IN ('c', 's', 'r', 'f'))
);
--> statement-breakpoint
ALTER TABLE "hives" ADD CONSTRAINT "hives_apiary_id_apiaries_id_fk" FOREIGN KEY ("apiary_id") REFERENCES "public"."apiaries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_hive_id_hives_id_fk" FOREIGN KEY ("hive_id") REFERENCES "public"."hives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_hives_apiary_id" ON "hives" USING btree ("apiary_id");--> statement-breakpoint
CREATE INDEX "idx_inspections_hive_date" ON "inspections" USING btree ("hive_id","inspection_date" DESC NULLS LAST);