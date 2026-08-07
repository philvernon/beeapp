# Beehive Tracking App

Manage apiaries, hives, and inspection records.

## Features

- **Apiary Management** — Create and organize multiple apiary locations
- **Hive Tracking** — Record hive details (queen breed, clipping status, apiary assignment)
- **Inspection Records** — Log inspections with queen presence, brood pattern, varroa mite load, stores, temperament, feeding, and weather
- **Analytics** — View aggregated inspection data

## Tech Stack

- Next.js 15 (App Router)
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

# Run migrations
# (run SQL in migrations/001_initial.sql against your database)

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  apiaries/     # Apiary CRUD pages
  hives/        # Hive CRUD pages
  analytics/    # Inspection analytics
  api/          # API routes
lib/
  db.ts         # Database connection
  validations.ts # Zod schemas
migrations/
  001_initial.sql # Schema definition
```

## License

MIT
