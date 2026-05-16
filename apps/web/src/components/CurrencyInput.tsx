"use client";

import { cn } from "@/lib/cn";
import { maskBRL } from "@/lib/masks";
import { forwardRef } from "react";

interface Props {
	label?: string;
	value: string;
	onChange: (masked: string) => void;
	placeholder?: string;
	error?: string;
	name?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, Props>(function CurrencyInput(
	{ label, value, onChange, placeholder = "R$ 0,00", error, name },
	ref,
) {
	return (
		<label className="block">
			{label ? (
				<span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-[var(--color-ink-2)]">
					{label}
				</span>
			) : null}
			<input
				ref={ref}
				name={name}
				inputMode="numeric"
				value={value}
				onChange={(e) => onChange(maskBRL(e.target.value))}
				placeholder={placeholder}
				className={cn(
					"tabular w-full bg-transparent py-3 text-[24px] font-semibold tracking-tight text-[var(--color-ink)]",
					"border-b transition-colors placeholder:text-[var(--color-ink-3)]/60 focus:outline-none",
					error
						? "border-[var(--color-danger)] focus:border-[var(--color-danger)]"
						: "border-[var(--color-border)] focus:border-[var(--color-teal)]",
				)}
			/>
			{error ? (
				<span className="mt-1 block text-[12px] text-[var(--color-danger)]">{error}</span>
			) : null}
		</label>
	);
});
