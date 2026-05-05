---
title: Seed do Banco de Dados
tags: [banco-de-dados, prisma, seed]
updated: 2026-05-04
---

# Seed — Dados Iniciais

O seed do QUITA é minimalista: popula apenas o **catálogo de categorias de dívidas** (`DebtCategory`). Nenhuma outra tabela recebe dados de seed.

## Arquivo

`apps/api/prisma/seed.ts`

```ts
import { PrismaClient } from "@prisma/client";
import { DEBT_CATEGORY_SEEDS } from "@quita/shared";

const prisma = new PrismaClient();

async function main() {
    for (const cat of DEBT_CATEGORY_SEEDS) {
        await prisma.debtCategory.upsert({
            where: { slug: cat.slug },
            update: { name: cat.name, icon: cat.icon },
            create: { slug: cat.slug, name: cat.name, icon: cat.icon },
        });
    }
    console.log(`Seed completed: ${DEBT_CATEGORY_SEEDS.length} debt categories`);
}
```

## Comportamento

- **Idempotente:** usa `upsert` por `slug` (que é `@unique` em `DebtCategory`). Pode ser executado múltiplas vezes sem duplicar.
- **Atualiza `name` e `icon`** a cada execução — útil quando a fonte (`DEBT_CATEGORY_SEEDS`) muda.
- **Não toca em `id`** existente, preservando integridade referencial com `Debt.categoryId`.

## Dados semeados

Origem: `DEBT_CATEGORY_SEEDS` em `packages/shared/src/constants/index.ts`.

| `slug` | `name` | `icon` |
|---|---|---|
| `credit_card` | Cartão de crédito | `credit-card` |
| `bank_loan` | Banco / Empréstimo | `briefcase` |
| `overdue_bill` | Conta atrasada | `alert-circle` |
| `housing` | Moradia | `home` |
| `personal` | Pessoa conhecida | `users` |
| `other` | Outra dívida | `more-horizontal` |

Total: **6 categorias**.

## Quando é executado

- **Manual:** via `npx prisma db seed` (na pasta `apps/api`), conforme convenção do Prisma.
- **CI / setup local:** após `prisma migrate dev` ou `prisma migrate deploy` em ambientes novos.
- **Não roda automaticamente em produção** sem chamada explícita.

> O comando exato de seed segue a configuração padrão do Prisma. Para detalhes do pipeline de setup, ver [[01-arquitetura]] / [[02-setup-local]].

## O que **não** é semeado

- Usuários, dívidas, pagamentos, planos, insights, exports, preferências, estatísticas — todos esses são criados **somente** pelo fluxo da aplicação (signup, onboarding, ações do usuário).
- `DebtCategory` é o único catálogo do schema.

## Dependências

- `@prisma/client` — instanciado em `seed.ts`.
- `@quita/shared` — fonte única de verdade do array `DEBT_CATEGORY_SEEDS` (compartilhado com mobile/API). Ver [[09-shared]].

## Notas relacionadas

- [[03-banco-de-dados]]
- [[03a-modelos]]
- [[03b-relacoes]]
- [[03c-enums]]
- [[01-arquitetura]]
- [[09-shared]]
- [[04-api-debt-categories]]
