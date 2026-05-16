"use client";

import { ChevronRightIcon, PlusIcon, TrendingDownIcon, TrendingUpIcon } from "@/components/Icons";
import { Modal } from "@/components/Modal";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NewDebtModal } from "./NewDebtModal";
import { NewExpenseModal } from "./NewExpenseModal";
import { NewIncomeModal } from "./NewIncomeModal";

const ITEMS = [
	{ key: "income", label: "Nova entrada", desc: "Salário, bico, ajuda", icon: TrendingUpIcon },
	{ key: "expense", label: "Nova despesa", desc: "Conta fixa ou variável", icon: TrendingDownIcon },
	{ key: "debt", label: "Nova dívida", desc: "Cobrança a quitar", icon: PlusIcon },
] as const;

export function NewItemPickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
	const router = useRouter();
	const [picked, setPicked] = useState<"income" | "expense" | "debt" | null>(null);

	function close() {
		setPicked(null);
		onClose();
	}

	return (
		<>
			<Modal
				open={open && picked === null}
				onClose={close}
				title="O que você quer adicionar?"
				size="md"
			>
				<div className="flex flex-col gap-2">
					{ITEMS.map((it) => (
						<button
							key={it.key}
							type="button"
							onClick={() => setPicked(it.key)}
							className="flex items-center gap-4 rounded-[12px] border border-[var(--color-border)] bg-white px-5 py-4 text-left transition-colors hover:border-[var(--color-teal)]"
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[var(--color-teal)]/8 text-[var(--color-teal)]">
								<it.icon size={20} />
							</div>
							<div className="flex-1">
								<div className="text-[15px] font-semibold text-[var(--color-ink)]">{it.label}</div>
								<div className="text-[13px] text-[var(--color-ink-2)]">{it.desc}</div>
							</div>
							<ChevronRightIcon size={18} />
						</button>
					))}
				</div>
			</Modal>

			<NewIncomeModal open={picked === "income"} onClose={close} />
			<NewExpenseModal open={picked === "expense"} onClose={close} />
			<NewDebtModal open={picked === "debt"} onClose={close} />
		</>
	);
}
