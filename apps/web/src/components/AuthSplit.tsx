import Image from "next/image";
import Link from "next/link";

export function AuthSplit({
	children,
	title,
	subtitle,
	footer,
}: {
	children: React.ReactNode;
	title: string;
	subtitle?: string;
	footer?: React.ReactNode;
}) {
	return (
		<div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
			<div className="relative hidden flex-col justify-between overflow-hidden bg-[var(--color-teal)] px-12 py-12 text-white lg:flex">
				<Link href="/" aria-label="Quita" className="inline-block">
					<Image
						src="/brand/logo-03.png"
						alt="Quita"
						width={946}
						height={321}
						className="h-10 w-auto"
						priority
					/>
				</Link>

				<div className="max-w-[460px]">
					<div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">
						Organize. Quite. Respire.
					</div>
					<h2 className="mt-4 text-[44px] font-bold leading-[1.05] tracking-tight">
						Saia das dívidas sem adiar. Monte seu plano com clareza.
					</h2>
					<p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/75">
						O Quita reúne suas entradas, despesas e dívidas em um lugar só — sem jargão, sem
						julgamento.
					</p>
				</div>

				<div className="border-t border-white/15 pt-6 text-[13px] text-white/65">
					Seus dados ficam no seu próprio espaço — sem compartilhamento com terceiros.
				</div>
			</div>

			<div className="flex flex-col px-6 py-10 lg:px-16">
				<div className="lg:hidden">
					<Link href="/" aria-label="Quita">
						<Image
							src="/brand/logo-01.png"
							alt="Quita"
							width={946}
							height={321}
							className="h-9 w-auto"
							priority
						/>
					</Link>
				</div>

				<div className="my-auto w-full max-w-[440px] py-8">
					<h1 className="text-[28px] font-bold tracking-tight text-[var(--color-ink)]">{title}</h1>
					{subtitle ? (
						<p className="mt-2 text-[15px] text-[var(--color-ink-2)]">{subtitle}</p>
					) : null}
					<div className="mt-7">{children}</div>
					{footer ? (
						<div className="mt-7 text-[14px] text-[var(--color-ink-2)]">{footer}</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
