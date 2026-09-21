import { z } from "zod";

/**
 * Client-safe validation schema for the multi-step wizard.
 *
 * This schema is a subset of the database schema — it only contains fields
 * that the client form collects. Do NOT derive or reproduce the full
 * inspection database schema here; keep concerns separate.
 *
 * Zod 4: z.object() strips unknown keys by default, so every field must be
 * explicitly declared. We use z.input<typeof schema> for RHF so that the
 * form accepts the raw (pre-transform) input types.
 *
 * Numeric fields accept empty strings (from uncontrolled inputs) and coerce
 * them to null so the wizard can navigate between steps without validation
 * errors on untouched fields.
 */

// Helper: coerce a possibly-empty-string or number to number | null.
const nullableNumber = z.preprocess((val) => {
  if (val === "" || val == null) return null;
  const n = typeof val === "number" ? val : Number(val);
  return Number.isNaN(n) ? null : n;
}, z.number().nullable());

const formBoolean = (defaultValue: boolean) =>
  z.preprocess((val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    if (val == null || val === "") return defaultValue;
    return val;
  }, z.boolean());

export const InspectionWizardSchema = z.object({
  // --- Conditions step ---
  queenSeen: formBoolean(false),
  queenColour: z.string().optional().nullable(),
  queenCellsFound: nullableNumber,
  queenCellsRemoved: formBoolean(false),
  eggsSeen: formBoolean(false),
  broodPatternOk: formBoolean(true),
  broodFrameCount: nullableNumber,

  // --- Colony step ---
  storeFrames: nullableNumber,
  roomFrames: nullableNumber,

  // --- Stores & Actions step ---
  healthOk: formBoolean(true),
  chalkBroodSuspected: formBoolean(false),
  efbSuspected: formBoolean(false),
  afbSuspected: formBoolean(false),
  varroaLevel: z.string().optional().nullable(),
  varroaCount: nullableNumber,

  // --- Health step ---
  temperamentScore: nullableNumber,
  feedLitresLightSyrup: z.string().optional().nullable(),
  feedLitresHeavySyrup: z.string().optional().nullable(),
  supersChange: z.string().optional().nullable(),

  // --- Review step (weather + notes) ---
  weatherTemperatureC: z.string().optional().nullable(),
  weatherCondition: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type InspectionWizardInput = z.input<typeof InspectionWizardSchema>;
export type InspectionWizardValue = z.output<typeof InspectionWizardSchema>;
