"use client";

import { Button } from "@/components/Button";
import { CheckIcon } from "@/components/Icons";
import { Modal } from "@/components/Modal";
import { Money } from "@/components/Money";

export function PaymentConfirmedModal({
	open,
	onClose,
	amount,
	creditor,
	fullyPaid,
}: {
	open: boolean;
	onClose: () => void;
	amount: number;
	creditor: string;
	fullyPaid: boolean;
}) {
	return (
		<Modal open={open} onClose={onClose} size="sm">
			<div className="text-center">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-fg)]">
					<CheckIcon size={28} />
				</div>
				<h2 className="mt-5 text-[22px] font-bold tracking-tight text-[var(--color-ink)]">
					{fullyPaid ? "Dívida quitada!" : "Pagamento registrado"}
				</h2>
				<p className="mt-2 text-[14px] text-[var(--color-ink-2)]">
					Você pagou{" "}
					<span className="tabular font-semibold text-[var(--color-ink)]">
						<Money value={amount} />
					</span>{" "}
					para {creditor}.
				</p>
				<div className="mt-7">
					<Button fullWidth onClick={onClose}>
						Continuar
					</Button>
				</div>
			</div>
		</Modal>
	);
}
