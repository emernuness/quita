export function Empty({
	title,
	description,
	action,
}: {
	title: string;
	description?: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="w-full rounded-[12px] border border-dashed border-[var(--color-border)] bg-white px-8 py-16">
			<div className="mx-auto flex max-w-md flex-col items-center text-center">
				<h3 className="text-[18px] font-semibold tracking-tight text-[var(--color-ink)]">{title}</h3>
				{description ? (
					<p className="mt-2 self-stretch text-[14px] leading-relaxed text-[var(--color-ink-2)]">
						{description}
					</p>
				) : null}
				{action ? <div className="mt-5">{action}</div> : null}
			</div>
		</div>
	);
}
