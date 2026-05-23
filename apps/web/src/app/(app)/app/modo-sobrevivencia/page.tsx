"use client";

import { Card } from "@/components/Card";
import { Money } from "@/components/Money";
import { PageHeader } from "@/components/PageHeader";
import { useMotorPlan } from "@/hooks/useMotorPlan";
import { useSupportChannels } from "@/hooks/useSupportChannels";
import { ExternalLink, HeartHandshake, LifeBuoy, Phone } from "lucide-react";
import Link from "next/link";

export default function ModoSobrevivenciaPage() {
	const { data: plan, isLoading } = useMotorPlan();
	const { data: channels } = useSupportChannels();
	const isSurvival = plan?.operationMode === "survival";

	return (
		<>
			<PageHeader
				title="Modo Sobrevivência"
				subtitle="Renda nao cobre nem o minimo vital. O foco agora e atravessar o mes — divida espera."
			/>

			{isLoading ? (
				<Card className="p-10 text-center text-[var(--color-ink-3)]">Carregando…</Card>
			) : !isSurvival ? (
				<Card className="p-6 bg-[var(--color-success-bg)] text-[var(--color-success-fg)] border-[var(--color-success)]">
					<div className="flex items-start gap-3">
						<LifeBuoy className="w-5 h-5 mt-0.5" />
						<div>
							<div className="text-[16px] font-semibold">
								Modo atual: <strong>{plan?.operationMode ?? "—"}</strong>
							</div>
							<p className="text-[14px] mt-1">
								Voce nao esta em Modo Sobrevivencia. Acompanhe seu plano em{" "}
								<Link className="underline" href="/app/plan">
									Meu plano
								</Link>
								.
							</p>
						</div>
					</div>
				</Card>
			) : (
				<>
					<Card className="p-6 bg-[var(--color-danger-bg)] text-[var(--color-danger-fg)] border-[var(--color-danger)] mb-6">
						<div className="flex items-start gap-3">
							<LifeBuoy className="w-5 h-5 mt-0.5" />
							<div>
								<div className="text-[16px] font-semibold">{plan.mainGoal}</div>
								<p className="text-[14px] mt-2">
									Capacidade segura: <Money value={plan.safeCapacity} />. Direcione 100% para
									essenciais (moradia, alimento, agua, luz). Dividas ficam congeladas — voce nao
									deve nada por descumprir o impossivel.
								</p>
							</div>
						</div>
					</Card>

					<h3 className="text-[16px] font-semibold mb-3">O que fazer hoje</h3>
					<ol className="space-y-3 mb-8">
						<li>
							<Card className="p-4">
								<strong>1.</strong> Liste seus essenciais inegociaveis: aluguel/prestacao, comida,
								agua, luz, gas, remedio. Tudo o mais espera.
							</Card>
						</li>
						<li>
							<Card className="p-4">
								<strong>2.</strong> Procure um canal de apoio agora. CRAS, Defensoria Publica, ONGs
								de proteção ao consumidor. Voce tem direito a renegociação coletiva pela Lei
								14.181/2021.
							</Card>
						</li>
						<li>
							<Card className="p-4">
								<strong>3.</strong> Comunique credores POR ESCRITO que esta em situacao de
								superendividamento. Eles nao podem te assediar. Bloqueie ligacoes abusivas.
							</Card>
						</li>
						<li>
							<Card className="p-4">
								<strong>4.</strong> Pense em renda extra possivel hoje (bico, venda de objeto que
								nao precisa, pedido de ajuda a familia). Registre tudo em{" "}
								<Link className="text-[var(--color-teal)] underline" href="/app/transactions">
									Transacoes
								</Link>
								.
							</Card>
						</li>
					</ol>

					<h3 className="text-[16px] font-semibold mb-3">Canais de apoio</h3>
					<div className="space-y-3 mb-6">
						{(channels ?? []).slice(0, 5).map((ch) => (
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

					<Card className="p-5 bg-[var(--color-info-bg)] text-[var(--color-info-fg)] border-[var(--color-info)]">
						<div className="flex items-start gap-3">
							<HeartHandshake className="w-5 h-5 mt-0.5" />
							<div className="text-[14px]">
								<strong>Voce nao esta sozinho.</strong> Atravessar este mes ja e vitoria. Quita
								continua acompanhando — quando entrar dinheiro novo, mostramos como reerguer.
							</div>
						</div>
					</Card>
				</>
			)}
		</>
	);
}
