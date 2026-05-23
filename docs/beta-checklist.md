# Beta Privado — Checklist Onda 6

15 testers convidados. Beta dura ~4 semanas. Objetivo: validar motor + cobrir UX rough edges
antes do launch público.

## Pré-beta (1 semana antes)

### Legais
- [ ] Política de Privacidade publicada em `/privacidade` (template revisado por advogado).
- [ ] Termos de Uso publicados em `/termos` (cláusula de não-aconselhamento destacada).
- [ ] Aceite versionado registrado em `consent_logs` no signup.
- [ ] DPO designado e canal `privacidade@quita.com.br` operacional.

### Infra
- [ ] Domain `quita.com.br` configurado + SSL.
- [ ] Vercel projeto `quita-web` apontando para `main`.
- [ ] Railway projeto `quita-api` + Postgres prod + Redis prod.
- [ ] Sentry projetos `quita-api` e `quita-web` recebendo eventos.
- [ ] PostHog projeto + feature flags `beta-only`, `premium-features` criadas.
- [ ] Resend domain validado (DKIM, SPF, DMARC).
- [ ] Backups Postgres diários ativados.

### Aplicação
- [ ] Migration `0001_init` rodada em prod (drop+recreate autorizado por Emerson).
- [ ] Seeds: `DebtCategory`, `RegionalMinimumVital`, `InterestRateReference`, `SupportChannel`, `ScoringWeight`.
- [ ] Smoke test E2E manual: signup → onboarding crítico → plano gerado.
- [ ] Feature flag `beta_only` bloqueia signup público (whitelist por email).
- [ ] Health check `/api/health` retornando 200.
- [ ] Throttler limites confirmados em prod.

### Suporte
- [ ] Canal Discord/Slack privado para testers.
- [ ] Email `suporte@quita.com.br` configurado com SLA de 24h em dias úteis.
- [ ] Runbook on-call (docs/runbook.md) revisado.

## Durante o beta

- [ ] Daily check de Sentry (errors novos).
- [ ] Weekly: review de PostHog (funnel signup→onboarding→plano).
- [ ] Backlog dedicado de bugs do beta em GitHub label `beta-feedback`.
- [ ] Sessões 1:1 com 5 testers no fim da semana 2.

## Saída do beta (gate p/ Onda 7)

- [ ] Zero P0 abertos > 48h.
- [ ] Funnel signup→plano > 60%.
- [ ] NPS internado dos 15 testers >= 30.
- [ ] Comunicação de launch preparada (LP, copy aquisição, post-mortem do beta).
