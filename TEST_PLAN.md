# Beehive Tracker — Test Plan

## 1. Project Summary

A Next.js 16 (React 19) beekeeping management app with:

- **3 entities**: Apiaries → Hives → Inspections (hierarchical, FK-linked)
- **Stack**: Next.js App Router, Drizzle ORM, PostgreSQL, Zod validation, Tailwind CSS
- **Architecture**: Server components for data fetching + client components for forms, REST API routes for CRUD

## 2. Current State

- Vitest v4 + jsdom + `@testing-library/react` + `@testing-library/dom` installed
- `vitest.config.mts` has basic jsdom config with `react` and `tsconfigPaths` plugins
- `@vitest/coverage-v8` is not installed yet; it is required before enabling V8 coverage
- **No tests exist yet**

## 3. Test Architecture Overview

```text
┌─────────────────────────────────────────────────┐
│  E2E Tests (Playwright) — NOT in scope yet      │  ← Full browser flows
├─────────────────────────────────────────────────┤
│  Route Handler Unit Tests (Vitest + node env)   │  ← Mocked data/DB boundaries
│  app/api/__tests__/                             │
├─────────────────────────────────────────────────┤
│  Unit Tests (Vitest + jsdom env)                │  ← Client components, utils, schemas
│  lib/__tests__/                                 │
│  app/__tests__/                                 │  ← Colocated client component tests
└─────────────────────────────────────────────────┘
```

## 4. File Structure

```text
__tests__/                          # Global test setup
  setup.ts                          # vi.mock for Next.js modules, globals

lib/
  __tests__/
    fetch.test.ts                   # Unit: getErrorMessage, safeJsonFetch
    schema.test.ts                  # Unit: Zod schemas, enum helpers
    data.test.ts                    # Unit: public data functions with mocked DB chains

app/
  __tests__/
    page.test.tsx                   # Unit: Home (sync server component)
    layout.test.tsx                 # Unit: RootLayout nav links

app/api/
  __tests__/
    apiaries.test.ts                # Unit: GET/POST /api/apiaries handlers
    apiaries-id.test.ts             # Unit: GET/PUT/DELETE /api/apiaries/:id handlers
    hives.test.ts                   # Unit: GET/POST /api/hives handlers
    hives-id.test.ts                # Unit: GET/PUT/DELETE /api/hives/:id handlers
    inspections.test.ts             # Unit: GET/POST /api/inspections handlers
    inspections-id.test.ts          # Unit: GET/PUT/DELETE /api/inspections/:id handlers

app/hives/[id]/
  __tests__/
    inspection-card.test.tsx        # Unit: extracted synchronous InspectionCard

app/analytics/
  __tests__/
    stat-card.test.tsx               # Unit: extracted synchronous StatCard
```

## 5. Test Strategy by Layer

### 5.1 Unit Tests — Utility Functions (`lib/__tests__/`)

#### `lib/fetch.test.ts` — `getErrorMessage`, `safeJsonFetch`

**What**: Pure async utility functions. No DB, no Next.js deps. Easy to test.

**Tests**:

- `getErrorMessage` returns empty string for `response.ok === true`
- `getErrorMessage` parses JSON error body when content-type is application/json
- `getErrorMessage` falls back to plain text body when not JSON
- `getErrorMessage` uses fallback string when body is empty/unparseable
- `safeJsonFetch` returns `{ data, error: null }` on success
- `safeJsonFetch` returns `{ data: null, error: message }` on non-ok response
- `safeJsonFetch` returns `{ data: null, error: err.message }` when `fetch` rejects with an `Error`
- `safeJsonFetch` returns `{ data: null, error: "Network error" }` for non-`Error` rejections

**Mocking**: `fetch` — use `vi.fn().mockResolvedValue(mockResponse)` or vitest's built-in `globalThis.fetch` mocking.

#### `lib/schema.test.ts` — Zod schemas + enum helpers

**What**: Drizzle-Zod generated schemas and label maps. Validate schema correctness.

> **Expected initial failures:** Some of these are specification/TDD tests for intended business rules that the current generated schemas do not yet enforce. In particular, the current implementation may initially fail the empty-name, temperament range, and non-negative count/frame tests. Those failures indicate that the production schemas need stronger constraints; do not weaken the tests to match the current behavior.

**Tests**:

- `ApiaryInsert` validates: required `name`, optional `notes`
- `ApiaryInsert` rejects: missing `name`, empty string `name`
- `ApiaryUpdate` validates: partial updates, nullable `notes`
- `ApiaryUpdate` rejects: empty `name`
- `HiveInsert` validates: required `apiaryId`, `name`; optional queen fields
- `HiveInsert` rejects: missing `apiaryId`, missing `name`
- `HiveUpdate` validates: partial updates, nullable `queenBreed`/`notes`
- `HiveUpdate` rejects: `apiaryId: null` (NOT NULL constraint)
- `InspectionInsert` validates: required `hiveId`, `inspectionDate`; defaults for booleans
- `InspectionInsert` rejects: missing `hiveId`, invalid `queenColour` enum
- `InspectionInsert` rejects: `temperamentScore` outside 1-10 range
- `InspectionInsert` rejects: negative `queenCellsFound`, `storeFrames`, etc.
- `InspectionUpdate` validates: partial updates, nullable fields
- `queenColourLabels` maps all 5 codes correctly (W/Y/R/G/B)
- `varroaLevelLabels` maps all 3 levels (l/m/h)
- `weatherConditionLabels` maps all 4 conditions (c/s/r/f)

**Mocking**: None needed. Pure schema validation tests.

### 5.2 Unit Tests — Client Components (`app/__tests__/`)

#### `Home` page (`app/page.tsx`)

**What**: Synchronous server component (no `async`, no DB calls). Renders static links.

**Tests**:

- Renders h1 with "Beehive Tracking App"
- Links to `/apiaries`, `/hives`, `/analytics` are present
- Each link has correct href and visible text

**Mocking**: None. Pure render test.

#### `RootLayout` (`app/layout.tsx`)

**What**: Renders nav with 3 links + children slot.

**Tests**:

- Renders "Beehive Tracker" nav title
- Nav contains links to `/apiaries`, `/hives`, `/analytics`
- `children` are rendered in `<main>`

**Mocking**: None. Pure render test.

### 5.3 Unit Tests — Synchronous Presentational Components (`app/`)

#### `InspectionCard` (`app/hives/[id]/page.tsx`)

**What**: Sync function component (not exported default). Renders inspection data.

**Tests**:

- Renders formatted date (en-GB locale)
- Shows "Healthy" or "Issues" badge based on `healthOk`
- Conditionally renders: queen seen/colour, eggs, brood frames, store frames, room frames, varroa level+count, temperament score
- Renders notes when present

**Mocking**: None. Pure render with props.

#### `StatCard` (`app/analytics/page.tsx`)

**What**: Sync function component. Renders label/value/sub.

**Tests**:

- Renders label, value, and optional sub text

**Mocking**: None. Pure render with props.

### 5.4 Route Handler Unit Tests — API Routes (`app/api/__tests__/`)

These test route handler functions directly rather than through HTTP. Because the data and database boundaries are mocked, these are unit tests, not integration tests. Import the `GET`/`POST`/`PUT`/`DELETE` exports and call them with mock `Request` objects, asserting on `NextResponse` results. Real database integration tests remain out of scope.

#### Pattern for all API route tests

```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// app/api/__tests__/apiaries.test.ts
import * as handlers from '../apiaries/route'

// app/api/__tests__/apiaries-id.test.ts uses:
// import * as handlers from '../apiaries/[id]/route'
// Use the equivalent paths for hives and inspections.

// Mock the data layer
vi.mock('@/lib/data', () => ({
  getApiaries: vi.fn(),
  getApiaryWithHives: vi.fn(),
  // ...
}))

// Mock db operations if needed
vi.mock('@/lib/db', () => ({
  db: { /* mock drizzle instance */ },
}))

// Keep the real schemas when testing route validation. If a schema must be
// isolated for a specific handler test, mock it from '@/lib/schema', not '@/lib/db'.
```

#### `GET /api/apiaries` — List apiaries

- Returns 200 with array of apiaries
- Returns 500 on data layer error

#### `POST /api/apiaries` — Create apiary

- Returns 201 with created apiary when valid
- Returns 400 with validation errors when `name` missing
- Returns 400 with validation errors when `name` is empty string
- Returns 500 on DB error

#### `GET /api/apiaries/:id` — Get apiary with hives

- Returns 200 with apiary + hives + inspection counts
- Returns 404 when apiary not found
- Returns 500 on error

#### `PUT /api/apiaries/:id` — Update apiary

- Returns 200 with updated apiary
- Returns 400 when validation fails
- Returns 400 when no fields to update (empty body)
- Trims `name` before saving
- Returns 404 when apiary not found
- Returns 500 on error

#### `DELETE /api/apiaries/:id` — Delete apiary

- Returns 200 with success + deleted apiary
- Returns 409 when hives exist in apiary
- Returns 404 when apiary not found
- Returns 500 on error

#### `GET /api/hives` — List hives (with optional `?apiary_id=`)

- Returns 200 with array of hives (with apiaryName, inspectionCount)
- Filters by `apiaryId` when query param present
- Returns 500 on error

#### `POST /api/hives` — Create hive

- Returns 201 with created hive when valid
- Returns 400 when validation fails (missing apiaryId, missing name)
- Sets `queenClipped: false` default
- Returns 500 on error

#### `GET /api/hives/:id` — Get hive

- Returns 200 with hive + apiaryName + inspectionCount
- Returns 404 when hive not found
- Returns 500 on error

#### `PUT /api/hives/:id` — Update hive

- Returns 200 with updated hive
- Returns 400 when validation fails
- Returns 400 when no fields to update
- Returns 400 when `apiaryId: null` (NOT NULL constraint)
- Returns 404 when hive not found
- Returns 500 on error

#### `DELETE /api/hives/:id` — Delete hive

- Returns 200 with success + deleted hive
- Returns 404 when hive not found
- Returns 500 on error

#### `GET /api/inspections` — List inspections (with optional `?hive_id=`)

- Returns 200 with array of inspections (flattened with hive/apiary names)
- Filters by `hiveId` when query param present
- Returns 500 on error

#### `POST /api/inspections` — Create inspection

- Returns 201 with `{ success: true }` when valid
- Returns 400 when validation fails (missing hiveId, invalid enum values)
- Applies defaults: `queenSeen: false`, `eggsSeen: false`, `healthOk: true`, etc.
- Returns 500 on error

#### `GET /api/inspections/:id` — Get inspection

- Returns 200 with inspection data
- Returns 404 when not found
- Returns 500 on error

#### `PUT /api/inspections/:id` — Update inspection

- Returns 200 with updated inspection
- Returns 400 when validation fails
- Returns 400 when no fields to update
- Returns 400 when `hiveId: null`
- Returns 404 when not found
- Returns 500 on error

#### `DELETE /api/inspections/:id` — Delete inspection

- Returns 200 with success + deleted inspection
- Returns 404 when not found
- Returns 500 on error

### 5.5 Client Form Components (Optional, Higher Effort)

The form pages (`NewApiaryPage`, `NewHivePage`, `EditApiaryPage`, `EditHivePage`, `NewInspectionPage`) are complex client components with:

- `useEffect` data loading
- Form state management
- Validation + API calls
- Router navigation

**Recommendation**: Test these through focused component tests plus route handler unit tests. Async server-component parents require E2E coverage and are not rendered with Vitest. The form logic is otherwise covered by:

1. Zod schema tests (validation rules)
2. Route handler unit tests (server-side validation and mocked persistence behavior)
3. Client fetch helper tests (`safeJsonFetch`, `getErrorMessage`)

If you want component-level form tests, use `@testing-library/react` with mocked `fetch` and `router.push`. This is lower priority given the API route coverage.

## 6. Mocking Strategy

### 6.1 Database Layer (`@/lib/data`)

All data-fetching functions go through `lib/data.ts`, which imports `db` from `lib/db.ts`. Two approaches:

**Approach A — Mock at the data layer (recommended)**:

```ts
vi.mock('@/lib/data', () => ({
  getApiaries: vi.fn().mockResolvedValue([
    { id: '1', name: 'Test Apiary', notes: null, createdAt: new Date() }
  ]),
  getHives: vi.fn().mockResolvedValue([]),
  // ... etc
}))
```

- Cleanest for component tests
- One mock per test file or shared in `__tests__/setup.ts`
- Easy to return different data per test with `mockResolvedValueOnce`

**Approach B — Mock at the Drizzle layer**:

```ts
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}))
```

- More realistic but more verbose
- Needed when testing `lib/data.ts` functions directly
- Configure `select` with a fresh query chain for each expected query; do not use one universal `mockReturnThis()` object

### 6.2 Next.js Modules

Mock these in a setup file or per-test:

```ts
// Mock next/navigation for router.push
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
  notFound: vi.fn(),
  redirect: vi.fn((url) => { throw new Error(`Redirect: ${url}`); }),
}))

// Mock server-only (no-op, just prevents errors)
vi.mock('server-only', () => ({}))
```

### 6.3 Global Fetch

For client components that call `fetch('/api/...')`:

```ts
// In test file or setup
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)
mockFetch.mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ id: '1', name: 'Test' }),
})
```

## 7. Vitest Configuration Updates

Current `vitest.config.mts` needs enhancement. Install the matching coverage provider first:

```bash
pnpm add -D @vitest/coverage-v8
```

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,              // expose expect, test, and vi without explicit imports
    environment: 'jsdom',       // for client components
    setupFiles: ['__tests__/setup.ts'],  // Next.js module mocks
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',           // or istanbul
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/',
        '.next/',
        '**/*.config.*',
        '**/drizzle.config.ts',
      ],
    },
  },
})
```

`__tests__/setup.ts`:

```ts
import { createElement, type ComponentProps } from 'react'
import { vi } from 'vitest'

// Prevent "server-only" import errors in test env
vi.mock('server-only', () => ({}))

// Mock next/navigation (used by client components)
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
  notFound: vi.fn(),
  redirect: vi.fn((url: string) => { throw new Error(`Redirect to ${url}`); }),
}))

// Mock next/font/google for RootLayout tests
vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}))

// Mock next/link to render plain <a>
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: ComponentProps<'a'>) =>
    createElement('a', { href, ...props }, children),
}))
```

## 8. Test Execution Order & Priority

### Phase 1: Foundation (fastest ROI)

1. **`lib/fetch.test.ts`** — Pure utils, zero mocking
2. **`lib/schema.test.ts`** — Pure Zod validation, zero mocking
3. **`app/__tests__/page.test.tsx`** — Home page render

### Phase 2: Route Handlers (core logic)

1. **`app/api/__tests__/apiaries.test.ts`** — GET/POST collection
2. **`app/api/__tests__/apiaries-id.test.ts`** — GET/PUT/DELETE single
3. **`app/api/__tests__/hives.test.ts`** — GET/POST collection
4. **`app/api/__tests__/hives-id.test.ts`** — GET/PUT/DELETE single
5. **`app/api/__tests__/inspections.test.ts`** — GET/POST collection
6. **`app/api/__tests__/inspections-id.test.ts`** — GET/PUT/DELETE single

### Phase 3: Data Layer

1. **`lib/__tests__/data.test.ts`** — Public data functions with mocked Drizzle chains; required to support the `lib/data.ts` coverage target

### Phase 4: Synchronous Components Only

1. **`app/__tests__/layout.test.tsx`** — RootLayout navigation + children
2. **`app/hives/[id]/__tests__/inspection-card.test.tsx`** — extracted `InspectionCard`
3. **`app/analytics/__tests__/stat-card.test.tsx`** — extracted `StatCard`
4. Add tests for other extracted synchronous presentational components when useful

Do not render `ApiaryList`, `HiveList`, `AnalyticsPage`, or `HiveDetailPage` with Vitest while they remain async Server Components. Cover their orchestration later with E2E tests.

### Phase 5: Client Components (forms)

1. **`app/__tests__/new-apiary-form.test.tsx`** — Form validation + submit flow
2. **`app/__tests__/new-hive-form.test.tsx`** — Form with apiary selection
3. **`app/__tests__/edit-apiary-form.test.tsx`** — Load + update flow
4. **`app/__tests__/edit-hive-form.test.tsx`** — Load + update with apiary list
5. **`app/__tests__/new-inspection-form.test.tsx`** — Complex form, all fields

## 9. Key Testing Challenges & Solutions

### Challenge 1: Async Server Components

Next.js docs explicitly state Vitest doesn't fully support async Server Components. Our server components (`ApiaryList`, `HiveList`, `AnalyticsPage`, `HiveDetailPage`) are all `async`.

**Solution**: Do not render async Server Components with Vitest. Extract and test synchronous presentational components such as `InspectionCard` and `StatCard`. Route handler and data-layer unit tests cover adjacent logic, but they do not cover page orchestration; reserve that coverage for future E2E tests.

### Challenge 2: `server-only` module

The `lib/data.ts` file imports `'server-only'` which doesn't exist in jsdom.

**Solution**: Mock it in `__tests__/setup.ts` as shown above.

### Challenge 3: Drizzle ORM chaining

Drizzle's query builder uses method chaining (`db.select().from().where().orderBy()`). Mocking this requires a fluent mock.

**Solution**: Use Approach A (mock at the data layer) for component tests. For `lib/data.ts`, do not use one universal `mockReturnThis()` object. Create a fresh chain for each expected query and configure the actual terminal method for that query. The mocks must support `leftJoin`, `where`, `orderBy`, `limit`, and `groupBy`, including queries that are awaited directly after `where()`. Use sequential `db.select.mockReturnValueOnce(...)` values when a data function executes multiple queries.

### Challenge 4: UUID generation

Tests need predictable IDs. Mock `gen_random_uuid()` or use fixed test UUIDs.

**Solution**: Use fixed UUIDs in mock data:

```ts
const TEST_APIARY = { id: '00000000-0000-0000-0000-000000000001', name: 'Test Apiary' }
```

### Challenge 5: `params: Promise<{ id: string }>` (Next.js 15+ App Router)

Route handlers receive params as a Promise. Tests need to handle this.

**Solution**: Create a helper:

```ts
function mockParams(id: string) {
  return { params: Promise.resolve({ id }) }
}
```

## 10. Test Data Fixtures

Define reusable test data at the top of test files or in a shared fixtures module:

```ts
// __tests__/fixtures.ts
export const TEST_APIARY = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Garden Apiary',
  notes: 'Behind the house',
  createdAt: new Date('2025-01-15T10:00:00Z'),
}

export const TEST_HIVE = {
  id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  apiaryId: TEST_APIARY.id,
  name: 'Colony Alpha',
  queenBreed: 'Italian',
  queenClipped: true,
  notes: null,
  createdAt: new Date('2025-02-01T10:00:00Z'),
  apiaryName: TEST_APIARY.name,
}

export const TEST_INSPECTION = {
  id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
  hiveId: TEST_HIVE.id,
  inspectionDate: '2025-03-01',
  queenSeen: true,
  queenColour: 'W',
  queenCellsFound: 0,
  queenCellsRemoved: false,
  eggsSeen: true,
  broodPatternOk: true,
  broodFrameCount: 8,
  storeFrames: 5,
  roomFrames: 3,
  healthOk: true,
  chalkBroodSuspected: false,
  efbSuspected: false,
  afbSuspected: false,
  varroaLevel: 'l',
  varroaCount: 2,
  temperamentScore: 8,
  feedLitresLightSyrup: null,
  feedLitresHeavySyrup: null,
  supersChange: null,
  weatherTemperatureC: '15.5',
  weatherCondition: 's',
  notes: 'Strong colony',
  hiveName: TEST_HIVE.name,
  apiaryName: TEST_APIARY.name,
}
```

## 11. Coverage Goals

| Layer | Target | Rationale |
| ------- | -------- | ----------- |
| `lib/fetch.ts` | 100% | Pure utilities, trivial to cover |
| `lib/schema.ts` | 100% | Validation is critical business logic |
| `lib/data.ts` | 80%+ | Complex queries; focus on public exports |
| API routes | 90%+ | Every HTTP method + error path |
| Client components | 70%+ | Forms are complex; focus on key interactions |
| Server components | 60%+ | Async SC limitation; test sub-components |

## 12. Commands

```bash
# Run all tests once
pnpm test --run

# Watch mode (development)
pnpm test

# With coverage
pnpm test --coverage

# Single file
pnpm test lib/__tests__/fetch.test.ts

# Single test
pnpm test -t "POST /api/apiaries returns 400 on invalid name"
```

## 13. What's Out of Scope (For Now)

- **E2E tests**: Would need Playwright or Cypress. Recommended as a future addition for critical user flows (create apiary → create hive → record inspection → view analytics).
- **Database integration tests**: Would need a real PostgreSQL instance (test container via `testcontainers` or docker-compose). Good to add later for API route tests that touch the DB.
- **Visual/snapshot tests**: Not applicable for this Tailwind-based UI; visual regression testing would need Playwright screenshots.
- **Accessibility tests**: Could add `jest-axe` or `axe-core` checks later; `@testing-library/jest-dom` can provide additional DOM matchers.

## 14. Recommended Next Steps

1. Install `@vitest/coverage-v8`, then update `vitest.config.mts` with `globals`, `setupFiles`, and coverage config
2. Create `__tests__/setup.ts` with Next.js module mocks
3. Write Phase 1 tests (fetch utils, schemas, Home page) — these prove the setup works
4. Write Phase 2 route handler unit tests — these are the most valuable for catching regressions
5. Write Phase 3 data-layer tests so the `lib/data.ts` coverage goal has corresponding work
6. Write Phase 4 tests for RootLayout and extracted synchronous presentational components; do not render async Server Components with Vitest
7. Write Phase 5 client form tests — highest effort, lowest marginal value given route coverage
