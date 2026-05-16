import { cn } from "@/lib/cn";
import { Card } from "./Card";

export function MetricCard({
	label,
	value,
	hint,
	tone = "surface",
	valueClassName,
	className,
}: {
	label: string;
	value: React.ReactNode;
	hint?: string;
	tone?: "surface" | "teal" | "navy" | "muted";
	valueClassName?: string;
	className?: string;
}) {
	const labelCls =
		tone === "teal" || tone === "navy" ? "text-white/70" : "text-[var(--color-ink-2)]";
	const hintCls =
		tone === "teal" || tone === "navy" ? "text-white/60" : "text-[var(--color-ink-3)]";

	return (
		<Card tone={tone} className={cn("p-6", className)}>
			<div className={cn("text-[12px] font-medium uppercase tracking-wider", labelCls)}>
				{label}
			</div>
			<div
				className={cn(
					"tabular mt-2 text-[34px] font-bold leading-none tracking-tight",
					valueClassName,
				)}
			>
				{value}
			</div>
			{hint ? <div className={cn("mt-2 text-[13px]", hintCls)}>{hint}</div> : null}
		</Card>
	);
}
