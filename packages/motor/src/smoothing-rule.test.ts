import { describe, expect, it } from "vitest";
import { applySmoothingRule, stateRank } from "./smoothing-rule";

describe("applySmoothingRule", () => {
	it("primeira observacao sempre vence", () => {
		const r = applySmoothingRule({
			rawState: "monthly_deficit",
			lastState: null,
		});
		expect(r.smoothedState).toBe("monthly_deficit");
		expect(r.transitionType).toBe("stable");
	});

	it("estado igual eh estavel", () => {
		const r = applySmoothingRule({
			rawState: "tight_budget",
			lastState: "tight_budget",
		});
		expect(r.transitionType).toBe("stable");
	});

	it("melhora aplica imediato", () => {
		const r = applySmoothingRule({
			rawState: "healthy_with_debt",
			lastState: "tight_budget",
		});
		expect(r.smoothedState).toBe("healthy_with_debt");
		expect(r.transitionType).toBe("improvement");
	});

	it("piora primeira deteccao mantem estado anterior", () => {
		const r = applySmoothingRule({
			rawState: "monthly_deficit",
			lastState: "tight_budget",
			lastRawState: "tight_budget",
		});
		expect(r.smoothedState).toBe("tight_budget");
		expect(r.transitionType).toBe("downgrade_pending");
		expect(r.pendingDowngradeFor).toBe("monthly_deficit");
	});

	it("piora confirmada apos 2 meses aplica", () => {
		const r = applySmoothingRule({
			rawState: "monthly_deficit",
			lastState: "tight_budget",
			lastRawState: "monthly_deficit", // mes anterior ja viu o pior
		});
		expect(r.smoothedState).toBe("monthly_deficit");
		expect(r.transitionType).toBe("downgrade_applied");
	});

	it("piora SEM lastRawState fica pending (defensivo)", () => {
		const r = applySmoothingRule({
			rawState: "overindebtedness",
			lastState: "monthly_deficit",
		});
		expect(r.transitionType).toBe("downgrade_pending");
	});

	it("stateRank ordena corretamente", () => {
		expect(stateRank("healthy_with_debt")).toBe(0);
		expect(stateRank("practical_insolvency")).toBe(4);
	});
});
