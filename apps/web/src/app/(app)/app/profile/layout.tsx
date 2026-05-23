"use client";

import { cn } from "@/lib/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
	{ href: "/app/profile", label: "Conta" },
	{ href: "/app/profile/security", label: "Segurança" },
	{ href: "/app/profile/notifications", label: "Notificações" },
	{ href: "/app/profile/discrete-mode", label: "Modo discreto" },
	{ href: "/app/profile/export-data", label: "Exportar dados" },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname() ?? "";
	return (
		<>
			<div className="mb-8 flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] pb-3">
				{ITEMS.map((it) => {
					const active = pathname === it.href;
					return (
						<Link
							key={it.href}
							href={it.href}
							className={cn(
								"rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition-colors",
								active
									? "bg-[var(--color-teal)] text-white"
									: "text-[var(--color-ink-2)] hover:bg-[var(--color-background)] hover:text-[var(--color-ink)]",
							)}
						>
							{it.label}
						</Link>
					);
				})}
			</div>
			{children}
		</>
	);
}
