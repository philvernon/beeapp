import { z } from "zod";

/**
 * Temporary validation schema for the multi-step wizard foundation.
 *
 * This schema only contains the `foundationTestValue` field used to prove
 * that form state survives step navigation. Delete this field and its entry
 * in `defaultValues` / `stepFields` when the first real step is implemented.
 *
 * Do NOT derive or reproduce the inspection database schema here.
 */

// Zod 4: z.object() strips unknown keys by default, so every field must be
// explicitly declared. We use z.input<typeof schema> for RHF so that the
// form accepts the raw (pre-transform) input types.
export const InspectionWizardSchema = z.object({
	foundationTestValue: z.string(),
});

export type InspectionWizardInput = z.input<typeof InspectionWizardSchema>;
