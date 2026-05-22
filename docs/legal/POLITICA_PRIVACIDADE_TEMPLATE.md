# Política de Privacidade — Template (rascunho jurídico)

> **Status:** rascunho técnico, NÃO substitui revisão por advogado fintech especializado em LGPD.
> Esta versão serve como ponto de partida da Onda 6 (beta privado). Antes do release público, o
> texto final deve ser produzido por advogado contratado conforme checklist da Fase 6 §13.7.

## 1. Quem somos
Quita ([CNPJ a inserir]), motor de decisão financeira para pessoas endividadas operando no Brasil.
Controlador dos dados pessoais nos termos do art. 5º, VI, da LGPD (Lei 13.709/2018).

## 2. Encarregado (DPO)
- Nome: [a definir]
- Contato: privacidade@quita.com.br

## 3. Dados coletados

| Categoria | Exemplo | Finalidade | Base legal LGPD |
|---|---|---|---|
| Identificação | Nome, e-mail, telefone | Cadastro e autenticação | Execução de contrato (art. 7º, V) |
| Localização | UF, cidade, dependentes | Cálculo do mínimo vital regional | Execução de contrato |
| Financeiros | Rendas, despesas, dívidas, pagamentos | Operar o motor de decisão | Execução de contrato |
| Auditoria | IP, user-agent, eventos de login | Segurança e antifraude | Legítimo interesse (art. 7º, IX) |
| Comportamentais | Estratégia preferida, metas | Personalizar plano | Consentimento (art. 7º, I) |

## 4. Compartilhamento
- Provedores de infra (Supabase, Railway, Vercel, Resend, Sentry, PostHog) — todos com DPA válidos.
- Stripe Connect Brasil — pagamentos da assinatura Premium.
- OpenAI (gpt-4o-mini) — OCR de boletos/contratos, com retenção zero acordada.
- **Nunca**: corretores de dados, parceiros de marketing externos, instituições financeiras sem ordem judicial.

## 5. Retenção
- Dados ativos: enquanto a conta existir.
- Dados financeiros após exclusão: 5 anos (CDC, art. 27) anonimizados para auditoria.
- Auth audit logs: 12 meses.
- Backups: 30 dias.

## 6. Direitos do titular
Conforme art. 18 da LGPD: confirmação, acesso, correção, anonimização, portabilidade, eliminação,
revogação de consentimento, oposição. Canal: privacidade@quita.com.br (resposta em até 15 dias).

## 7. Segurança
- Senhas com bcrypt rounds=12 (ADR-0003).
- Tokens de sessão em cookies httpOnly + Secure + SameSite=Lax (ADR-0001).
- TLS 1.2+ obrigatório em produção.
- Logs e métricas sem PII (redação automática de cookies, headers e senhas).
- AuthAuditLog rastreia logins, refresh e tentativas de fraude (ADR retroativo).

## 8. Versionamento
Versão atual: 0.1 — rascunho beta privado.

---

**Pré-deploy público (Fase 6 §13.7):**
- [ ] Revisão por advogado fintech contratado.
- [ ] RIPD (Relatório de Impacto à Proteção de Dados) anexado.
- [ ] DPO formalmente designado (ata interna até 1k users, terceirizado acima).
- [ ] Aceite versionado registrado em `consent_logs` por usuário.
