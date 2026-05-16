"use client";

import { Button } from "@/components/Button";
import { CheckIcon } from "@/components/Icons";
import { Modal } from "@/components/Modal";

export function CelebrationModal({
	open,
	onClose,
	title = "Mais uma quitada!",
	subtitle = "Cada dívida que sai é mais ar pra respirar.",
}: {
	open: boolean;
	onClose: () => void;
	title?: string;
	subtitle?: string;
}) {
	return (
		<Modal open={open} onClose={onClose} size="sm">
			<div className="text-center">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-fg)]">
					<CheckIcon size={32} />
				</div>
				<h2 className="mt-5 text-[22px] font-bold tracking-tight text-[var(--color-ink)]">
					{title}
				</h2>
				<p className="mt-2 text-[14px] text-[var(--color-ink-2)]">{subtitle}</p>
				<div className="mt-7">
					<Button fullWidth onClick={onClose}>
						Continuar
					</Button>
				</div>
			</div>
		</Modal>
	);
}
