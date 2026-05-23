import { redirect } from "next/navigation";

// Charts agora vivem no /app dashboard.
export default function ChartsRedirect() {
	redirect("/app");
}
