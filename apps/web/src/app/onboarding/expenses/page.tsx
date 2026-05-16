import { redirect } from "next/navigation";

// Etapa removida do wizard — despesas fixas agora são cadastradas dentro do app.
// Mantida como redirect para evitar 404 em links antigos.
export default function ExpensesRedirect() {
	redirect("/app");
}
