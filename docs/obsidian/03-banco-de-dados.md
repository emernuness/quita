---
title: Banco de Dados — Visão Geral
tags: [banco-de-dados, prisma, postgres, schema]
updated: 2026-05-04
---

# Banco de Dados — Visão Geral

O QUITA utiliza **PostgreSQL** como banco relacional e **Prisma** como ORM/migrações. O schema é declarado em `apps/api/prisma/schema.prisma` e gera o cliente JavaScript via `prisma-client-js`.

## Configuração

- **Provider:** `postgresql`
- **URL de conexão:** variável de ambiente `DATABASE_URL`
- **Generator:** `prisma-client-js`
- **Arquivo do schema:** `apps/api/prisma/schema.prisma`

## Convenções do schema

- **IDs:** todos os models usam `String @id @default(uuid())`.
- **Mapeamento snake_case:** colunas no Postgres seguem `snake_case` via `@map(...)` e `@@map(...)`. Os campos no Prisma Client permanecem em `camelCase`.
- **Timestamps:** padrão de `createdAt` (`@default(now())`) e `updatedAt` (`@updatedAt`) presentes na maioria dos models.
- **Soft delete:** apenas `User` possui `deletedAt` (DateTime opcional). Outras entidades são removidas em cascata via `onDelete: Cascade`.
- **Tipos monetários:** `Decimal(12, 2)` para todos os valores em reais (R$).
- **Tipos de data pura:** `@db.Date` para `dueDate`, `suggestedDate` (sem componente de hora).
- **Inteiros pequenos:** `Int @db.SmallInt` para contadores e parcelas (otimização de espaço).

## Models (entidades)

| Model | Tabela SQL | Papel no domínio |
|---|---|---|
| `User` | `users` | Usuário/conta principal (raiz agregada) |
| `Income` | `incomes` | Rendas declaradas pelo usuário |
| `Expense` | `expenses` | Despesas fixas/variáveis |
| `DebtCategory` | `debt_categories` | Catálogo de categorias de dívidas (seedado) |
| `Debt` | `debts` | Dívidas a quitar |
| `Payment` | `payments` | Pagamentos efetuados em uma dívida |
| `PaymentPlan` | `payment_plans` | Plano de quitação gerado pela IA/estratégia |
| `PlanTimelineItem` | `plan_timeline_items` | Item da timeline (etapas) de um plano |
| `AiInsight` | `ai_insights` | Insights/recomendações de IA |
| `NotificationPreference` | `notification_preferences` | Preferências de notificação por usuário (1:1) |
| `DataExport` | `data_exports` | Exportações de dados (PDF/CSV) |
| `UserJourneyStats` | `user_journey_stats` | Estatísticas agregadas da jornada do usuário (1:1) |

Detalhe campo a campo em [[03a-modelos]].

## Enums

Todos os enums Prisma são strings nativas no Postgres. Lista completa em [[03c-enums]].

- `PlanType`, `FinancialType`, `ExpenseCategory`, `IncomeSource`
- `DebtNature`, `DebtStatus`, `PaymentType`, `PlanStrategy`
- `InsightType`, `ExportFormat`, `ExportStatus`, `TimelineItemStatus`

Os mesmos valores são espelhados em `packages/shared/src/enums/index.ts` no formato `as const` (sem TS enums) para uso compartilhado entre API e mobile.

## Migrações

Histórico em `apps/api/prisma/migrations/`:

| Migration | Descrição |
|---|---|
| `20260313043124_init` | Criação inicial de todos os models, enums e índices |
| `20260313231659_add_monthly_amount_to_debt` | Adiciona `Debt.monthlyAmount` para dívidas recorrentes/parceladas |
| `20260313232608_add_debt_nature` | Adiciona enum `DebtNature` e campo `Debt.nature` (default `one_time`) |

`migration_lock.toml` fixa o provider em `postgresql`.

## Seed

O seed (`apps/api/prisma/seed.ts`) popula apenas o catálogo de categorias de dívidas (`DebtCategory`) a partir de `DEBT_CATEGORY_SEEDS` em `@quita/shared`. Detalhes em [[03d-seed]].

## Relacionamentos

Todos os relacionamentos, regras `onDelete` e diagrama ER em [[03b-relacoes]].

## Notas relacionadas

- [[01-arquitetura]]
- [[03a-modelos]]
- [[03b-relacoes]]
- [[03c-enums]]
- [[03d-seed]]
- [[04-api-overview]]
- [[09-shared]]
