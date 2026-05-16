"use client";

import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

export function BlueModeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
	return (
		<Modal open={open} onClose={onClose} size="md">
			<div className="-mx-7 -mt-6 mb-6 rounded-t-[20px] bg-gradient-to-br from-[var(--color-teal)] via-[var(--color-teal-mid)] to-[var(--color-green)] px-7 py-10 text-white">
				<div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/70">
					Você chegou no azul
				</div>
				<h2 className="mt-2 text-[28px] font-bold leading-tight tracking-tight">
					Dívidas zeradas. Próximo capítulo: viver no azul.
				</h2>
			</div>

			<p className="text-[14px] leading-relaxed text-[var(--color-ink-2)]">
				Parabéns por quitar tudo. Agora o Quita vira seu organizador financeiro — sem dívidas no
				caminho, dá para começar a planejar o futuro.
			</p>

			<div className="mt-6 flex justify-end gap-2">
				<Button variant="ghost" onClick={onClose}>
					Mais tarde
				</Button>
				<Button onClick={onClose}>Vamos lá</Button>
			</div>
		</Modal>
	);
}
