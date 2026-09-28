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

  advanced: {
    useSecureCookies: true,
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const clientIp = ctx.headers?.get("x-real-ip");

      if (!clientIp || !clientIp.startsWith("192.168.1.")) {
        throw new APIError("FORBIDDEN", {
          message: "Sign-up is restricted to the local network.",
        });
      }
    }),
  },
});

export type Auth = typeof auth;
