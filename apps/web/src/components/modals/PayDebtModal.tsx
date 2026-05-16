"use client";

import { Button } from "@/components/Button";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Modal } from "@/components/Modal";
import { Money } from "@/components/Money";
import { Select } from "@/components/Select";
import { useCreatePayment } from "@/hooks/useDebts";
import { cn } from "@/lib/cn";
import { unmaskBRL } from "@/lib/masks";
import { PaymentType } from "@quita/shared";
import { useState } from "react";

export function PayDebtModal({
	open,
	onClose,
	debtId,
	creditor,
	remaining,
	onPaid,
}: {
	open: boolean;
	onClose: () => void;
	debtId: string;
	creditor: string;
	remaining: number;
	onPaid?: (amount: number, type: (typeof PaymentType)[keyof typeof PaymentType]) => void;
}) {
	const create = useCreatePayment(debtId);
	const [paymentType, setPaymentType] = useState<(typeof PaymentType)[keyof typeof PaymentType]>(
		PaymentType.FULL,
	);
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);

	const value = paymentType === PaymentType.FULL ? remaining : unmaskBRL(amount);

	async function onSave() {
		setError(null);
		if (value <= 0) return setError("Informe um valor maior que zero.");
		try {
			await create.mutateAsync({ amount: value, paymentType });
			onPaid?.(value, paymentType);
			setAmount("");
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro ao registrar pagamento.");
		}
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={`Pagar ${creditor}`}
			subtitle={
				<>
					Restam <Money value={remaining} />
				</>
			}
			size="md"
			footer={
				<>
					<Button variant="ghost" onClick={onClose}>
						Cancelar
					</Button>
					<Button loading={create.isPending} onClick={onSave}>
						Registrar pagamento
					</Button>
				</>
			}
		>
			<div className="grid grid-cols-3 gap-2">
				{[
					{ k: PaymentType.FULL, l: "Quitar" },
					{ k: PaymentType.PARTIAL, l: "Parcial" },
					{ k: PaymentType.RENEGOTIATED, l: "Negociar" },
				].map((opt) => (
					<button
						key={opt.k}
						type="button"
						onClick={() => setPaymentType(opt.k)}
						className={cn(
							"h-10 rounded-[8px] border text-[13px] font-semibold",
							paymentType === opt.k
								? "border-[var(--color-teal)] bg-[var(--color-teal)] text-white"
								: "border-[var(--color-border)] bg-white text-[var(--color-ink)]",
						)}
					>
						{opt.l}
					</button>
				))}
			</div>

			{paymentType !== PaymentType.FULL ? (
				<div className="mt-5">
					<CurrencyInput label="VALOR PAGO" value={amount} onChange={setAmount} />
				</div>
			) : (
				<div className="mt-5 rounded-[8px] border border-[var(--color-success-bg)] bg-[var(--color-success-bg)] px-4 py-3 text-[13px] text-[var(--color-success-fg)]">
					Vamos quitar toda a dívida:{" "}
					<span className="tabular font-bold">
						<Money value={remaining} />
					</span>
				</div>
			)}

			{error ? (
				<div className="mt-5 rounded-[8px] border border-[var(--color-danger-bg)] bg-[var(--color-danger-bg)] px-4 py-3 text-[13px] text-[var(--color-danger-fg)]">
					{error}
				</div>
			) : null}
		</Modal>
	);
}
