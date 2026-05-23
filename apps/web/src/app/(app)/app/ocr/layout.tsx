"use client";

import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";

const STEPS = [
	{ slug: "consent", label: "Consentimento" },
	{ slug: "capture", label: "Captura" },
	{ slug: "confirm", label: "Confirmação" },
	{ slug: "quota", label: "Uso" },
];

export default function OcrLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname() ?? "";
	const currentSlug = pathname.split("/").pop();
	const currentIdx = STEPS.findIndex((s) => s.slug === currentSlug);

	return (
		<div className="mx-auto max-w-[720px]">
			<nav className="mb-8" aria-label="Etapas OCR">
				<ol className="flex items-center gap-2">
					{STEPS.map((step, idx) => {
						const active = idx === currentIdx;
						const past = currentIdx > idx;
						return (
							<li key={step.slug} className="flex flex-1 items-center gap-2">
								<div
									className={cn(
										"flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
										active
											? "bg-[var(--color-teal)] text-white"
											: past
												? "bg-[var(--color-success)] text-white"
												: "bg-[var(--color-background)] text-[var(--color-ink-3)]",
									)}
								>
									{idx + 1}
								</div>
								<span
									className={cn(
										"hidden text-[12px] sm:inline",
										active ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-3)]",
									)}
								>
									{step.label}
								</span>
								{idx < STEPS.length - 1 ? (
									<div className="h-px flex-1 bg-[var(--color-border)]" />
								) : null}
							</li>
						);
					})}
				</ol>
			</nav>
			{children}
		</div>
	);
}
