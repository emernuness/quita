---
title: 07b - Telas Onboarding
tags: [mobile, telas, onboarding]
created: 2026-05-04
---

# 07b - Telas de Onboarding

Fluxo de 4 passos para capturar renda, mapeamento de dívidas, detalhe das dívidas e despesas. Layout em `apps/mobile/app/(onboarding)/_layout.tsx` (Stack com `animation: "slide_from_right"`).

Cada tela exibe uma barra de progresso no topo com `width` correspondente (50% / 75% / 50→75% dinâmico / 100%).

## Income

- **Caminho:** `apps/mobile/app/(onboarding)/income.tsx`
- **Rota:** `/(onboarding)/income`
- **O que o usuário vê:**
  - Progress bar 50%.
  - Step indicator "Passo 2 de 4 · você pode estimar e ajustar depois".
  - Título "Quanto entra por mês?" + subtítulo.
  - 3 `TextInput` numéricos com máscara `maskCurrency`: Salário/renda fixa, Bicos/renda extra, Ajuda de alguém.
  - Helper: "Se algum valor variar, use a média dos últimos 3 meses."
  - `Button` **Continuar** ([[06-componentes]]).
- **O que pode fazer:**
  - Submit aplica `unmaskCurrency` em cada campo, valida via `onboardingIncomeSchema` ([[09-shared]]). Campos `extra` e `help` viram `undefined` se zerados.
  - Em sucesso da mutation `useSaveIncome` → `router.push("/(onboarding)/categories")`.
  - Em erro → `Alert.alert("Erro", …)`.
- **Estado local:** `values: Record<FieldKey, string>`, `errors`.
- **Chamadas de API:** `useSaveIncome().mutate(data)` → `POST` em [[04b-api-onboarding]] (`/onboarding/income`).
- **Componentes:** [[06-componentes]] `Button`. Utilitários `maskCurrency`, `unmaskCurrency`, `validateWithZod`.

## Categories

- **Caminho:** `apps/mobile/app/(onboarding)/categories.tsx`
- **Rota:** `/(onboarding)/categories`
- **O que o usuário vê:**
  - Progress bar 75%, "Passo 3 de 4".
  - Botão "Voltar".
  - Step label "Mapeamento de dívidas", título "Pra quem você deve hoje?".
  - Caixa de info "Por que separar por categoria?".
  - Grid 2-col de chips `Pressable` com ícone Feather + nome (cada chip é uma `DebtCategory` vinda da API). `ActivityIndicator` durante load; texto de erro quando vazio.
  - Helper "Não se preocupe se esqueceu alguma. Você pode adicionar depois."
  - `Button` **Continuar**.
- **O que pode fazer:**
  - Tap em chip alterna seleção (`Set<string>`).
  - Submit valida `onboardingDebtCategoriesSchema` ([[09-shared]]) com `categoryIds`. Em sucesso, navega para `debt-detail` passando `categories` (JSON serializado com `id`/`name`/`icon`) via `params`.
  - Erro de mutation mostra `Alert.alert("Erro", …)`.
- **Estado local:** `selected: Set<string>`, `error: string | null`.
- **Chamadas de API:**
  - `useDebtCategories()` (query GET) → lista de categorias disponíveis.
  - `useSaveCategories().mutate({ categoryIds })` → mutation em [[04b-api-onboarding]].
- **Componentes:** [[06-componentes]] `Button`.
- **Navegação:** sucesso → `router.push({ pathname: "/(onboarding)/debt-detail", params: { categories: JSON.stringify(...) } })`.

## Debt Detail

- **Caminho:** `apps/mobile/app/(onboarding)/debt-detail.tsx`
- **Rota:** `/(onboarding)/debt-detail`
- **O que o usuário vê:** tela densa de captura de dívidas, processada **uma categoria por vez**:
  - Progress bar dinâmica calculada como `((categoryIndex + 1) / (allCategories.length + 1)) * 25 + 50`.
  - Header com "Categoria N de M".
  - Lista de dívidas já adicionadas na categoria atual, cada card com botão remover (X).
  - **Bloco 1 — Credor + Natureza**:
    - `TextInput` Credor (max 100).
    - 3 pílulas verticais para `nature`: `installment`, `recurring`, `one_time` com subtítulos descritivos.
  - **Bloco 2 — Situação + campos por natureza** (aparece após escolher natureza):
    - Pílulas de status: ATRASADA (danger badge), NEGOCIANDO (warning), EM DIA (success).
    - Se ATRASADA: pills 1–5 e "6+" com `TextInput` numérico para meses customizados.
    - Se `installment`: valor da parcela + linha "X de Y" para parcela atual/total.
    - Se `recurring`: valor mensal.
  - **Bloco 3 — Valor total + juros + vencimento** (aparece quando `nature === "one_time"` OR `valorMensal` preenchido):
    - Valor total com sugestão automática (clicável) baseada em `valorMensal × meses` ou `valorMensal × parcelas restantes`.
    - Pills "Sim/Não/Não sei" para juros.
    - `DateTimePicker` (`@react-native-community/datetimepicker`) com locale `pt-BR`. Botão Confirmar no iOS, "Limpar data".
  - Botão dashed **Adicionar outra dívida nesta categoria**.
  - Card de info "Você pode ter várias dívidas na mesma categoria…".
  - `Button` final: **Próxima categoria** ou **Salvar dívidas** se for a última.
- **O que pode fazer:**
  - Adicionar várias dívidas na mesma categoria via `handleAddAnother` (valida e empilha em `collectedDebts`, depois `resetForm()`).
  - Avançar via `handleAdvance` — se há dados de form, valida e empilha; se é a última categoria, dispara `useSaveDebts.mutate(allDebts)`. Caso contrário, incrementa `categoryIndex`.
  - Voltar via `handleBack` — decrementa `categoryIndex` ou `router.back()`.
  - Remover dívida adicionada pelo X no card.
  - `LayoutAnimation.easeInEaseOut` em transições de blocos.
- **Estado local:** `categoryIndex`, `collectedDebts: OnboardingDebtInput[]`, `credor`, `nature`, `status`, `overdueMonths` (`-1` representa "6+"), `overdueCustom`, `valorMensal`, `valorTotal`, `totalParcelas`, `parcelaAtual`, `juros`, `dueDate: Date | null`, `showDatePicker`, `errors`.
- **Validação Zod:** `onboardingDebtSchema` ([[09-shared]]) por dívida + checagens locais (parcela atual <= total, custom overdue obrigatório quando 6+ selecionado).
- **Chamadas de API:** `useSaveDebts().mutate(allDebts)` → [[04b-api-onboarding]]. Payload: array de `OnboardingDebtInput`.
- **Componentes:** [[06-componentes]] `Button`.
- **Navegação:**
  - Sucesso na última categoria → `router.push("/(onboarding)/expenses")`.
  - Sem categoria selecionada → empty state.

## Expenses

- **Caminho:** `apps/mobile/app/(onboarding)/expenses.tsx`
- **Rota:** `/(onboarding)/expenses`
- **O que o usuário vê:**
  - Progress bar 100%, "Passo 4 de 4 · se não souber algum valor, deixe zerado".
  - Botão "Voltar".
  - Step label "Despesas fixas", título "Suas contas fixas do mês".
  - 5 `TextInput` mascarados: Aluguel/prestação (`housing`), Luz/água/gás (`bills`), Mercado (`food`), Transporte (`transport`), Internet/celular (`telecom`).
  - `Button` **Gerar meu plano**.
- **O que pode fazer:**
  - `handleGeneratePlan` aplica `unmaskCurrency`, monta objeto, valida `onboardingExpensesSchema` ([[09-shared]]).
  - Fluxo encadeado: `useSaveExpenses().mutate(...)` → `useCompleteOnboarding().mutate()` em sucesso → `router.replace("/")`.
  - Se já salvou despesas e o complete falhou, próximo tap dispara só `completeOnboarding`.
  - Erros mostram `Alert.alert`.
- **Estado local:** `values`, `expensesSaved` (flag para retry), `errors`.
- **Chamadas de API:**
  - `POST /onboarding/expenses` via `useSaveExpenses` em [[04b-api-onboarding]].
  - `POST /onboarding/complete` via `useCompleteOnboarding`.
- **Mapeamento de erros:** as chaves dos campos UI (`aluguel`, `utilidades`, etc.) mapeiam para `apiKey` (`housing`, `bills`, `food`, `transport`, `telecom`) para casar com a resposta de erro do schema.
- **Componentes:** [[06-componentes]] `Button`.

## Notas relacionadas

- [[07-telas-overview]]
- [[07a-telas-auth]]
- [[07c-telas-tabs]]
- [[07d-telas-financas]]
- [[07e-telas-profile]]
- [[07f-telas-modais]]
- [[04b-api-onboarding]]
- [[05-stores]]
- [[06-componentes]]
- [[09-shared]]
