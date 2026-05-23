"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Empty } from "@/components/Empty";
import { Input } from "@/components/Input";
import { Money } from "@/components/Money";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { Select } from "@/components/Select";
import { SkeletonList } from "@/components/Skeleton";
import {
	type CreateGoalPayload,
	type GoalType,
	useCreateGoal,
	useDeleteGoal,
	useGoals,
} from "@/hooks/useGoals";
import { Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const GOAL_LABELS: Record<GoalType, string> = {
	debt_freedom: "Sair das dívidas",
	house: "Casa própria",
	education: "Educação",
	family: "Família",
	travel: "Viagem",
	peace: "Paz financeira",
	security: "Segurança",
	retirement: "Aposentadoria",
	other: "Outro",
};

export default function ObjetivosPage() {
	const { data, isLoading } = useGoals();
	const create = useCreateGoal();
	const remove = useDeleteGoal();
	const [adding, setAdding] = useState(false);
	const [form, setForm] = useState<CreateGoalPayload>({
		goalType: "debt_freedom",
		description: "",
	});

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		if (!form.description.trim()) {
			toast.error("Descreva sua meta.");
			return;
		}
		try {
			await create.mutateAsync({
				...form,
				targetAmount: form.targetAmount ? Number(form.targetAmount) : null,
			});
			toast.success("Meta criada.");
			setAdding(false);
			setForm({ goalType: "debt_freedom", description: "" });
		} catch (err) {
			toast.error((err as Error).message);
		}
	}

	return (
		<>
			<PageHeader
				title="Meus objetivos"
				subtitle="Defina onde quer chegar. O motor considera suas metas ao calcular o plano."
			/>

			<div className="flex justify-end mb-4">
				{!adding && (
					<Button onClick={() => setAdding(true)}>
						<Plus className="w-4 h-4" /> Nova meta
					</Button>
				)}
			</div>

			{adding && (
				<Card className="p-6 mb-6">
					<form onSubmit={handleCreate} className="grid gap-4">
						<Select
							label="Tipo"
							value={form.goalType}
							onChange={(e) => setForm({ ...form, goalType: e.target.value as GoalType })}
						>
							{Object.entries(GOAL_LABELS).map(([k, v]) => (
								<option key={k} value={k}>
									{v}
								</option>
							))}
						</Select>
						<Input
							label="Descrição"
							value={form.description}
							onChange={(e) => setForm({ ...form, description: e.target.value })}
							placeholder="Quitar cartão até dezembro"
						/>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<Input
								label="Valor alvo (R$, opcional)"
								type="number"
								value={form.targetAmount?.toString() ?? ""}
								onChange={(e) =>
									setForm({ ...form, targetAmount: e.target.value ? Number(e.target.value) : null })
								}
							/>
							<Input
								label="Data limite (opcional)"
								type="date"
								value={form.targetDate ?? ""}
								onChange={(e) => setForm({ ...form, targetDate: e.target.value || null })}
							/>
						</div>
						<div className="flex gap-3">
							<Button type="submit" disabled={create.isPending}>
								{create.isPending ? "Criando…" : "Criar meta"}
							</Button>
							<Button type="button" variant="ghost" onClick={() => setAdding(false)}>
								Cancelar
							</Button>
						</div>
					</form>
				</Card>
			)}

			{isLoading && <SkeletonList count={3} />}

			{!isLoading && (!data || data.length === 0) && !adding && (
				<Empty
					title="Sem metas cadastradas"
					description="Crie sua primeira meta para o motor considerar no plano."
				/>
			)}

			<div className="space-y-3">
				{(data ?? []).map((g) => {
					const target = g.targetAmount ? Number(g.targetAmount) : null;
					return (
						<Card key={g.id} className="p-5">
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-start gap-3 flex-1">
									<div className="rounded-lg bg-[var(--color-teal-soft)] p-2">
										<Target className="w-4 h-4 text-[var(--color-teal)]" />
									</div>
									<div className="flex-1">
										<div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-3)] font-semibold">
											{GOAL_LABELS[g.goalType]}
										</div>
										<div className="text-[16px] font-semibold mt-0.5">{g.description}</div>
										{target !== null && (
											<div className="mt-2 text-[13px] text-[var(--color-ink-3)]">
												Meta: <Money value={target} />
											</div>
										)}
										{g.targetDate && (
											<div className="text-[12px] text-[var(--color-ink-3)] mt-0.5">
												até {new Date(g.targetDate).toLocaleDateString("pt-BR")}
											</div>
										)}
										{g.achievedAt && (
											<div className="mt-2">
												<ProgressBar value={100} />
												<div className="text-[12px] text-[var(--color-success-fg)] mt-1 font-semibold">
													✓ Conquistada
												</div>
											</div>
										)}
									</div>
								</div>
								<button
									type="button"
									aria-label="Remover meta"
									className="text-[var(--color-ink-3)] hover:text-[var(--color-danger)]"
									onClick={() => remove.mutate(g.id)}
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						</Card>
					);
				})}
			</div>
		</>
	);
}
