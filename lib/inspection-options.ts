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

// ── Queen colours ─────────────────────────────────────────
export const queenColours = [
  "W",
  "Y",
  "R",
  "G",
  "B",
] as const satisfies readonly QueenColour[];

export const queenColourLabels: Record<QueenColour, string> = {
  W: "White",
  Y: "Yellow",
  R: "Red",
  G: "Green",
  B: "Blue",
} satisfies Record<QueenColour, string>;

// ── Varroa levels ─────────────────────────────────────────
export const varroaLevels = [
  "l",
  "m",
  "h",
] as const satisfies readonly VarroaLevel[];

export const varroaLevelLabels: Record<VarroaLevel, string> = {
  l: "Low",
  m: "Medium",
  h: "High",
} satisfies Record<VarroaLevel, string>;

// ── Weather conditions ────────────────────────────────────
export const weatherConditions = [
  "c",
  "s",
  "r",
  "f",
] as const satisfies readonly WeatherCondition[];

export const weatherConditionLabels: Record<WeatherCondition, string> = {
  c: "Cloudy",
  s: "Sunny",
  r: "Rain",
  f: "Fair",
} satisfies Record<WeatherCondition, string>;
