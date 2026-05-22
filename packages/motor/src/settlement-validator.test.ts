import { describe, expect, it } from "vitest";
import { type SettlementProposalInput, evaluateSettlement } from "./settlement-validator";

const baseInput: Omit<SettlementProposalInput, "proposalCashAmount" | "proposalInstallmentAmount"> =
	{
		debtId: "d1",
		debtRemaining: 10000,
		proposalInstallments: null,
		proposalDeadline: null,
		safeCapacity: 2000,
		financialState: "tight_budget",
		now: new Date("2026-05-22"),
	};

describe("evaluateSettlement — proposta a vista", () => {
	it("accept com desconto >= 30% e cabe na capacidade", () => {
		const r = evaluateSettlement({
			...baseInput,
			proposalCashAmount: 1500, // 85% desconto
			proposalInstallmentAmount: null,
		});
		expect(r.recommendation).toBe("accept");
		expect(r.discountPercent).toBeCloseTo(0.85);
	});

	it("negotiate_lower quando cabe mas desconto modesto (15-30%)", () => {
		const r = evaluateSettlement({
			...baseInput,
			proposalCashAmount: 7800, // 22% desconto
			proposalInstallmentAmount: null,
			safeCapacity: 10000, // garante que cabe
		});
		expect(r.recommendation).toBe("negotiate_lower");
	});

	it("reject quando desconto < 15%", () => {
		const r = evaluateSettlement({
			...baseInput,
			proposalCashAmount: 9500, // 5% desconto
			proposalInstallmentAmount: null,
			safeCapacity: 10000,
		});
		expect(r.recommendation).toBe("reject");
	});

	it("negotiate_lower quando nao cabe na capacidade", () => {
		const r = evaluateSettlement({
			...baseInput,
			proposalCashAmount: 5000, // 50% desconto mas nao cabe (capacidade 2000)
			proposalInstallmentAmount: null,
		});
		expect(r.recommendation).toBe("negotiate_lower");
		expect(r.wouldCauseNegativeCashflow).toBe(true);
	});

	it("reject em estado critico mesmo com desconto bom", () => {
		const r = evaluateSettlement({
			...baseInput,
			proposalCashAmount: 1000,
			proposalInstallmentAmount: null,
			financialState: "monthly_deficit",
		});
		expect(r.recommendation).toBe("reject");
	});
});

describe("evaluateSettlement — proposta parcelada", () => {
	it("accept quando parcela cabe em 70% da capacidade", () => {
		const r = evaluateSettlement({
			...baseInput,
			proposalCashAmount: null,
			proposalInstallments: 12,
			proposalInstallmentAmount: 1000, // 50% da capacidade
		});
		expect(r.recommendation).toBe("accept");
	});

	it("negotiate_lower quando parcela ultrapassa limite seguro", () => {
		const r = evaluateSettlement({
			...baseInput,
			proposalCashAmount: null,
			proposalInstallments: 12,
			proposalInstallmentAmount: 1800, // 90% da capacidade
		});
		expect(r.recommendation).toBe("negotiate_lower");
		expect(r.wouldCauseNegativeCashflow).toBe(true);
	});
});
