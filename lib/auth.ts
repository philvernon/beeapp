import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { username } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),

  baseURL: {
    allowedHosts: [
      "localhost:3000",
      "localhost",
      "192.168.*.*",
    ],
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
});

export type Auth = typeof auth;
