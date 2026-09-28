import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "./db";
import * as schema from "./auth-schema";

/**
 * Parse the AUTH_ALLOWED_IP environment variable.
 *
 * Returns the exact IP address string, or null if unset/empty.
 */
function parseAllowedIp(): string | null {
  const raw = process.env.AUTH_ALLOWED_IP;
  if (!raw || raw.trim() === "") return null;
  return raw.trim();
}

/**
 * Extract the client IP from request headers.
 *
 * Checks x-forwarded-for (first entry) and x-real-ip in order of precedence.
 */
function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return null;
}

/**
 * Check whether a sign-up request is allowed based on client IP.
 *
 * When AUTH_ALLOWED_IP is set, only requests from that exact IP can register.
 * When unset, no new registrations are allowed (fails closed).
 */
function isRegistrationAllowed(headers: Headers): boolean {
  const allowedIp = parseAllowedIp();
  if (!allowedIp) return false;
  const clientIp = getClientIp(headers);
  if (!clientIp) return false;
  return clientIp === allowedIp;
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

  // Block sign-up for non-allowlisted IPs via the user create hook.
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (!ctx?.request?.headers || !isRegistrationAllowed(ctx.request.headers)) {
            const { APIError } = await import("better-auth/api");
            throw new APIError("FORBIDDEN", {
              message: "Sign-ups are restricted to allowed IP addresses.",
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
