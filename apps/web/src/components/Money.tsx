"use client";

import { useAuthStore } from "@/stores/auth";
import { formatBRL, formatBRLCompact } from "@quita/shared";

export function Money({ value, compact = false }: { value: number; compact?: boolean }) {
	const discrete = useAuthStore((s) => !!s.user?.discreteMode);
	if (discrete) {
		return <span aria-label="valor oculto">R$ ••••</span>;
	}
	return <>{compact ? formatBRLCompact(value) : formatBRL(value)}</>;
}
