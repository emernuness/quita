"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Money } from "@/components/Money";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { Toggle } from "@/components/Toggle";
import { useEmergencyReserve, useUpsertEmergencyReserve } from "@/hooks/useEmergencyReserve";
import { PiggyBank, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ReservaPage() {
	const { data, isLoading } = useEmergencyReserve();
	const upsert = useUpsertEmergencyReserve();
	const [current, setCurrent] = useState("");
	const [target, setTarget] = useState("");
	const [monthly, setMonthly] = useState("");
	const [active, setActive] = useState(false);

	useEffect(() => {
		if (!data) return;
		setCurrent(String(Number(data.currentAmount ?? 0)));
		setTarget(data.targetAmount ? String(Number(data.targetAmount)) : "");
		setMonthly(data.monthlyTarget ? String(Number(data.monthlyTarget)) : "");
		setActive(data.isActive);
	}, [data]);

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		try {
			await upsert.mutateAsync({
				currentAmount: current ? Number(current) : 0,
				targetAmount: target ? Number(target) : null,
				monthlyTarget: monthly ? Number(monthly) : null,
				isActive: active,
			});
			toast.success("Reserva atualizada.");
		} catch (err) {
			toast.error((err as Error).message);
		}
	}

	const currentN = Number(current || 0);
	const targetN = Number(target || 0);
	const progress = targetN > 0 ? Math.min(100, (currentN / targetN) * 100) : 0;

	return (
		<>
			<PageHeader
				title="Reserva de emergência"
				subtitle="Quando ativa, o motor reserva mensalmente o valor que você definir antes de quitar dívidas."
			/>

			<Card className="p-6 mb-6">
				<div className="flex items-start gap-3">
					<div className="rounded-lg bg-[var(--color-teal-soft)] p-2">
						<ShieldCheck className="w-5 h-5 text-[var(--color-teal)]" />
					</div>
					<div>
						<h2 className="text-[16px] font-semibold">Por que ter reserva?</h2>
						<p className="text-[14px] mt-1 text-[var(--color-ink-2)]">
							Reserva impede que um imprevisto (saúde, conserto) vire dívida nova. Recomendação: 3 a
							6 meses de despesas essenciais.
						</p>
					</div>
				</div>
			</Card>

			{isLoading ? (
				<Card className="p-10 text-center text-[var(--color-ink-3)]">Carregando…</Card>
			) : (
				<Card className="p-6">
					<form onSubmit={handleSave} className="grid gap-5">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-[14px] font-medium">Ativa</div>
								<div className="text-[12px] text-[var(--color-ink-3)]">
									Motor passa a subtrair o aporte mensal da capacidade segura.
								</div>
							</div>
							<Toggle checked={active} onChange={setActive} />
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<Input
								label="Saldo atual (R$)"
								type="number"
								value={current}
								onChange={(e) => setCurrent(e.target.value)}
							/>
							<Input
								label="Meta (R$)"
								type="number"
								value={target}
								onChange={(e) => setTarget(e.target.value)}
							/>
							<Input
								label="Aporte mensal (R$)"
								type="number"
								value={monthly}
								onChange={(e) => setMonthly(e.target.value)}
							/>
						</div>

						{targetN > 0 && (
							<div>
								<div className="flex items-center gap-2 mb-2 text-[14px]">
									<PiggyBank className="w-4 h-4 text-[var(--color-teal)]" />
									<span>
										<Money value={currentN} /> de <Money value={targetN} />
									</span>
									<span className="ml-auto text-[12px] text-[var(--color-ink-3)]">
										{progress.toFixed(0)}%
									</span>
								</div>
								<ProgressBar value={progress} />
							</div>
						)}

						<div className="flex gap-3">
							<Button type="submit" disabled={upsert.isPending}>
								{upsert.isPending ? "Salvando…" : "Salvar"}
							</Button>
						</div>
					</form>
				</Card>
			)}
		</>
	);
}
