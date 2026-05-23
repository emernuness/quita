import { redirect } from "next/navigation";

// Rota legada — o picker de "novo item" agora é aberto direto pela Sidebar.
// Mantido apenas como redirecionamento para evitar 404 em links antigos.
export default function NewItemRedirect() {
	redirect("/app");
}
