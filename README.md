# Beehive Tracking App

Manage apiaries, hives, and inspection records.

## Features

- **Apiary Management** — Create and organize multiple apiary locations
- **Hive Tracking** — Record hive details (queen breed, clipping status, apiary assignment)
- **Inspection Records** — Log inspections with queen presence, brood pattern, varroa mite load, stores, temperament, feeding, and weather

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- PostgreSQL (via Docker Compose)
- Tailwind CSS
- Docker

## Getting Started

### First-time setup (existing database)

If you already have a PostgreSQL volume from before issue #6, destroy it so the new Drizzle migration can run cleanly:

```bash
docker compose down -v
docker compose up -d db
pnpm db:migrate
```

### Normal development

```bash
# Install dependencies
pnpm install

# Start PostgreSQL via Docker
docker compose up -d db

# Set environment variables
# Copy .env and update DATABASE_URL to use localhost:5432 for local tooling:
cp .env .env.local
# Edit .env.local — change the host in DATABASE_URL from "db" to "localhost"

# Run Drizzle migrations (if starting fresh)
pnpm db:migrate

# Start dev server
pnpm dev
```

> **Note:** `docker compose up -d` starts both `db` and `app`. Use `docker compose up -d db` to start only the database, since `pnpm dev` also binds port 3000.

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```text
app/
  api/
  apiaries/
  hive-scan/    # QR-based hive scan flow
  hives/
    [id]/
      new-inspection/  # Multi-step inspection wizard
lib/
  db.ts                         # Database connection
  schema.ts                     # Drizzle tables + Zod schemas (source of truth)
  inspection-wizard-schema.ts   # Client form schema subset
migrations/
  0000_initial.sql  # Drizzle-generated migration
  meta/             # Drizzle journal and snapshots
```

## License

MIT
