import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths(), react()],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["__tests__/setup.ts"],
		include: ["**/*.{test,spec}.{ts,tsx}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov"],
			include: ["app/**", "lib/**"],
			exclude: [
				"node_modules/",
				".next/",
				"**/*.config.*",
				"**/drizzle.config.ts",
				// Generated coverage output (gitignored but ESLint scans it):
				"coverage/**",
				// Server-only page components without direct tests
				"app/**/page.tsx",
			],
			thresholds: {
				statements: 95,
				branches: 90,
				functions: 94,
				lines: 95,
			},
		},
	},
});
