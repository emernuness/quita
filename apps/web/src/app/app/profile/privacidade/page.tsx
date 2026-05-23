"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { apiDelete } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PrivacidadePage() {
	const [confirming, setConfirming] = useState(false);
	const [requesting, setRequesting] = useState(false);
	const logout = useAuthStore((s) => s.logout);

	async function handleDelete() {
		setRequesting(true);
		try {
			await apiDelete("/profile/me");
			toast.success("Conta marcada para exclusão. Faça login em até 30 dias para cancelar.");
			await logout();
		} catch (err) {
			toast.error((err as Error).message);
		} finally {
			setRequesting(false);
		}
	}

	return (
		<>
			<PageHeader
				title="Privacidade e dados"
				subtitle="LGPD — você decide o que fazer com seus dados."
			/>

			<Card className="p-6 mb-6">
				<h2 className="text-[18px] font-semibold mb-2">Seus direitos</h2>
				<ul className="text-[14px] space-y-2 list-disc list-inside text-[var(--color-ink-2)]">
					<li>Acesso aos dados pessoais que armazenamos (Perfil)</li>
					<li>Correção de dados imprecisos (editar Perfil)</li>
					<li>Eliminação da conta e dados (botão abaixo)</li>
					<li>Portabilidade — exportação em JSON (em breve)</li>
					<li>Revogação de consentimentos (Notificações)</li>
				</ul>
				<p className="mt-4 text-[13px] text-[var(--color-ink-3)]">
					Dúvidas? Escreva para <strong>privacidade@quita.com.br</strong>.
				</p>
			</Card>

			<Card className="p-6 border-[var(--color-danger)]">
				<div className="flex items-start gap-3">
					<AlertTriangle className="w-5 h-5 text-[var(--color-danger)] mt-0.5" />
					<div className="flex-1">
						<h2 className="text-[18px] font-semibold text-[var(--color-danger)]">Excluir conta</h2>
						<p className="text-[14px] mt-2">
							Sua conta é marcada como excluída e <strong>preservada por 30 dias</strong>. Faça
							login nesse período para cancelar. Após 30 dias, todos os dados são apagados
							permanentemente (audit logs anonimizados conforme LGPD art. 18, IV).
						</p>

						{!confirming ? (
							<Button className="mt-4" onClick={() => setConfirming(true)} disabled={requesting}>
								<Trash2 className="w-4 h-4" />
								Solicitar exclusão
							</Button>
						) : (
							<div className="mt-4 flex flex-wrap gap-3">
								<Button onClick={handleDelete} disabled={requesting}>
									{requesting ? "Processando…" : "Confirmar exclusão"}
								</Button>
								<Button variant="ghost" onClick={() => setConfirming(false)}>
									Cancelar
								</Button>
							</div>
						)}
					</div>
				</div>
			</Card>
		</>
	);
}
