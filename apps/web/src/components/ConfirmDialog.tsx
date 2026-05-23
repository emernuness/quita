"use client";

import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

interface Props {
	open: boolean;
	title: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
	loading?: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel = "Confirmar",
	cancelLabel = "Cancelar",
	destructive = false,
	loading = false,
	onConfirm,
	onClose,
}: Props) {
	return (
		<Modal open={open} onClose={onClose} title={title} size="sm">
			{description ? <p className="text-[14px] text-[var(--color-ink-2)]">{description}</p> : null}
			<div className="mt-6 flex justify-end gap-3">
				<Button variant="ghost" onClick={onClose} disabled={loading}>
					{cancelLabel}
				</Button>
				<Button
					onClick={onConfirm}
					loading={loading}
					className={
						destructive ? "bg-[var(--color-danger)] hover:opacity-90 text-white" : undefined
					}
				>
					{confirmLabel}
				</Button>
			</div>
		</Modal>
	);
}
