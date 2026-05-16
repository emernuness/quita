import { ExpenseCategory, IncomeSource } from "@quita/shared";

export const expenseCategoryColor: Record<string, string> = {
	[ExpenseCategory.HOUSING]: "#A0522D",
	[ExpenseCategory.BILLS]: "#4338CA",
	[ExpenseCategory.FOOD]: "#2EA84A",
	[ExpenseCategory.TRANSPORT]: "#0E8C74",
	[ExpenseCategory.TELECOM]: "#D4892B",
	[ExpenseCategory.OTHER]: "#5A6560",
};

export const incomeSourceColor: Record<string, string> = {
	[IncomeSource.SALARY]: "#0A5248",
	[IncomeSource.EXTRA]: "#3DC55C",
	[IncomeSource.HELP]: "#7C5A89",
	[IncomeSource.OTHER]: "#5A6560",
};

export const debtCategoryColor: Record<string, string> = {
	credit_card: "#D4892B",
	bank_loan: "#4338CA",
	overdue_bill: "#B85430",
	housing: "#A0522D",
	personal: "#7C5A89",
	other: "#5A6560",
};

export function colorFor(map: Record<string, string>, key: string): string {
	return map[key] ?? "#5A6560";
}
