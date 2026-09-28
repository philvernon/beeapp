import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { username } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./auth-schema";

/**
 * Parse the AUTH_ALLOWED_IP environment variable.
 *
 * Supports a single IP or CIDR range (e.g. "192.168.1.0/24").
 * Returns null if unset/empty.
 */
function parseAllowedIp(): { ip: string; prefix?: number } | null {
  const raw = process.env.AUTH_ALLOWED_IP;
  if (!raw || raw.trim() === "") return null;
  const trimmed = raw.trim();
  const slashIdx = trimmed.indexOf("/");
  if (slashIdx !== -1) {
    const ip = trimmed.slice(0, slashIdx);
    const prefix = parseInt(trimmed.slice(slashIdx + 1), 10);
    if (!isNaN(prefix)) return { ip, prefix };
  }
  return { ip: trimmed };
}

/**
 * Convert an IPv4 address to a 32-bit integer.
 */
function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255))
    return -1;
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
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
 * Supports exact IP match or CIDR range (e.g. "192.168.1.0/24").
 * When unset, no new registrations are allowed (fails closed).
 */
function isRegistrationAllowed(headers: Headers): boolean {
  const allowed = parseAllowedIp();
  if (!allowed) return false;
  const clientIp = getClientIp(headers);
  if (!clientIp) return false;

  if (allowed.prefix !== undefined) {
    const network = ipToInt(allowed.ip);
    const client = ipToInt(clientIp);
    if (network === -1 || client === -1) return false;
    const mask = ~(0xffffffff >> allowed.prefix) >>> 0;
    return (network & mask) === (client & mask);
  }

  return clientIp === allowed.ip;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),

  trustedOrigins: [
    "http://localhost:3000",
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS
      ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
      : []),
  ],

  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    username({
      displayUsername: false,
    }),
  ],

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
          if (
            !ctx?.request?.headers ||
            !isRegistrationAllowed(ctx.request.headers)
          ) {
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
