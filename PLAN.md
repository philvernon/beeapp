# Task: Add a Multi-Step Form Foundation

## Goal

Create a small, tested multi-step form foundation for the new-inspection page. Do not migrate the existing inspection fields yet.

The result should make it straightforward to add fields to each step later without changing the step-navigation architecture.

GitHub issue #12 is background only. Do not attempt to implement its full scope.

## Required preparation

Before editing:

1. Read the repository `AGENTS.md`.
2. Read these exact documents:

   Next.js 16:
   - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
   - `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`

   React Hook Form:
   - <https://react-hook-form.com/docs/useform> — focus on `defaultValues`, `shouldUnregister`, and `resolver`
   - <https://react-hook-form.com/docs/formprovider>
   - <https://react-hook-form.com/docs/useformcontext>

   React Hook Form with Zod:
   - <https://github.com/react-hook-form/resolvers/blob/master/README.md> — read the TypeScript and Zod sections

   Zod 4:
   - <https://zod.dev/basics> — focus on object schemas and `z.input` versus `z.output`

3. Do not read or use Drizzle documentation for this task. Do not derive the wizard schema from the database schema. Database integration is explicitly deferred.

4. Inspect:
   - `app/hives/[id]/new-inspection/page.tsx`
   - `package.json`
   - `vitest.config.mts`
   - existing test conventions
5. Do not modify code during this inspection.

## Scope

Implement only:

1. Install:
   - `react-hook-form`
   - `@hookform/resolvers`

2. Create a reusable inspection wizard shell with five steps:
   - Conditions
   - Colony
   - Stores & Actions
   - Health
   - Review

3. Set up one React Hook Form instance at the wizard root.

4. Use `FormProvider` so future step components can access the same form instance through `useFormContext()`.

5. Keep form values when navigating between steps:
   - configure `shouldUnregister: false`

6. Add Previous and Next navigation:
   - Previous is disabled on the first step
   - Next advances to the following step
   - Next is absent on the Review step
   - Review is the final step
   - Do not render a Submit button or implement final API submission yet

7. Expose basic accessible step state:
   - a navigation landmark with an accessible label
   - ordered step labels
   - `aria-current="step"` on the active step
   - visible current-step heading

8. Add a minimal client-safe Zod schema used by the RHF resolver:
   - include only the temporary field used to prove state preservation
   - do not use `z.object({})` with an undeclared field, because Zod strips unknown object keys by default
   - delete or replace the temporary field and its schema entry when the first real step is implemented
   - do not reproduce or derive the inspection database schema

9. Add focused tests for:
   - initial step
   - Next navigation
   - Previous navigation
   - first/last boundary behavior
   - active `aria-current` state
   - one temporary test field retaining its value between steps

## Integration strategy

Do not integrate the wizard into `page.tsx` in this task. Do not replace, wrap, or delete any part of the existing working inspection form.

Create `InspectionWizard` as an isolated component beside the page. Its test must import and render it directly. It is acceptable for the component to remain unused by production code until the existing fields are migrated incrementally in later work.

## Suggested files

Create:

- `app/hives/[id]/new-inspection/inspection-wizard.tsx`
- `app/hives/[id]/new-inspection/inspection-wizard-schema.ts`
- `app/hives/[id]/new-inspection/__tests__/inspection-wizard.test.tsx`

Modify only if necessary:

- `package.json`
- `pnpm-lock.yaml`
- `vitest.config.mts`

Do not modify:

- `lib/schema.ts`
- `app/api/inspections/route.ts`
- database declarations
- API contracts
- the current inspection submission logic
- unrelated components

## Component responsibilities

### `InspectionWizard`

Owns:

- the RHF `useForm()` instance
- `FormProvider`
- the active step index
- Previous/Next navigation
- rendering the active step
- accessible step status

It must not own inspection-specific validation rules beyond connecting the resolver.

### Step definitions

Represent steps as static configuration containing:

- stable ID
- display label
- rendered content

Do not introduce a generic application-wide wizard framework. Keep this local to the inspection feature.

### Step content

Use simple placeholders for unfinished steps.

The Conditions placeholder must contain one temporary text input named `foundationTestValue`, registered through `useFormContext()`. Include `foundationTestValue: ""` in RHF `defaultValues` and in the temporary Zod schema. Use it only to prove that state survives navigation; do not invent real inspection fields.

The test must type into this field, navigate to Colony, return to Conditions, and assert that the same value remains.

## Explicit form semantics for future work

Record these conventions in comments or exported defaults, but do not add all fields now:

- checkbox values will default to `false`
- unchecked checkboxes will submit `false`
- optional text, select, and numeric fields may use `null` when later implemented
- database nullability must not determine checkbox UI defaults
- fields must not be cleared or inferred from unrelated fields
- queen colour is independent of whether the queen was seen
- queen-cell observations are independent of whether the queen was seen

## Non-goals

Do not implement:

- existing field migration
- inspection form defaults beyond the temporary test field
- conditional field behavior
- cross-field normalization
- database schema changes
- API changes
- final form submission
- server/client page restructuring
- hive loading changes
- error summaries
- per-step field validation
- completed-step tracking
- review summaries
- styling redesign
- a generic wizard library

## Acceptance criteria

- One RHF instance exists for the entire wizard.
- The wizard has exactly five named steps.
- Previous is disabled on Conditions, Next is absent on Review, and navigation never leaves the five-step range.
- The active step exposes `aria-current="step"`.
- A field value survives moving forward and backward.
- No existing inspection behavior is removed.
- No database or API files are changed.
- Tests pass.
- Type checking and linting pass.

## Verification

Run:

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
```

Report:

1. files created
2. files modified
3. tests added
4. verification results
5. anything deliberately left for later

## Stop conditions

Stop and ask before proceeding if:

- the wizard cannot be tested in isolation without changing the existing page
- the test setup requires unrelated global changes
- the specified Next.js documentation conflicts with this plan
- implementation requires changing the database or API
- an unspecified product decision is encountered
