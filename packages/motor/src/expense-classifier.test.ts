import { describe, expect, it } from "vitest";
import { EXPENSE_CATEGORY_DEFAULTS, classifyExpense } from "./expense-classifier";

describe("classifyExpense", () => {
	it("aplica defaults da categoria housing", () => {
		const r = classifyExpense({ category: "housing" });
		expect(r.isEssential).toBe(true);
		expect(r.consequenceIfUnpaid).toBe("loss_of_asset");
		expect(r.canCancel).toBe(false);
		expect(r.dataConfidence).toBe("medium");
	});

	it("declaracao do usuario tem precedencia sobre defaults", () => {
		const r = classifyExpense({
			category: "leisure",
			isEssential: true,
			dataConfidence: "high",
		});
		expect(r.isEssential).toBe(true);
		expect(r.dataConfidence).toBe("high");
	});

	it("aggressiveFallback assume essential salvo leisure/subscription", () => {
		const r1 = classifyExpense({ category: "transport" }, { aggressiveFallback: true });
		const r2 = classifyExpense({ category: "leisure" }, { aggressiveFallback: true });
		expect(r1.isEssential).toBe(true);
		expect(r2.isEssential).toBe(false);
		expect(r1.dataConfidence).toBe("low");
	});

	it("legal carrega isLegalObligation true", () => {
		const r = classifyExpense({ category: "legal" });
		expect(r.isLegalObligation).toBe(true);
		expect(r.consequenceIfUnpaid).toBe("legal_action");
	});

	it("EXPENSE_CATEGORY_DEFAULTS cobre todas as categorias", () => {
		const categories = Object.keys(EXPENSE_CATEGORY_DEFAULTS);
		expect(categories.length).toBe(14);
	});
});
