/**
 * Client-safe inspection option values and labels.
 *
 * UI dropdowns and radio groups consume these directly — no Drizzle or Zod
 * dependency — so client components can avoid importing from lib/schema.ts.
 *
 * Types are imported from lib/schema.ts via `import type` only, so they
 * provide compile-time constraint against the Drizzle enum definitions
 * without pulling schema.ts into the client bundle at runtime.
 */
import type { QueenColour, VarroaLevel, WeatherCondition } from "./schema";

export const queenColourLabels = {
  W: "White",
  Y: "Yellow",
  R: "Red",
  G: "Green",
  B: "Blue",
} satisfies Record<QueenColour, string>;

export const varroaLevelLabels = {
  l: "Low",
  m: "Medium",
  h: "High",
} satisfies Record<VarroaLevel, string>;

export const weatherConditionLabels = {
  c: "Cloudy",
  s: "Sunny",
  r: "Rain",
  f: "Fair",
} satisfies Record<WeatherCondition, string>;
