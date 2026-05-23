import Image from "next/image";
import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col bg-[var(--color-background)]">
			<header className="border-b border-[var(--color-border)] bg-white">
				<div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4">
					<Link href="/" className="flex items-center gap-2">
						<Image src="/logo.svg" alt="Quita" width={32} height={32} priority />
						<span className="text-[16px] font-semibold text-[var(--color-ink)]">Quita</span>
					</Link>
					<nav className="flex items-center gap-5 text-[14px]">
						<Link href="/login" className="text-[var(--color-ink-2)] hover:text-[var(--color-ink)]">
							Entrar
						</Link>
						<Link
							href="/register"
							className="rounded-[8px] bg-[var(--color-teal)] px-4 py-2 font-semibold text-white hover:opacity-90"
						>
							Criar conta
						</Link>
					</nav>
				</div>
			</header>
			<main className="mx-auto w-full max-w-[820px] flex-1 px-6 py-12">{children}</main>
			<footer className="border-t border-[var(--color-border)] bg-white">
				<div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-6 py-6 text-[12px] text-[var(--color-ink-3)] md:flex-row md:items-center md:justify-between">
					<div>© {new Date().getFullYear()} Quita — todos os direitos reservados.</div>
					<nav className="flex gap-4">
						<Link href="/termos" className="hover:text-[var(--color-ink)]">
							Termos de Uso
						</Link>
						<Link href="/privacidade" className="hover:text-[var(--color-ink)]">
							Privacidade
						</Link>
					</nav>
				</div>
			</footer>
		</div>
	);
}
