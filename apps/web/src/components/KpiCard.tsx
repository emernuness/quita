"use client";

import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type Accent = "income" | "expense" | "debt" | "balance" | "bank" | "card" | "overdue";

const accentStyles: Record<Accent, { fg: string; bg: string }> = {
	income: { fg: "text-[var(--color-cat-income)]", bg: "bg-[var(--color-cat-income-soft)]" },
	expense: { fg: "text-[var(--color-cat-expense)]", bg: "bg-[var(--color-cat-expense-soft)]" },
	debt: { fg: "text-[var(--color-cat-debt)]", bg: "bg-[var(--color-cat-debt-soft)]" },
	balance: { fg: "text-[var(--color-cat-balance)]", bg: "bg-[var(--color-cat-balance-soft)]" },
	bank: { fg: "text-[var(--color-cat-bank)]", bg: "bg-[var(--color-cat-bank-soft)]" },
	card: { fg: "text-[var(--color-cat-card)]", bg: "bg-[var(--color-cat-card-soft)]" },
	overdue: { fg: "text-[var(--color-cat-overdue)]", bg: "bg-[var(--color-cat-overdue-soft)]" },
};

export function KpiCard({
	label,
	value,
	hint,
	accent = "balance",
	icon: Icon,
	href,
	className,
}: {
	label: string;
	value: React.ReactNode;
	hint?: React.ReactNode;
	accent?: Accent;
	icon: LucideIcon;
	href?: string;
	className?: string;
}) {
	const a = accentStyles[accent];
	const inner = (
		<div
			className={cn(
				"card-shadow card-shadow-hover relative flex items-start justify-between rounded-[12px] bg-white p-5 transition-shadow",
				className,
			)}
		>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-2)]">
					<span>{label}</span>
					{href ? <span className="text-[var(--color-ink-3)]">›</span> : null}
				</div>
				<div className="tabular mt-2 text-[26px] font-bold leading-[1.1] tracking-tight text-[var(--color-ink)]">
					{value}
				</div>
				{hint ? <div className="mt-1 text-[12px] text-[var(--color-ink-3)]">{hint}</div> : null}
			</div>
			<span
				className={cn(
					"flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
					a.bg,
					a.fg,
				)}
				aria-hidden="true"
			>
				<Icon size={20} strokeWidth={1.8} />
			</span>
		</div>
	);

	if (href) {
		return (
			<Link href={href} className="block">
				{inner}
			</Link>
		);
	}
	return inner;
}
