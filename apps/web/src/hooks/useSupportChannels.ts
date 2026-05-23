"use client";

import { apiGet } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface SupportChannel {
	id: string;
	slug: string;
	name: string;
	channelType: string;
	scope: "federal" | "state" | "municipal";
	phone: string | null;
	url: string | null;
	description: string | null;
}

export function useSupportChannels() {
	return useQuery({
		queryKey: ["support-channels"],
		queryFn: () => apiGet<SupportChannel[]>("/support/channels"),
	});
}
