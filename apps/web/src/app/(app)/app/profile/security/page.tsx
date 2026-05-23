"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { useChangePassword } from "@/hooks/useProfile";
import { type FormEvent, useState } from "react";

export default function SecurityPage() {
	const change = useChangePassword();
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [ok, setOk] = useState(false);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setOk(false);
		if (next.length < 8) return setError("Nova senha precisa de pelo menos 8 caracteres.");
		if (next !== confirm) return setError("As senhas não coincidem.");
		try {
			await change.mutateAsync({ currentPassword: current, newPassword: next });
			setOk(true);
			setCurrent("");
			setNext("");
			setConfirm("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro ao trocar senha.");
		}
	}

	return (
		<>
			<PageHeader title="Segurança" subtitle="Troque a senha e ajuste preferências de acesso." />

			<Card className="p-6">
				<form className="grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={onSubmit}>
					<Input
						label="SENHA ATUAL"
						type="password"
						value={current}
						onChange={(e) => setCurrent(e.target.value)}
						autoComplete="current-password"
					/>
					<div className="hidden md:block" />
					<Input
						label="NOVA SENHA"
						type="password"
						value={next}
						onChange={(e) => setNext(e.target.value)}
						autoComplete="new-password"
					/>
					<Input
						label="CONFIRMAR NOVA SENHA"
						type="password"
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						autoComplete="new-password"
					/>
					<div className="md:col-span-2 flex items-center gap-3">
						<Button type="submit" loading={change.isPending}>
							Trocar senha
						</Button>
					</div>
					{ok ? (
						<div className="md:col-span-2 rounded-[8px] border border-[var(--color-success-bg)] bg-[var(--color-success-bg)] px-4 py-3 text-[13px] text-[var(--color-success-fg)]">
							Senha alterada.
						</div>
					) : null}
					{error ? (
						<div className="md:col-span-2 rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)]">
							{error}
						</div>
					) : null}
				</form>
			</Card>
		</>
	);
}
