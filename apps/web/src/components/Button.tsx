"use client";

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "ghostGreen" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
	size?: Size;
	loading?: boolean;
	fullWidth?: boolean;
}

const variantCls: Record<Variant, string> = {
	primary:
		"bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal-mid)] disabled:bg-[var(--color-ink-3)]",
	secondary:
		"bg-transparent text-[var(--color-teal)] border-[1.5px] border-[var(--color-teal)] hover:bg-[var(--color-teal)]/5",
	ghost: "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-gray100)]",
	ghostGreen:
		"bg-transparent text-[var(--color-green)] border-[1.5px] border-[var(--color-green)] hover:bg-[var(--color-green)]/8",
	outline:
		"bg-transparent text-[var(--color-ink)] border-[1.5px] border-[var(--color-gray200)] hover:border-[var(--color-ink)]",
	danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
};

const sizeCls: Record<Size, string> = {
	sm: "h-9 px-4 text-[13px]",
	md: "h-10 px-5 text-[14px]",
	lg: "h-12 px-6 text-[15px]",
};

export function Button({
	variant = "primary",
	size = "md",
	loading,
	fullWidth,
	className,
	children,
	disabled,
	...rest
}: Props) {
	return (
		<button
			{...rest}
			disabled={disabled || loading}
			className={cn(
				"inline-flex items-center justify-center gap-2 rounded-[8px] font-semibold tracking-tight transition-colors",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)]/30",
				"disabled:cursor-not-allowed disabled:opacity-60",
				variantCls[variant],
				sizeCls[size],
				fullWidth && "w-full",
				className,
			)}
		>
			{loading ? <Spinner /> : children}
		</button>
	);
}

function Spinner() {
	return (
		<svg
			className="h-4 w-4 animate-spin"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
			focusable="false"
		>
			<circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
			<path
				d="M22 12a10 10 0 0 1-10 10"
				stroke="currentColor"
				strokeWidth="3"
				strokeLinecap="round"
			/>
		</svg>
	);
}
