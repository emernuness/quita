"use client";

import { Card } from "@/components/Card";
import { Money } from "@/components/Money";
import { PageHeader } from "@/components/PageHeader";
import { useMotorPlan } from "@/hooks/useMotorPlan";
import { useSupportChannels } from "@/hooks/useSupportChannels";
import { AlertOctagon, ExternalLink, Phone, ShieldAlert } from "lucide-react";
import Link from "next/link";

const CRISIS_STATES = ["monthly_deficit", "overindebtedness", "practical_insolvency"];

export default function ModoCrisePage() {
	const { data: plan, isLoading } = useMotorPlan();
	const { data: channels } = useSupportChannels();
	const inCrisis = plan && CRISIS_STATES.includes(plan.financialState);

	return (
		<>
			<PageHeader
				title="Modo Crise"
				subtitle="Protocolo de emergência quando renda não cobre essenciais ou dívidas."
			/>

			{isLoading && <Card className="p-10 text-center text-[var(--color-ink-3)]">Carregando…</Card>}

			{!isLoading && !inCrisis && (
				<Card className="p-6 bg-[var(--color-success-bg)] text-[var(--color-success-fg)] border-[var(--color-success)]">
					<div className="flex items-start gap-3">
						<ShieldAlert className="w-5 h-5 mt-0.5" />
						<div>
							<div className="text-[16px] font-semibold">Você não está em crise.</div>
							<p className="text-[14px] mt-1">
								Seu estado atual é <strong>{plan?.financialState}</strong>. Continue com seu plano
								regular em{" "}
								<Link className="underline" href="/app/plan">
									Meu plano
								</Link>
								.
							</p>
						</div>
					</div>
				</Card>
			)}

			{!isLoading && inCrisis && plan && (
				<>
					<Card className="p-6 bg-[var(--color-danger-bg)] text-[var(--color-danger-fg)] border-[var(--color-danger)] mb-6">
						<div className="flex items-start gap-3">
							<AlertOctagon className="w-5 h-5 mt-0.5" />
							<div>
								<div className="text-[16px] font-semibold">{plan.mainGoal}</div>
								<p className="text-[14px] mt-2">
									Capacidade segura atual: <Money value={plan.safeCapacity} />
								</p>
							</div>
						</div>
					</Card>

					<h3 className="text-[16px] font-semibold mb-3">O que fazer agora</h3>
					<ol className="space-y-3 mb-8">
						<li>
							<Card className="p-4">
								<strong>1.</strong> Pause todas as dívidas não essenciais (cartão, empréstimos
								pessoais). Não pague nada além do mínimo absoluto.
							</Card>
						</li>
						<li>
							<Card className="p-4">
								<strong>2.</strong> Garanta moradia, energia, água, alimento. Tudo o mais é
								secundário enquanto a renda não cobrir essenciais.
							</Card>
						</li>
						<li>
							<Card className="p-4">
								<strong>3.</strong> Procure canais de apoio listados abaixo. Lei 14.181/2021 protege
								superendividados — renegociação coletiva é possível.
							</Card>
						</li>
						<li>
							<Card className="p-4">
								<strong>4.</strong> Cadastre toda renda extra (bicos, vendas) em{" "}
								<Link className="text-[var(--color-teal)] underline" href="/app/transactions">
									Transações
								</Link>
								. Pequenas entradas mudam o cenário.
							</Card>
						</li>
					</ol>

					<h3 className="text-[16px] font-semibold mb-3">Canais de apoio</h3>
					<div className="space-y-3">
						{(channels ?? []).slice(0, 4).map((ch) => (
							<Card key={ch.id} className="p-4">
								<div className="flex items-start justify-between gap-4">
									<div>
										<div className="text-[15px] font-semibold">{ch.name}</div>
										{ch.description && (
											<p className="text-[13px] text-[var(--color-ink-2)] mt-1">{ch.description}</p>
										)}
									</div>
									<div className="flex gap-3 text-[14px]">
										{ch.phone && (
											<a
												href={`tel:${ch.phone}`}
												className="text-[var(--color-teal)] inline-flex items-center gap-1"
											>
												<Phone className="w-3.5 h-3.5" /> {ch.phone}
											</a>
										)}
										{ch.url && (
											<a
												href={ch.url}
												target="_blank"
												rel="noreferrer noopener"
												className="text-[var(--color-teal)] inline-flex items-center gap-1"
											>
												<ExternalLink className="w-3.5 h-3.5" /> site
											</a>
										)}
									</div>
								</div>
							</Card>
						))}
					</div>
				</>
			)}
		</>
	);
}
