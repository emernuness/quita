import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-6">
			<Card className="max-w-[480px] p-8 text-center">
				<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-info-bg)]">
					<Compass className="h-6 w-6 text-[var(--color-info-fg)]" />
				</div>
				<h1 className="text-[20px] font-semibold mb-2">Página não encontrada</h1>
				<p className="text-[14px] text-[var(--color-ink-2)] mb-6">
					A página que você procurou não existe ou foi movida.
				</p>
				<div className="flex justify-center gap-3">
					<Link href="/app">
						<Button>Ir ao painel</Button>
					</Link>
					<Link href="/">
						<Button variant="ghost">Voltar ao início</Button>
					</Link>
				</div>
			</Card>
		</div>
	);
}
