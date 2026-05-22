import type { CapacityBreakdown, CapacityCalculatorInput, ExpenseLineLike } from "./types";

const DEFAULT_OPERATIONAL_RESERVE_RATIO = 0.05;

function sumProvisioned(items: ExpenseLineLike[]): number {
	return items.reduce((acc, it) => acc + (it.monthlyProvision ?? 0), 0);
}

function sumAmounts(items: ExpenseLineLike[]): number {
	return items.reduce((acc, it) => acc + (it.amount ?? 0), 0);
}

/**
 * Calcula a capacidade segura mensal — base de todas as decisoes do motor.
 *
 * Spec: Fase 1 §7.3 + Fase 3 §7 (financial-state-detector).
 *
 * Ordem de subtracao (cada item nao-essencial vira `0` se ausente):
 *
 *   safeCapacity = incomeNetMonthly
 *                - essentialsTotal
 *                - seasonalProvisionTotal
 *                - incomeProtectiveTotal
 *                - legalsTotal
 *                - operationalReserve (5% da renda por default)
 *                - emergencyReserveContribution
 *
 * **Sem efeitos colaterais. Determinístico.**
 *
 * @returns breakdown completo (cada componente exposto para auditoria/UI).
 */
export function calculateCapacity(input: CapacityCalculatorInput): CapacityBreakdown {
	const essentialsTotal = sumAmounts(input.essentials);
	const seasonalProvisionTotal = sumProvisioned(input.seasonalExpenses);
	const incomeProtectiveTotal = sumAmounts(input.incomeProtective);
	const legalsTotal = sumAmounts(input.legals);
	const operationalReserve =
		input.incomeNetMonthly * (input.operationalReserveRatio ?? DEFAULT_OPERATIONAL_RESERVE_RATIO);
	const emergencyReserveContribution = input.emergencyReserveMonthlyTarget ?? 0;

	const safeCapacity =
		input.incomeNetMonthly -
		essentialsTotal -
		seasonalProvisionTotal -
		incomeProtectiveTotal -
		legalsTotal -
		operationalReserve -
		emergencyReserveContribution;

	return {
		incomeNetMonthly: input.incomeNetMonthly,
		essentialsTotal,
		seasonalProvisionTotal,
		incomeProtectiveTotal,
		legalsTotal,
		minimumVital: input.minimumVitalRegional,
		operationalReserve,
		emergencyReserveContribution,
		safeCapacity,
	};
}
