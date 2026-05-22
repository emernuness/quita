import { describe, expect, it } from "vitest";
import {
	OPERATION_MODE_RULES,
	getAllowedActions,
	isActionAllowed,
	selectStrategy,
} from "./strategy-selector";

describe("selectStrategy", () => {
	it("forca crisis em monthly_deficit", () => {
		expect(
			selectStrategy({
				financialState: "monthly_deficit",
				mode: "crisis_mode",
				debtsCount: 5,
				smallDebtsCount: 5,
				highInterestDebtsCount: 0,
				preferredStrategy: "snowball",
			}),
		).toBe("crisis");
	});

	it("forca crisis em overindebtedness e ignora preferencia", () => {
		expect(
			selectStrategy({
				financialState: "overindebtedness",
				mode: "protection",
				debtsCount: 3,
				smallDebtsCount: 0,
				highInterestDebtsCount: 0,
				preferredStrategy: "avalanche",
			}),
		).toBe("crisis");
	});

	it("respeita preferencia em estados nao criticos", () => {
		expect(
			selectStrategy({
				financialState: "healthy_with_debt",
				mode: "payoff",
				debtsCount: 5,
				smallDebtsCount: 5,
				highInterestDebtsCount: 0,
				preferredStrategy: "avalanche",
			}),
		).toBe("avalanche");
	});

	it("ignora 'undecided' como nao-preferencia", () => {
		expect(
			selectStrategy({
				financialState: "healthy_with_debt",
				mode: "payoff",
				debtsCount: 0,
				smallDebtsCount: 0,
				highInterestDebtsCount: 0,
				preferredStrategy: "undecided",
			}),
		).toBe("hybrid");
	});

	it("auto-snowball quando >= 3 dividas pequenas e sem preferencia", () => {
		expect(
			selectStrategy({
				financialState: "tight_budget",
				mode: "stabilization",
				debtsCount: 5,
				smallDebtsCount: 4,
				highInterestDebtsCount: 0,
				preferredStrategy: null,
			}),
		).toBe("snowball");
	});

	it("auto-avalanche quando >= 2 dividas de juros alto e sem preferencia", () => {
		expect(
			selectStrategy({
				financialState: "tight_budget",
				mode: "stabilization",
				debtsCount: 3,
				smallDebtsCount: 0,
				highInterestDebtsCount: 2,
				preferredStrategy: null,
			}),
		).toBe("avalanche");
	});
});

describe("OPERATION_MODE_RULES (constante critica)", () => {
	it("survival NUNCA permite pay ou negotiate", () => {
		expect(OPERATION_MODE_RULES.survival).not.toContain("pay");
		expect(OPERATION_MODE_RULES.survival).not.toContain("negotiate");
	});

	it("crisis_mode permite refuse e wait", () => {
		expect(OPERATION_MODE_RULES.crisis_mode).toContain("refuse");
		expect(OPERATION_MODE_RULES.crisis_mode).toContain("wait");
	});

	it("payoff bloqueia pause", () => {
		expect(OPERATION_MODE_RULES.payoff).not.toContain("pause");
	});
});

describe("isActionAllowed", () => {
	it("retorna true para pay em payoff", () => {
		expect(isActionAllowed("pay", "payoff")).toBe(true);
	});

	it("retorna false para pay em survival", () => {
		expect(isActionAllowed("pay", "survival")).toBe(false);
	});
});

describe("getAllowedActions", () => {
	it("retorna lista do mode", () => {
		expect(getAllowedActions("survival")).toEqual(["pause", "wait", "review", "monitor"]);
	});
});
