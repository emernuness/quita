import { describe, expect, it, vi } from "vitest";
import { MotorOrchestratorService } from "./motor-orchestrator.service";

/**
 * Testes de integracao do MotorOrchestratorService usando PrismaService mockado.
 * Cobre os 3 caminhos principais:
 * 1. Cenario saudavel — gera plano payoff
 * 2. Cenario insolvencia — survival, nao gera pay/negotiate
 * 3. Persistencia em transacao + reconciliacao de RecommendedAction
 */

function makePrismaMock(overrides: {
	user?: object | null;
	incomes?: object[];
	expenses?: object[];
	debts?: object[];
	scoringWeights?: object[];
	regional?: object | null;
}) {
	const tx = {
		monthlyActionPlan: { upsert: vi.fn().mockResolvedValue({ id: "plan-id" }) },
		recommendedAction: {
			deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
			createMany: vi.fn().mockResolvedValue({ count: 0 }),
		},
		debt: { update: vi.fn().mockResolvedValue({}) },
	};

	const prisma = {
		user: {
			findUnique: vi.fn().mockResolvedValue(overrides.user ?? null),
		},
		income: { findMany: vi.fn().mockResolvedValue(overrides.incomes ?? []) },
		expense: { findMany: vi.fn().mockResolvedValue(overrides.expenses ?? []) },
		debt: {
			findMany: vi.fn().mockResolvedValue(overrides.debts ?? []),
			update: vi.fn().mockResolvedValue({}),
		},
		debtCategory: { findMany: vi.fn().mockResolvedValue([]) },
		scoringWeight: { findMany: vi.fn().mockResolvedValue(overrides.scoringWeights ?? []) },
		regionalMinimumVital: {
			findFirst: vi.fn().mockResolvedValue(overrides.regional ?? null),
		},
		interestRateReference: { findMany: vi.fn().mockResolvedValue([]) },
		financialStateSnapshot: {
			findMany: vi.fn().mockResolvedValue([]),
			create: vi.fn().mockResolvedValue({}),
		},
		monthlyActionPlan: { upsert: vi.fn().mockResolvedValue({ id: "plan-id" }) },
		recommendedAction: {
			deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
			createMany: vi.fn().mockResolvedValue({ count: 0 }),
		},
		$transaction: vi.fn().mockImplementation(async (fn: (tx: typeof prisma) => unknown) => {
			if (typeof fn === "function") {
				return fn({
					...prisma,
					...tx,
					debt: { ...prisma.debt, update: tx.debt.update },
				} as never);
			}
			return Promise.all(fn);
		}),
	};
	return prisma;
}

describe("MotorOrchestratorService — integracao com Prisma mockado", () => {
	it("lanca NotFoundException quando user nao existe", async () => {
		const prisma = makePrismaMock({ user: null });
		const svc = new MotorOrchestratorService(prisma as never);
		await expect(svc.recalculateForUser("u1", "manual_recalc")).rejects.toThrow();
	});

	it("calcula plano para usuario saudavel — gera plan id", async () => {
		const prisma = makePrismaMock({
			user: {
				id: "u1",
				diagnosisLevel: "basic",
				stateCode: "BR",
				dependentsCount: 0,
				emergencyReserve: null,
				behaviorProfile: null,
			},
			incomes: [
				{
					id: "i1",
					amount: 5000,
					frequency: "recurring",
					dueDate: null,
					installments: null,
					installmentAmount: null,
					guaranteedAmount: null,
					stabilityType: "stable",
				},
			],
			expenses: [],
			debts: [],
			regional: {
				baseAmountSingle: { toNumber: () => 1320 },
				basePerDependent: { toNumber: () => 400 },
			},
		});
		const svc = new MotorOrchestratorService(prisma as never);
		const result = await svc.recalculateForUser("u1", "manual_recalc");
		expect(result.data.financialState).toBe("healthy_with_debt");
		expect(result.data.operationMode).toBe("payoff");
		expect(prisma.$transaction).toHaveBeenCalled();
	});

	it("renda zero → practical_insolvency (survival)", async () => {
		const prisma = makePrismaMock({
			user: {
				id: "u1",
				diagnosisLevel: "minimal",
				stateCode: "BR",
				dependentsCount: 0,
				emergencyReserve: null,
				behaviorProfile: null,
			},
			incomes: [],
			expenses: [],
			debts: [],
			regional: {
				baseAmountSingle: { toNumber: () => 1320 },
				basePerDependent: { toNumber: () => 400 },
			},
		});
		const svc = new MotorOrchestratorService(prisma as never);
		const result = await svc.recalculateForUser("u1", "manual_recalc");
		expect(result.data.financialState).toBe("practical_insolvency");
		expect(result.data.operationMode).toBe("survival");
		// Modo survival nao gera pay/negotiate
		for (const action of result.data.actions) {
			expect(["pay", "negotiate"]).not.toContain(action.actionType);
		}
	});

	it("aplica RegionalMinimumVital diferenciado por UF + dependentes", async () => {
		const prisma = makePrismaMock({
			user: {
				id: "u1",
				diagnosisLevel: "basic",
				stateCode: "SP",
				dependentsCount: 2,
				emergencyReserve: null,
				behaviorProfile: null,
			},
			incomes: [
				{
					id: "i1",
					amount: 2500,
					frequency: "recurring",
					dueDate: null,
					installments: null,
					installmentAmount: null,
					guaranteedAmount: null,
					stabilityType: "stable",
				},
			],
			expenses: [],
			debts: [],
			regional: {
				baseAmountSingle: { toNumber: () => 1900 },
				basePerDependent: { toNumber: () => 550 },
			},
		});
		const svc = new MotorOrchestratorService(prisma as never);
		const result = await svc.recalculateForUser("u1", "manual_recalc");
		// minimumVital = 1900 + 550*2 = 3000. Renda 2500 < 3000 → insolvencia.
		expect(result.data.financialState).toBe("practical_insolvency");
		expect(result.data.capacity.minimumVital).toBe(3000);
	});
});
