# Beehive Tracking App — Design Document

## Recommended Stack

| Layer          | Choice                        | Why                                                                  |
| -------------- | ----------------------------- | -------------------------------------------------------------------- |
| **DB**         | PostgreSQL (Docker container) | Self-hosted, full control, no vendor lock-in                         |
| **Driver**     | `pg` (node-postgres)          | Lightweight, works with any Postgres instance                        |
| **ORM**        | None initially                | Your schema is simple — raw SQL is fine                              |
| **Validation** | Zod                           | Type-safe server-side validation, works great with TypeScript        |
| **Hosting**    | Docker Compose                | Next.js + PostgreSQL in one compose file, self-hosted on your server |

## What gets built

```
beeapp/
├── app/
│   ├── layout.tsx          ← existing
│   ├── page.tsx            ← existing (landing)
│   ├── apiaries/
│   │   ├── page.tsx        ← Apiary list
│   │   ├── new/page.tsx    ← Create apiary form
│   │   └── [id]/
│   │       ├── page.tsx    ← Apiary detail + hives
│   │       └── edit/page.tsx ← Edit apiary form
│   ├── hives/
│   │   ├── page.tsx        ← Hive list
│   │   ├── new/page.tsx    ← Create hive form
│   │   └── [id]/
│   │       ├── page.tsx    ← Hive detail + inspections
│   │       ├── edit/page.tsx ← Edit hive form
│   │       └── new-inspection/
│   │           └── page.tsx ← Inspection form
│   ├── analytics/page.tsx  ← Analytics dashboard
│   └── api/
│       ├── apiaries/route.ts         ← Apiary collection CRUD (GET, POST)
│       ├── apiaries/[id]/route.ts    ← Apiary single-resource CRUD (GET, PUT, DELETE)
│       ├── hives/route.ts            ← Hive collection CRUD (GET, POST)
│       ├── hives/[id]/route.ts       ← Hive single-resource CRUD (GET, PUT, DELETE)
│       ├── inspections/route.ts      ← Inspection collection CRUD (GET, POST)
│       └── inspections/[id]/route.ts ← Inspection single-resource CRUD (GET, PUT, DELETE)
├── lib/
│   ├── db.ts               ← pg connection pool
│   └── validations.ts      ← Zod schemas
├── migrations/
│   └── 001_initial.sql     ← Table definitions
├── docker-compose.yml      ← Next.js + PostgreSQL
├── .env.local              ← DATABASE_URL (dev)
└── .env                    ← DATABASE_URL (production)
```

## Docker Compose

```yaml
services:
  db:
    image: postgres:18-alpine
    container_name: postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-beehive}
      POSTGRES_USER: ${POSTGRES_USER:-bee}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "${DB_PORT:-5432}:5432" # remove in production if DB shouldn't be externally reachable
    volumes:
      - postgres_data:/var/lib/postgresql
      - ./migrations:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  app:
    build: .
    restart: unless-stopped
    ports:
      - "${APP_PORT:-3000}:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      db:
        condition: service_healthy

volumes:
  postgres_data:
```

## The SQL (migrations/001_initial.sql)

### Hive-level fields (from the header section of the record sheet)

- **Apiary** → `apiaries.name` (separate table, hives reference via FK)
- **Colony** → `hives.name`
- **Queen breed from** → `hives.queen_breed`
- **Queen Clipped?** → `hives.queen_clipped` (boolean)

### Per-inspection fields (from the row columns)

- **Q** (Queen seen) → `inspections.queen_seen`, `inspections.queen_clipped`, `inspections.queen_colour`
- **QC** (Queen Cells) → `inspections.queen_cells_found`, `inspections.queen_cells_removed`
- **Brood** → `inspections.eggs_seen`, `inspections.brood_pattern_ok`, `inspections.brood_frame_count`
- **Stores** → `inspections.store_frames`
- **Room** → `inspections.room_frames`
- **Health** (CB/EFB/AFB) → `inspections.health_ok`, `inspections.chalk_brood_suspected`, `inspections.efb_suspected`, `inspections.afb_suspected`
- **Varroa** (L/M/H or count) → `inspections.varroa_level`, `inspections.varroa_count`
- **Temper** → `inspections.temperament_score`
- **Feed** → `inspections.feed_litres_light_syrup`, `inspections.feed_litres_heavy_syrup`
- **Supers** → `inspections.supers_change`
- **Weather** → `inspections.weather_temperature`, `inspections.weather_condition`

```sql
CREATE TABLE apiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apiary_id UUID NOT NULL REFERENCES apiaries(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  queen_breed TEXT,                 -- Queen breed from
  queen_clipped BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hive_id UUID NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL,

  -- Q: Queen presence (boolean + metadata)
  queen_seen BOOLEAN,               -- true = seen, false = not found
  queen_colour TEXT CHECK (queen_colour IN ('W', 'Y', 'R', 'G', 'B')),

  -- QC: Queen cells (structured count)
  queen_cells_found INTEGER CHECK (queen_cells_found >= 0),
  queen_cells_removed BOOLEAN,

  -- Brood: structured brood data
  eggs_seen BOOLEAN,
  brood_pattern_ok BOOLEAN,
  brood_frame_count INTEGER CHECK (brood_frame_count >= 0),

  -- Stores: honey/pollen quantity (integer super-frame equivalents)
  store_frames INTEGER CHECK (store_frames >= 0),

  -- Room: available laying space (integer brood-frame equivalents)
  room_frames INTEGER CHECK (room_frames >= 0),

  -- Health: disease status (boolean flags per disease)
  health_ok BOOLEAN,
  chalk_brood_suspected BOOLEAN,
  efb_suspected BOOLEAN,
  afb_suspected BOOLEAN,

  -- Varroa: structured mite data
  varroa_level TEXT CHECK (varroa_level IN ('l', 'm', 'h')),
  varroa_count INTEGER CHECK (varroa_count >= 0),

  -- Temper: docility score (integer 1-10)
  temperament_score INTEGER CHECK (temperament_score BETWEEN 1 AND 10),

  -- Feed: structured feeding data
  feed_litres_light_syrup NUMERIC(5,2) CHECK (feed_litres_light_syrup >= 0),
  feed_litres_heavy_syrup NUMERIC(5,2) CHECK (feed_litres_heavy_syrup >= 0),

  -- Supers: number added/removed (can be fractional)
  supers_change NUMERIC(5,2),

  -- Weather: structured conditions
  weather_temperature_c NUMERIC(4,1),
  weather_condition TEXT CHECK (weather_condition IN ('c', 's', 'r', 'f')),

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hives_apiary_id ON hives(apiary_id);
CREATE INDEX idx_inspections_hive_date
ON inspections (hive_id, inspection_date DESC);
```

## Migration Strategy

The `migrations/` directory is mounted into `/docker-entrypoint-initdb.d`, which runs `.sql` files **only when the volume is first created**. For subsequent deployments:

- Use a migration tool (e.g. `node-pg-migrate` or `drizzle-kit`) that runs versioned SQL files against an existing database.
- The init SQL (`001_initial.sql`) handles the first-time schema creation.
- Future migrations should be numbered and applied via the migration tool before starting the app container.

## Next Steps

1. Install deps (`pg`, `zod`, `next`, `tailwindcss`) + create Docker Compose + migrations
2. Build all pages + API routes — hives CRUD, inspections form with validation, analytics page
3. Full app from scratch

this is a test of the diff rendering

and here i am going to just type lots of words as many as i can
