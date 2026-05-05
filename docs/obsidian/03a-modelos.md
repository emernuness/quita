---
title: Modelos do Banco de Dados
tags: [banco-de-dados, prisma, models]
updated: 2026-05-04
---

# Modelos — Detalhe campo a campo

Documentação fiel ao schema em `apps/api/prisma/schema.prisma`. Os tipos SQL inferidos refletem a tradução do Prisma para Postgres.

> Convenções: `Decimal(12, 2)` => `numeric(12, 2)`. `String @db.VarChar(N)` => `varchar(N)`. `Int @db.SmallInt` => `smallint`. `DateTime @db.Date` => `date`. `DateTime` => `timestamp(3)`. UUIDs são armazenados como `text` (default Prisma `uuid()`).

---

## User (`users`)

Raiz agregada de quase todo o domínio. Único model com **soft delete** (`deletedAt`).

| Campo | Tipo Prisma | Tipo SQL | Default | Descrição |
|---|---|---|---|---|
| `id` | `String @id` | text | `uuid()` | Chave primária |
| `name` | `String @db.VarChar(255)` | varchar(255) | — | Nome completo |
| `email` | `String @unique @db.VarChar(255)` | varchar(255) UNIQUE | — | E-mail (login) |
| `phone` | `String @db.VarChar(20)` | varchar(20) | — | Telefone |
| `passwordHash` | `String @db.VarChar(255)` | varchar(255) | — | Hash da senha (`password_hash`) |
| `avatarInitials` | `String? @db.VarChar(5)` | varchar(5) NULL | — | Iniciais para avatar (`avatar_initials`) |
| `googleId` | `String? @db.VarChar(255)` | varchar(255) NULL | — | ID Google (login social) (`google_id`) |
| `biometricFingerprint` | `Boolean?` | boolean NULL | `false` | Biometria por digital habilitada |
| `biometricFace` | `Boolean?` | boolean NULL | `false` | Biometria facial habilitada |
| `discreteMode` | `Boolean?` | boolean NULL | `false` | Modo discreto (oculta valores) |
| `onboardingStep` | `Int? @db.SmallInt` | smallint NULL | `0` | Etapa atual do onboarding |
| `onboardingCompleted` | `Boolean?` | boolean NULL | `false` | Onboarding concluído |
| `planType` | `PlanType` | enum | `free` | Plano: `free` ou `premium` |
| `planExpiresAt` | `DateTime?` | timestamp NULL | — | Validade do plano premium |
| `lastSyncAt` | `DateTime?` | timestamp NULL | — | Último sync mobile |
| `createdAt` | `DateTime` | timestamp | `now()` | Criação |
| `updatedAt` | `DateTime` | timestamp | `@updatedAt` | Atualização |
| `deletedAt` | `DateTime?` | timestamp NULL | — | **Soft delete** |

**Índices:** `email` é `@unique`.

**Soft delete:** sim (`deletedAt`). Filtragem fica a cargo dos services da API.

**Relações:** 1:N para `Income`, `Expense`, `Debt`, `Payment`, `PaymentPlan`, `AiInsight`, `DataExport`. 1:1 com `NotificationPreference` e `UserJourneyStats`. Detalhes em [[03b-relacoes]].

**API:** ver [[04-api-users]] e [[04-api-auth]].

---

## Income (`incomes`)

| Campo | Tipo Prisma | Tipo SQL | Default | Descrição |
|---|---|---|---|---|
| `id` | `String @id` | text | `uuid()` | PK |
| `userId` | `String` | text | — | FK → `User` (`user_id`) |
| `name` | `String @db.VarChar(255)` | varchar(255) | — | Descrição da renda |
| `amount` | `Decimal @db.Decimal(12,2)` | numeric(12,2) | — | Valor |
| `type` | `FinancialType` | enum | — | `fixed` / `one_time` / `recurring` |
| `dueDate` | `DateTime? @db.Date` | date NULL | — | Data prevista (`due_date`) |
| `installments` | `Int? @db.SmallInt` | smallint NULL | — | Total de parcelas |
| `installmentAmount` | `Decimal? @db.Decimal(12,2)` | numeric(12,2) NULL | — | Valor por parcela (`installment_amount`) |
| `sourceCategory` | `IncomeSource?` | enum NULL | — | `salary` / `extra` / `help` / `other` (`source_category`) |
| `isActive` | `Boolean` | boolean | `true` | Ativa? (`is_active`) |
| `createdAt` | `DateTime` | timestamp | `now()` | — |
| `updatedAt` | `DateTime` | timestamp | `@updatedAt` | — |

**Índices:** `@@index([userId, isActive])`.

**Relações:** N:1 com `User` (`onDelete: Cascade`). Ver [[03b-relacoes]].

**API:** ver [[04-api-incomes]].

---

## Expense (`expenses`)

| Campo | Tipo Prisma | Tipo SQL | Default | Descrição |
|---|---|---|---|---|
| `id` | `String @id` | text | `uuid()` | PK |
| `userId` | `String` | text | — | FK → `User` |
| `name` | `String @db.VarChar(255)` | varchar(255) | — | Descrição |
| `amount` | `Decimal @db.Decimal(12,2)` | numeric(12,2) | — | Valor |
| `type` | `FinancialType` | enum | — | `fixed` / `one_time` / `recurring` |
| `category` | `ExpenseCategory` | enum | — | `housing`, `bills`, `food`, `transport`, `telecom`, `other` |
| `dueDate` | `DateTime? @db.Date` | date NULL | — | Vencimento |
| `installments` | `Int? @db.SmallInt` | smallint NULL | — | Total de parcelas |
| `installmentAmount` | `Decimal? @db.Decimal(12,2)` | numeric(12,2) NULL | — | Valor por parcela |
| `isActive` | `Boolean` | boolean | `true` | Ativa? |
| `createdAt` | `DateTime` | timestamp | `now()` | — |
| `updatedAt` | `DateTime` | timestamp | `@updatedAt` | — |

**Índices:** `@@index([userId, isActive])`.

**Relações:** N:1 com `User` (`onDelete: Cascade`).

**API:** ver [[04-api-expenses]].

---

## DebtCategory (`debt_categories`)

Catálogo global, populado via [[03d-seed]].

| Campo | Tipo Prisma | Tipo SQL | Default | Descrição |
|---|---|---|---|---|
| `id` | `String @id` | text | `uuid()` | PK |
| `slug` | `String @unique @db.VarChar(50)` | varchar(50) UNIQUE | — | Identificador estável |
| `name` | `String @db.VarChar(100)` | varchar(100) | — | Rótulo exibido |
| `icon` | `String @db.VarChar(50)` | varchar(50) | — | Nome do ícone (frontend) |
| `createdAt` | `DateTime` | timestamp | `now()` | — |

**Índices:** `slug` é `@unique`.

**Relações:** 1:N com `Debt`.

**API:** ver [[04-api-debt-categories]].

---

## Debt (`debts`)

Entidade central do produto.

| Campo | Tipo Prisma | Tipo SQL | Default | Descrição |
|---|---|---|---|---|
| `id` | `String @id` | text | `uuid()` | PK |
| `userId` | `String` | text | — | FK → `User` |
| `categoryId` | `String` | text | — | FK → `DebtCategory` (`category_id`) |
| `creditor` | `String @db.VarChar(255)` | varchar(255) | — | Credor |
| `totalAmount` | `Decimal @db.Decimal(12,2)` | numeric(12,2) | — | Valor total (`total_amount`) |
| `nature` | `DebtNature` | enum | `one_time` | `installment` / `recurring` / `one_time` |
| `monthlyAmount` | `Decimal? @db.Decimal(12,2)` | numeric(12,2) NULL | — | Mensalidade (`monthly_amount`) |
| `amountPaid` | `Decimal @db.Decimal(12,2)` | numeric(12,2) | `0` | Total já pago (`amount_paid`) |
| `hasInterest` | `Boolean?` | boolean NULL | `false` | Possui juros? (`has_interest`) |
| `dueDate` | `DateTime? @db.Date` | date NULL | — | Vencimento |
| `status` | `DebtStatus` | enum | `on_time` | `on_time` / `overdue` / `renegotiated` / `paid` |
| `overdueMonths` | `Int? @db.SmallInt` | smallint NULL | — | Meses em atraso (`overdue_months`) |
| `totalInstallments` | `Int? @db.SmallInt` | smallint NULL | — | Total de parcelas (`total_installments`) |
| `currentInstallment` | `Int? @db.SmallInt` | smallint NULL | — | Parcela atual (`current_installment`) |
| `priorityOrder` | `Int? @db.SmallInt` | smallint NULL | — | Ordem de prioridade (`priority_order`) |
| `paidAt` | `DateTime?` | timestamp NULL | — | Quitada em (`paid_at`) |
| `interestSaved` | `Decimal? @db.Decimal(12,2)` | numeric(12,2) NULL | — | Juros economizados (`interest_saved`) |
| `createdAt` | `DateTime` | timestamp | `now()` | — |
| `updatedAt` | `DateTime` | timestamp | `@updatedAt` | — |

**Índices:** `@@index([userId, status])`.

**Relações:** N:1 com `User` (Cascade) e com `DebtCategory` (sem cascade — categoria é catálogo). 1:N para `Payment`, `AiInsight`, `PlanTimelineItem`.

**API:** ver [[04-api-debts]].

---

## Payment (`payments`)

| Campo | Tipo Prisma | Tipo SQL | Default | Descrição |
|---|---|---|---|---|
| `id` | `String @id` | text | `uuid()` | PK |
| `userId` | `String` | text | — | FK → `User` |
| `debtId` | `String` | text | — | FK → `Debt` (`debt_id`) |
| `amount` | `Decimal @db.Decimal(12,2)` | numeric(12,2) | — | Valor pago |
| `paymentType` | `PaymentType` | enum | — | `full` / `partial` / `renegotiated` (`payment_type`) |
| `receiptUrl` | `String? @db.VarChar(500)` | varchar(500) NULL | — | URL do comprovante (`receipt_url`) |
| `canUndoUntil` | `DateTime?` | timestamp NULL | — | Janela de undo (`can_undo_until`) |
| `undone` | `Boolean` | boolean | `false` | Pagamento desfeito? |
| `paidAt` | `DateTime` | timestamp | — | Quando foi pago (`paid_at`) |
| `createdAt` | `DateTime` | timestamp | `now()` | — |

**Índices:** `@@index([debtId])`.

**Relações:** N:1 com `User` e `Debt` (ambos `onDelete: Cascade`).

> A janela de undo do pagamento (`canUndoUntil`) está alinhada com a constante `PAYMENT_UNDO_WINDOW_HOURS = 24` em `@quita/shared`. Ver [[09-shared]].

**API:** ver [[04-api-payments]].

---

## PaymentPlan (`payment_plans`)

| Campo | Tipo Prisma | Tipo SQL | Default | Descrição |
|---|---|---|---|---|
| `id` | `String @id` | text | `uuid()` | PK |
| `userId` | `String` | text | — | FK → `User` |
| `strategy` | `PlanStrategy` | enum | `smallest_first` | `smallest_first` / `highest_interest` / `custom` |
| `monthlyAvailable` | `Decimal @db.Decimal(12,2)` | numeric(12,2) | — | Disponível mensal (`monthly_available`) |
| `totalDebtsCount` | `Int @db.SmallInt` | smallint | — | Qtd. total de dívidas (`total_debts_count`) |
| `paidDebtsCount` | `Int @db.SmallInt` | smallint | `0` | Qtd. de dívidas quitadas (`paid_debts_count`) |
| `progressPercent` | `Decimal @db.Decimal(5,2)` | numeric(5,2) | `0` | % de progresso (`progress_percent`) |
| `isCritical` | `Boolean` | boolean | `false` | Plano em estado crítico (`is_critical`) |
| `allPaid` | `Boolean` | boolean | `false` | Todas quitadas (`all_paid`) |
| `isActive` | `Boolean` | boolean | `true` | Plano ativo (`is_active`) |
| `generatedAt` | `DateTime` | timestamp | — | Gerado em (`generated_at`) |
| `createdAt` | `DateTime` | timestamp | `now()` | — |
| `updatedAt` | `DateTime` | timestamp | `@updatedAt` | — |

**Índices:** `@@index([userId])`.

**Relações:** N:1 com `User` (Cascade); 1:N com `PlanTimelineItem`.

**API:** ver [[04-api-payment-plans]].

---

## PlanTimelineItem (`plan_timeline_items`)

Etapa individual dentro de um `PaymentPlan`.

| Campo | Tipo Prisma | Tipo SQL | Default | Descrição |
|---|---|---|---|---|
| `id` | `String @id` | text | `uuid()` | PK |
| `planId` | `String` | text | — | FK → `PaymentPlan` (`plan_id`) |
| `debtId` | `String` | text | — | FK → `Debt` (`debt_id`) |
| `order` | `Int @db.SmallInt` | smallint | — | Ordem na timeline |
| `suggestedAmount` | `Decimal @db.Decimal(12,2)` | numeric(12,2) | — | Valor sugerido (`suggested_amount`) |
| `suggestedDate` | `DateTime @db.Date` | date | — | Data sugerida (`suggested_date`) |
| `status` | `TimelineItemStatus` | enum | `pending` | `pending` / `completed` / `skipped` |
| `createdAt` | `DateTime` | timestamp | `now()` | — |

**Índices:** nenhum explícito além das FKs.

**Relações:** N:1 com `PaymentPlan` e `Debt` (ambos `onDelete: Cascade`).

**API:** integrado a [[04-api-payment-plans]].

---

## AiInsight (`ai_insights`)

| Campo | Tipo Prisma | Tipo SQL | Default | Descrição |
|---|---|---|---|---|
| `id` | `String @id` | text | `uuid()` | PK |
| `userId` | `String` | text | — | FK → `User` |
| `debtId` | `String?` | text NULL | — | FK opcional → `Debt` (`debt_id`) |
| `type` | `InsightType` | enum | — | `tip` / `action` / `warning` / `negotiation` / `expense_cut` |
| `title` | `String? @db.VarChar(255)` | varchar(255) NULL | — | Título |
| `content` | `String` | text | — | Conteúdo (texto livre) |
| `actionLabel` | `String? @db.VarChar(100)` | varchar(100) NULL | — | Rótulo do CTA (`action_label`) |
| `actionUrl` | `String? @db.VarChar(500)` | varchar(500) NULL | — | URL/deep-link do CTA (`action_url`) |
| `impactLabel` | `String? @db.VarChar(50)` | varchar(50) NULL | — | Rótulo de impacto (`impact_label`) |
| `savingsAmount` | `Decimal? @db.Decimal(12,2)` | numeric(12,2) NULL | — | Economia projetada (`savings_amount`) |
| `isRead` | `Boolean` | boolean | `false` | Lido? (`is_read`) |
| `createdAt` | `DateTime` | timestamp | `now()` | — |

**Índices:** `@@index([userId, isRead])`.

**Relações:** N:1 com `User` (`Cascade`); N:1 com `Debt` opcional (`onDelete: SetNull` — quando a dívida é removida o insight permanece com `debtId = null`).

**API:** ver [[04-api-ai-insights]].

---

## NotificationPreference (`notification_preferences`)

Relação **1:1 com `User`** (`userId @unique`).

| Campo | Tipo Prisma | Tipo SQL | Default | Descrição |
|---|---|---|---|---|
| `id` | `String @id` | text | `uuid()` | PK |
| `userId` | `String @unique` | text UNIQUE | — | FK 1:1 → `User` (`user_id`) |
| `dueDates` | `Boolean` | boolean | `false` | Notificar vencimentos (`due_dates`) |
| `weeklyProgress` | `Boolean` | boolean | `true` | Resumo semanal (`weekly_progress`) |
| `paymentIncentive` | `Boolean` | boolean | `true` | Incentivo a pagamentos (`payment_incentive`) |
| `riskAlert` | `Boolean` | boolean | `true` | Alertas de risco (`risk_alert`) |
| `newsAndTips` | `Boolean` | boolean | `true` | Novidades e dicas (`news_and_tips`) |
| `createdAt` | `DateTime` | timestamp | `now()` | — |
| `updatedAt` | `DateTime` | timestamp | `@updatedAt` | — |

**Relações:** 1:1 com `User` (`onDelete: Cascade`).

**API:** ver [[04-api-notifications]].

---

## DataExport (`data_exports`)

| Campo | Tipo Prisma | Tipo SQL | Default | Descrição |
|---|---|---|---|---|
| `id` | `String @id` | text | `uuid()` | PK |
| `userId` | `String` | text | — | FK → `User` |
| `format` | `ExportFormat` | enum | — | `pdf` / `csv` |
| `status` | `ExportStatus` | enum | `processing` | `processing` / `ready` / `expired` |
| `fileUrl` | `String? @db.VarChar(500)` | varchar(500) NULL | — | URL do arquivo gerado (`file_url`) |
| `requestedAt` | `DateTime` | timestamp | `now()` | Quando foi solicitado (`requested_at`) |
| `readyAt` | `DateTime?` | timestamp NULL | — | Quando ficou pronto (`ready_at`) |
| `expiresAt` | `DateTime?` | timestamp NULL | — | Quando expira (`expires_at`) |

**Índices:** `@@index([userId, status])`.

**Relações:** N:1 com `User` (`onDelete: Cascade`).

> Janela de expiração padrão: `EXPORT_EXPIRY_HOURS = 48` (constante em `@quita/shared`). Ver [[09-shared]].

**API:** ver [[04-api-data-exports]].

---

## UserJourneyStats (`user_journey_stats`)

Relação **1:1 com `User`**.

| Campo | Tipo Prisma | Tipo SQL | Default | Descrição |
|---|---|---|---|---|
| `id` | `String @id` | text | `uuid()` | PK |
| `userId` | `String @unique` | text UNIQUE | — | FK 1:1 → `User` (`user_id`) |
| `totalDebtsCleared` | `Int @db.SmallInt` | smallint | `0` | Dívidas quitadas (`total_debts_cleared`) |
| `journeyMonths` | `Int @db.SmallInt` | smallint | `0` | Meses de jornada (`journey_months`) |
| `totalInterestSaved` | `Decimal @db.Decimal(12,2)` | numeric(12,2) | `0` | Juros totais economizados (`total_interest_saved`) |
| `updatedAt` | `DateTime` | timestamp | `@updatedAt` | — |

**Relações:** 1:1 com `User` (`onDelete: Cascade`).

**API:** ver [[04-api-users]] (perfil/estatísticas).

---

## Notas relacionadas

- [[03-banco-de-dados]]
- [[03b-relacoes]]
- [[03c-enums]]
- [[03d-seed]]
- [[01-arquitetura]]
- [[04-api-overview]]
- [[09-shared]]
