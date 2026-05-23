import { describe, expect, it } from "vitest";
import {
	type ClassifiedDebt,
	type ScoringContext,
	calculatePriority,
	calculatePriorityBatch,
} from "./priority-engine";

function makeDebt(overrides: Partial<ClassifiedDebt> = {}): ClassifiedDebt {
	return {
		id: "d1",
		totalAmount: 1000,
		amountPaid: 0,
		monthlyAmount: null,
		hasInterest: false,
		interestRateMonthly: null,
		daysOverdue: 0,
		installmentsOverdue: 0,
		affectsSurvival: false,
		affectsIncome: false,
		hasLegalRisk: false,
		collateralType: null,
		settlementCashAmount: null,
		settlementInstallmentAmount: null,
		...overrides,
	};
}

const ctx: ScoringContext = {
	safeCapacity: 1000,
	financialState: "tight_budget",
};

describe("calculatePriority", () => {
	it("retorna score baixo para divida grande sem fatores criticos", () => {
		// Divida grande (10x capacidade) sem risco -> sem fatores ativos
		const r = calculatePriority(makeDebt({ totalAmount: 10000 }), ctx);
		expect(r.score).toBe(0);
		expect(r.reason).toBe("Prioridade padrão por categoria.");
	});

	it("aplica peso 30 (max) para divida com risco de moradia + collateralProperty", () => {
		const r = calculatePriority(
			makeDebt({ affectsSurvival: true, collateralType: "property" }),
			ctx,
		);
		// risco_moradia = 1 * 30 = 30
		expect(r.score).toBeGreaterThanOrEqual(30);
		expect(r.topFactors[0].factorKey).toBe("risco_moradia");
	});

	it("aplica peso negativo para parcela_insustentavel", () => {
		const r = calculatePriority(
			makeDebt({
				monthlyAmount: 600, // 60% da safeCapacity = 1000
			}),
			ctx,
		);
		// parcela_insustentavel = 1 * 30 * -1 = -30
		expect(r.score).toBeLessThan(0);
	});

	it("normaliza juros (15% a.m. = teto)", () => {
		const r = calculatePriority(makeDebt({ interestRateMonthly: 0.15 }), ctx);
		// juros_mensal_normalizado = 1 * 15 = 15
		expect(r.score).toBeGreaterThanOrEqual(15);
	});

	it("conta dias_em_atraso normalizado em 90 (cap em 1)", () => {
		// Usa divida grande para evitar overlap com valor_pequeno_quitavel
		const r45 = calculatePriority(makeDebt({ totalAmount: 10000, daysOverdue: 45 }), ctx);
		const r180 = calculatePriority(makeDebt({ totalAmount: 10000, daysOverdue: 180 }), ctx);
		expect(r180.score).toBeGreaterThan(r45.score);
		// 180 dias capped em 1 * 10 = 10
		expect(r180.score).toBeCloseTo(10);
	});

	it("valor pequeno quitavel: divida cabe na capacidade ganha boost", () => {
		const r = calculatePriority(makeDebt({ totalAmount: 500 }), ctx);
		// valor_pequeno_quitavel = 1 (500 <= 800) * 8 = 8
		expect(r.score).toBeGreaterThanOrEqual(8);
	});

	it("inclui reason customizada com dias de atraso quando relevante", () => {
		const r = calculatePriority(makeDebt({ totalAmount: 10000, daysOverdue: 90 }), ctx);
		expect(r.reason).toContain("90 dias em atraso");
	});

	it("eh deterministico", () => {
		const d = makeDebt({ affectsSurvival: true });
		expect(calculatePriority(d, ctx)).toEqual(calculatePriority(d, ctx));
	});
});

describe("calculatePriorityBatch", () => {
	it("ordena por score decrescente", () => {
		const d1 = makeDebt({ id: "low", totalAmount: 5000 });
		const d2 = makeDebt({ id: "high", affectsSurvival: true, collateralType: "property" });
		const result = calculatePriorityBatch([d1, d2], ctx);
		expect(result[0].debtId).toBe("high");
		expect(result[1].debtId).toBe("low");
	});
});
