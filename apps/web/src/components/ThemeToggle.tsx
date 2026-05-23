"use client";

import { type Theme, useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";
import { Monitor, Moon, Sun } from "lucide-react";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
	{ value: "light", label: "Claro", icon: Sun },
	{ value: "dark", label: "Escuro", icon: Moon },
	{ value: "system", label: "Sistema", icon: Monitor },
];

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	return (
		<div className="inline-flex rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
			{OPTIONS.map((opt) => {
				const Icon = opt.icon;
				const active = theme === opt.value;
				return (
					<button
						key={opt.value}
						type="button"
						onClick={() => setTheme(opt.value)}
						aria-pressed={active}
						className={cn(
							"flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-semibold transition-colors",
							active
								? "bg-[var(--color-teal)] text-white"
								: "text-[var(--color-ink-2)] hover:text-[var(--color-ink)]",
						)}
					>
						<Icon className="w-3.5 h-3.5" /> {opt.label}
					</button>
				);
			})}
		</div>
	);
}
