"use client";

import { apiGet } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface DashboardData {
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
		category: { id: string; name: string; slug: string; icon: string };
	}>;
}

export function useDashboard() {
	return useQuery({
		queryKey: ["dashboard"],
		queryFn: () => apiGet<DashboardData>("/dashboard"),
		staleTime: 30_000,
	});
}
