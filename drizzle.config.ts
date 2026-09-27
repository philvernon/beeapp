import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local if present (local overrides, e.g. localhost URL for
// pnpm db:migrate / pnpm dev). Falls back to .env when not present.
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
