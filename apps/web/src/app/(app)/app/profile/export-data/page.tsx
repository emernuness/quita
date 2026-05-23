"use client";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { FileTextIcon } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";

export default function ExportDataPage() {
	return (
		<>
			<PageHeader
				title="Exportar dados"
				subtitle="Em breve você poderá baixar uma cópia das suas dívidas e movimentações."
			/>

			<Card className="p-8">
				<Badge tone="warning" dot>
					Em desenvolvimento
				</Badge>
				<div className="mt-5 flex items-start gap-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[var(--color-background)] text-[var(--color-teal)]">
						<FileTextIcon size={20} />
					</div>
					<div>
						<div className="text-[15px] font-semibold text-[var(--color-ink)]">
							PDF e CSV chegando
						</div>
						<p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-2)]">
							Estamos finalizando a geração dos arquivos no servidor. Quando estiver pronto, esta
							tela vai permitir solicitar o relatório e receber por e-mail.
						</p>
					</div>
				</div>
			</Card>
		</>
	);
}
