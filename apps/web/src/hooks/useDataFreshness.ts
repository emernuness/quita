"use client";

import { apiGet } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface DimensionScore {
	score: number;
	lastUpdated: string | null;
	suggestions: string[];
}

export interface DataFreshness {
	dimensions: {
		income: DimensionScore;
		essentials: DimensionScore;
		behavior: DimensionScore;
		location: DimensionScore;
	};
	overallScore: number;
	nextReviewDate: string;
}

export function useDataFreshness() {
	return useQuery({
		queryKey: ["user", "data-freshness"],
		queryFn: () => apiGet<DataFreshness>("/user/data-freshness"),
	});
}
