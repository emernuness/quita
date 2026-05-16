"use client";

import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Toggle } from "@/components/Toggle";
import { useNotificationPrefs, useUpdateNotificationPrefs } from "@/hooks/useProfile";

const ITEMS: {
	key: "dueDates" | "weeklyProgress" | "paymentIncentive" | "riskAlert" | "newsAndTips";
	title: string;
	desc: string;
}[] = [
	{ key: "dueDates", title: "Vencimentos", desc: "Avisos quando uma dívida está perto de vencer." },
	{
		key: "paymentIncentive",
		title: "Incentivo de pagamento",
		desc: "Lembretes para manter o ritmo.",
	},
	{ key: "weeklyProgress", title: "Resumo semanal", desc: "Como foi sua semana em poucas linhas." },
	{ key: "riskAlert", title: "Alertas de risco", desc: "Quando algo precisa de atenção imediata." },
	{ key: "newsAndTips", title: "Dicas e novidades", desc: "Conteúdo educativo sobre finanças." },
];

export default function NotificationsPage() {
	const { data: prefs } = useNotificationPrefs();
	const update = useUpdateNotificationPrefs();

	return (
		<>
			<PageHeader title="Notificações" subtitle="Escolha o que você quer receber." />

			<Card className="divide-y divide-[var(--color-border)] p-0">
				{ITEMS.map((it) => (
					<div key={it.key} className="flex items-center justify-between gap-6 px-6 py-4">
						<div>
							<div className="text-[14px] font-semibold text-[var(--color-ink)]">{it.title}</div>
							<div className="text-[13px] text-[var(--color-ink-2)]">{it.desc}</div>
						</div>
						<Toggle
							checked={!!prefs?.[it.key]}
							onChange={(next) => update.mutate({ [it.key]: next })}
							label={it.title}
						/>
					</div>
				))}
			</Card>
		</>
	);
}
