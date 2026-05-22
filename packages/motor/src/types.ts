/**
 * Tipos foundation do motor de decisao Quita (Fase 3 §2 da spec).
 * Sao funcoes puras — recebem input explicito, devolvem output deterministico.
 * Sem acesso a banco; repositorios sao orquestrados nas bordas (NestJS).
 */

export type TriggerEvent =
	| "income_added"
	| "income_updated"
	| "income_removed"
	| "expense_added"
	| "expense_updated"
	| "expense_removed"
	| "debt_added"
	| "debt_updated"
	| "debt_removed"
	| "payment_recorded"
	| "payment_reverted"
	| "settlement_evaluated"
	| "behavior_profile_updated"
	| "goal_added"
	| "goal_updated"
	| "emergency_reserve_updated"
	| "month_rollover"
	| "manual_recalc"
	| "data_freshness_review";

export interface MotorContext {
	userId: string;
	referenceMonth: Date; // primeiro dia do mes (UTC)
	triggerEvent: TriggerEvent;
	triggeredAt: Date;
	now: Date; // injetado para determinismo (nunca Date.now() interno)
}

export interface MotorResult<T> {
	data: T;
	warnings: string[]; // mostrar ao usuario
	internalWarnings: string[]; // log do time
}

export type FinancialState =
	| "healthy_with_debt"
	| "tight_budget"
	| "monthly_deficit"
	| "overindebtedness"
	| "practical_insolvency";

export type OperationMode = "payoff" | "stabilization" | "crisis_mode" | "protection" | "survival";

export type ActionType =
	| "pay"
	| "negotiate"
	| "pause"
	| "cut"
	| "wait"
	| "review"
	| "refuse"
	| "monitor";

export type DiagnosisLevel = "minimal" | "basic" | "detailed";
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Breakdown completo da capacidade segura (Fase 1 §7.3 / Fase 3 §7.3).
 *
 * Formula:
 *   safeCapacity = incomeNetMonthly
 *                - essentialsTotal
 *                - seasonalProvisionTotal
 *                - incomeProtectiveTotal
 *                - legalsTotal
 *                - operationalReserve
 *                - emergencyReserveContribution
 *
 * minimumVital eh apenas referencia regional (nao subtrai diretamente);
 * usado para detectar estado `practical_insolvency` quando renda nao
 * cobre o minimo regional para a UF/dependentes.
 */
export interface CapacityBreakdown {
	incomeNetMonthly: number;
	essentialsTotal: number;
	seasonalProvisionTotal: number;
	incomeProtectiveTotal: number;
	legalsTotal: number;
	minimumVital: number;
	operationalReserve: number;
	emergencyReserveContribution: number;
	safeCapacity: number;
}

/**
 * Input minimo para classificacao de estado.
 * Todos os valores ja agregados pelo orquestrador (sem JSONs brutos).
 */
export interface StateClassifierInput {
	capacity: CapacityBreakdown;
	debtsTotalMonthlyAmount: number;
	hasCriticalRiskDebt: boolean;
	diagnosisLevel: DiagnosisLevel;
}

export interface StateClassifierOutput {
	state: FinancialState;
	mode: OperationMode;
	confidence: ConfidenceLevel;
}

/**
 * Input do calculo de capacidade segura. Itens essenciais ja somados
 * pelo expense-classification-service. Renda liquida ja descontada
 * impostos pelo financial-profile-service.
 */
export interface CapacityCalculatorInput {
	incomeNetMonthly: number;
	essentials: ExpenseLineLike[];
	seasonalExpenses: ExpenseLineLike[]; // com `monthlyProvision`
	incomeProtective: ExpenseLineLike[]; // gastos necessarios para gerar renda
	legals: ExpenseLineLike[]; // pensao, multa, dividas judiciais
	minimumVitalRegional: number; // de RegionalMinimumVital
	operationalReserveRatio?: number; // default 0.05 (5%)
	emergencyReserveMonthlyTarget?: number; // 0 quando reserva nao ativa
}

export interface ExpenseLineLike {
	amount: number;
	monthlyProvision?: number | null;
}
