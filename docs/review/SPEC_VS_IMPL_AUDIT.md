# Auditoria Spec vs Implementação

**Branch:** `refactor/onda-1-foundation`
**Data:** 2026-05-22
**Conformidade estimada:** ~62%
**Itens críticos ausentes:** 6
**Itens altos:** 3
**Itens médios:** 3

---

## Críticos

### C-A1 — Threshold `tight_budget` 15% vs 10% da spec
- **Spec:** Fase 1 §4.2 — folga ≤ 10% → `tight_budget`
- **Impl:** `packages/motor/src/state-classifier.ts:43` — `TIGHT_BUDGET_RATIO = 0.15`
- **Impacto:** usuários com folga 10–15% recebem plano `payoff` quando deveriam ser `stabilization`. Recomendações mais agressivas do que projetado.

### C-A2 — Nenhum BullMQ processor implementado
- **Spec:** Fase 4 §7.5 — 8 processors (RecalculateState, MonthlyRollover, DataFreshnessReview, DataRetentionCleanup, SettlementRevalidation, LongTermPlanGeneration, InterestRateUpdate, RecalculateAllScores)
- **Impl:** apenas filas registradas (`apps/api/src/queues/queue.module.ts`). Zero processors.
- **Impacto:** sem rollover mensal, sem cleanup LGPD, sem update BCB, sem revalidação de acordos. Motor só-sob-demanda síncrono.

### C-A3 — Schemas Zod v2 ausentes em `@quita/shared`
- **Spec:** Fase 2 §5 — `incomeInputSchema`, `expenseInputSchema`, `debtInputSchema` com campos v2
- **Impl:** schemas legados em `packages/shared/src/schemas/{income,expense,debt}.ts` sem `guaranteedAmount`, `stabilityType`, `frequency`, `monthlyProvision`, `daysOverdue`, `dataConfidence`
- **Impacto:** colunas novas do schema Prisma inacessíveis via API validada.

### C-A4 — Soft delete ausente no `User`
- **Spec:** Fase 1 §2 princípio 8 + Fase 3 §16 (retenção 30 dias)
- **Impl:** `apps/api/prisma/schema.prisma` — sem `deletedAt`. Removido na migration 0002 (decisão minha que diverge da spec).
- **Impacto:** política LGPD de 30 dias antes de hard delete não implementável. Risco legal.

### C-A5 — Campos OCR ausentes em `SettlementEvaluation`
- **Spec:** Bridge §8 — `usedOcr`, `ocrImageUrl`, `ocrExtractedData`, `ocrConfidence`
- **Impl:** schema sem esses campos. Endpoint `POST /settlements/validate-from-image` não existe.
- **Impacto:** OCR Premium funcionalmente vazio. `OcrService` isolado de `settlement-validator`.

### C-A6 — Fallback `InterestRateReference` ausente no orquestrador
- **Spec:** Fase 3 §6.3 — `interestRateRepo.findActiveByCategory` quando user não declara
- **Impl:** `motor-orchestrator.service.ts:147-151` passa null direto, sem lookup.
- **Impacto:** dívidas sem juros declarado têm fator `juros_mensal_normalizado` zerado, subestimando prioridade.

---

## Altos

### H-A1 — Campos obsoletos não removidos
- **Spec:** Fase 2 §2.5 e §2.6 — remover `smallest_first`, `highest_interest`, `custom` (PlanStrategy); `overdueMonths`, `priorityOrder` (Debt)
- **Impl:** todos permanecem no schema; `PaymentPlan.strategy` ainda usa `default(smallest_first)`.

### H-A2 — Clamp `max(5% renda, R$ 100)` ausente na reserva operacional
- **Spec:** Fase 1 §4.2
- **Impl:** `capacity-calculator.ts:37-38` — apenas `incomeNetMonthly * ratio`, sem min R$ 100.
- **Impacto:** rendas muito baixas inflam capacidade artificialmente.

### H-A3 — Anti-whiplash extremo ausente na smoothing-rule
- **Spec:** Fase 3 §7.5 — salto > 1 rank deve descer apenas 1 nível
- **Impl:** `smoothing-rule.ts:76-85` — permite salto de qualquer amplitude após confirmação.

---

## Médios

### M-A1 — ~19 das 30 telas da Fase 5 ausentes
Ausentes: Plano do Mês principal, Validador de Acordo + sub-telas OCR, Refinamento Progressivo (C1-C7), tela Privacidade LGPD, Modo Crise, Apoio, Modo Proteção/Sobrevivência específicas, Espelho, Objetivos, Provisão sazonal, Reserva de emergência.

### M-A2 — Route groups `(auth)/(onboarding)/(app)` não adotados
Estrutura `apps/web/src/app/` usa diretórios simples ao invés do padrão Next 15 route groups da spec.

### M-A3 — CSP desabilitado em Helmet sem ADR
`main.ts:36` — `contentSecurityPolicy: false`. Frontend tem CSP via `next.config.mjs`, backend não cobre o Swagger `/api/docs`.

---

## Itens fora da auditoria que estão ok

- `survival` nunca gera pay/negotiate (testado)
- 12 módulos motor implementados (1 ausente: long-term-plan)
- 12 ADRs documentados
- Stripe completo (checkout + 4 webhooks)
- Helmet, throttler, CORS restrito, cookie-parser
- Sentry + PostHog + Resend SDKs reais
- Seeds 5 tabelas referência
- Migrations 0001 + 0002 aplicadas

---

## Recomendação executiva

Antes de declarar conformidade com a spec e avançar para beta privado, 5 itens críticos devem ser resolvidos:

1. Threshold `tight_budget` 15% → 10% (1 linha)
2. Implementar 3 processors BullMQ críticos: RecalculateState, MonthlyRollover, DataRetentionCleanup (LGPD)
3. Re-adicionar `deletedAt` em `User` + implementar soft-delete real
4. Atualizar schemas Zod v2 em `@quita/shared`
5. Remover campos obsoletos do schema (`smallest_first`/etc, `overdueMonths`, `priorityOrder`)
