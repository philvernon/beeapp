import { createInsertSchema } from "drizzle-zod";
import { inspections } from "@/lib/schema";
import { z } from "zod";

/**
 * Client-safe validation schema for the multi-step wizard.
 *
 * Derived from the Drizzle insert schema — only the fields the form collects,
 * with id/createdAt/hiveId/inspectionDate omitted. Types are guaranteed to
 * match what the database layer expects (string for numeric columns, number
 * for integer columns, boolean for booleans).
 */

export const InspectionWizardSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true,
  hiveId: true,
  inspectionDate: true,
});

export type InspectionWizardInput = z.input<typeof InspectionWizardSchema>;
export type InspectionWizardValue = z.output<typeof InspectionWizardSchema>;
