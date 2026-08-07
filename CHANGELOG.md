# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-08-07

### Added

- **Project setup**
  - Next.js 16 with TypeScript, Tailwind CSS v4, ESLint
  - pnpm workspace configuration
  - Docker and docker-compose for PostgreSQL + Next.js

- **Database**
  - Initial schema: `apiaries`, `hives`, `inspections` tables
  - PostgreSQL connection pool with HMR-safe dev mode

- **Validation**
  - Zod schemas for apiary, hive, and inspection CRUD operations
  - Enum helpers for queen colours, varroa levels, weather conditions

- **Apiaries**
  - List, create, view, and edit apiary pages
  - REST API routes (GET/POST /api/apiaries, GET/PUT/DELETE /api/apiaries/:id)

- **Hives**
  - List, create, view, and edit hive pages
  - New inspection form per hive
  - REST API routes (GET/POST /api/hives, GET/PUT/DELETE /api/hives/:id)

- **Inspections**
  - Full CRUD API routes (GET/POST /api/inspections, GET/PUT/DELETE /api/inspections/:id)
  - Record queen presence, brood pattern, varroa mite load, stores, temperament, feeding, weather

- **Analytics**
  - Aggregated inspection data dashboard

- **Documentation**
  - README with setup instructions and project structure
  - Design document (Beehive Tracking App architecture)
  - NHBKA Bee Hive Record Sheet field reference
