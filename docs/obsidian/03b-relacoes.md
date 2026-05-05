---
title: Relacionamentos do Schema
tags: [banco-de-dados, prisma, relacionamentos, er-diagram]
updated: 2026-05-04
---

# Relacionamentos entre Models

Mapa completo dos relacionamentos definidos em `apps/api/prisma/schema.prisma`. As regras `onDelete` são fiéis às declaradas no schema.

## Resumo das relações

| Origem | Cardinalidade | Destino | onDelete | Campo FK |
|---|---|---|---|---|
| `User` → `Income` | 1:N | `Income.user` | `Cascade` | `userId` |
| `User` → `Expense` | 1:N | `Expense.user` | `Cascade` | `userId` |
| `User` → `Debt` | 1:N | `Debt.user` | `Cascade` | `userId` |
| `User` → `Payment` | 1:N | `Payment.user` | `Cascade` | `userId` |
| `User` → `PaymentPlan` | 1:N | `PaymentPlan.user` | `Cascade` | `userId` |
| `User` → `AiInsight` | 1:N | `AiInsight.user` | `Cascade` | `userId` |
| `User` → `DataExport` | 1:N | `DataExport.user` | `Cascade` | `userId` |
| `User` → `NotificationPreference` | **1:1** | `NotificationPreference.user` | `Cascade` | `userId @unique` |
| `User` → `UserJourneyStats` | **1:1** | `UserJourneyStats.user` | `Cascade` | `userId @unique` |
| `DebtCategory` → `Debt` | 1:N | `Debt.category` | _padrão (Restrict)_ | `categoryId` |
| `Debt` → `Payment` | 1:N | `Payment.debt` | `Cascade` | `debtId` |
| `Debt` → `AiInsight` | 1:N (opcional) | `AiInsight.debt` | `SetNull` | `debtId?` |
| `Debt` → `PlanTimelineItem` | 1:N | `PlanTimelineItem.debt` | `Cascade` | `debtId` |
| `PaymentPlan` → `PlanTimelineItem` | 1:N | `PlanTimelineItem.plan` | `Cascade` | `planId` |

### Observações

- **Cascade no `User`:** apagar um `User` (hard delete) propaga para todas as entidades dependentes. Como `User` tem `deletedAt` (soft delete), o caminho recomendado é o soft delete a nível de aplicação.
- **`AiInsight.debtId` opcional:** quando uma `Debt` é removida, o insight é preservado com `debtId = null` (`onDelete: SetNull`).
- **`DebtCategory` é catálogo:** não há cascade — não é possível remover uma categoria que tenha dívidas associadas (regra default do Prisma).
- **`Payment` x `Debt`:** apagar a dívida apaga seus pagamentos.
- **`PlanTimelineItem`:** apagar plano ou dívida cascateia.

## Diagrama ER (Mermaid)

```mermaid
erDiagram
    USER ||--o{ INCOME : "tem"
    USER ||--o{ EXPENSE : "tem"
    USER ||--o{ DEBT : "possui"
    USER ||--o{ PAYMENT : "registra"
    USER ||--o{ PAYMENT_PLAN : "gera"
    USER ||--o{ AI_INSIGHT : "recebe"
    USER ||--o{ DATA_EXPORT : "solicita"
    USER ||--|| NOTIFICATION_PREFERENCE : "configura"
    USER ||--|| USER_JOURNEY_STATS : "acumula"

    DEBT_CATEGORY ||--o{ DEBT : "classifica"
    DEBT ||--o{ PAYMENT : "recebe"
    DEBT ||--o{ AI_INSIGHT : "origina"
    DEBT ||--o{ PLAN_TIMELINE_ITEM : "compoe"
    PAYMENT_PLAN ||--o{ PLAN_TIMELINE_ITEM : "agenda"

    USER {
        string id PK
        string email UK
        string passwordHash
        PlanType planType
        datetime deletedAt "soft delete"
    }
    INCOME {
        string id PK
        string userId FK
        decimal amount
        FinancialType type
        IncomeSource sourceCategory
        boolean isActive
    }
    EXPENSE {
        string id PK
        string userId FK
        decimal amount
        FinancialType type
        ExpenseCategory category
        boolean isActive
    }
    DEBT_CATEGORY {
        string id PK
        string slug UK
        string name
        string icon
    }
    DEBT {
        string id PK
        string userId FK
        string categoryId FK
        decimal totalAmount
        decimal amountPaid
        DebtNature nature
        DebtStatus status
        decimal monthlyAmount
    }
    PAYMENT {
        string id PK
        string userId FK
        string debtId FK
        decimal amount
        PaymentType paymentType
        boolean undone
        datetime paidAt
    }
    PAYMENT_PLAN {
        string id PK
        string userId FK
        PlanStrategy strategy
        decimal monthlyAvailable
        decimal progressPercent
        boolean isActive
    }
    PLAN_TIMELINE_ITEM {
        string id PK
        string planId FK
        string debtId FK
        smallint order
        decimal suggestedAmount
        TimelineItemStatus status
    }
    AI_INSIGHT {
        string id PK
        string userId FK
        string debtId FK "nullable, SetNull"
        InsightType type
        boolean isRead
    }
    NOTIFICATION_PREFERENCE {
        string id PK
        string userId FK_UK
        boolean dueDates
        boolean weeklyProgress
    }
    DATA_EXPORT {
        string id PK
        string userId FK
        ExportFormat format
        ExportStatus status
        datetime expiresAt
    }
    USER_JOURNEY_STATS {
        string id PK
        string userId FK_UK
        smallint totalDebtsCleared
        decimal totalInterestSaved
    }
```

## Regras de integridade chave

- **Unicidade:** `User.email`, `DebtCategory.slug`, `NotificationPreference.userId`, `UserJourneyStats.userId`.
- **Índices compostos:** `Income[userId, isActive]`, `Expense[userId, isActive]`, `Debt[userId, status]`, `AiInsight[userId, isRead]`, `DataExport[userId, status]`, `Payment[debtId]`, `PaymentPlan[userId]`.
- **Catálogo protegido:** `DebtCategory` não cascateia — gerenciado pelo seed (ver [[03d-seed]]).

## Notas relacionadas

- [[03-banco-de-dados]]
- [[03a-modelos]]
- [[03c-enums]]
- [[03d-seed]]
- [[01-arquitetura]]
- [[04-api-overview]]
