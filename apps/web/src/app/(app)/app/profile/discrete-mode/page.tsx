"use client";

import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Toggle } from "@/components/Toggle";
import { useProfile, useToggleDiscreteMode } from "@/hooks/useProfile";

export default function DiscreteModePage() {
	const { data: profile } = useProfile();
	const toggle = useToggleDiscreteMode();

	return (
		<>
			<PageHeader
				title="Modo discreto"
				subtitle="Esconde valores absolutos. Útil em locais públicos ou ao mostrar a tela."
			/>

			<Card className="p-6">
				<div className="flex items-center justify-between gap-6">
					<div>
						<div className="text-[14px] font-semibold text-[var(--color-ink)]">
							Ativar modo discreto
						</div>
						<div className="mt-1 text-[13px] text-[var(--color-ink-2)]">
							Os valores ficam mascarados (R$ ••••) e voltam ao normal quando você desativa.
						</div>
					</div>
					<Toggle
						checked={!!profile?.discreteMode}
						onChange={(enabled) => toggle.mutate({ enabled })}
						label="Modo discreto"
					/>
				</div>
			</Card>
		</>
	);
}
