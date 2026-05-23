"use client";

import { Card } from "@/components/Card";
import { Empty } from "@/components/Empty";
import { PageHeader } from "@/components/PageHeader";
import { useSupportChannels } from "@/hooks/useSupportChannels";
import { ExternalLink, Phone } from "lucide-react";

export default function ApoioPage() {
	const { data, isLoading } = useSupportChannels();

	return (
		<>
			<PageHeader
				title="Canais de apoio"
				subtitle="Lei 14.181/2021 — você tem direito a renegociar dívidas com auxílio público."
			/>

			{isLoading && <Card className="p-10 text-center text-[var(--color-ink-3)]">Carregando…</Card>}

			{!isLoading && (!data || data.length === 0) && (
				<Empty
					title="Sem canais disponíveis"
					description="Em breve listamos canais regionais para a sua UF."
				/>
			)}

			<div className="space-y-4">
				{(data ?? []).map((ch) => (
					<Card key={ch.id} className="p-5">
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1">
								<div className="text-[12px] uppercase tracking-wider text-[var(--color-ink-3)] font-semibold">
									{ch.scope === "federal" ? "Nacional" : ch.scope}
								</div>
								<h3 className="text-[18px] font-semibold mt-1">{ch.name}</h3>
								{ch.description && (
									<p className="text-[14px] text-[var(--color-ink-2)] mt-2">{ch.description}</p>
								)}
								<div className="flex flex-wrap gap-4 mt-3">
									{ch.phone && (
										<a
											href={`tel:${ch.phone}`}
											className="inline-flex items-center gap-1.5 text-[14px] text-[var(--color-teal)] hover:underline"
										>
											<Phone className="w-3.5 h-3.5" /> {ch.phone}
										</a>
									)}
									{ch.url && (
										<a
											href={ch.url}
											target="_blank"
											rel="noreferrer noopener"
											className="inline-flex items-center gap-1.5 text-[14px] text-[var(--color-teal)] hover:underline"
										>
											<ExternalLink className="w-3.5 h-3.5" /> Acessar site
										</a>
									)}
								</div>
							</div>
						</div>
					</Card>
				))}
			</div>
		</>
	);
}
