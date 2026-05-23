import { cn } from "@/lib/cn";

interface BaseProps {
	className?: string;
}

export function SkeletonLine({ className }: BaseProps) {
	return (
		<div
			className={cn(
				"h-4 w-full animate-pulse rounded-[6px] bg-[var(--color-background)]",
				className,
			)}
		/>
	);
}

export function SkeletonCard({ className, lines = 3 }: BaseProps & { lines?: number }) {
	return (
		<div
			className={cn(
				"animate-pulse rounded-[12px] border border-[var(--color-border)] bg-white p-6",
				className,
			)}
		>
			<div className="space-y-3">
				<div className="h-5 w-2/3 rounded-[6px] bg-[var(--color-background)]" />
				{Array.from({ length: lines }).map((_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton index OK
						key={i}
						className="h-3 w-full rounded-[6px] bg-[var(--color-background)]"
					/>
				))}
			</div>
		</div>
	);
}

export function SkeletonList({ count = 3, className }: BaseProps & { count?: number }) {
	return (
		<div className={cn("space-y-3", className)}>
			{Array.from({ length: count }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton index OK
				<SkeletonCard key={i} lines={2} />
			))}
		</div>
	);
}
