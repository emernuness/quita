"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonList } from "@/components/Skeleton";
import { useAuditLog, useLogoutAll } from "@/hooks/useAuthSecurity";
import { useChangePassword } from "@/hooks/useProfile";
import { useAuthStore } from "@/stores/auth";
import { Activity, LogOut, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

const EVENT_LABELS: Record<string, { label: string; tone: string }> = {
	login_success: { label: "Login concluído", tone: "text-[var(--color-success)]" },
	login_failure: { label: "Tentativa de login falhou", tone: "text-[var(--color-danger)]" },
	logout: { label: "Logout", tone: "text-[var(--color-ink-2)]" },
	logout_all: { label: "Logout de todos os dispositivos", tone: "text-[var(--color-warning)]" },
	refresh_success: { label: "Sessão renovada", tone: "text-[var(--color-ink-3)]" },
	password_changed: { label: "Senha alterada", tone: "text-[var(--color-success)]" },
	password_reset_requested: {
		label: "Reset de senha solicitado",
		tone: "text-[var(--color-warning)]",
	},
	password_reset_completed: {
		label: "Reset de senha concluído",
		tone: "text-[var(--color-success)]",
	},
};

export default function SecurityPage() {
	const router = useRouter();
	const logoutAuthState = useAuthStore((s) => s.logout);
	const change = useChangePassword();
	const logoutAll = useLogoutAll();
	const { data: events, isLoading: eventsLoading } = useAuditLog(50);

	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [ok, setOk] = useState(false);
	const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

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
			toast.success("Senha alterada.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro ao trocar senha.");
		}
	}

	async function onLogoutAll() {
		try {
			await logoutAll.mutateAsync();
			logoutAuthState();
			toast.success("Logout em todos os dispositivos.");
			router.replace("/login");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Erro ao sair.");
		} finally {
			setConfirmLogoutAll(false);
		}
	}

	return (
		<>
			<PageHeader
				title="Segurança"
				subtitle="Troque a senha, encerre sessões e veja atividade recente."
			/>

			<Card className="p-6 mb-6">
				<div className="flex items-start gap-3 mb-4">
					<ShieldAlert className="w-5 h-5 mt-0.5 text-[var(--color-teal)]" />
					<div>
						<h2 className="text-[16px] font-semibold">Trocar senha</h2>
						<p className="text-[13px] text-[var(--color-ink-2)]">Mínimo 8 caracteres.</p>
					</div>
				</div>
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

			<Card className="p-6 mb-6">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-start gap-3">
						<LogOut className="w-5 h-5 mt-0.5 text-[var(--color-warning)]" />
						<div>
							<h2 className="text-[16px] font-semibold">Sair de todos os dispositivos</h2>
							<p className="text-[13px] text-[var(--color-ink-2)] mt-1 max-w-[480px]">
								Revoga todas as sessões ativas. Você precisará fazer login novamente em todos os
								navegadores e celulares.
							</p>
						</div>
					</div>
					<Button variant="ghost" onClick={() => setConfirmLogoutAll(true)}>
						Sair em todos
					</Button>
				</div>
			</Card>

			<Card className="p-6">
				<div className="flex items-start gap-3 mb-4">
					<Activity className="w-5 h-5 mt-0.5 text-[var(--color-teal)]" />
					<div>
						<h2 className="text-[16px] font-semibold">Atividade recente</h2>
						<p className="text-[13px] text-[var(--color-ink-2)]">
							Últimos 50 eventos da sua conta. Se ver algo suspeito, troque a senha.
						</p>
					</div>
				</div>
				{eventsLoading ? (
					<SkeletonList count={4} />
				) : !events?.length ? (
					<div className="py-6 text-center text-[14px] text-[var(--color-ink-3)]">
						Sem eventos registrados.
					</div>
				) : (
					<ul className="divide-y divide-[var(--color-border)]">
						{events.map((ev) => {
							const meta = EVENT_LABELS[ev.eventType] ?? {
								label: ev.eventType,
								tone: "text-[var(--color-ink-2)]",
							};
							return (
								<li key={ev.id} className="py-3 flex items-center justify-between gap-4">
									<div className="min-w-0 flex-1">
										<div className={`text-[14px] font-semibold ${meta.tone}`}>{meta.label}</div>
										<div className="text-[12px] text-[var(--color-ink-3)] truncate">
											{ev.ipAddress ? `IP ${ev.ipAddress}` : "IP desconhecido"}
											{ev.userAgent ? ` • ${ev.userAgent.slice(0, 60)}` : null}
										</div>
									</div>
									<div className="text-[12px] text-[var(--color-ink-3)] shrink-0">
										{new Date(ev.createdAt).toLocaleString("pt-BR")}
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</Card>

			<ConfirmDialog
				open={confirmLogoutAll}
				title="Encerrar todas as sessões?"
				description="Você será desconectado em todos os dispositivos. Precisará fazer login novamente."
				confirmLabel="Sair em todos"
				destructive
				loading={logoutAll.isPending}
				onConfirm={onLogoutAll}
				onClose={() => setConfirmLogoutAll(false)}
			/>
		</>
	);
}
