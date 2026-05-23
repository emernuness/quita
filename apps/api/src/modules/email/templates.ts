/**
 * Templates HTML PT-BR. Plain HTML + inline CSS para compatibilidade
 * cross-client (Outlook/Gmail/Apple Mail). Sem React Email para evitar
 * dep extra — strings simples bastam para 3 emails MVP.
 */

const BASE_STYLES = `
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	max-width: 560px; margin: 0 auto; padding: 32px 24px;
	background: #f4f6f4; color: #1a2030;
`;
const CARD_STYLES = `
	background: white; border-radius: 12px; padding: 32px;
	box-shadow: 0 1px 3px rgba(0,0,0,0.05);
`;
const BUTTON_STYLES = `
	display: inline-block; background: #0a5248; color: white;
	padding: 12px 24px; border-radius: 8px;
	text-decoration: none; font-weight: 600; font-size: 14px;
`;
const FOOTER_STYLES = `
	margin-top: 24px; padding-top: 16px;
	border-top: 1px solid #e4e8e5;
	font-size: 12px; color: #5a6560;
`;

function layout(content: string): string {
	return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Quita</title></head>
<body style="${BASE_STYLES}">
	<div style="${CARD_STYLES}">
		<h1 style="margin: 0 0 16px; font-size: 24px; color: #0a5248;">Quita</h1>
		${content}
		<div style="${FOOTER_STYLES}">
			Quita — App de quitação de dívidas.<br>
			Você está recebendo este e-mail porque tem uma conta ativa em quita.com.br.<br>
			Em conformidade com a LGPD (Lei 13.709/2018). Para desativar comunicações,
			acesse Perfil → Notificações ou responda STOP.
		</div>
	</div>
</body>
</html>`;
}

export function welcomeEmail(input: { name: string; appUrl: string }): {
	subject: string;
	html: string;
	text: string;
} {
	const subject = `Bem-vindo ao Quita, ${input.name.split(" ")[0]}`;
	const html = layout(`
		<p style="font-size: 16px;">Oi <strong>${input.name.split(" ")[0]}</strong>,</p>
		<p>Sua conta está pronta. O Quita vai te ajudar a organizar as dívidas e montar
		um plano realista para sair delas.</p>
		<p><strong>O que fazer agora:</strong></p>
		<ol>
			<li>Complete o cadastro mínimo (3-5 min)</li>
			<li>Veja seu primeiro plano personalizado</li>
			<li>Acompanhe semanalmente — pequenas mudanças, grandes resultados</li>
		</ol>
		<p style="margin: 24px 0;">
			<a href="${input.appUrl}/app" style="${BUTTON_STYLES}">Acessar o app</a>
		</p>
		<p style="font-size: 13px; color: #5a6560;">
			Sem julgamento. Sem promessa mágica. Plano com base em dados.
		</p>
	`);
	const text = `Oi ${input.name.split(" ")[0]},

Sua conta no Quita está pronta. Acesse: ${input.appUrl}/app

1. Complete o cadastro mínimo (3-5 min)
2. Veja seu primeiro plano personalizado
3. Acompanhe semanalmente

Sem julgamento. Sem promessa mágica.`;

	return { subject, html, text };
}

export function passwordResetEmail(input: { name: string; resetUrl: string; ttlMinutes: number }): {
	subject: string;
	html: string;
	text: string;
} {
	const subject = "Recuperar senha — Quita";
	const html = layout(`
		<p>Oi <strong>${input.name.split(" ")[0]}</strong>,</p>
		<p>Recebemos um pedido para redefinir sua senha. Use o link abaixo:</p>
		<p style="margin: 24px 0;">
			<a href="${input.resetUrl}" style="${BUTTON_STYLES}">Redefinir senha</a>
		</p>
		<p style="font-size: 13px; color: #5a6560;">
			Link válido por <strong>${input.ttlMinutes} minutos</strong>.
			Se não foi você, ignore este e-mail — sua senha continua intacta.
		</p>
	`);
	const text = `Oi ${input.name.split(" ")[0]},

Para redefinir sua senha, acesse: ${input.resetUrl}

Link válido por ${input.ttlMinutes} minutos.
Se não foi você, ignore este e-mail.`;

	return { subject, html, text };
}

export function weeklyProgressEmail(input: {
	name: string;
	appUrl: string;
	progressPercent: number;
	paidThisWeek: number;
	nextDebtName: string;
}): { subject: string; html: string; text: string } {
	const subject = `Seu progresso esta semana — ${input.progressPercent}%`;
	const html = layout(`
		<p>Oi <strong>${input.name.split(" ")[0]}</strong>,</p>
		<p>Resumo da semana:</p>
		<ul>
			<li><strong>Progresso geral:</strong> ${input.progressPercent}%</li>
			<li><strong>Pago esta semana:</strong> R$ ${input.paidThisWeek.toFixed(2)}</li>
			<li><strong>Próxima dívida sugerida:</strong> ${input.nextDebtName}</li>
		</ul>
		<p style="margin: 24px 0;">
			<a href="${input.appUrl}/app/plan" style="${BUTTON_STYLES}">Ver plano completo</a>
		</p>
	`);
	const text = `Oi ${input.name.split(" ")[0]},

Resumo da semana:
- Progresso: ${input.progressPercent}%
- Pago: R$ ${input.paidThisWeek.toFixed(2)}
- Próxima dívida: ${input.nextDebtName}

Ver plano: ${input.appUrl}/app/plan`;

	return { subject, html, text };
}
