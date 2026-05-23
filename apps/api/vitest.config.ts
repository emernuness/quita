import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		include: ["src/**/*.{test,spec}.ts", "test/**/*.{test,spec}.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json-summary"],
			include: ["src/**/*.ts"],
			exclude: [
				"src/**/*.{test,spec}.ts",
				"src/main.ts",
				"src/**/*.module.ts",
				"src/**/*.controller.ts",
				"src/**/index.ts",
				"src/config/**",
				"src/queues/queue.constants.ts",
			],
			// Spec AdvDiabo v2 #6: threshold enforced no CI.
			// Baseline atual ~35% (16 services + processors + auth). Target progressivo:
			// 30 (M+0, hoje) → 50 (M+1) → 70 (M+3). Issue: coverage-progressivo
			thresholds: {
				lines: 30,
				statements: 30,
				functions: 30,
				branches: 20,
			},
		},
	},
});
