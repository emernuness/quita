"use client";

import { cn } from "@/lib/cn";

export function Toggle({
	checked,
	onChange,
	disabled,
	label,
}: {
	checked: boolean;
	onChange: (next: boolean) => void;
	disabled?: boolean;
	label?: string;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={cn(
				"relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
				checked ? "bg-[var(--color-teal)]" : "bg-[var(--color-border)]",
				disabled && "opacity-60",
			)}
		>
			<span
				className={cn(
					"inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
					checked ? "translate-x-[22px]" : "translate-x-[2px]",
				)}
			/>
		</button>
	);
}
