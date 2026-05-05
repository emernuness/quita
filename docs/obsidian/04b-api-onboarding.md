---
title: API - Onboarding
tags: [api, onboarding]
updated: 2026-05-04
---

# 04b - Módulo Onboarding

Arquivos: `apps/api/src/modules/onboarding/`.

## Responsabilidade

Captura sequencial dos dados iniciais do usuário (renda, categorias de dívida, dívidas, despesas) e marca conclusão. Cada etapa atualiza `user.onboardingStep`; o `complete` marca `user.onboardingCompleted = true`.

Todas as rotas exigem JWT — o controller decora `@UseGuards(JwtAuthGuard)` na classe.

## Endpoints

Prefixo: `onboarding`.

| Método | Rota | Guard | Body (Zod) | Resposta `data` |
| --- | --- | --- | --- | --- |
| POST | `/api/onboarding/income` | `JwtAuthGuard` | `onboardingIncomeSchema` | `{ step: 1 }` |
| POST | `/api/onboarding/categories` | `JwtAuthGuard` | `onboardingDebtCategoriesSchema` | `{ step: 2, categoryIds }` |
| POST | `/api/onboarding/debts` | `JwtAuthGuard` | `z.array(onboardingDebtSchema).min(1)` | `{ step: 3 }` |
| POST | `/api/onboarding/expenses` | `JwtAuthGuard` | `onboardingExpensesSchema` | `{ step: 4 }` |
| POST | `/api/onboarding/complete` | `JwtAuthGuard` | — | `{ completed: true }` |

Schemas em [[09-shared]].

## Lógica relevante

### `saveIncome(userId, data)`

Monta lista de incomes a partir de `salary`, `extra`, `help` (cada um só entra se `> 0`):

| Campo | Nome gravado | `sourceCategory` |
| --- | --- | --- |
| `salary` | `"Salário"` | `salary` |
| `extra` | `"Renda Extra"` | `extra` |
| `help` | `"Ajuda"` | `help` |

Em `prisma.$transaction`:

1. `income.deleteMany({ where: { userId } })` (limpa renda anterior).
2. Para cada item, `income.create` com `type: "fixed"`.
3. `user.update` → `onboardingStep: 1`.

### `saveCategories(userId, data)`

- Apenas atualiza `user.onboardingStep = 2` (não persiste categorias selecionadas no usuário — `categoryIds` é ecoado na resposta).

### `saveDebts(userId, debts)`

Em `prisma.$transaction`:

1. `debt.deleteMany({ where: { userId } })`.
2. Para cada `debt` no array (com índice), cria `Debt` mapeando:
   - `categoryId`, `creditor`, `nature` (cast para `PrismaDebtNature`).
   - `totalAmount`; `monthlyAmount`, `overdueMonths`, `totalInstallments`, `currentInstallment` (passados quando definidos, senão `undefined`).
   - `hasInterest`.
   - `dueDate`: `new Date(debt.dueDate)` se houver, senão `undefined`.
   - `status` (cast para `PrismaDebtStatus`).
   - `priorityOrder: index + 1`.
3. `user.update` → `onboardingStep: 3`.

### `saveExpenses(userId, data)`

Mapa interno de chave → label PT-BR:

```
housing  → "Moradia"
bills    → "Contas"
food     → "Alimentação"
transport→ "Transporte"
telecom  → "Telecomunicações"
```

Cria uma `Expense` por chave com valor `> 0`, com `type: "fixed"` e `category` igual à chave. Em `prisma.$transaction`:

1. `expense.deleteMany({ where: { userId } })`.
2. Cria as `Expense`.
3. `user.update` → `onboardingStep: 4`.

### `complete(userId)`

`user.update` → `onboardingCompleted: true`.

## Erros lançados

- `BadRequestException` (400) via `ZodValidationPipe` quando o body falha validação.
- `UnauthorizedException` (401) quando o token JWT é inválido/ausente (via `JwtAuthGuard` → `JwtStrategy`).
- O service não lança exceções de domínio próprias.

## Models tocados

- `User` (campos `onboardingStep`, `onboardingCompleted`).
- `Income`.
- `Expense`.
- `Debt`.

Detalhes em [[03a-modelos]].

## Notas relacionadas

- [[04-api-overview]]
- [[04a-api-auth]]
- [[09-shared]]
