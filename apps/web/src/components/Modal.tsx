"use client";

import { cn } from "@/lib/cn";
import { useEffect, useId, useRef } from "react";

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
	open,
	onClose,
	title,
	subtitle,
	children,
	size = "md",
	footer,
}: {
	open: boolean;
	onClose: () => void;
	title?: string;
	subtitle?: React.ReactNode;
	children: React.ReactNode;
	size?: "sm" | "md" | "lg";
	footer?: React.ReactNode;
}) {
	const dialogRef = useRef<HTMLDivElement | null>(null);
	const titleId = useId();

	useEffect(() => {
		if (!open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		const previouslyFocused = document.activeElement as HTMLElement | null;
		const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
		first?.focus();

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				onClose();
				return;
			}
			if (e.key !== "Tab" || !dialogRef.current) return;
			const focusables = Array.from(
				dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
			).filter((el) => !el.hasAttribute("aria-hidden"));
			if (focusables.length === 0) return;
			const firstEl = focusables[0];
			const lastEl = focusables[focusables.length - 1];
			if (e.shiftKey && document.activeElement === firstEl) {
				e.preventDefault();
				lastEl.focus();
			} else if (!e.shiftKey && document.activeElement === lastEl) {
				e.preventDefault();
				firstEl.focus();
			}
		};
		window.addEventListener("keydown", onKey);

		return () => {
			window.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
			previouslyFocused?.focus?.();
		};
	}, [open, onClose]);

	if (!open) return null;

	const sizeCls = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" }[size];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
			<button
				type="button"
				aria-label="Fechar"
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div
				ref={dialogRef}
				// biome-ignore lint/a11y/useSemanticElements: <dialog> não permite backdrop click + animação custom
				role="dialog"
				aria-modal="true"
				aria-labelledby={title ? titleId : undefined}
				className={cn(
					"relative w-full rounded-[16px] bg-white shadow-[0_24px_64px_-12px_rgba(10,82,72,0.25)]",
					sizeCls,
				)}
			>
				{title ? (
					<div className="border-b border-[var(--color-border)] px-7 pb-5 pt-6">
						<h2
							id={titleId}
							className="text-[20px] font-bold tracking-tight text-[var(--color-ink)]"
						>
							{title}
						</h2>
						{subtitle ? (
							<p className="mt-1 text-[14px] text-[var(--color-ink-2)]">{subtitle}</p>
						) : null}
					</div>
				) : null}
				<div className="px-7 py-6">{children}</div>
				{footer ? (
					<div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-7 py-4">
						{footer}
					</div>
				) : null}
			</div>
		</div>
	);
}
