---
title: "Pacote @quita/shared"
tags: [shared, monorepo, zod, types, enums]
local: packages/shared/src
consumido-por: [apps/api, apps/mobile]
---

# 09 · Pacote `@quita/shared`

> Camada compartilhada do monorepo: schemas Zod, enums, constants, types e utils que rodam tanto no [[02-dev-workflow|backend NestJS]] quanto no [[01-arquitetura|app Expo]]. Local: [packages/shared/src](../../packages/shared/src). Build: `tsc` → `dist/`.

## Estrutura

```
packages/shared/src/
├── index.ts          # re-exports tudo
├── enums/            # enums "as const" (sem TS enums)
├── constants/        # limites, seeds, labels
├── schemas/          # validações Zod (auth, debt, payment, etc.)
├── types/            # interfaces alinhadas 1:1 com Prisma
└── utils/            # formatBRL, isValidCPF, formatDateBR, ...
```

`package.json`:

```json
{
  "name": "@quita/shared",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": { "zod": "^3.24" }
}
```

Re-export único em [packages/shared/src/index.ts](../../packages/shared/src/index.ts):

```ts
export * from "./enums/index.js";
export * from "./constants/index.js";
export * from "./schemas/index.js";
export * from "./types/index.js";
export * from "./utils/index.js";
```

## Schemas Zod

Todos os schemas estão em [packages/shared/src/schemas](../../packages/shared/src/schemas) e são consumidos pelo `ZodValidationPipe` no backend e por `validateWithZod` no mobile.

### `auth.ts`

| Schema | Campos | Regras |
| --- | --- | --- |
| `registerSchema` | `name`, `email`, `phone`, `password` | name `min(2)` · email válido · phone `^(\+?55)?\d{10,11}$` ("Telefone brasileiro inválido") · password `min(8)` |
| `loginSchema` | `email`, `password` | email válido · password `min(1)` ("Campo obrigatório") |
| `forgotPasswordSchema` | `contact` | string `min(1)` |
| `resetPasswordSchema` | `email`, `code`, `newPassword` | newPassword `min(8)` |
| `refreshTokenSchema` | `refreshToken` | string |

### `debt.ts`

| Schema | Campos relevantes |
| --- | --- |
| `createDebtSchema` | `categoryId` (uuid), `creditor` (min 1), `nature` (`installment`/`recurring`/`one_time`, default `one_time`), `totalAmount` (positive), `monthlyAmount?`, `overdueMonths` (1–120)?, `totalInstallments` (1–600)?, `currentInstallment` (1–600)?, `hasInterest?`, `dueDate?` (`z.string().date()`), `status` (default `on_time`) |
| `updateDebtSchema` | `createDebtSchema.partial()` |

### `payment.ts`

- `createPaymentSchema`: `amount > 0`, `paymentType` (`full`/`partial`/`renegotiated`), `paidAt?` (datetime ISO).

### `income.ts`

- `createIncomeSchema`: `name`, `amount > 0`, `type` (`fixed`/`one_time`/`recurring`), `dueDate?`, `installments?`, `installmentAmount?`, `sourceCategory?` (`salary`/`extra`/`help`/`other`).
- `updateIncomeSchema = createIncomeSchema.partial()`.

### `expense.ts`

- `createExpenseSchema`: igual ao income mais `category` (`housing`/`bills`/`food`/`transport`/`telecom`/`other`).
- `updateExpenseSchema` partial.

### `plan.ts`

- `updateStrategySchema`: `strategy` ∈ `smallest_first`/`highest_interest`/`custom`.

### `profile.ts`

| Schema | Campos |
| --- | --- |
| `updateProfileSchema` | `name?` (min 2), `phone?` |
| `changePasswordSchema` | `currentPassword`, `newPassword` (min 8) |
| `updateSecuritySchema` | `biometricFingerprint?`, `biometricFace?` |
| `updateDiscreteModeSchema` | `enabled` (bool) |
| `updateNotificationPrefsSchema` | `dueDates?`, `weeklyProgress?`, `paymentIncentive?`, `riskAlert?`, `newsAndTips?` |

### `onboarding.ts`

- `onboardingIncomeSchema`: `salary > 0` ("Informe sua renda principal"), `extra?`, `help?`.
- `onboardingDebtCategoriesSchema`: `categoryIds: uuid[]` com `min(1)`.
- `onboardingDebtSchema`: payload completo de uma dívida do onboarding.
- `onboardingExpensesSchema`: `housing?`, `bills?`, `food?`, `transport?`, `telecom?`.

### `export.ts`

- `createExportSchema`: `format` (`pdf`/`csv`).

## Enums (pattern `as const`)

Sem `enum` do TypeScript — usa objetos `as const` para tree-shaking. Definidos em [packages/shared/src/enums/index.ts](../../packages/shared/src/enums/index.ts):

| Enum | Valores |
| --- | --- |
| `PlanType` | `free`, `premium` |
| `FinancialType` | `fixed`, `one_time`, `recurring` |
| `ExpenseCategory` | `housing`, `bills`, `food`, `transport`, `telecom`, `other` |
| `IncomeSource` | `salary`, `extra`, `help`, `other` |
| `DebtNature` | `installment`, `recurring`, `one_time` |
| `DebtStatus` | `on_time`, `overdue`, `renegotiated`, `paid` |
| `PaymentType` | `full`, `partial`, `renegotiated` |
| `PlanStrategy` | `smallest_first`, `highest_interest`, `custom` |
| `InsightType` | `tip`, `action`, `warning`, `negotiation`, `expense_cut` |
| `ExportFormat` | `pdf`, `csv` |
| `ExportStatus` | `processing`, `ready`, `expired` |
| `TimelineItemStatus` | `pending`, `completed`, `skipped` |

## Constants

Em [packages/shared/src/constants/index.ts](../../packages/shared/src/constants/index.ts):

| Constante | Valor | Significado |
| --- | --- | --- |
| `FREE_DEBT_LIMIT` | `3` | Dívidas máximas no plano free |
| `PREMIUM_PRICE` | `9.9` | R$/mês do premium |
| `FREE_PLAN_GENERATIONS_PER_MONTH` | `2` | Gerações de plano por mês no free |
| `PREMIUM_PLAN_COOLDOWN_HOURS` | `1` | Cooldown entre gerações no premium |
| `PAYMENT_UNDO_WINDOW_HOURS` | `24` | Janela para desfazer pagamento |
| `EXPORT_EXPIRY_HOURS` | `48` | Validade do link de export |

Seeds e labels:

- `DEBT_CATEGORY_SEEDS` — 6 categorias pré-cadastradas (`credit_card`, `bank_loan`, `overdue_bill`, `housing`, `personal`, `other`) com `slug`, `name` (PT-BR) e `icon` (Feather).
- `EXPENSE_CATEGORY_LABELS` e `INCOME_SOURCE_LABELS` — mapas de tradução para PT-BR.

## Types

Em [packages/shared/src/types/index.ts](../../packages/shared/src/types/index.ts) — interfaces alinhadas 1:1 com [[03-banco-de-dados|Prisma schema]].

### Wrappers de API (envelope padrão)

```ts
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginationMeta {
  page: number; perPage: number;
  total: number; totalPages: number;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}
```

### Entidades

`User`, `Income`, `Expense`, `DebtCategory`, `Debt`, `Payment`, `PaymentPlan`, `PlanTimelineItem`, `AiInsight`, `NotificationPreference`, `DataExport`, `UserJourneyStats`. Datas como `string` (ISO 8601) — não `Date` — porque atravessam fronteira HTTP/JSON.

## Utils

Em [packages/shared/src/utils/index.ts](../../packages/shared/src/utils/index.ts):

### Moeda

- `formatBRL(value)` → `"R$ 1.234,56"` (locale `pt-BR`).
- `formatBRLCompact(value)` → `R$ 8K`, `R$ 1,6K`, `R$ 1,2M`. Abaixo de 1000 cai em `formatBRL`.
- `parseBRL(string)` → `number`. Limpa `R$`, `.`, troca `,` por `.`.

### Validação BR

- `isValidCPF(cpf)` — checa 11 dígitos, rejeita sequências repetidas, valida os 2 dígitos verificadores.
- `isValidPhone(phone)` — 10 ou 11 dígitos, opcionalmente prefixado com `55`.
- `formatPhone(phone)` → `"(11) 99999-9999"` ou `"(11) 9999-9999"`.

### Datas

- `formatDateBR(date)` → `"dd/mm/yyyy"`.
- `formatMonthBR(date)` → `"março 2026"` (nomes em PT).
- `getRelativeTime(date)` → `"agora"`, `"há 5 minutos"`, `"ontem"`, `"há 3 dias"`, `"há 2 meses"`, `"há 1 ano"`.

## Como o pacote é consumido

Workspace alias `"@quita/shared": "workspace:*"` em [apps/api/package.json](../../apps/api/package.json) e [apps/mobile/package.json](../../apps/mobile/package.json).

### No backend ([apps/api](../../apps/api))

```ts
// auth.controller.ts
import { loginSchema, registerSchema } from "@quita/shared";
import { ZodValidationPipe } from "../../common";

@Post("login")
login(@Body(new ZodValidationPipe(loginSchema)) body: any) {
  return this.authService.login(body);
}
```

```ts
// auth.service.ts
import type { LoginInput, RegisterInput } from "@quita/shared";
```

### No mobile ([apps/mobile](../../apps/mobile))

```ts
// app/(auth)/login.tsx
import { loginSchema } from "@quita/shared";
import { validateWithZod } from "../../src/utils/validation";

const result = validateWithZod(loginSchema, { email, password });
```

```ts
// stores/auth.ts
import type { User } from "@quita/shared";
```

> Resultado: a mesma regra de validação roda no cliente (UX) e no servidor (segurança), sem duplicação.

## Notas relacionadas

- [[01-arquitetura]]
- [[03-banco-de-dados]]
- [[04-api-overview]]
- [[10-tratamento-erros]]
- [[11-fluxo-autenticacao]]
