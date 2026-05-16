import { ProgressBar } from "./ProgressBar";

export function OnboardingHeader({
	step,
	total,
	eyebrow,
	title,
	description,
}: {
	step: number;
	total: number;
	eyebrow?: string;
	title: string;
	description?: string;
}) {
	const pct = (step / total) * 100;
	return (
		<div className="mb-8">
			<ProgressBar value={pct} className="mb-6" />
			<div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-3)]">
				Passo {step} de {total}
			</div>
			{eyebrow ? (
				<div className="mt-3 text-[13px] font-semibold tracking-wide text-[var(--color-teal)]">
					{eyebrow}
				</div>
			) : null}
			<h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight text-[var(--color-ink)]">
				{title}
			</h1>
			{description ? (
				<p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-[var(--color-ink-2)]">
					{description}
				</p>
			) : null}
		</div>
	);
}
