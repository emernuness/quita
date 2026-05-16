import { DebtStatus, ExpenseCategory, IncomeSource, PaymentType } from "@quita/shared";

export type SemanticTone = "success" | "danger" | "warning" | "info" | "neutral";

export const debtStatusTone: Record<string, SemanticTone> = {
	[DebtStatus.PAID]: "success",
	[DebtStatus.ON_TIME]: "neutral",
	[DebtStatus.OVERDUE]: "danger",
	[DebtStatus.RENEGOTIATED]: "warning",
};

export const debtStatusLabel: Record<string, string> = {
	[DebtStatus.PAID]: "Quitada",
	[DebtStatus.ON_TIME]: "Em dia",
	[DebtStatus.OVERDUE]: "Atrasada",
	[DebtStatus.RENEGOTIATED]: "Negociando",
};

export const paymentTypeLabel: Record<string, string> = {
	[PaymentType.FULL]: "Quitação",
	[PaymentType.PARTIAL]: "Parcial",
	[PaymentType.RENEGOTIATED]: "Negociação",
};

const incomeSourceLabel: Record<string, string> = {
	[IncomeSource.SALARY]: "Salário",
	[IncomeSource.EXTRA]: "Extra",
	[IncomeSource.HELP]: "Ajuda",
	[IncomeSource.OTHER]: "Outro",
};

const expenseCategoryLabel: Record<string, string> = {
	[ExpenseCategory.HOUSING]: "Moradia",
	[ExpenseCategory.BILLS]: "Contas",
	[ExpenseCategory.FOOD]: "Alimentação",
	[ExpenseCategory.TRANSPORT]: "Transporte",
	[ExpenseCategory.TELECOM]: "Internet / celular",
	[ExpenseCategory.OTHER]: "Outro",
};

export function financialLabel(slug: string): string {
	return incomeSourceLabel[slug] ?? expenseCategoryLabel[slug] ?? slug;
}
