---
title: API - Dashboard
tags: [api, dashboard]
updated: 2026-05-04
---

# 04e - Módulo Dashboard

Arquivos: `apps/api/src/modules/dashboard/`.

## Responsabilidade

Endpoint único de leitura que agrega rendas, despesas e dívidas para alimentar a tela inicial. Exige JWT (`@UseGuards(JwtAuthGuard)` na classe).

## Endpoints

Prefixo: `dashboard`.

| Método | Rota | Guard | Body | Resposta `data` |
| --- | --- | --- | --- | --- |
| GET | `/api/dashboard` | `JwtAuthGuard` | — | objeto agregado (ver abaixo) |

Resposta envelopada por `TransformInterceptor` em `{ success: true, data: {...} }`.

## Lógica relevante

`getDashboard(userId)` busca em paralelo:

- `income.findMany({ userId, isActive: true })`.
- `expense.findMany({ userId, isActive: true })`.
- `debt.findMany({ userId, include: { category: true }, orderBy: { priorityOrder: "asc" } })` — todas as dívidas, sem filtro de status.

Calcula:

| Campo | Cálculo |
| --- | --- |
| `totalIncome` | soma de `income.amount.toNumber()` (rendas ativas). |
| `totalExpenses` | soma de `expense.amount.toNumber()` (despesas ativas). |
| `monthlyBalance` | `totalIncome - totalExpenses`. |
| `surplusForDebts` | `Math.max(0, monthlyBalance)`. |
| `debtsCount` | `debts.length`. |
| `paidDebtsCount` | dívidas com `status === "paid"`. |
| `progressPercent` | `(paidDebtsCount / debtsCount) * 100` (0 se não há dívidas), arredondado para 2 casas via `Math.round(x * 100) / 100`. |
| `totalDebt` | soma de `(d.totalAmount - d.amountPaid)` apenas para dívidas com `status !== "paid"`. |
| `debts` | `debts.slice(0, 5)` (top 5 por `priorityOrder`), com `totalAmount`, `amountPaid` e `interestSaved` convertidos para `number`/`null`. Inclui o relacionamento `category`. |

Forma final do `data`:

```ts
{
  totalDebt: number,
  totalIncome: number,
  totalExpenses: number,
  monthlyBalance: number,
  surplusForDebts: number,
  debtsCount: number,
  paidDebtsCount: number,
  progressPercent: number,
  debts: Array<Debt & { category, totalAmount: number, amountPaid: number, interestSaved: number | null }>
}
```

## Erros lançados

- `UnauthorizedException` (401) via `JwtAuthGuard` quando o token é inválido/ausente.
- O service não lança exceções de domínio próprias.

## Models tocados

- `Income` (lê `amount`, `isActive`).
- `Expense` (lê `amount`, `isActive`).
- `Debt` (lê `totalAmount`, `amountPaid`, `status`, `priorityOrder`, `interestSaved`, `category`).

Ver [[03a-modelos]].

## Notas relacionadas

- [[04-api-overview]]
- [[04c-api-financial]]
- [[04d-api-debts]]
