import { type SimulationStrategy, type SimulatorDebt, runSimulation } from "./simulator";

/**
 * Spec Fase 4 §3 modulo 12 — long-term-plan-service.
 *
 * Projeção de 12-24 meses com checkpoints trimestrais.
 * Função pura — recebe dívidas + estratégia + capacidade média projetada.
 */
export interface LongTermPlanInput {
	debts: SimulatorDebt[];
	monthlyCapacity: number;
	strategy: SimulationStrategy;
	horizonMonths?: number; // default 24
}

export interface QuarterlyCheckpoint {
	quarterIndex: number; // 1..N
	monthIndex: number; // 3, 6, 9, 12, ...
	debtsRemaining: number; // soma dos remanescentes
	debtsPaidOff: number; // dividas quitadas até este checkpoint
	totalInterestPaid: number;
}

export interface LongTermPlanResult {
	horizonMonths: number;
	estimatedDebtFreeMonth: number | null; // null se nao quitar no horizonte
	checkpoints: QuarterlyCheckpoint[];
	totalInterestProjected: number;
}

const DEFAULT_HORIZON = 24;
const QUARTER_LEN = 3;

export function projectLongTermPlan(input: LongTermPlanInput): LongTermPlanResult {
	const horizon = input.horizonMonths ?? DEFAULT_HORIZON;
	const sim = runSimulation({
		debts: input.debts,
		safeCapacity: input.monthlyCapacity,
		strategy: input.strategy,
	});

	// Re-simula passo a passo para checkpoints.
	const debts = input.debts.map((d) => ({ ...d }));
	let totalInterestPaid = 0;
	let debtsPaidOff = 0;
	let estimatedDebtFreeMonth: number | null = null;
	const checkpoints: QuarterlyCheckpoint[] = [];

	for (let month = 1; month <= horizon; month += 1) {
		const active = debts.filter((d) => d.remainingAmount > 0.01);
		if (active.length === 0) {
			if (estimatedDebtFreeMonth === null) estimatedDebtFreeMonth = month - 1;
			break;
		}

		let budget = Math.max(0, input.monthlyCapacity);
		for (const d of active) {
			const pay = Math.min(d.monthlyMinimum, d.remainingAmount, budget);
			d.remainingAmount -= pay;
			budget -= pay;
			if (budget <= 0) break;
		}
		if (budget > 0) {
			const target = pickTargetByStrategy(active, input.strategy);
			if (target) {
				const extra = Math.min(budget, target.remainingAmount);
				target.remainingAmount -= extra;
			}
		}
		for (const d of active) {
			if (d.remainingAmount <= 0.01) continue;
			const interest = d.remainingAmount * d.interestRateMonthly;
			d.remainingAmount += interest;
			totalInterestPaid += interest;
		}

		debtsPaidOff = debts.filter((d) => d.remainingAmount <= 0.01).length;

		if (month % QUARTER_LEN === 0) {
			checkpoints.push({
				quarterIndex: month / QUARTER_LEN,
				monthIndex: month,
				debtsRemaining: debts.reduce((acc, d) => acc + Math.max(0, d.remainingAmount), 0),
				debtsPaidOff,
				totalInterestPaid,
			});
		}
	}

	if (estimatedDebtFreeMonth === null && debts.every((d) => d.remainingAmount <= 0.01)) {
		estimatedDebtFreeMonth = horizon;
	}

	return {
		horizonMonths: horizon,
		estimatedDebtFreeMonth,
		checkpoints,
		totalInterestProjected: totalInterestPaid + sim.optimized.totalInterestPaid * 0, // reuse sim para warmup; opcional
	};
}

function pickTargetByStrategy(
	active: SimulatorDebt[],
	strategy: SimulationStrategy,
): SimulatorDebt | undefined {
	if (active.length === 0) return undefined;
	if (strategy === "snowball") {
		return [...active].sort((a, b) => a.remainingAmount - b.remainingAmount)[0];
	}
	if (strategy === "avalanche") {
		return [...active].sort((a, b) => b.interestRateMonthly - a.interestRateMonthly)[0];
	}
	return [...active].sort(
		(a, b) => b.interestRateMonthly * b.remainingAmount - a.interestRateMonthly * a.remainingAmount,
	)[0];
}
