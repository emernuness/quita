"use client";

import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import {
	type MainConcern,
	type PreferredStrategy,
	useBehaviorProfile,
	useUpsertBehaviorProfile,
} from "@/hooks/useBehaviorProfile";
import { ArrowRight, Calendar, Heart, PiggyBank, ShieldCheck, Target, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

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

			<Card className="p-6 mb-6">
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
