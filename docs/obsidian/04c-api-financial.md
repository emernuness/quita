---
title: API - Financial
tags: [api, financial, incomes, expenses]
updated: 2026-05-04
---

# 04c - Módulo Financial

Arquivos: `apps/api/src/modules/financial/`.

## Responsabilidade

CRUD de **rendas** (`Income`) e **despesas** (`Expense`) do usuário, mais um endpoint de resumo agregado (`summary`). Todas as rotas exigem JWT (`@UseGuards(JwtAuthGuard)` na classe).

## Endpoints

Prefixo: `financial`.

### Resumo

| Método | Rota | Guard | Body | Resposta `data` |
| --- | --- | --- | --- | --- |
| GET | `/api/financial/summary` | `JwtAuthGuard` | — | `{ totalIncome, totalExpenses, balance }` |

### Rendas (Incomes)

| Método | Rota | Guard | Body (Zod) | Resposta `data` |
| --- | --- | --- | --- | --- |
| GET | `/api/financial/incomes` | `JwtAuthGuard` | — | `Income[]` (Decimals → number) |
| POST | `/api/financial/incomes` | `JwtAuthGuard` | `createIncomeSchema` | `Income` criado |
| PATCH | `/api/financial/incomes/:id` | `JwtAuthGuard` | `updateIncomeSchema` | `Income` atualizado |
| DELETE | `/api/financial/incomes/:id` | `JwtAuthGuard` | — | `{ deleted: true }` |

### Despesas (Expenses)

| Método | Rota | Guard | Body (Zod) | Resposta `data` |
| --- | --- | --- | --- | --- |
| GET | `/api/financial/expenses` | `JwtAuthGuard` | — | `Expense[]` (Decimals → number) |
| POST | `/api/financial/expenses` | `JwtAuthGuard` | `createExpenseSchema` | `Expense` criado |
| PATCH | `/api/financial/expenses/:id` | `JwtAuthGuard` | `updateExpenseSchema` | `Expense` atualizado |
| DELETE | `/api/financial/expenses/:id` | `JwtAuthGuard` | — | `{ deleted: true }` |

Schemas em [[09-shared]].

## Lógica relevante

### `getSummary(userId)`

- Busca em paralelo `income.findMany({ userId, isActive: true })` e `expense.findMany({ userId, isActive: true })`.
- `totalIncome = sum(income.amount.toNumber())`.
- `totalExpenses = sum(expense.amount.toNumber())`.
- `balance = totalIncome - totalExpenses`.
- Retorna `{ totalIncome, totalExpenses, balance }` (números, não Decimals).

### Listagens

`listIncomes` / `listExpenses`:

- `findMany({ where: { userId }, orderBy: { createdAt: "desc" } })`.
- Não filtra `isActive` (lista também as desativadas).
- Converte `amount` e `installmentAmount` de `Prisma.Decimal` para `number` (ou `null`).

### Criação

`createIncome(userId, data)`:

- Cria `Income` com `userId`, `name`, `amount`, `type` (cast para `FinancialType`), `dueDate` (`new Date(...)` se enviado), `installments`, `installmentAmount`, `sourceCategory` (cast para `IncomeSource`).
- Resposta com Decimals serializados para `number`.

`createExpense(userId, data)`:

- Mesma forma, mas com `category` (cast para `ExpenseCategory`).

### Update

`updateIncome` / `updateExpense`:

1. `findUnique({ where: { id } })`. Se nulo: `NotFoundException("Income not found")` ou `"Expense not found"`.
2. Se `record.userId !== userId`: `ForbiddenException("Not your resource")`.
3. Atualiza apenas campos definidos no body (spread condicional `data.x !== undefined`). Para `dueDate`: `null` se string vazia/undefined no payload aceito como `null`, senão `new Date(...)`.
4. Retorna o registro com Decimals normalizados.

### Delete

- Mesma checagem de propriedade que update.
- Hard delete via `prisma.income.delete` / `prisma.expense.delete`.
- Retorna `{ deleted: true }`.

## Erros lançados

| Origem | Exception | Mensagem |
| --- | --- | --- |
| Update/Delete Income, ID inexistente | `NotFoundException` (404) | `Income not found` |
| Update/Delete Expense, ID inexistente | `NotFoundException` (404) | `Expense not found` |
| Update/Delete, dono diferente | `ForbiddenException` (403) | `Not your resource` |
| Validação Zod | `BadRequestException` (400) | `Validation failed` + `errors[]` |
| Token inválido | `UnauthorizedException` (401) | (via `JwtAuthGuard`) |

## Models tocados

- `Income`.
- `Expense`.

Ver [[03a-modelos]].

## Notas relacionadas

- [[04-api-overview]]
- [[04e-api-dashboard]]
- [[09-shared]]
