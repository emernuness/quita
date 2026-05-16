import { redirect } from "next/navigation";

// Rota legada — substituída por /app/transactions + /app/debts.
export default function FinancesRedirect() {
	redirect("/app/transactions");
}
