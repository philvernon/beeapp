/** Format a date string (ISO or timestamp) to en-GB locale. */
export function formatDate(
  input: string | Date,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof input === "string" ? new Date(input + "T00:00:00") : input;
  return d.toLocaleDateString("en-GB", opts);
}
