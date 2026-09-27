import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env first (Docker defaults), then .env.local on top (local overrides).
// .env.local should set DATABASE_URL with localhost for local tooling.
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
