"use client";

import { AuthSplit } from "@/components/AuthSplit";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import Link from "next/link";

export default function ForgotPasswordPage() {
	return (
		<AuthSplit
			title="Esqueceu a senha?"
			subtitle="Em breve você poderá redefinir sua senha por aqui."
			footer={
				<>
					Já lembrou?{" "}
					<Link href="/login" className="font-semibold text-[var(--color-teal)] hover:underline">
						Voltar ao login
					</Link>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<Badge tone="warning" dot>
					Em desenvolvimento
				</Badge>
				<p className="text-[14px] leading-relaxed text-[var(--color-ink-2)]">
					Ainda não habilitamos a recuperação automática de senha. Por enquanto, entre em contato
					pelo e-mail suporte@quita.app que ajudamos manualmente.
				</p>
				<div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-info-bg)] p-4 text-[13px] text-[var(--color-info-fg)]">
					<div className="font-semibold">Por que ainda não está disponível?</div>
					<p className="mt-1">
						Recuperação por código exige envio de e-mail/SMS. Estamos integrando esse fluxo com
						cuidado pra não vazar dado.
					</p>
				</div>
				<Link href="/login" className="block">
					<Button fullWidth size="lg" variant="secondary" type="button">
						Voltar ao login
					</Button>
				</Link>
			</div>
		</AuthSplit>
	);
}
