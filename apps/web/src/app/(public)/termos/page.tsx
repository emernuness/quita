import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Termos de Uso — Quita",
	description: "Termos de Uso da plataforma Quita (v1.0.0). LGPD compliant.",
};

export default function TermosPage() {
	return (
		<article className="prose prose-sm max-w-none text-[var(--color-ink)]">
			<div className="mb-8 rounded-[12px] border border-[var(--color-warning-bg)] bg-[var(--color-warning-bg)] p-5 text-[14px] text-[var(--color-warning-fg)]">
				<strong>Template inicial — revisão jurídica pendente.</strong>
				<p className="mt-1 text-[13px]">
					Este documento é uma versão preliminar (v1.0.0) elaborada para conformidade técnica
					mínima. A revisão por advogado especializado está rastreada na issue{" "}
					<a
						href="https://github.com/emernuness/quita/issues"
						className="underline"
						target="_blank"
						rel="noreferrer"
					>
						legal-review
					</a>
					.
				</p>
			</div>

			<h1 className="text-[28px] font-bold">Termos de Uso</h1>
			<p className="text-[14px] text-[var(--color-ink-2)]">
				Versão 1.0.0 — atualizado em{" "}
				{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
			</p>

			<h2 className="mt-8 text-[20px] font-semibold">1. Aceitação</h2>
			<p>
				Ao criar uma conta no Quita, você concorda com estes Termos e com nossa Política de
				Privacidade. Se discordar, não use o serviço.
			</p>

			<h2 className="mt-6 text-[20px] font-semibold">2. O serviço</h2>
			<p>
				Quita é uma plataforma de organização financeira pessoal e plano de quitação de dívidas. Não
				somos instituição financeira, não emprestamos dinheiro, não cobramos dívidas em nome de
				terceiros e não fornecemos consultoria financeira regulamentada.
			</p>

			<h2 className="mt-6 text-[20px] font-semibold">3. Cadastro e conta</h2>
			<ul className="list-disc pl-6">
				<li>Você deve ter 18 anos ou mais.</li>
				<li>Informações cadastrais devem ser verdadeiras e atualizadas.</li>
				<li>Você é responsável por manter sua senha em segurança.</li>
				<li>Notifique-nos imediatamente sobre uso não autorizado da conta.</li>
			</ul>

			<h2 className="mt-6 text-[20px] font-semibold">4. Uso aceitável</h2>
			<p>Você concorda em NÃO:</p>
			<ul className="list-disc pl-6">
				<li>Usar o serviço para fins ilícitos ou contra terceiros</li>
				<li>Tentar acessar dados de outros usuários</li>
				<li>Fazer engenharia reversa, scrape ou automação não autorizada</li>
				<li>Inserir dados falsos ou enganosos sobre dívidas ou rendas</li>
			</ul>

			<h2 className="mt-6 text-[20px] font-semibold">5. Plano Premium</h2>
			<p>
				Recursos pagos (como OCR de propostas e simulações avançadas) são oferecidos por assinatura
				mensal/anual via Stripe. Cancelamento a qualquer momento; sem reembolso de período já pago,
				salvo exceções legais.
			</p>

			<h2 className="mt-6 text-[20px] font-semibold">6. Limitação de responsabilidade</h2>
			<p>
				As recomendações do Quita são baseadas em dados informados por você e em parâmetros
				configuráveis. A decisão financeira final é sua. Não nos responsabilizamos por consequências
				diretas ou indiretas de decisões tomadas com base no app, especialmente em situações de
				superendividamento (Lei 14.181/2021), onde recomendamos buscar Defensoria Pública, Procon ou
				CRAS.
			</p>

			<h2 className="mt-6 text-[20px] font-semibold">7. Suspensão e encerramento</h2>
			<p>
				Podemos suspender ou encerrar contas que violem estes Termos, com aviso prévio quando
				possível. Você pode encerrar sua conta a qualquer momento pelo painel de Perfil; dados são
				retidos por 30 dias (LGPD) antes de apagamento definitivo.
			</p>

			<h2 className="mt-6 text-[20px] font-semibold">8. Modificações</h2>
			<p>
				Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas por e-mail e exigirão
				novo aceite no próximo login.
			</p>

			<h2 className="mt-6 text-[20px] font-semibold">9. Foro</h2>
			<p>Foro da comarca do domicílio do usuário-consumidor, conforme CDC Art. 101 I.</p>

			<h2 className="mt-6 text-[20px] font-semibold">10. Contato</h2>
			<p>
				Dúvidas:{" "}
				<a href="mailto:contato@quita.com.br" className="text-[var(--color-teal)] underline">
					contato@quita.com.br
				</a>
			</p>
		</article>
	);
}
