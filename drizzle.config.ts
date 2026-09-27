import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env first (Docker defaults), then .env.local on top (local
// overrides, e.g. localhost URL for pnpm db:migrate / pnpm dev).
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
