---
title: Enums do Schema
tags: [banco-de-dados, prisma, enums]
updated: 2026-05-04
---

# Enums Prisma

Todos os enums declarados em `apps/api/prisma/schema.prisma`. Cada enum vira um tipo nativo no Postgres. Os mesmos valores são espelhados em `packages/shared/src/enums/index.ts` no padrão `as const` (sem TS enums) — ver [[09-shared]].

> Os literais documentados abaixo correspondem **exatamente** ao schema. Mudar um valor exige migration.

---

## `PlanType`

Valores: `free`, `premium`.

**Usado em:** `User.planType` (default `free`).

**Constantes relacionadas (`@quita/shared`):** `FREE_DEBT_LIMIT = 3`, `PREMIUM_PRICE = 9.9`, `FREE_PLAN_GENERATIONS_PER_MONTH = 2`, `PREMIUM_PLAN_COOLDOWN_HOURS = 1`.

---

## `FinancialType`

Valores: `fixed`, `one_time`, `recurring`.

**Usado em:**
- `Income.type`
- `Expense.type`

Distingue rendas/despesas fixas, pontuais e recorrentes.

---

## `ExpenseCategory`

Valores: `housing`, `bills`, `food`, `transport`, `telecom`, `other`.

**Usado em:** `Expense.category`.

**Rótulos PT-BR (`EXPENSE_CATEGORY_LABELS` em `@quita/shared`):**

| Valor | Rótulo |
|---|---|
| `housing` | Moradia |
| `bills` | Contas |
| `food` | Alimentação |
| `transport` | Transporte |
| `telecom` | Internet e Celular |
| `other` | Outros |

---

## `IncomeSource`

Valores: `salary`, `extra`, `help`, `other`.

**Usado em:** `Income.sourceCategory` (opcional).

**Rótulos PT-BR (`INCOME_SOURCE_LABELS` em `@quita/shared`):**

| Valor | Rótulo |
|---|---|
| `salary` | Salário |
| `extra` | Bico / Extra |
| `help` | Ajuda |
| `other` | Outro |

---

## `DebtNature`

Valores: `installment`, `recurring`, `one_time`.

**Usado em:** `Debt.nature` (default `one_time`).

> Adicionado pela migration `20260313232608_add_debt_nature`. Antes desse ponto, dívidas não eram diferenciadas por natureza.

---

## `DebtStatus`

Valores: `on_time`, `overdue`, `renegotiated`, `paid`.

**Usado em:** `Debt.status` (default `on_time`).

Estado da dívida no fluxo de quitação. `paid` é estado terminal e geralmente acompanha `Debt.paidAt`.

---

## `PaymentType`

Valores: `full`, `partial`, `renegotiated`.

**Usado em:** `Payment.paymentType`.

Tipo do pagamento registrado. Acompanha `Payment.canUndoUntil` (janela de undo) e `Payment.undone` (flag).

---

## `PlanStrategy`

Valores: `smallest_first`, `highest_interest`, `custom`.

**Usado em:** `PaymentPlan.strategy` (default `smallest_first`).

Estratégia de quitação aplicada ao gerar o plano:
- `smallest_first`: bola de neve (menor saldo primeiro).
- `highest_interest`: avalanche (maior juros primeiro).
- `custom`: ordem definida pelo usuário (via `PlanTimelineItem.order` e/ou `Debt.priorityOrder`).

---

## `InsightType`

Valores: `tip`, `action`, `warning`, `negotiation`, `expense_cut`.

**Usado em:** `AiInsight.type`.

Categoria do insight gerado pela IA — guia de UI (ícone, cor, CTA).

---

## `ExportFormat`

Valores: `pdf`, `csv`.

**Usado em:** `DataExport.format`.

Formato do arquivo gerado pela exportação de dados do usuário.

---

## `ExportStatus`

Valores: `processing`, `ready`, `expired`.

**Usado em:** `DataExport.status` (default `processing`).

Ciclo de vida do export. `expired` é alcançado após `DataExport.expiresAt` — ver constante `EXPORT_EXPIRY_HOURS = 48` em [[09-shared]].

---

## `TimelineItemStatus`

Valores: `pending`, `completed`, `skipped`.

**Usado em:** `PlanTimelineItem.status` (default `pending`).

Estado de cada etapa de um `PaymentPlan`.

---

## Onde cada enum aparece

| Enum | Models que utilizam |
|---|---|
| `PlanType` | `User` |
| `FinancialType` | `Income`, `Expense` |
| `ExpenseCategory` | `Expense` |
| `IncomeSource` | `Income` |
| `DebtNature` | `Debt` |
| `DebtStatus` | `Debt` |
| `PaymentType` | `Payment` |
| `PlanStrategy` | `PaymentPlan` |
| `InsightType` | `AiInsight` |
| `ExportFormat` | `DataExport` |
| `ExportStatus` | `DataExport` |
| `TimelineItemStatus` | `PlanTimelineItem` |

## Notas relacionadas

- [[03-banco-de-dados]]
- [[03a-modelos]]
- [[03b-relacoes]]
- [[03d-seed]]
- [[09-shared]]
- [[04-api-overview]]
