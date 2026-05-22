import type { ConfidenceLevel } from "./types";

/**
 * Spec: Fase 3 §5 — expense-classification-service.
 *
 * Funcao pura: recebe a despesa e a tabela de defaults da categoria,
 * preenche as flags faltantes. Declaracao manual do usuario tem precedencia.
 */

export type ExpenseCategory =
	| "housing"
	| "utilities"
	| "bills" // alias legado de utilities (mantido para compat com schema)
	| "telecom"
	| "food"
	| "transport"
	| "health"
	| "education"
	| "childcare"
	| "work_tools"
	| "insurance"
	| "legal"
	| "subscription"
	| "leisure"
	| "other";

export type ConsequenceType = "service_cut" | "loss_of_asset" | "legal_action" | "fine" | "none";

export interface ExpenseDefaults {
	isEssential: boolean;
	isIncomeRelated: boolean;
	isLegalObligation: boolean;
	canReduce: boolean;
	canCancel: boolean;
	consequenceIfUnpaid: ConsequenceType;
}

export interface RawExpense {
	category: ExpenseCategory;
	isEssential?: boolean | null;
	isIncomeRelated?: boolean | null;
	isLegalObligation?: boolean | null;
	canReduce?: boolean | null;
	canCancel?: boolean | null;
	consequenceIfUnpaid?: ConsequenceType | null;
	dataConfidence?: ConfidenceLevel | null;
}

export interface ClassifiedExpense {
	category: ExpenseCategory;
	isEssential: boolean;
	isIncomeRelated: boolean;
	isLegalObligation: boolean;
	canReduce: boolean;
	canCancel: boolean;
	consequenceIfUnpaid: ConsequenceType;
	dataConfidence: ConfidenceLevel;
}

export const EXPENSE_CATEGORY_DEFAULTS: Record<ExpenseCategory, ExpenseDefaults> = {
	housing: {
		isEssential: true,
		consequenceIfUnpaid: "loss_of_asset",
		canReduce: false,
		canCancel: false,
		isIncomeRelated: false,
		isLegalObligation: false,
	},
	utilities: {
		isEssential: true,
		consequenceIfUnpaid: "service_cut",
		canReduce: true,
		canCancel: false,
		isIncomeRelated: false,
		isLegalObligation: false,
	},
	// Legacy alias — mesmas regras de utilities.
	bills: {
		isEssential: true,
		consequenceIfUnpaid: "service_cut",
		canReduce: true,
		canCancel: false,
		isIncomeRelated: false,
		isLegalObligation: false,
	},
	telecom: {
		isEssential: false,
		consequenceIfUnpaid: "service_cut",
		canReduce: true,
		canCancel: true,
		isIncomeRelated: false,
		isLegalObligation: false,
	},
	food: {
		isEssential: true,
		consequenceIfUnpaid: "none",
		canReduce: true,
		canCancel: false,
		isIncomeRelated: false,
		isLegalObligation: false,
	},
	transport: {
		isEssential: true,
		consequenceIfUnpaid: "none",
		canReduce: true,
		canCancel: false,
		isIncomeRelated: true,
		isLegalObligation: false,
	},
	health: {
		isEssential: true,
		consequenceIfUnpaid: "none",
		canReduce: false,
		canCancel: false,
		isIncomeRelated: false,
		isLegalObligation: false,
	},
	education: {
		isEssential: true,
		consequenceIfUnpaid: "none",
		canReduce: true,
		canCancel: true,
		isIncomeRelated: false,
		isLegalObligation: false,
	},
	childcare: {
		isEssential: true,
		consequenceIfUnpaid: "none",
		canReduce: false,
		canCancel: false,
		isIncomeRelated: true,
		isLegalObligation: false,
	},
	work_tools: {
		isEssential: true,
		consequenceIfUnpaid: "none",
		canReduce: true,
		canCancel: false,
		isIncomeRelated: true,
		isLegalObligation: false,
	},
	insurance: {
		isEssential: false,
		consequenceIfUnpaid: "none",
		canReduce: true,
		canCancel: true,
		isIncomeRelated: false,
		isLegalObligation: false,
	},
	legal: {
		isEssential: true,
		consequenceIfUnpaid: "legal_action",
		canReduce: false,
		canCancel: false,
		isIncomeRelated: false,
		isLegalObligation: true,
	},
	subscription: {
		isEssential: false,
		consequenceIfUnpaid: "service_cut",
		canReduce: true,
		canCancel: true,
		isIncomeRelated: false,
		isLegalObligation: false,
	},
	leisure: {
		isEssential: false,
		consequenceIfUnpaid: "none",
		canReduce: true,
		canCancel: true,
		isIncomeRelated: false,
		isLegalObligation: false,
	},
	other: {
		isEssential: false,
		consequenceIfUnpaid: "none",
		canReduce: true,
		canCancel: true,
		isIncomeRelated: false,
		isLegalObligation: false,
	},
};

const CLEARLY_NON_ESSENTIAL: ExpenseCategory[] = ["leisure", "subscription"];

export interface ClassifyExpenseOptions {
	/** Para diagnosisLevel='minimal': assume tudo essencial salvo categorias supérfluas. */
	aggressiveFallback?: boolean;
}

export function classifyExpense(
	expense: RawExpense,
	options: ClassifyExpenseOptions = {},
): ClassifiedExpense {
	const defaults = EXPENSE_CATEGORY_DEFAULTS[expense.category];

	if (options.aggressiveFallback) {
		return {
			category: expense.category,
			isEssential: !CLEARLY_NON_ESSENTIAL.includes(expense.category),
			isIncomeRelated: defaults.isIncomeRelated,
			isLegalObligation: defaults.isLegalObligation,
			canReduce: defaults.canReduce,
			canCancel: defaults.canCancel,
			consequenceIfUnpaid: defaults.consequenceIfUnpaid,
			dataConfidence: "low",
		};
	}

	return {
		category: expense.category,
		isEssential: expense.isEssential ?? defaults.isEssential,
		isIncomeRelated: expense.isIncomeRelated ?? defaults.isIncomeRelated,
		isLegalObligation: expense.isLegalObligation ?? defaults.isLegalObligation,
		canReduce: expense.canReduce ?? defaults.canReduce,
		canCancel: expense.canCancel ?? defaults.canCancel,
		consequenceIfUnpaid: expense.consequenceIfUnpaid ?? defaults.consequenceIfUnpaid,
		dataConfidence: expense.dataConfidence ?? "medium",
	};
}
