"use client";

import {
	useMarkAllRead,
	useMarkRead,
	useNotifications,
	useUnreadCount,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/cn";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function relTime(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const m = Math.floor(diff / 60_000);
	if (m < 1) return "agora";
	if (m < 60) return `${m}min`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h`;
	const d = Math.floor(h / 24);
	return `${d}d`;
}

const SEVERITY_DOT: Record<string, string> = {
	info: "bg-[var(--color-teal)]",
	success: "bg-[var(--color-success)]",
	warning: "bg-[var(--color-warning)]",
	danger: "bg-[var(--color-danger)]",
};

export function NotificationBell() {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const { data: unread } = useUnreadCount();
	const { data: items } = useNotifications({ limit: 15 });
	const markRead = useMarkRead();
	const markAll = useMarkAllRead();
	const count = unread?.count ?? 0;

	useEffect(() => {
		if (!open) return;
		function onClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-label="Notificações"
				className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-ink)] hover:bg-[var(--color-background)]"
			>
				<Bell className="h-5 w-5" />
				{count > 0 ? (
					<span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white">
						{count > 99 ? "99+" : count}
					</span>
				) : null}
			</button>

			{open ? (
				<div className="absolute right-0 z-50 mt-2 w-[min(90vw,360px)] overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
					<div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
						<div className="text-[14px] font-semibold">Notificações</div>
						{count > 0 ? (
							<button
								type="button"
								onClick={() => markAll.mutate()}
								className="text-[12px] font-semibold text-[var(--color-teal)] hover:underline"
							>
								Marcar todas
							</button>
						) : null}
					</div>
					<div className="max-h-[440px] overflow-auto">
						{!items?.length ? (
							<div className="px-4 py-8 text-center text-[13px] text-[var(--color-ink-2)]">
								Sem notificações ainda.
							</div>
						) : (
							<ul>
								{items.map((n) => {
									const isUnread = !n.readAt;
									const body = (
										<div
											className={cn(
												"flex gap-3 px-4 py-3 text-left",
												isUnread ? "bg-[var(--color-background)]" : "",
											)}
										>
											<span
												className={cn(
													"mt-1.5 h-2 w-2 shrink-0 rounded-full",
													SEVERITY_DOT[n.severity] ?? SEVERITY_DOT.info,
												)}
											/>
											<div className="min-w-0 flex-1">
												<div className="text-[13px] font-semibold text-[var(--color-ink)]">
													{n.title}
												</div>
												<div className="mt-0.5 text-[12px] text-[var(--color-ink-2)]">{n.body}</div>
												<div className="mt-1 text-[11px] text-[var(--color-ink-3)]">
													{relTime(n.createdAt)}
												</div>
											</div>
										</div>
									);
									return (
										<li key={n.id} className="border-b border-[var(--color-border)] last:border-0">
											{n.linkUrl ? (
												<Link
													href={n.linkUrl}
													onClick={() => {
														if (isUnread) markRead.mutate(n.id);
														setOpen(false);
													}}
													className="block hover:bg-[var(--color-background)]"
												>
													{body}
												</Link>
											) : (
												<button
													type="button"
													onClick={() => isUnread && markRead.mutate(n.id)}
													className="block w-full hover:bg-[var(--color-background)]"
												>
													{body}
												</button>
											)}
										</li>
									);
								})}
							</ul>
						)}
					</div>
				</div>
			) : null}
		</div>
	);
}
