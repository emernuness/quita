"use client";

import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

export function CriticalModal({
	open,
	onClose,
	onAction,
}: {
	open: boolean;
	onClose: () => void;
	onAction?: () => void;
}) {
	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Suas dívidas estão maiores que o que sobra"
			subtitle="Vamos juntos achar caminhos. Calma e plano resolvem mais que pressa."
			size="md"
			footer={
				<>
					<Button variant="ghost" onClick={onClose}>
						Agora não
					</Button>
					<Button onClick={onAction ?? onClose}>Ver opções</Button>
				</>
			}
		>
			<ul className="space-y-2 text-[14px] text-[var(--color-ink-2)]">
				<li>· Renegociar a maior dívida diretamente com o credor</li>
				<li>· Pausar uma despesa não essencial neste mês</li>
				<li>· Procurar uma renda extra pontual</li>
				<li>· Cadastrar uma ajuda externa temporária</li>
			</ul>
		</Modal>
	);
}
