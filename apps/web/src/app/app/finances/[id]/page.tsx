import { redirect } from "next/navigation";

interface Props {
	params: Promise<{ id: string }>;
}

// Detalhe de dívida agora vive em /app/debts/[id].
export default async function FinancesIdRedirect({ params }: Props) {
	const { id } = await params;
	redirect(`/app/debts/${id}`);
}
