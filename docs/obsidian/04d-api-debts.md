---
title: API - Debts
tags: [api, debts, payments]
updated: 2026-05-04
---

# 04d - Módulo Debts

Arquivos: `apps/api/src/modules/debts/`.

## Responsabilidade

CRUD de dívidas (`Debt`), registro e desfazer pagamentos (`Payment`), e listagem das categorias de dívida (`DebtCategory`). Todas as rotas exigem JWT (`@UseGuards(JwtAuthGuard)` na classe).

## Endpoints

Prefixo: `debts`.

| Método | Rota | Guard | Body (Zod) | Resposta `data` |
| --- | --- | --- | --- | --- |
| GET | `/api/debts/categories` | `JwtAuthGuard` | — | `DebtCategory[]` ordenadas por `name asc` |
| GET | `/api/debts` | `JwtAuthGuard` | — | `Debt[]` com `category` incluído, ordenadas por `priorityOrder asc` |
| GET | `/api/debts/:id` | `JwtAuthGuard` | — | `Debt` com `category` e `payments` (apenas `undone: false`) |
| POST | `/api/debts` | `JwtAuthGuard` | `createDebtSchema` | `Debt` criada com `category` |
| PATCH | `/api/debts/:id` | `JwtAuthGuard` | `updateDebtSchema` | `Debt` atualizada |
| DELETE | `/api/debts/:id` | `JwtAuthGuard` | — | `{ deleted: true }` |
| POST | `/api/debts/:id/payments` | `JwtAuthGuard` | `createPaymentSchema` | `Payment` criado (Decimal → number) |
| DELETE | `/api/debts/:debtId/payments/:paymentId` | `JwtAuthGuard` | — | `{ undone: true }` |

Schemas em [[09-shared]].

## Lógica relevante

### Serialização (`serializeDebt`)

Converte campos `Prisma.Decimal` para `number`:

- `totalAmount.toNumber()`.
- `monthlyAmount` → `number | null`.
- `amountPaid.toNumber()`.
- `interestSaved` → `number | null`.
- Se `payments` estiver presente, converte `payment.amount` para `number`.

### `listDebts(userId)`

- `findMany({ where: { userId }, include: { category: true }, orderBy: { priorityOrder: "asc" } })`.
- Aplica `serializeDebt` em todos.

### `getDebt(userId, id)`

- `findUnique({ where: { id }, include: { category, payments: { where: { undone: false }, orderBy: { paidAt: "desc" } } } })`.
- Erros: `NotFoundException("Debt not found")` se não existe; `ForbiddenException("Not your resource")` se `userId` diferente.

### `createDebt(userId, data)`

1. Calcula próxima ordem: `priorityOrder = (max(priorityOrder) ?? 0) + 1` via `prisma.debt.aggregate`.
2. Cria `Debt` com defaults:
   - `nature` cast para `PrismaDebtNature`, default `"one_time"` se ausente.
   - `status` cast para `PrismaDebtStatus`, default `"on_time"` se ausente.
   - `dueDate`: `new Date(...)` se enviado.
   - Demais campos opcionais passam `?? undefined`.
3. Inclui `category` no retorno.

### `updateDebt(userId, id, data)`

1. Carrega a dívida; se inexistente → `NotFoundException("Debt not found")`; dono diferente → `ForbiddenException("Not your resource")`.
2. Atualiza apenas campos com `data.x !== undefined` (spread condicional). Para `dueDate`, aceita `null` quando o campo vier como `null`/falsy.
3. Retorna serializado com `category`.

### `deleteDebt(userId, id)`

- Mesma checagem de propriedade.
- Hard delete (`prisma.debt.delete`).
- Retorna `{ deleted: true }`.

### `createPayment(userId, debtId, data)`

1. Carrega `Debt`; falha com `NotFoundException("Debt not found")` ou `ForbiddenException("Not your resource")`.
2. `canUndoUntil = agora + 24h` (`Date` mutado com `setHours(getHours() + 24)`).
3. `paidAt = data.paidAt ? new Date(data.paidAt) : new Date()`.
4. `newAmountPaid = debt.amountPaid.toNumber() + data.amount`.
5. `isFull = data.paymentType === "full"`.
6. `prisma.$transaction`:
   - `payment.create` com `userId`, `debtId`, `amount`, `paymentType` (cast para `PrismaPaymentType`), `paidAt`, `canUndoUntil`.
   - `debt.update` com `amountPaid: newAmountPaid` e, se `isFull`, também `status: "paid"` e `paidAt: new Date()`.
7. Retorna o `payment` com `amount` em `number`.

### `undoPayment(userId, debtId, paymentId)`

Validações sequenciais:

1. `payment` não encontrado → `NotFoundException("Payment not found")`.
2. `payment.userId !== userId` → `ForbiddenException("Not your resource")`.
3. `payment.debtId !== debtId` → `BadRequestException("Payment does not belong to this debt")`.
4. `payment.undone === true` → `BadRequestException("Payment already undone")`.
5. `payment.canUndoUntil` ausente ou expirado (`< now`) → `BadRequestException("Undo window expired")`.
6. Carrega a `debt`; se inexistente → `NotFoundException("Debt not found")`.

Em `prisma.$transaction`:

- `payment.update({ undone: true })`.
- `debt.update`:
  - `amountPaid = max(0, debt.amountPaid - payment.amount)`.
  - Se `debt.status === "paid"`, reverte para `status: "on_time"` e `paidAt: null`.

Retorna `{ undone: true }`.

### `listCategories()`

- `prisma.debtCategory.findMany({ orderBy: { name: "asc" } })`. Sem filtro de usuário (categorias são globais).

## Erros lançados

| Origem | Exception | Mensagem |
| --- | --- | --- |
| `getDebt`/`updateDebt`/`deleteDebt`/`createPayment` ID inexistente | `NotFoundException` (404) | `Debt not found` |
| `getDebt`/`updateDebt`/`deleteDebt`/`createPayment` dono diferente | `ForbiddenException` (403) | `Not your resource` |
| `undoPayment` ID inexistente | `NotFoundException` (404) | `Payment not found` |
| `undoPayment` dono diferente | `ForbiddenException` (403) | `Not your resource` |
| `undoPayment` `debtId` divergente | `BadRequestException` (400) | `Payment does not belong to this debt` |
| `undoPayment` já desfeito | `BadRequestException` (400) | `Payment already undone` |
| `undoPayment` janela expirada | `BadRequestException` (400) | `Undo window expired` |
| `undoPayment` debt sumiu | `NotFoundException` (404) | `Debt not found` |
| Validação Zod | `BadRequestException` (400) | `Validation failed` + `errors[]` |

## Models tocados

- `Debt`.
- `DebtCategory`.
- `Payment`.

Ver [[03a-modelos]].

## Notas relacionadas

- [[04-api-overview]]
- [[04b-api-onboarding]]
- [[04e-api-dashboard]]
- [[09-shared]]
