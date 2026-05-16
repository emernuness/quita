export function PageHeader({
	title,
	subtitle,
	actions,
}: {
	title: string;
	subtitle?: string;
	actions?: React.ReactNode;
}) {
	return (
		<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--color-ink)]">
					{title}
				</h1>
				{subtitle ? (
					<p className="mt-1.5 text-[15px] text-[var(--color-ink-2)]">{subtitle}</p>
				) : null}
			</div>
			{actions ? <div className="flex items-center gap-2">{actions}</div> : null}
		</div>
	);
}
