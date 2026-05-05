---
title: "Fluxos de dados — dívidas, pagamentos, finanças"
tags: [data-flow, mobile, api, debts, payments, finance]
camadas: [ui, store, api, db]
---

# 12 · Fluxos de dados

> Como cada operação atravessa o app: tela → axios → endpoint NestJS → Prisma → Postgres → resposta envelope → render. Detalhes finos dos endpoints estão em [[04c-api-financial]] e [[04d-api-debts]] (responsabilidade de outro agente).

## Princípios comuns a todos os fluxos

- **Envelope canônico**: todas as respostas envelopadas em `{ success: true, data: ... }` (ver `ApiResponse<T>` em [[09-shared]]).
- **Validação dupla**: schema do `@quita/shared` roda no cliente (`validateWithZod`) e no servidor (`ZodValidationPipe`).
- **Token automático**: todo request sai com `Authorization: Bearer ...` injetado pelo request interceptor de [apps/mobile/src/services/api.ts](../../apps/mobile/src/services/api.ts) (ver [[11-fluxo-autenticacao]]).
- **Erro amigável**: qualquer falha vira mensagem em PT-BR via `extractMessage` (ver [[10-tratamento-erros]]).

## 1) Criação de dívida

```
[ (modals)/new-debt ] → POST /api/debts → DB → invalidate React Query → render em Hoje + Finanças/Dívidas
```

### Fluxo

1. Usuário toca "+" em [[07c-telas-tabs|Hoje]] ou no [[07d-telas-financas|Finanças → Dívidas]] e abre o modal `new-debt` em [[07f-telas-modais]].
2. Modal coleta: `categoryId`, `creditor`, `nature` (parcelado / recorrente / única), `totalAmount`, e campos opcionais conforme `nature` (`monthlyAmount`, `overdueMonths`, `totalInstallments`, `currentInstallment`, `hasInterest`, `dueDate`).
3. Cliente valida com `createDebtSchema` (ver [[09-shared#schemas-zod|schemas]]).
4. `POST /api/debts` com Bearer JWT. Backend valida de novo via `ZodValidationPipe` e cria a `Debt` no Postgres ([[03-banco-de-dados]]).
5. Resposta `{ success:true, data: Debt }`. React Query invalida queries: `["debts"]`, `["debts", "today"]`, `["plan"]`, `["summary"]`.
6. Telas re-renderizam:
   - **Hoje** ([[07c-telas-tabs]]) — passa a listar a dívida se ela tiver `dueDate` no dia ou estar `overdue`.
   - **Finanças → Dívidas** ([[07d-telas-financas]]) — entra na lista, atualiza progresso geral.
7. Limite do plano free (`FREE_DEBT_LIMIT = 3`, [[09-shared#constants]]) deve ser verificado pelo backend antes de criar a 4ª dívida.

### Endpoint detalhado

Ver [[04d-api-debts]] para shape exato de request/response.

## 2) Registrar pagamento

```
[ (modals)/pay-debt ] → POST /api/debts/:id/payments → recalcula plano → atualiza Debt + Payment + Plan
```

### Fluxo

1. Usuário toca em uma dívida → abre modal `pay-debt` ([[07f-telas-modais]]).
2. Modal pede: `amount`, `paymentType` (`full` / `partial` / `renegotiated`), `paidAt?` (default agora).
3. Cliente valida com `createPaymentSchema` ([[09-shared]]).
4. `POST /api/debts/:id/payments`. Backend deve:
   - Criar registro `Payment` (com `canUndoUntil = now + PAYMENT_UNDO_WINDOW_HOURS` — 24h).
   - Atualizar `Debt.amountPaid` e potencialmente `status` (→ `paid` se quitada).
   - Atualizar contadores no `PaymentPlan` ativo (`paidDebtsCount`, `progressPercent`, `allPaid`).
   - Atualizar `UserJourneyStats.totalDebtsCleared` quando aplicável.
5. Resposta envelope `{ success:true, data: { payment, debt } }`.
6. React Query invalida `["debts"]`, `["debts", :id]`, `["plan"]`, `["payments"]`, `["summary"]`.
7. Telas afetadas:
   - **Hoje** ([[07c-telas-tabs]]) — remove a dívida da lista ou marca como quitada.
   - **Finanças → Dívidas** — atualiza barra de progresso.
   - **Plano** ([[07e-telas-plano|07e-telas-plano]]) — `PlanTimelineItem` correspondente vira `completed`.
8. Janela de 24h para desfazer (`canUndoUntil`) — exposto em UI de detalhes do pagamento.

### Endpoint detalhado

Ver [[04d-api-debts]] (sub-rotas de pagamento).

## 3) Receitas e despesas → summary

### Receitas (`Income`)

```
[ Finanças → Receitas ] (CRUD) → /api/incomes → Postgres
                                                 ↓
                              GET /api/financial/summary → Hoje / Finanças
```

1. Cadastro em [[07d-telas-financas|Finanças → Receitas]]: `name`, `amount`, `type` (`fixed`/`one_time`/`recurring`), `dueDate?`, `installments?`, `installmentAmount?`, `sourceCategory` (`salary`/`extra`/`help`/`other`).
2. Validação com `createIncomeSchema`. Backend persiste com `userId` derivado do JWT.
3. Edit usa `updateIncomeSchema` (partial). Soft-disable via `isActive`.

### Despesas (`Expense`)

Análogo às receitas, com `category` ∈ `housing/bills/food/transport/telecom/other` (`createExpenseSchema`). Labels traduzidas em `EXPENSE_CATEGORY_LABELS` ([[09-shared#constants]]).

### Cálculo do summary

O backend (módulo financial — ver [[04c-api-financial]]) agrega:

```
monthlyIncome   = Σ Income.amount onde isActive
monthlyExpenses = Σ Expense.amount onde isActive
monthlyDebts    = Σ Debt.monthlyAmount onde status ∈ {on_time, overdue}
monthlyAvailable = monthlyIncome − monthlyExpenses − monthlyDebts
```

Esses valores alimentam:

- **Hoje** ([[07c-telas-tabs]]) — métric cards "Disponível este mês", "Total de dívidas".
- **Finanças** ([[07d-telas-financas]]) — visão consolidada.
- **Plano** ([[07e-telas-plano]]) — `PaymentPlan.monthlyAvailable` é congelado no momento da geração.

## 4) Geração de plano (visão de alto nível)

1. Usuário aciona "Gerar plano" → `POST /api/plan/generate` com `strategy` (`smallest_first` / `highest_interest` / `custom`).
2. Backend cria `PaymentPlan` ativo (desativa o anterior) + `PlanTimelineItem` por dívida, ordenados conforme `strategy`.
3. Limites: `FREE_PLAN_GENERATIONS_PER_MONTH = 2` para free, `PREMIUM_PLAN_COOLDOWN_HOURS = 1` para premium ([[09-shared#constants]]).
4. UI de [[07e-telas-plano]] consome `GET /api/plan/active` e renderiza timeline.

## 5) Onboarding alimenta tudo

Schemas em [packages/shared/src/schemas/onboarding.ts](../../packages/shared/src/schemas/onboarding.ts):

| Etapa | Schema | Resultado |
| --- | --- | --- |
| Renda | `onboardingIncomeSchema` (`salary` obrigatório, `extra?`, `help?`) | cria `Income` (`type:fixed`, `sourceCategory:salary/extra/help`) |
| Categorias de dívida | `onboardingDebtCategoriesSchema` | só seleção; nada persistido até a próxima etapa |
| Dívidas | `onboardingDebtSchema` (uma por vez) | cria `Debt` |
| Despesas | `onboardingExpensesSchema` (`housing?`, `bills?`, `food?`, `transport?`, `telecom?`) | cria `Expense` por categoria com valor > 0 |

Ao completar, `User.onboardingCompleted = true` e `onboardingStep = N` final. Próximo boot pula direto para `(tabs)` graças ao `loadToken`/`AuthInit` ([[11-fluxo-autenticacao]]).

## Mapa rápido — quem fala com quem

| Tela | Endpoint principal | Tabela primária |
| --- | --- | --- |
| `(tabs)/index` (Hoje) | `GET /api/dashboard/today`, `GET /api/financial/summary` | `Debt`, `Payment`, agregações |
| `(tabs)/financas/index` | `GET /api/financial/summary` | agregação |
| `(tabs)/financas/dividas` | `GET /api/debts` | `Debt` |
| `(tabs)/financas/receitas` | `GET/POST/PATCH /api/incomes` | `Income` |
| `(tabs)/financas/despesas` | `GET/POST/PATCH /api/expenses` | `Expense` |
| `(modals)/new-debt` | `POST /api/debts` | `Debt` |
| `(modals)/pay-debt` | `POST /api/debts/:id/payments` | `Payment`, `Debt`, `PaymentPlan` |
| `(tabs)/plano` | `GET /api/plan/active`, `POST /api/plan/generate` | `PaymentPlan`, `PlanTimelineItem` |

## Notas relacionadas

- [[03-banco-de-dados]]
- [[04-api-overview]]
- [[04c-api-financial]]
- [[04d-api-debts]]
- [[07c-telas-tabs]]
- [[07d-telas-financas]]
- [[07e-telas-plano]]
- [[07f-telas-modais]]
- [[09-shared]]
- [[10-tratamento-erros]]
- [[11-fluxo-autenticacao]]
