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

  baseURL: process.env.BETTER_AUTH_URL || {
    allowedHosts: ["localhost:*", "127.0.0.1:*", "localhost", "127.0.0.1"],
  },

  advanced: {
    useSecureCookies: true,
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      // LAN restriction only applies in production (behind Nginx Proxy Manager).
      // Local development via pnpm dev or docker compose skips the check.
      if (process.env.DEV === "true") return;

      const viaNginx = ctx.headers?.get("X-Via-Nginx") === "1";

      if (viaNginx) {
        throw new APIError("FORBIDDEN", {
          message: "Sign-up is restricted to the local network.",
        });
      }
    }),
  },
});

export type Auth = typeof auth;
