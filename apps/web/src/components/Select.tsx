"use client";

import { cn } from "@/lib/cn";
import { type SelectHTMLAttributes, forwardRef } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	error?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
	{ label, error, className, children, id, ...rest },
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
			<select
				ref={ref}
				id={inputId}
				{...rest}
				className={cn(
					"h-12 w-full appearance-none rounded-[4px] border bg-white px-4 pr-10 text-[15px] text-[var(--color-ink)]",
					"bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%235A6560%22><path d=%22M5 8l5 5 5-5%22 stroke=%22%235A6560%22 stroke-width=%221.6%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 fill=%22none%22/></svg>')] bg-[length:18px] bg-[right_14px_center] bg-no-repeat",
					"focus:outline-none",
					error
						? "border-[var(--color-danger)]"
						: "border-[var(--color-border)] focus:border-[var(--color-teal)]",
					className,
				)}
			>
				{children}
			</select>
			{error ? (
				<span className="mt-1 block text-[12px] text-[var(--color-danger)]">{error}</span>
			) : null}
		</label>
	);
});
