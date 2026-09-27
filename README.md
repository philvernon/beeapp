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

```bash
# Install dependencies
pnpm install

# Start PostgreSQL via Docker
docker compose up -d

# Set environment variables
cp .env.local.example .env.local
# Edit .env.local with your DB_URL

# Run Drizzle migrations
pnpm db:migrate

# Start dev server
pnpm dev
```

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
