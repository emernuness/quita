# Advogado do Diabo — Revisão Comercial

**Branch:** `refactor/onda-1-foundation`
**Data:** 2026-05-22
**Veredito original:** NÃO PRONTO PARA COMERCIAL — 3 Critical + 7 High + 7 Medium

Veja `ADVOGADO_DO_DIABO_FIXES.md` para o conjunto de fixes aplicados.

## Críticos (C-01..C-03) — aplicados

- C-01 Stripe rawBody → `NestFactory.create(AppModule, { rawBody: true })` + `RawBodyRequest<Request>`.
- C-02 persistPlan sem transação → tudo em `prisma.$transaction` + `createMany` para ações.
- C-03 planExpiresAt errado → buscar `subscription.current_period_end`.

## High (H-01..H-07) — aplicados

- H-01 health endpoint → `GET /api/health`.
- H-02 graceful shutdown → SIGTERM handler + PostHog flush + Sentry close.
- H-03 Zod validation checkout → `checkoutSessionSchema`.
- H-04 bcrypt rounds profile → usa `BCRYPT_ROUNDS = 12`.
- H-05 OCR tipos discriminados → schemas por tipo + union retorno.
- H-06 downgrade webhooks → `stripeCustomerId` no User + downgrade em `subscription.deleted` e `invoice.payment_failed` (após N retries).
- H-07 batch persist → `createMany` + `Promise.all` para updates.

## Medium (M-01..M-07) — aplicados

- M-01 REFRESH_TOKEN_HMAC_SECRET length em prod.
- M-02 throttle no logout.
- M-03 throttle no motor.recalculate (3 req/min/user).
- M-04 smoothing-rule integrado: orchestrator busca FinancialStateSnapshot e persiste.
- M-05 phone regex em updateProfileSchema.
- M-06 OCR não loga input.imageBase64 (comentário explícito).
- M-07 deletedAt removido do schema (sem uso real).

## Pontos elogiados

- Auth flow sólido (rotação atômica + reuse detection).
- Motor puro testável.
- LGPD hard delete com anonimização prévia.
- Sanitização de logs.
- Validação Zod consistente.
