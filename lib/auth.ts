import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "./db";
import * as schema from "./auth-schema";

/**
 * Parse the AUTH_ALLOWED_EMAILS environment variable.
 *
 * Returns a sorted array of lowercased, trimmed email addresses.
 * An empty or missing value returns an empty array (fails closed —
 * no new registrations allowed until the allowlist is configured).
 */
function parseAllowedEmails(): string[] {
  const raw = process.env.AUTH_ALLOWED_EMAILS;
  if (!raw || raw.trim() === "") return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

/**
 * Check whether an email address is allowlisted for sign-up.
 */
function isEmailAllowed(email: string): boolean {
  const allowed = parseAllowedEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.toLowerCase());
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),

  emailAndPassword: {
    enabled: true,
  },

  // No email verification in this issue.
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: false,
  },

  // Block sign-up for non-allowlisted emails via the user create hook.
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!isEmailAllowed(user.email)) {
            const { APIError } = await import("better-auth/api");
            throw new APIError("FORBIDDEN", {
              message: "Sign-ups are restricted to allowed email addresses.",
            });
          }
          return { data: user };
        },
      },
    },
  },

  advanced: {
    useSecureCookies: true,
  },
});

export type Auth = typeof auth;
