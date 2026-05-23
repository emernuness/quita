"use client";

import { Card } from "@/components/Card";
import { Money } from "@/components/Money";
import { PageHeader } from "@/components/PageHeader";
import { useMotorPlan } from "@/hooks/useMotorPlan";
import { Lock, Shield, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ModoProtecaoPage() {
	const { data: plan, isLoading } = useMotorPlan();
	const isProtection = plan?.operationMode === "protection";

	return (
		<>
			<PageHeader
				title="Modo Proteção"
				subtitle="Você está perto de uma situação crítica. Vamos blindar o essencial antes que algo quebre."
			/>

			{isLoading ? (
				<Card className="p-10 text-center text-[var(--color-ink-3)]">Carregando…</Card>
			) : !isProtection ? (
				<Card className="p-6 bg-[var(--color-success-bg)] text-[var(--color-success-fg)] border-[var(--color-success)]">
					<div className="flex items-start gap-3">
						<ShieldCheck className="w-5 h-5 mt-0.5" />
						<div>
							<div className="text-[16px] font-semibold">
								Modo atual: <strong>{plan?.operationMode ?? "—"}</strong>
							</div>
							<p className="text-[14px] mt-1">
								Voce nao esta em Modo Protecao. Acompanhe seu plano regular em{" "}
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
					<Card className="p-6 bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)] border-[var(--color-warning)] mb-6">
						<div className="flex items-start gap-3">
							<Shield className="w-5 h-5 mt-0.5" />
							<div>
								<div className="text-[16px] font-semibold">{plan.mainGoal}</div>
								<p className="text-[14px] mt-2">
									Capacidade segura atual: <Money value={plan.safeCapacity} />. Use 100% para
									reserva minima — nada de pagar divida alem do minimo legal.
								</p>
							</div>
						</div>
					</Card>

					<h3 className="text-[16px] font-semibold mb-3">Plano de protecao</h3>
					<ol className="space-y-3 mb-8">
						<li>
							<Card className="p-4">
								<strong>1.</strong> Direcione toda capacidade segura para reserva de 1 mes do minimo
								vital. Sem reserva, qualquer imprevisto vira crise.
							</Card>
						</li>
						<li>
							<Card className="p-4">
								<strong>2.</strong> Pague apenas o minimo de cada divida ativa. Negocie pausa em
								dividas sem garantia (cartao, emprestimo pessoal). Lei 14.181/2021 reconhece
								superendividamento como circunstancia legitima.
							</Card>
						</li>
						<li>
							<Card className="p-4">
								<strong>3.</strong> Revise despesas: cancele assinaturas, plano de telefonia caro,
								qualquer servico nao essencial. Use{" "}
								<Link className="text-[var(--color-teal)] underline" href="/app/finances">
									Financas
								</Link>{" "}
								para marcar canCancel=true.
							</Card>
						</li>
						<li>
							<Card className="p-4">
								<strong>4.</strong> Toda renda extra entra em{" "}
								<Link className="text-[var(--color-teal)] underline" href="/app/transactions">
									Transacoes
								</Link>
								. Bico, freela, venda de objeto — registre. Acelera saida do modo.
							</Card>
						</li>
					</ol>

					<Card className="p-5 bg-[var(--color-info-bg)] text-[var(--color-info-fg)] border-[var(--color-info)]">
						<div className="flex items-start gap-3">
							<Lock className="w-5 h-5 mt-0.5" />
							<div className="text-[14px]">
								<strong>Sem julgamento.</strong> Modo Protecao nao e fracasso. E reconhecer que a
								margem ficou estreita e blindar o que importa antes que vire crise. Quando reserva
								voltar, voce sai automaticamente.
							</div>
						</div>
					</Card>
				</>
			)}
		</>
	);
}
