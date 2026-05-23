"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { maskPhone, onlyDigits } from "@/lib/masks";
import { type FormEvent, useEffect, useState } from "react";

export default function ProfileAccountPage() {
	const { data: profile } = useProfile();
	const update = useUpdateProfile();
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	useEffect(() => {
		if (profile) {
			setName(profile.name);
			setPhone(maskPhone(profile.phone));
		}
	}, [profile]);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setStatus("idle");
		setErrorMsg(null);
		try {
			await update.mutateAsync({ name: name.trim(), phone: onlyDigits(phone) });
			setStatus("saved");
		} catch (err) {
			setStatus("error");
			setErrorMsg(err instanceof Error ? err.message : "Erro ao salvar.");
		}
	}

	return (
		<>
			<PageHeader title="Conta" subtitle="Seus dados pessoais e contato." />

			<Card className="p-6">
				<form className="grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={onSubmit}>
					<Input label="NOME" value={name} onChange={(e) => setName(e.target.value)} />
					<Input
						label="CELULAR"
						value={phone}
						onChange={(e) => setPhone(maskPhone(e.target.value))}
					/>
					<Input label="E-MAIL" value={profile?.email ?? ""} disabled />
					<div className="flex items-end">
						<Button type="submit" loading={update.isPending}>
							Salvar alterações
						</Button>
					</div>
					{status === "saved" ? (
						<div className="md:col-span-2 rounded-[8px] border border-[var(--color-success-bg)] bg-[var(--color-success-bg)] px-4 py-3 text-[13px] text-[var(--color-success-fg)]">
							Dados atualizados.
						</div>
					) : null}
					{status === "error" && errorMsg ? (
						<div className="md:col-span-2 rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)]">
							{errorMsg}
						</div>
					) : null}
				</form>
			</Card>

			<Card className="p-6 mt-6">
				<div className="flex items-start justify-between gap-4 flex-wrap">
					<div>
						<h2 className="text-[16px] font-semibold mb-1">Aparência</h2>
						<p className="text-[13px] text-[var(--color-ink-2)]">
							Tema claro, escuro ou seguir preferência do sistema.
						</p>
					</div>
					<ThemeToggle />
				</div>
			</Card>
		</>
	);
}
