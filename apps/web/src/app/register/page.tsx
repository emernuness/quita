"use client";

import { AuthSplit } from "@/components/AuthSplit";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { maskPhone, onlyDigits } from "@/lib/masks";
import { validateWithZod } from "@/lib/zod";
import { useAuthStore } from "@/stores/auth";
import { registerSchema } from "@quita/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function RegisterPage() {
	const router = useRouter();
	const register = useAuthStore((s) => s.register);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setSubmitError(null);
		const fieldErrors: Record<string, string> = {};
		if (password !== confirm) fieldErrors.confirm = "As senhas não coincidem";

		const unmaskedPhone = onlyDigits(phone);
		const result = validateWithZod(registerSchema, {
			name: name.trim(),
			email: email.trim().toLowerCase(),
			phone: unmaskedPhone,
			password,
		});
		if (!result.success) {
			for (const [k, v] of Object.entries(result.errors)) if (!fieldErrors[k]) fieldErrors[k] = v;
		}
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		setErrors({});
		setLoading(true);
		try {
			await register(name.trim(), email.trim().toLowerCase(), unmaskedPhone, password);
			router.replace("/onboarding/income");
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Não foi possível criar a conta.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthSplit
			title="Crie sua conta"
			subtitle="Vamos começar com seus dados."
			footer={
				<>
					Já tem conta?{" "}
					<Link href="/login" className="font-semibold text-[var(--color-teal)] hover:underline">
						Entrar
					</Link>
				</>
			}
		>
			<form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
				<Input
					label="NOME COMPLETO"
					name="name"
					autoComplete="name"
					placeholder="Ex: Maria Silva"
					value={name}
					onChange={(e) => setName(e.target.value)}
					error={errors.name}
				/>
				<Input
					label="E-MAIL"
					name="email"
					type="email"
					autoComplete="email"
					placeholder="seu@email.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					error={errors.email}
				/>
				<Input
					label="CELULAR"
					name="phone"
					autoComplete="tel"
					placeholder="(41) 99999-9999"
					value={phone}
					onChange={(e) => setPhone(maskPhone(e.target.value))}
					error={errors.phone}
				/>
				<Input
					label="SENHA"
					name="password"
					type="password"
					autoComplete="new-password"
					placeholder="Mínimo 8 caracteres"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					error={errors.password}
				/>
				<Input
					label="CONFIRMAR SENHA"
					name="confirm"
					type="password"
					autoComplete="new-password"
					placeholder="Repita a senha"
					value={confirm}
					onChange={(e) => setConfirm(e.target.value)}
					error={errors.confirm}
				/>

				{submitError ? (
					<div className="rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)]">
						{submitError}
					</div>
				) : null}

				<Button type="submit" loading={loading} fullWidth size="lg">
					Criar conta
				</Button>
			</form>
		</AuthSplit>
	);
}
