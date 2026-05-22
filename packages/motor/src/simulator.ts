/**
 * Spec: Fase 3 §10 — simulator.
 *
 * Projeta tempo de quitacao em 3 cenarios:
 * - conservative: aporta apenas safeCapacity * 0.5 (margem ampla)
 * - optimized:    aporta safeCapacity (uso pleno)
 * - accelerated:  aporta safeCapacity * 1.2 (corta gasto extra)
 *
 * Para cada cenario, simula mes a mes ate a divida ser quitada,
 * aplicando juros mensais. Estimativa eh aproximada — ordem de
 * grandeza para guiar decisao, nao planilha financeira detalhada.
 */

export type SimulationStrategy = "snowball" | "avalanche" | "hybrid";

export interface SimulatorDebt {
	id: string;
	remainingAmount: number; // totalAmount - amountPaid
	interestRateMonthly: number; // 0 para semjuros
	monthlyMinimum: number; // pagamento minimo obrigatorio
}

export interface SimulationInput {
	debts: SimulatorDebt[];
	safeCapacity: number;
	strategy: SimulationStrategy;
}

export interface SimulationScenario {
	name: "conservative" | "optimized" | "accelerated";
	monthlyContribution: number;
	estimatedMonths: number | null; // null se nao paga em ate 120 meses
	totalInterestPaid: number;
}

export interface SimulationResult {
	conservative: SimulationScenario;
	optimized: SimulationScenario;
	accelerated: SimulationScenario;
}

const MAX_SIMULATION_MONTHS = 120; // 10 anos
const CONSERVATIVE_RATIO = 0.5;
const ACCELERATED_RATIO = 1.2;

export function runSimulation(input: SimulationInput): SimulationResult {
	return {
		conservative: simulateScenario(input, "conservative", input.safeCapacity * CONSERVATIVE_RATIO),
		optimized: simulateScenario(input, "optimized", input.safeCapacity),
		accelerated: simulateScenario(input, "accelerated", input.safeCapacity * ACCELERATED_RATIO),
	};
}

function simulateScenario(
	input: SimulationInput,
	name: SimulationScenario["name"],
	contribution: number,
): SimulationScenario {
	if (contribution <= 0 || input.debts.length === 0) {
		return {
			name,
			monthlyContribution: Math.max(0, contribution),
			estimatedMonths: null,
			totalInterestPaid: 0,
		};
	}

	const debts = input.debts.map((d) => ({ ...d }));
	let totalInterestPaid = 0;
	let month = 0;

	while (debts.some((d) => d.remainingAmount > 0.01) && month < MAX_SIMULATION_MONTHS) {
		month += 1;
		const active = debts.filter((d) => d.remainingAmount > 0.01);

		// Aplica juros mensais em todas as ativas
		for (const d of active) {
			const interest = d.remainingAmount * d.interestRateMonthly;
			d.remainingAmount += interest;
			totalInterestPaid += interest;
		}

		// Distribui pagamento: minimos obrigatorios primeiro, sobra vai
		// para a divida priorizada pela strategy.
		let budgetLeft = contribution;
		for (const d of active) {
			const minPay = Math.min(d.monthlyMinimum, d.remainingAmount);
			const pay = Math.min(minPay, budgetLeft);
			d.remainingAmount -= pay;
			budgetLeft -= pay;
			if (budgetLeft <= 0) break;
		}

		if (budgetLeft > 0) {
			const target = pickTarget(active, input.strategy);
			if (target) {
				const extra = Math.min(budgetLeft, target.remainingAmount);
				target.remainingAmount -= extra;
			}
		}
	}

	const allPaid = debts.every((d) => d.remainingAmount <= 0.01);

	return {
		name,
		monthlyContribution: contribution,
		estimatedMonths: allPaid ? month : null,
		totalInterestPaid,
	};
}

function pickTarget(
	active: SimulatorDebt[],
	strategy: SimulationStrategy,
): SimulatorDebt | undefined {
	if (active.length === 0) return undefined;
	if (strategy === "snowball") {
		// menor saldo primeiro
		return [...active].sort((a, b) => a.remainingAmount - b.remainingAmount)[0];
	}
	if (strategy === "avalanche") {
		// maior juros primeiro
		return [...active].sort((a, b) => b.interestRateMonthly - a.interestRateMonthly)[0];
	}
	// hybrid: maior (juros * saldo) — bang for buck
	return [...active].sort(
		(a, b) => b.interestRateMonthly * b.remainingAmount - a.interestRateMonthly * a.remainingAmount,
	)[0];
}
