export { cn } from "cn";

/**
 * Return today's local calendar date as `YYYY-MM-DD`.
 *
 * Uses local date components (`getFullYear`, `getMonth`, `getDate`) so the
 * result matches the user's calendar day regardless of timezone offset.
 */
export function getLocalDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
