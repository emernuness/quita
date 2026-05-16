"use client";

import { cn } from "@/lib/cn";
import { type InputHTMLAttributes, forwardRef } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	hint?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
	{ label, error, hint, className, id, ...rest },
	ref,
) {
	const inputId = id ?? rest.name;
	return (
		<label htmlFor={inputId} className="block">
			{label ? (
				<span className="mb-1.5 block text-[12px] font-medium text-[var(--color-ink-2)]">
					{label}
				</span>
			) : null}
			<input
				ref={ref}
				id={inputId}
				{...rest}
				className={cn(
					"h-12 w-full rounded-[4px] border bg-white px-4 text-[15px] text-[var(--color-ink)]",
					"placeholder:text-[var(--color-ink-3)] focus:outline-none",
					error
						? "border-[var(--color-danger)] focus:border-[var(--color-danger)]"
						: "border-[var(--color-border)] focus:border-[var(--color-teal)]",
					className,
				)}
			/>
			{error ? (
				<span className="mt-1 block text-[12px] text-[var(--color-danger)]">{error}</span>
			) : hint ? (
				<span className="mt-1 block text-[12px] text-[var(--color-ink-3)]">{hint}</span>
			) : null}
		</label>
	);
});
