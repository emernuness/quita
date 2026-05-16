import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Card({
	className,
	tone = "surface",
	...rest
}: HTMLAttributes<HTMLDivElement> & { tone?: "surface" | "teal" | "navy" | "muted" }) {
	const base = "rounded-[12px] border";
	const tones: Record<string, string> = {
		surface: "bg-white border-[var(--color-border)]",
		teal: "bg-[var(--color-teal)] text-white border-transparent",
		navy: "bg-[var(--color-navy)] text-white border-transparent",
		muted: "bg-[var(--color-background)] border-[var(--color-border)]",
	};
	return <div className={cn(base, tones[tone], className)} {...rest} />;
}
