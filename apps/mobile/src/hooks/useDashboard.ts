import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

interface DashboardData {
	totalDebt: number;
	totalIncome: number;
	totalExpenses: number;
	monthlyBalance: number;
	surplusForDebts: number;
	debtsCount: number;
	paidDebtsCount: number;
	progressPercent: number;
	debts: Array<{
		id: string;
		creditor: string;
		totalAmount: number;
		amountPaid: number;
		status: string;
		category: {
			id: string;
			name: string;
			slug: string;
			icon: string;
		};
	}>;
}

export function useDashboard() {
	return useQuery({
		queryKey: ["dashboard"],
		queryFn: async () => {
			const { data } = await api.get<{
				success: boolean;
				data: DashboardData;
			}>("/dashboard");
			return data.data;
		},
		staleTime: 30 * 1000,
	});
}
