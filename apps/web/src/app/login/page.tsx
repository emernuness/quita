"use client";

import { AuthSplit } from "@/components/AuthSplit";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { validateWithZod } from "@/lib/zod";
import { useAuthStore } from "@/stores/auth";
import { loginSchema } from "@quita/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function LoginPage() {
	const router = useRouter();
	const login = useAuthStore((s) => s.login);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setSubmitError(null);
		const result = validateWithZod(loginSchema, {
			email: email.trim().toLowerCase(),
			password,
		});
		if (!result.success) {
			setErrors(result.errors);
			return;
		}
		setErrors({});
		setLoading(true);
		try {
			await login(email.trim().toLowerCase(), password);
			router.replace("/");
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Não foi possível entrar.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthSplit
			title="Entrar na sua conta"
			subtitle="Use o e-mail que você cadastrou."
			footer={
				<>
					Não tem conta?{" "}
					<Link href="/register" className="font-semibold text-[var(--color-teal)] hover:underline">
						Cadastre-se
					</Link>
				</>
			}
		>
			<form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
				<Input
					label="E-MAIL"
					name="email"
					type="email"
					autoComplete="email"
					placeholder="voce@exemplo.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					error={errors.email}
				/>
				<Input
					label="SENHA"
					name="password"
					type="password"
					autoComplete="current-password"
					placeholder="Sua senha"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					error={errors.password}
				/>

				<div className="flex items-center justify-end">
					<Link
						href="/forgot-password"
						className="text-[13px] font-semibold text-[var(--color-teal)] hover:underline"
					>
						Esqueci minha senha
					</Link>
				</div>

				{submitError ? (
					<div className="rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)]">
						{submitError}
					</div>
				) : null}

				<Button type="submit" loading={loading} fullWidth size="lg">
					Entrar
				</Button>
			</form>
		</AuthSplit>
	);
}
