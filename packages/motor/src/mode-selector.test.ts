import { describe, expect, it } from "vitest";
import { selectMode } from "./mode-selector";

describe("selectMode", () => {
	it.each([
		["healthy_with_debt", "payoff"],
		["tight_budget", "stabilization"],
		["monthly_deficit", "crisis_mode"],
		["overindebtedness", "protection"],
		["practical_insolvency", "survival"],
	] as const)("mapeia %s -> %s", (state, mode) => {
		expect(selectMode(state)).toBe(mode);
	});
});
