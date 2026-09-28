<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Beehive Tracker — Agent Guide

## Stack

Next.js App Router (RSC), Drizzle ORM + PostgreSQL, Zod schemas, React Hook Form + Zod resolver, Base UI primitives (shadcn), Phosphor icons, `@yudiel/react-qr-scanner`.

## Architecture

```
lib/          ← schema.ts (Drizzle tables + Zod), data.ts (queries), db.ts (pool), fetch.ts (client helpers), inspection-wizard-schema.ts (form-only)
app/api/      ← one route file per resource (CRUD), validated against lib/schema types
app/          ← RSC pages (list/detail) + "use client" forms
components/   ← ui/ (shadcn UI layer), button-link, app-header, apiary-hives, stat-card
```

`components/ui/**` contains shadcn UI components and thin project styling adapters. Some wrap Base UI primitives, some are native DOM elements (Label, Card, Textarea, etc.), and `questionnaire.tsx` uses `@shadcn/react`. Application code should consume this layer rather than importing `@base-ui/react` directly. Do not put application/domain logic or form-library integration here.

## Frontend patterns

- **RSC pages**: data fetches directly in component body, no `useEffect` for loading
- **Client forms**: use `useState` per field + `getErrorMessage` from `lib/fetch.ts`, validate with Zod schema before POST/PUT, redirect on success
- **Initial form data**: loaded in RSC pages via `lib/data.ts` functions and passed as typed props to client form components
- **Wizard inspection form**: multi-step via `FormProvider` + `useForm`, steps defined as `[QueenFields, ColonyFields, HealthFields, DetailsFields, NotesFields]`, step validation via `methods.trigger(stepFields[stepIndex])`
- **Server list/detail pages**: export `dynamic = "force-dynamic"`, use `Suspense` for async sub-components
- **Toast notifications**: `toast.add({ type, title, description })` from `@/components/ui/toast`
- **QR flow**: `/hive-scan` page uses camera scanner → reads raw hive UUID from QR code → redirects to inspection form

## Auth

BeeApp uses [Better Auth](https://www.better-auth.com/) (v1.7.6) for authentication.

### Key files

| File                                | Purpose                                                               |
| ----------------------------------- | --------------------------------------------------------------------- |
| `lib/auth.ts`                       | Server-side auth module (adapter, config, hooks)                      |
| `lib/auth-client.ts`                | React client (`createAuthClient`)                                     |
| `lib/auth-schema.ts`                | Drizzle schema for auth tables (user, session, account, verification) |
| `lib/auth-session.ts`               | `requireSession()` — RSC page session guard (redirects to `/sign-in`) |
| `lib/auth-middleware.ts`            | `requireApiSession()` — API route session guard (returns JSON 401)    |
| `proxy.ts`                          | Next.js 16 proxy — real DB-backed session validation for all routes   |
| `app/api/auth/[...all]/route.ts`    | Better Auth API handler mounted at `/api/auth/*`                      |
| `app/api/auth/sign-out/route.ts`    | POST sign-out route (invalidates session + clears cookies)            |
| `app/sign-in/page.tsx`              | Sign-in page                                                          |
| `app/sign-up/page.tsx`              | Sign-up page (enforces IP-based registration)                         |

### Session validation pattern

- **Next.js proxy** (`proxy.ts`) protects all routes automatically by calling `auth.api.getSession()` — a real DB-backed session check. Unauthenticated requests are redirected to `/sign-in`.
- **API routes** should also call `requireApiSession()` at the top of each handler for defense-in-depth. If unauthenticated, return the Response early: `const auth = await requireApiSession(); if ("status" in auth) return auth;`
- **RSC pages** do not need per-page guards — proxy handles it. The legacy `requireSession()` helper remains available for any component-level needs.

### Sign-out pattern

- Client calls `POST /api/auth/sign-out` which invokes `auth.api.signOut()` to invalidate the session and clear cookies.
- After the fetch completes (or fails), navigate to `/sign-in`.

### Registration restriction

- Set `AUTH_ALLOWED_IP` to restrict sign-ups to a specific IP address (e.g. your homelab host).
- When unset, no new registrations are allowed (fails closed).
- The check reads `x-forwarded-for` and `x-real-ip` headers from the request context.

### Auth conventions

- Server functions: `import "server-only"`, query helpers in `lib/data.ts`
- Error responses: `{ error: string }` — keep consistent across routes
- No debug `console.log` in committed code
- Date formatting: `toLocaleDateString("en-GB")` — extract to utility if repeated

## Database & Migrations

- `lib/schema.ts` is the maintained database source of truth.
- The `migrations/` directory contains generated Drizzle migration history — do not hand-edit it.
- Schema changes require generating a new migration: `pnpm db:generate`.
- Pending migrations are applied via: `pnpm db:migrate`.
- Query, UI, API, or business-logic changes that do not alter the database schema must **not** generate migrations.
- Do not delete migration history, regenerate the baseline, run destructive DB resets, or use `docker compose down -v` unless the task explicitly calls for resetting a disposable development database.
- Production migrations should be preceded by an appropriate database backup.

## Key files

- `lib/schema.ts` — DB tables + insert/select/update schemas + enum helpers
- `lib/data.ts` — all DB queries (batched where possible)
- `lib/inspection-wizard-schema.ts` — client form schema subset (never duplicate full DB schema here)
- `components/ui/field.tsx` — shadcn field system (only Field, FieldGroup, FieldLabel, FieldSet used)
- `app/hives/[id]/new-inspection/` — multi-step wizard (form + 5 group components)
