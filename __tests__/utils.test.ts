import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLocalDate } from "@/lib/utils";

describe("getLocalDate", () => {
  let realDate: typeof globalThis.Date;

  beforeEach(() => {
    realDate = global.Date;
  });

  afterEach(() => {
    global.Date = realDate;
  });

  function freezeDate(dateStr: string) {
    const d = new realDate(dateStr);
    global.Date = class extends realDate {
      constructor(year?: number, month?: number, date?: number) {
        if (year === undefined && month === undefined && date === undefined) {
          super(d.getTime());
        } else {
          super(year as number, month as number, date as number);
        }
      }
    } as unknown as typeof globalThis.Date;
  }

  it("returns YYYY-MM-DD format", () => {
    freezeDate("2025-06-15T12:00:00Z");
    const result = getLocalDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns the correct local date in UTC+0", () => {
    freezeDate("2025-06-15T12:00:00Z");
    // In UTC+0, 12:00 UTC = 12:00 local
    vi.stubEnv("TZ", "UTC");
    const result = getLocalDate();
    expect(result).toBe("2025-06-15");
    vi.unstubAllEnvs();
  });

  it("returns the correct local date in a positive offset (e.g. UTC+12)", () => {
    freezeDate("2025-06-15T02:00:00Z");
    // In UTC+12, 02:00 UTC = 14:00 local → same day
    vi.stubEnv("TZ", "Pacific/Auckland");
    const result = getLocalDate();
    expect(result).toBe("2025-06-15");
    vi.unstubAllEnvs();
  });

  it("returns the correct local date in a negative offset (e.g. UTC-11)", () => {
    freezeDate("2025-06-15T05:00:00Z");
    // In UTC-11, 05:00 UTC = 18:00 previous day local → June 14
    vi.stubEnv("TZ", "Pacific/Pago_Pago");
    const result = getLocalDate();
    expect(result).toBe("2025-06-14");
    vi.unstubAllEnvs();
  });

  it("handles local midnight correctly when UTC is previous day", () => {
    // 23:30 UTC on June 14 = 00:30 BST (UTC+1) on June 15
    freezeDate("2025-06-14T23:30:00Z");
    vi.stubEnv("TZ", "Europe/London");
    const result = getLocalDate();
    expect(result).toBe("2025-06-15");
    vi.unstubAllEnvs();
  });

  it("handles local midnight correctly when UTC is next day", () => {
    // 00:30 UTC on June 15 = 16:30 local on June 14 in UTC-8 (AKDT)
    freezeDate("2025-06-15T00:30:00Z");
    vi.stubEnv("TZ", "America/Anchorage");
    const result = getLocalDate();
    expect(result).toBe("2025-06-14");
    vi.unstubAllEnvs();
  });

  it("pads month and day with leading zeros", () => {
    freezeDate("2025-01-05T12:00:00Z");
    vi.stubEnv("TZ", "UTC");
    const result = getLocalDate();
    expect(result).toBe("2025-01-05");
    vi.unstubAllEnvs();
  });
});
