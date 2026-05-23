import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Política de Privacidade — Quita",
	description: "Política de Privacidade da plataforma Quita (v1.0.0). LGPD compliant.",
};

export default function PrivacidadePage() {
	return (
		<article className="prose prose-sm max-w-none text-[var(--color-ink)]">
			<div className="mb-8 rounded-[12px] border border-[var(--color-warning-bg)] bg-[var(--color-warning-bg)] p-5 text-[14px] text-[var(--color-warning-fg)]">
				<strong>Template inicial — revisão jurídica pendente.</strong>
				<p className="mt-1 text-[13px]">
					Este documento é uma versão preliminar (v1.0.0). Revisão por advogado especializado em
					LGPD está rastreada na issue{" "}
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

			<h1 className="text-[28px] font-bold">Política de Privacidade</h1>
			<p className="text-[14px] text-[var(--color-ink-2)]">
				Versão 1.0.0 — atualizado em{" "}
				{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
			</p>

			<h2 className="mt-8 text-[20px] font-semibold">1. Controlador dos dados</h2>
			<p>
				Quita (CNPJ a ser informado), com sede no Brasil. Contato do Encarregado (DPO):{" "}
				<a href="mailto:privacidade@quita.com.br" className="text-[var(--color-teal)] underline">
					privacidade@quita.com.br
				</a>
			</p>

			<h2 className="mt-6 text-[20px] font-semibold">2. Dados coletados</h2>
			<ul className="list-disc pl-6">
				<li>
					<strong>Cadastrais:</strong> nome, e-mail, UF, número de dependentes
				</li>
				<li>
					<strong>Financeiros (você informa):</strong> rendas, dívidas, despesas, metas, perfil
					comportamental
				</li>
				<li>
					<strong>Imagens OCR (Premium, opcional):</strong> fotos de propostas de acordo para
					extração via IA — retenção 30 dias, apagamento automático
				</li>
				<li>
					<strong>Técnicos:</strong> IP, user-agent, eventos de login/logout (audit log de
					segurança), dispositivos
				</li>
				<li>
					<strong>Pagamento:</strong> dados de cartão NÃO ficam conosco — processados via Stripe
				</li>
			</ul>

			<h2 className="mt-6 text-[20px] font-semibold">3. Bases legais (LGPD Art. 7º)</h2>
			<ul className="list-disc pl-6">
				<li>
					<strong>Execução de contrato (II):</strong> dados cadastrais e financeiros para entregar o
					plano
				</li>
				<li>
					<strong>Cumprimento de obrigação legal (V):</strong> retenção de logs de auditoria
					obrigatória
				</li>
				<li>
					<strong>Exercício regular de direitos (VI):</strong> defesa em processos judiciais
				</li>
				<li>
					<strong>Consentimento (IX):</strong> OCR Premium, comunicações de marketing, processamento
					por IA (OpenAI)
				</li>
			</ul>

			<h2 className="mt-6 text-[20px] font-semibold">4. Compartilhamento</h2>
			<p>NÃO vendemos seus dados. Compartilhamos apenas com:</p>
			<ul className="list-disc pl-6">
				<li>
					<strong>Processadores:</strong> Stripe (pagamento), Resend (e-mail transacional), OpenAI
					(OCR opcional, sem treino com seus dados), Cloudflare R2 (storage), Sentry (erros),
					PostHog (analytics anônimas)
				</li>
				<li>
					<strong>Autoridades:</strong> mediante ordem judicial ou solicitação legal fundamentada
				</li>
			</ul>

			<h2 className="mt-6 text-[20px] font-semibold">5. Armazenamento</h2>
			<p>
				Dados primários ficam no Brasil (banco PostgreSQL gerenciado). Processadores estrangeiros
				(Stripe US, OpenAI US) recebem apenas dados necessários para a função contratada, com
				cláusulas de transferência internacional (LGPD Art. 33).
			</p>

			<h2 className="mt-6 text-[20px] font-semibold">6. Retenção</h2>
			<ul className="list-disc pl-6">
				<li>Conta ativa: enquanto vigente</li>
				<li>Após exclusão: 30 dias (soft-delete), depois apagamento definitivo</li>
				<li>Logs de auditoria: 12 meses (segurança)</li>
				<li>Imagens OCR: 30 dias após upload</li>
			</ul>

			<h2 className="mt-6 text-[20px] font-semibold">7. Seus direitos (LGPD Art. 18)</h2>
			<p>
				Você pode, a qualquer momento, em <strong>Perfil → Privacidade</strong>:
			</p>
			<ul className="list-disc pl-6">
				<li>Confirmar existência de tratamento</li>
				<li>Acessar seus dados (export JSON/CSV)</li>
				<li>Corrigir dados incompletos/inexatos</li>
				<li>Anonimizar, bloquear ou eliminar dados desnecessários</li>
				<li>Portar para outro fornecedor</li>
				<li>Eliminar dados tratados com consentimento</li>
				<li>Revogar consentimento</li>
			</ul>

			<h2 className="mt-6 text-[20px] font-semibold">8. Segurança</h2>
			<ul className="list-disc pl-6">
				<li>Conexão criptografada (HTTPS/TLS)</li>
				<li>Senhas com bcrypt (cost 12)</li>
				<li>Cookies httpOnly + secure + sameSite=strict</li>
				<li>Rate limiting + auditoria de tentativas de login</li>
				<li>Tokens de refresh rotativos com detecção de reuso</li>
			</ul>

			<h2 className="mt-6 text-[20px] font-semibold">9. Crianças</h2>
			<p>
				Serviço destinado a maiores de 18 anos. Não coletamos intencionalmente dados de menores.
			</p>

			<h2 className="mt-6 text-[20px] font-semibold">10. Reclamações</h2>
			<p>
				Tente primeiro o canal direto:{" "}
				<a href="mailto:privacidade@quita.com.br" className="text-[var(--color-teal)] underline">
					privacidade@quita.com.br
				</a>
				. Persistindo, registre na ANPD (
				<a
					href="https://www.gov.br/anpd/pt-br"
					className="text-[var(--color-teal)] underline"
					target="_blank"
					rel="noreferrer"
				>
					gov.br/anpd
				</a>
				).
			</p>
		</article>
	);
}
