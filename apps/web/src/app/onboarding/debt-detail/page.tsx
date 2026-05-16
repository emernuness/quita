import { redirect } from "next/navigation";

// Etapa removida do wizard — cadastro detalhado de dívidas agora é feito dentro do app.
// Mantida como redirect para evitar 404 em links antigos.
export default function DebtDetailRedirect() {
	redirect("/onboarding/categories");
}
