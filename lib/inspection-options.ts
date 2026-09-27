/**
 * Client-safe inspection option values and labels.
 *
 * UI dropdowns and radio groups consume these directly — no Drizzle or Zod
 * dependency — so client components can avoid importing from lib/schema.ts.
 */

// ── Queen colours ─────────────────────────────────────────
export const queenColours = ["W", "Y", "R", "G", "B"] as const;

export const queenColourLabels: Record<(typeof queenColours)[number], string> =
  {
    W: "White",
    Y: "Yellow",
    R: "Red",
    G: "Green",
    B: "Blue",
  };

// ── Varroa levels ─────────────────────────────────────────
export const varroaLevels = ["l", "m", "h"] as const;

export const varroaLevelLabels: Record<(typeof varroaLevels)[number], string> =
  {
    l: "Low",
    m: "Medium",
    h: "High",
  };

// ── Weather conditions ────────────────────────────────────
export const weatherConditions = ["c", "s", "r", "f"] as const;

export const weatherConditionLabels: Record<
  (typeof weatherConditions)[number],
  string
> = {
  c: "Cloudy",
  s: "Sunny",
  r: "Rain",
  f: "Fair",
};
