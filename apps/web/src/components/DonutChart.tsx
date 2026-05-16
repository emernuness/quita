"use client";

import { cn } from "@/lib/cn";

export interface DonutSlice {
	key: string;
	label: string;
	value: number;
	color: string;
}

export function DonutChart({
	slices,
	size = 200,
	thickness = 22,
	centerLabel,
	centerValue,
	emptyLabel = "Sem dados",
	className,
}: {
	slices: DonutSlice[];
	size?: number;
	thickness?: number;
	centerLabel?: string;
	centerValue?: React.ReactNode;
	emptyLabel?: string;
	className?: string;
}) {
	const total = slices.reduce((sum, s) => sum + s.value, 0);
	const r = (size - thickness) / 2;
	const cx = size / 2;
	const cy = size / 2;
	const circumference = 2 * Math.PI * r;

	if (total <= 0) {
		return (
			<div className={cn("flex flex-col items-center justify-center gap-3", className)}>
				<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
					<circle
						cx={cx}
						cy={cy}
						r={r}
						fill="none"
						stroke="var(--color-border)"
						strokeWidth={thickness}
					/>
				</svg>
				<div className="text-[13px] text-[var(--color-ink-3)]">{emptyLabel}</div>
			</div>
		);
	}

	let offset = 0;
	const segments = slices
		.filter((s) => s.value > 0)
		.map((s) => {
			const pct = s.value / total;
			const length = pct * circumference;
			const dash = `${length} ${circumference - length}`;
			const seg = { ...s, pct, dash, offset };
			offset += length;
			return seg;
		});

	return (
		<div className={cn("flex flex-col items-center", className)}>
			<div className="relative" style={{ width: size, height: size }}>
				<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
					<title>Donut</title>
					<circle
						cx={cx}
						cy={cy}
						r={r}
						fill="none"
						stroke="var(--color-border)"
						strokeWidth={thickness}
					/>
					{segments.map((s) => (
						<circle
							key={s.key}
							cx={cx}
							cy={cy}
							r={r}
							fill="none"
							stroke={s.color}
							strokeWidth={thickness}
							strokeDasharray={s.dash}
							strokeDashoffset={-s.offset}
							strokeLinecap="butt"
							transform={`rotate(-90 ${cx} ${cy})`}
						/>
					))}
				</svg>
				<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
					{centerLabel ? (
						<div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-3)]">
							{centerLabel}
						</div>
					) : null}
					<div className="tabular mt-1 text-[20px] font-bold tracking-tight text-[var(--color-ink)]">
						{centerValue}
					</div>
				</div>
			</div>
		</div>
	);
}

export function DonutLegend({
	slices,
	formatValue,
	className,
}: {
	slices: DonutSlice[];
	formatValue?: (value: number) => React.ReactNode;
	className?: string;
}) {
	const total = slices.reduce((sum, s) => sum + s.value, 0);
	return (
		<ul className={cn("flex flex-col gap-2.5", className)}>
			{slices.map((s) => {
				const pct = total > 0 ? (s.value / total) * 100 : 0;
				return (
					<li key={s.key} className="flex items-center gap-3 text-[13px]">
						<span
							className="h-2.5 w-2.5 shrink-0 rounded-full"
							style={{ backgroundColor: s.color }}
							aria-hidden="true"
						/>
						<span className="min-w-0 flex-1 truncate text-[var(--color-ink)]">{s.label}</span>
						<span className="tabular text-[var(--color-ink-2)]">
							{formatValue ? formatValue(s.value) : s.value}
						</span>
						<span className="tabular w-10 shrink-0 text-right text-[var(--color-ink-3)]">
							{pct.toFixed(0)}%
						</span>
					</li>
				);
			})}
		</ul>
	);
}
