import { cn } from "@/lib/cn";

export function ProgressBar({
	value,
	className,
	tone = "success",
}: {
	value: number;
	className?: string;
	tone?: "success" | "teal" | "white";
}) {
	const v = Math.max(0, Math.min(100, value));
	const fill =
		tone === "success"
			? "bg-[var(--color-success)]"
			: tone === "teal"
				? "bg-[var(--color-teal)]"
				: "bg-white";
	const track = tone === "white" ? "bg-white/20" : "bg-[var(--color-border)]";
	return (
		<div className={cn("h-2 w-full overflow-hidden rounded-full", track, className)}>
			<div
				className={cn("h-full rounded-full transition-[width]", fill)}
				style={{ width: `${v}%` }}
			/>
		</div>
	);
}
