import { cn } from "@/lib/cn";

type Tone = "success" | "danger" | "warning" | "info" | "neutral";

const tones: Record<Tone, string> = {
	success: "bg-[var(--color-success-bg)] text-[var(--color-success-fg)]",
	danger: "bg-[var(--color-danger-bg)] text-[var(--color-danger-fg)]",
	warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]",
	info: "bg-[var(--color-info-bg)] text-[var(--color-info-fg)]",
	neutral:
		"bg-[var(--color-background)] text-[var(--color-ink-2)] border border-[var(--color-border)]",
};

const dotColors: Record<Tone, string> = {
	success: "bg-[var(--color-success)]",
	danger: "bg-[var(--color-danger)]",
	warning: "bg-[var(--color-warning)]",
	info: "bg-[var(--color-info)]",
	neutral: "bg-[var(--color-ink-3)]",
};

export function Badge({
	tone = "neutral",
	children,
	dot,
	className,
}: {
	tone?: Tone;
	children: React.ReactNode;
	dot?: boolean;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
				tones[tone],
				className,
			)}
		>
			{dot ? <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[tone])} /> : null}
			{children}
		</span>
	);
}
