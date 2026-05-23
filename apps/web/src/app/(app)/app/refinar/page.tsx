"use client";

import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { SkeletonCard } from "@/components/Skeleton";
import {
	type MainConcern,
	type PreferredStrategy,
	useBehaviorProfile,
	useUpsertBehaviorProfile,
} from "@/hooks/useBehaviorProfile";
import { useDataFreshness } from "@/hooks/useDataFreshness";
import { ArrowRight, Calendar, Heart, MapPin, ShieldCheck, Target, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const DIMENSION_META = {
	income: { label: "Renda", icon: Wallet, editHref: "/app/finances" },
	essentials: { label: "Despesas essenciais", icon: ShieldCheck, editHref: "/app/transactions" },
	behavior: { label: "Comportamento", icon: Heart, editHref: "#perfil" },
	location: { label: "Localização", icon: MapPin, editHref: "/app/profile" },
} as const;

const STRATEGY_LABELS: Record<PreferredStrategy, string> = {
	snowball: "Bola de neve (menor primeiro)",
	avalanche: "Avalanche (maior juros primeiro)",
	hybrid: "Híbrido (motor escolhe)",
	undecided: "Não decidi ainda",
};

const CONCERN_LABELS: Record<MainConcern, string> = {
	collection_pressure: "Pressão de cobrança",
	service_cut_risk: "Risco de corte de serviço essencial",
	disorganization: "Desorganização financeira",
	shame: "Vergonha / culpa",
	where_to_start: "Não sei por onde começar",
};

const REFINE_CARDS = [
	{
		href: "/app/objetivos",
		label: "Minhas metas",
		description: "Defina onde quer chegar.",
		icon: Target,
	},
	{
		href: "/app/reserva",
		label: "Reserva de emergência",
		description: "Protege contra imprevistos virarem nova dívida.",
		icon: ShieldCheck,
	},
	{
		href: "/app/transactions",
		label: "Despesas detalhadas",
		description: "Marque cada gasto: essencial, cortável, sazonal.",
		icon: Wallet,
	},
	{
		href: "/app/debts",
		label: "Dívidas detalhadas",
		description: "Adicione juros, garantias, parcelas em atraso.",
		icon: Calendar,
	},
];

export default function RefinarPage() {
	const { data, isLoading } = useBehaviorProfile();
	const { data: freshness, isLoading: freshnessLoading } = useDataFreshness();
	const upsert = useUpsertBehaviorProfile();
	const [strategy, setStrategy] = useState<PreferredStrategy>("undecided");
	const [concern, setConcern] = useState<MainConcern | "">("");

	function syncForm() {
		if (data) {
			setStrategy(data.preferredStrategy);
			setConcern(data.mainConcern ?? "");
		}
	}

	if (data && strategy === "undecided" && data.preferredStrategy !== "undecided") {
		syncForm();
	}

	async function handleSave() {
		try {
			await upsert.mutateAsync({
				preferredStrategy: strategy,
				...(concern && { mainConcern: concern as MainConcern }),
			});
			toast.success("Perfil atualizado.");
		} catch (err) {
			toast.error((err as Error).message);
		}
	}

	return (
		<>
			<PageHeader
				title="Refinar dados"
				subtitle="Quanto mais o motor sabe sobre você, melhor o plano."
			/>

			{freshnessLoading ? (
				<div className="mb-6">
					<SkeletonCard lines={4} />
				</div>
			) : freshness ? (
				<>
					<Card className="p-6 mb-4">
						<div className="flex items-center justify-between mb-3">
							<div className="text-[14px] font-semibold">Precisão geral do seu plano</div>
							<div className="text-[24px] font-bold text-[var(--color-teal)]">
								{Math.round(freshness.overallScore * 100)}%
							</div>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-background)]">
							<div
								className="h-full bg-[var(--color-teal)] transition-all"
								style={{ width: `${Math.round(freshness.overallScore * 100)}%` }}
							/>
						</div>
						<p className="text-[12px] text-[var(--color-ink-3)] mt-2">
							Próxima revisão: {new Date(freshness.nextReviewDate).toLocaleDateString("pt-BR")}
						</p>
					</Card>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-6">
						{(Object.keys(DIMENSION_META) as Array<keyof typeof DIMENSION_META>).map((dim) => {
							const score = freshness.dimensions[dim];
							const meta = DIMENSION_META[dim];
							const pct = Math.round(score.score * 100);
							const Icon = meta.icon;
							return (
								<Card key={dim} className="p-4">
									<div className="flex items-start gap-3">
										<div className="rounded-lg bg-[var(--color-background)] p-2">
											<Icon className="w-4 h-4 text-[var(--color-teal)]" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between mb-1">
												<div className="text-[14px] font-semibold">{meta.label}</div>
												<div
													className={`text-[12px] font-semibold ${pct >= 75 ? "text-[var(--color-success)]" : pct >= 50 ? "text-[var(--color-warning)]" : "text-[var(--color-danger)]"}`}
												>
													{pct}%
												</div>
											</div>
											<div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-background)] mb-2">
												<div
													className="h-full bg-[var(--color-teal)] transition-all"
													style={{ width: `${pct}%` }}
												/>
											</div>
											{score.suggestions.length > 0 ? (
												<ul className="text-[12px] text-[var(--color-ink-2)] space-y-0.5 mb-2">
													{score.suggestions.slice(0, 2).map((s) => (
														<li key={s}>• {s}</li>
													))}
												</ul>
											) : (
												<p className="text-[12px] text-[var(--color-success)] mb-2">
													✓ Dimensão completa
												</p>
											)}
											{score.suggestions.length > 0 ? (
												<Link
													href={meta.editHref}
													className="text-[12px] font-semibold text-[var(--color-teal)] hover:underline inline-flex items-center gap-1"
												>
													Refinar <ArrowRight className="w-3 h-3" />
												</Link>
											) : null}
										</div>
									</div>
								</Card>
							);
						})}
					</div>
				</>
			) : null}

			<Card id="perfil" className="p-6 mb-6">
				<div className="flex items-start gap-3 mb-5">
					<div className="rounded-lg bg-[var(--color-teal-soft)] p-2">
						<Heart className="w-5 h-5 text-[var(--color-teal)]" />
					</div>
					<div>
						<h2 className="text-[16px] font-semibold">Perfil comportamental</h2>
						<p className="text-[13px] text-[var(--color-ink-2)] mt-1">
							Como você prefere atacar dívidas? Qual sua maior preocupação? Isso ajuda o motor a
							personalizar recomendações.
						</p>
					</div>
				</div>

				{isLoading ? (
					<div className="text-[var(--color-ink-3)] text-[14px]">Carregando…</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						<Select
							label="Estratégia preferida"
							value={strategy}
							onChange={(e) => setStrategy(e.target.value as PreferredStrategy)}
						>
							{Object.entries(STRATEGY_LABELS).map(([k, v]) => (
								<option key={k} value={k}>
									{v}
								</option>
							))}
						</Select>
						<Select
							label="Principal preocupação"
							value={concern}
							onChange={(e) => setConcern(e.target.value as MainConcern | "")}
						>
							<option value="">Escolha…</option>
							{Object.entries(CONCERN_LABELS).map(([k, v]) => (
								<option key={k} value={k}>
									{v}
								</option>
							))}
						</Select>
						<div className="md:col-span-2">
							<button
								type="button"
								onClick={handleSave}
								disabled={upsert.isPending}
								className="px-4 py-2 rounded-lg bg-[var(--color-teal)] text-white text-[14px] font-medium hover:opacity-90 disabled:opacity-50"
							>
								{upsert.isPending ? "Salvando…" : "Salvar perfil"}
							</button>
						</div>
					</div>
				)}
			</Card>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{REFINE_CARDS.map((c) => (
					<Link key={c.href} href={c.href}>
						<Card className="p-5 hover:border-[var(--color-teal)] transition-colors h-full">
							<div className="flex items-start gap-3">
								<div className="rounded-lg bg-[var(--color-background)] p-2">
									<c.icon className="w-5 h-5 text-[var(--color-teal)]" />
								</div>
								<div className="flex-1">
									<div className="text-[16px] font-semibold flex items-center justify-between">
										{c.label} <ArrowRight className="w-4 h-4 text-[var(--color-ink-3)]" />
									</div>
									<p className="text-[13px] text-[var(--color-ink-2)] mt-1">{c.description}</p>
								</div>
							</div>
						</Card>
					</Link>
				))}
			</div>
		</>
	);
}
