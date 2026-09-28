# Beehive Tracking App

Manage apiaries, hives, and inspection records.

## Features

- **Apiary Management** — Create and organize multiple apiary locations
- **Hive Tracking** — Record hive details (queen breed, clipping status, apiary assignment)
- **Inspection Records** — Log inspections with queen presence, brood pattern, varroa mite load, stores, temperament, feeding, and weather
- **Authentication** — Email/password auth via Better Auth with LAN-only sign-up restriction

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- PostgreSQL (via Docker Compose)
- Tailwind CSS
- Docker

## Getting Started

### Normal development

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
cp .env.example .env.local
# Edit .env.local — change DATABASE_URL to use localhost:5432 for local tooling:
#   DATABASE_URL=postgresql://bee:change-me@localhost:5432/beehive
# Generate a secret:  openssl rand -hex 32
#   BETTER_AUTH_SECRET=<generated-secret>
# Set the app URL (must match what Better Auth uses for callbacks):
#   BETTER_AUTH_URL=http://localhost:3000
# Restrict sign-ups to a CIDR range (e.g. your LAN):
#   AUTH_SIGNUP_CIDR=192.168.1.0/24

# Start PostgreSQL and the app
docker compose up -d

# Run Drizzle migrations (if starting fresh or schema has changed)
pnpm db:migrate

# Start dev server
pnpm dev
```

> **Note:** `docker compose up -d` starts both `db` and `app`. Use `docker compose up -d db` to start only the database, since `pnpm dev` also binds port 3000.

### Deploying to a host (Docker)

```bash
git pull
docker compose up -d --build
```

Docker deployments automatically run pending migrations before the app starts via the `migrate` service. For local/host-side development, migrations can still be applied manually with `pnpm db:migrate`.

Open [http://localhost:3000](http://localhost:3000).

### First-user sign-up

When `AUTH_SIGNUP_CIDR` is set, only requests from IPs within that CIDR range can create accounts. If `AUTH_SIGNUP_CIDR` is empty or unset, sign-ups are blocked entirely (fails closed). For local development you can leave it unset to prevent accidental sign-ups.

### Docker deployment notes

Docker deployments pass `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `AUTH_SIGNUP_CIDR` from the host environment. Ensure these are set in your `.env` file before running `docker compose up`. The `BETTER_AUTH_URL` should match the public URL of your deployment (e.g. `https://beehive.yourdomain.com`).

## Database Migrations

This project uses Drizzle ORM for database schema management. The workflow is:

```
lib/schema.ts
    ↓
pnpm db:generate   # creates an incremental migration from schema changes
    ↓
generated migration in migrations/
    ↓
pnpm db:migrate    # applies pending migrations to the target database
```

- **`pnpm db:generate`** — Creates a new migration file when `lib/schema.ts` has changed. Only run this when you intentionally modify the database schema.
- **`pnpm db:migrate`** — Applies any pending migrations to the connected database. Run this before starting the app after generating migrations or pulling changes from others.

### Important rules

- Application, query, UI, and API changes that do not alter the database schema do **not** require generating a migration.
- `lib/schema.ts` is the source of truth. The `migrations/` directory contains generated history — do not hand-edit it.
- An existing hosted database should normally be upgraded incrementally via `pnpm db:migrate`. Do not delete or recreate it for routine releases.
- **`docker compose down`** does **not** remove the named database volume. Data persists across restarts.
- **`docker compose down -v`** removes the database volume and all data. Only use this to reset a disposable development database.
- Production migrations should be preceded by an appropriate database backup.
- Do not delete or regenerate migration history (e.g. `0000_initial.sql`) during normal development or deployment.

### Development database access

PostgreSQL is bound to `127.0.0.1` so that local Drizzle tooling (`pnpm db:generate`, `pnpm db:migrate`) can reach it at `localhost:5432`. The app container connects internally via the Docker network hostname `db:5432`. This keeps the database port off the external network while supporting host-side development tooling.

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
