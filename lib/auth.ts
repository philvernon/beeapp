import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { username } from "better-auth/plugins";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { db } from "./db";
import * as schema from "./auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),

  baseURL: {
    allowedHosts: ["localhost:3000", "localhost", "192.168.*.*"],
  },

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

  advanced: {
    useSecureCookies: true,
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const cidr = process.env.AUTH_SIGNUP_CIDR;
      if (!cidr || cidr.trim() === "") {
        throw new APIError("FORBIDDEN", {
          message: "Sign-up is currently disabled. Contact an administrator.",
        });
      }

      // Parse CIDR: "192.168.1.0/24" → { network: number[], prefix: number }
      const slash = cidr.indexOf("/");
      if (slash === -1) {
        throw new APIError("FORBIDDEN", {
          message: "Sign-up is currently disabled. Contact an administrator.",
        });
      }
      const ipParts = cidr.slice(0, slash).split(".");
      const prefix = parseInt(cidr.slice(slash + 1), 10);
      if (ipParts.length !== 4 || isNaN(prefix) || prefix < 0 || prefix > 32) {
        throw new APIError("FORBIDDEN", {
          message: "Sign-up is currently disabled. Contact an administrator.",
        });
      }
      const network = ipParts.map((p) => {
        const n = parseInt(p, 10);
        return isNaN(n) || n < 0 || n > 255 ? -1 : n;
      });
      if (network.some((b) => b === -1)) {
        throw new APIError("FORBIDDEN", {
          message: "Sign-up is currently disabled. Contact an administrator.",
        });
      }

      // Derive client IP from request headers (honors x-real-ip for Nginx Proxy Manager)
      const headers = ctx.headers;
      const clientIp =
        headers?.get("x-real-ip") ??
        headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        null;

      if (!clientIp) {
        throw new APIError("FORBIDDEN", {
          message: "Sign-up is currently disabled. Contact an administrator.",
        });
      }

      const ipBytes = clientIp.split(".").map((p) => parseInt(p, 10));
      if (
        ipBytes.length !== 4 ||
        ipBytes.some((b) => isNaN(b) || b < 0 || b > 255)
      ) {
        throw new APIError("FORBIDDEN", {
          message: "Sign-up is currently disabled. Contact an administrator.",
        });
      }

      // CIDR match using 32-bit arithmetic
      const ipNum =
        (ipBytes[0] << 24) +
        (ipBytes[1] << 16) +
        (ipBytes[2] << 8) +
        ipBytes[3];
      const netNum =
        (network[0] << 24) +
        (network[1] << 16) +
        (network[2] << 8) +
        network[3];
      const mask = prefix === 0 ? 0 : (-1 << (32 - prefix)) >>> 0;
      if (((ipNum >>> 0) & mask) !== ((netNum >>> 0) & mask)) {
        throw new APIError("FORBIDDEN", {
          message: "Sign-up is restricted to the local network.",
        });
      }
    }),
  },
});

export type Auth = typeof auth;
