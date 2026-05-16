"use client";

import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

export function ConfirmModal({
	open,
	onClose,
	onConfirm,
	title,
	description,
	confirmLabel = "Confirmar",
	cancelLabel = "Cancelar",
	tone = "danger",
	loading,
}: {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description?: React.ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	tone?: "danger" | "primary";
	loading?: boolean;
}) {
	return (
		<Modal
			open={open}
			onClose={onClose}
			title={title}
			size="sm"
			footer={
				<>
					<Button variant="ghost" onClick={onClose}>
						{cancelLabel}
					</Button>
					<Button
						variant={tone === "danger" ? "danger" : "primary"}
						loading={loading}
						onClick={onConfirm}
					>
						{confirmLabel}
					</Button>
				</>
			}
		>
			{description ? <p className="text-[14px] text-[var(--color-ink-2)]">{description}</p> : null}
		</Modal>
	);
}
