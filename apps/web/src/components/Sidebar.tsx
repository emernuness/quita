"use client";

import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/auth";
import {
	AlertOctagon,
	ArrowLeftRight,
	ChevronLeft,
	ChevronRight,
	CreditCard,
	FileCheck,
	LayoutDashboard,
	LifeBuoy,
	LogOut,
	type LucideIcon,
	Map as MapIcon,
	PiggyBank,
	Plus,
	Sparkles,
	Target,
	UserCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./Button";
import { NewItemPickerModal } from "./modals/NewItemPickerModal";

interface NavItem {
	href: string;
	label: string;
	icon: LucideIcon;
	match: RegExp;
}

const items: NavItem[] = [
	{ href: "/app", label: "Dashboard", icon: LayoutDashboard, match: /^\/app\/?$/ },
	{ href: "/app/espelho", label: "Espelho", icon: Sparkles, match: /^\/app\/espelho/ },
	{
		href: "/app/transactions",
		label: "Transações",
		icon: ArrowLeftRight,
		match: /^\/app\/transactions/,
	},
	{ href: "/app/debts", label: "Dívidas", icon: CreditCard, match: /^\/app\/(debts|finances)/ },
	{ href: "/app/plan", label: "Plano", icon: MapIcon, match: /^\/app\/plan/ },
	{ href: "/app/objetivos", label: "Metas", icon: Target, match: /^\/app\/objetivos/ },
	{ href: "/app/reserva", label: "Reserva", icon: PiggyBank, match: /^\/app\/reserva/ },
	{ href: "/app/refinar", label: "Refinar", icon: Sparkles, match: /^\/app\/refinar/ },
	{
		href: "/app/avaliar-acordo",
		label: "Avaliar acordo",
		icon: FileCheck,
		match: /^\/app\/avaliar-acordo/,
	},
	{
		href: "/app/modo-crise",
		label: "Modo crise",
		icon: AlertOctagon,
		match: /^\/app\/modo-crise/,
	},
	{ href: "/app/apoio", label: "Apoio", icon: LifeBuoy, match: /^\/app\/apoio/ },
	{ href: "/app/profile", label: "Perfil", icon: UserCircle, match: /^\/app\/profile/ },
];

const COLLAPSE_KEY = "quita.sidebarCollapsed";

export function Sidebar() {
	const pathname = usePathname() ?? "";
	const router = useRouter();
	const user = useAuthStore((s) => s.user);
	const logout = useAuthStore((s) => s.logout);
	const [newOpen, setNewOpen] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		const stored = window.localStorage.getItem(COLLAPSE_KEY);
		if (stored === "1") setCollapsed(true);
		setHydrated(true);
	}, []);

	function toggleCollapsed() {
		setCollapsed((prev) => {
			const next = !prev;
			window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
			return next;
		});
	}

	const initials = user?.avatarInitials ?? user?.name?.charAt(0)?.toUpperCase() ?? "U";

	return (
		<aside
			className={cn(
				"sticky top-0 flex h-screen shrink-0 flex-col border-r border-[var(--color-border)] bg-white py-6 transition-[width] duration-200",
				collapsed ? "w-[76px] px-2" : "w-[240px] px-4",
			)}
		>
			<button
				type="button"
				onClick={toggleCollapsed}
				aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
				className="absolute -right-3 top-9 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-ink-2)] shadow-sm hover:text-[var(--color-ink)]"
			>
				{collapsed ? (
					<ChevronRight size={14} strokeWidth={2} />
				) : (
					<ChevronLeft size={14} strokeWidth={2} />
				)}
			</button>

			<div className={cn(collapsed ? "px-1" : "px-2")}>
				<Link href="/app" className="flex items-center" aria-label="Quita">
					{collapsed ? (
						<Image
							src="/brand/icone.svg"
							alt="Quita"
							width={40}
							height={40}
							className="h-10 w-10"
							priority
						/>
					) : (
						<Image
							src="/brand/logo-01.png"
							alt="Quita"
							width={946}
							height={321}
							className="h-9 w-auto"
							priority
						/>
					)}
				</Link>
			</div>

			<div className={cn("mt-7", collapsed ? "px-0" : "px-2")}>
				<Button
					fullWidth
					size="lg"
					onClick={() => setNewOpen(true)}
					aria-label="Novo lançamento"
					className={collapsed ? "!px-0" : ""}
				>
					<Plus size={16} strokeWidth={2.4} />
					{collapsed ? null : "Novo"}
				</Button>
			</div>

			<nav className={cn("mt-6 flex flex-col gap-0.5", collapsed && "items-center")}>
				{items.map((it) => {
					const active = it.match.test(pathname);
					return (
						<Link
							key={it.href}
							href={it.href}
							aria-current={active ? "page" : undefined}
							aria-label={it.label}
							title={collapsed ? it.label : undefined}
							className={cn(
								"flex items-center gap-3 rounded-[8px] text-[14px] font-medium transition-colors",
								collapsed ? "h-10 w-10 justify-center" : "px-3 py-2.5",
								active
									? "bg-[var(--color-teal)]/8 text-[var(--color-teal)]"
									: "text-[var(--color-ink-2)] hover:bg-[var(--color-background)] hover:text-[var(--color-ink)]",
							)}
						>
							<it.icon size={18} strokeWidth={active ? 2.2 : 1.8} />
							{collapsed ? null : it.label}
						</Link>
					);
				})}
			</nav>

			<div
				className={cn(
					"mt-auto rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-2)]",
					collapsed ? "p-2" : "p-3",
				)}
			>
				<div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
					<div
						className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-teal)] text-[13px] font-semibold text-white"
						title={collapsed && hydrated ? (user?.name ?? undefined) : undefined}
					>
						{initials}
					</div>
					{collapsed ? null : (
						<>
							<div className="min-w-0 flex-1">
								<div className="truncate text-[13px] font-semibold text-[var(--color-ink)]">
									{user?.name ?? "—"}
								</div>
								<div className="truncate text-[11px] text-[var(--color-ink-3)]">
									{user?.email ?? ""}
								</div>
							</div>
							<button
								type="button"
								aria-label="Sair"
								onClick={async () => {
									await logout();
									router.replace("/login");
								}}
								className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)]"
							>
								<LogOut size={16} strokeWidth={1.8} />
							</button>
						</>
					)}
				</div>
			</div>

			<NewItemPickerModal open={newOpen} onClose={() => setNewOpen(false)} />
		</aside>
	);
}
