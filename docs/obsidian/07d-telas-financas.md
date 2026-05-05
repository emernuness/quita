---
title: 07d - Telas Finanças
tags: [mobile, telas, financas]
created: 2026-05-04
---

# 07d - Telas Finanças

Stack interno da aba "Finanças" (`apps/mobile/app/(tabs)/finances/_layout.tsx`). Inclui lista mensal, detalhe da dívida e tela de gráficos.

Layout: `Stack` simples sem header; rotas `index`, `[id]`, `charts`.

## Finances (lista mensal)

- **Caminho:** `apps/mobile/app/(tabs)/finances/index.tsx`
- **Rota:** `/(tabs)/finances`
- **O que o usuário vê:**
  - Header "Minhas finanças" + subtítulo, botão **Filtros** (sliders) e botão **+ Nova** (abre `(modals)/new-item-picker`).
  - **Summary boxes** (3 colunas): Entrou (verde), Saiu (vermelho), Sobrou (verde se positivo / vermelho se negativo). Valores em `formatCompact` (R$ k/M).
  - **Sobra pra dívidas** (card brand teal) com valor compact + ícone `trending-up`.
  - **Filtros expansíveis** (`LayoutAnimation`): pílulas de Tipo (Tudo/Dívidas/Receitas/Despesas), Situação (overdue/on_time/renegotiated/paid — só quando `typeFilter` é "all" ou "debts"), Ordenar por (Vencimento/Valor/Nome). Botão **Limpar filtros** quando há filtros ativos.
  - **Month Navigator**: setas chevron-left/right e label `"Outubro de 2025"` com primeira letra maiúscula.
  - **Sections agrupadas** por tipo (Dívidas / Receitas / Despesas): header com título + total, lista de itens. Cada item exibe nome, detalhe (categoria · "Vence DD/MM" ou "Dia DD"), valor formatado em `formatBRL` ([[09-shared]]) e frequência/status.
  - Empty state com mensagem condicional (filtros ativos vs. nenhum item).
- **O que pode fazer:**
  - Tap **+ Nova** → `router.push("/(modals)/new-item-picker")` ([[07f-telas-modais]]).
  - Tap em item de dívida → `router.push("/(tabs)/finances/${item.rawId}")`.
  - Trocar mês com setas (`setSelectedMonth` ajusta `Date`).
  - Aplicar/limpar filtros, alternar ordem.
- **Estado local:** `selectedMonth: Date`, `showFilters`, `typeFilter`, `statusFilter`, `sortBy`. `useMemo` para `monthLabel`, `activeFilterCount`, `sections` (agrupamento + ordenação).
- **Chamadas de API:** `useDebts()`, `useIncomes()`, `useExpenses()`, `useFinancialSummary()` (queries) — ver hooks em `src/hooks/useDebts.ts` e `src/hooks/useFinancial.ts` (linkar [[04c-api-financial]] para receitas/despesas e [[04d-api-debts]] para dívidas). `summary` traz `totalIncome`, `totalExpenses`, `available`.
- **Filtragem por mês:** `isInSelectedMonth(dueDate)` retorna `true` quando o item não tem data ou quando mês/ano batem com `selectedMonth`.
- **Componentes:** sem imports diretos do design system aqui — usa tokens e Pressable.

## Detalhe da Dívida `[id]`

- **Caminho:** `apps/mobile/app/(tabs)/finances/[id].tsx`
- **Rota:** `/(tabs)/finances/[id]`
- **O que o usuário vê:**
  - Botão "Voltar".
  - Categoria em uppercase teal mid + nome do credor grande.
  - **Status pill** com dot e label dinâmico ("Atrasada há N meses", "Em dia", ou texto custom).
  - **Info section** (4 linhas com separadores): Valor total, Já pago, Juros/multa (sublinhado quando há juros, com `tipLink`), Vencimento.
  - **AI Tip card** com `tipLabel` "Dica da IA", texto e link "Ver acordo no Serasa".
  - Botão primário **Marcar como pago** → abre `/(modals)/pay-debt`.
  - Botão secundário **Editar dívida** (sem handler conectado).
- **Dados:** atualmente lê de `DEBTS_DATA` (objeto **mock hardcoded** dentro do arquivo) usando `useLocalSearchParams` para `id`. Faz fallback para `DEBTS_DATA["1"]` quando o id não existe. Não há chamada de API real ainda nesta tela.
- **Estado local:** nenhum. `statusVariant` derivado para escolher badge.
- **Componentes:** sem imports do design system — uso direto de Pressable.
- **Navegação:** voltar e `pay-debt` modal.

## Charts (Gráficos e relatórios)

- **Caminho:** `apps/mobile/app/(tabs)/finances/charts.tsx`
- **Rota:** `/(tabs)/finances/charts`
- **O que o usuário vê:**
  - Botão "Voltar". Título "Gráficos e relatórios" + subtítulo.
  - **Card "Despesas por categoria"** (mock `CATEGORIES`): linhas com label, valor R$ e barra horizontal preenchida pelo `percent`.
  - **Card "Evolução das dívidas"** (mock `MONTHS` com 4 meses Jun–Set): grupos de barras verticais por mês.
  - **Card "Comparativo mensal"** (mock Out → Nov): "Despesas ↘ -12%" e "Dívida total ↗ R$ 1.230" em sucesso verde.
- **Estado local:** nenhum.
- **Chamadas de API:** **nenhuma** — totalmente mockada por enquanto.
- **Componentes:** sem imports do design system.

## Notas relacionadas

- [[07-telas-overview]]
- [[07a-telas-auth]]
- [[07b-telas-onboarding]]
- [[07c-telas-tabs]]
- [[07e-telas-profile]]
- [[07f-telas-modais]]
- [[04c-api-financial]]
- [[04d-api-debts]]
- [[09-shared]]
