---
title: 07f - Telas Modais
tags: [mobile, telas, modals]
created: 2026-05-04
---

# 07f - Telas Modais

Grupo `(modals)` em `apps/mobile/app/(modals)/_layout.tsx` configurado com `presentation: "modal"` e `contentStyle.backgroundColor = colors.surface`. Todas as telas têm bordas arredondadas no topo (`borderTopLeftRadius: radius.lg`).

Apresentadas via `router.push("/(modals)/...")` e dispensadas com `router.back()`.

## New Item Picker

- **Caminho:** `apps/mobile/app/(modals)/new-item-picker.tsx`
- **Rota:** `/(modals)/new-item-picker`
- **O que o usuário vê:**
  - Botão X de fechar.
  - Título "O que você quer adicionar?" + subtítulo.
  - 3 pills clicáveis com ícone Feather + label + subtitle + chevron-right:
    - **Nova receita** → `/(modals)/new-income`
    - **Nova dívida** → `/(modals)/new-debt`
    - **Nova despesa** → `/(modals)/new-expense`
- **O que pode fazer:** `handleSelect(route)` chama `router.back()` e depois `setTimeout(() => router.push(route), 300)` para que o modal anterior feche antes do próximo aparecer.
- **Estado local:** nenhum.
- **Chamadas de API:** nenhuma — só roteamento.

## New Income

- **Caminho:** `apps/mobile/app/(modals)/new-income.tsx`
- **Rota:** `/(modals)/new-income`
- **O que o usuário vê (revelação progressiva por blocos):**
  - "Voltar", título "Nova receita", subtítulo "Quanto mais preciso, melhor o seu plano."
  - **Bloco 1**: `TextInput` Nome da receita; lista de pills verticais para origem (`SOURCE_OPTIONS`): Salário, Extra, Ajuda, Outro com subtítulos.
  - **Bloco 2** (após escolher origem): pills de tipo (Fixa / Pontual / Recorrente) e `TextInput` Valor com `maskCurrency`.
  - **Bloco 3** (após preencher valor): trigger de DateTimePicker para "Data de recebimento (se souber)" e seção opcional **Parcelamento** (apenas quando tipo ≠ "fixed") com "X parcelas de R$ Y".
  - `Button` **Salvar receita**.
- **O que pode fazer:**
  - Selecionar origem aplica `LayoutAnimation.easeInEaseOut`.
  - Submit monta `CreateIncomeInput` ([[09-shared]]) com `name`, `amount`, `type`, `sourceCategory?`, `dueDate?` (formato ISO `YYYY-MM-DD`), `installments?`, `installmentAmount?`. Se um lado de parcelamento estiver presente sem o outro, gera erro inline.
  - Valida via `createIncomeSchema` ([[09-shared]]).
  - `useCreateIncome.mutate(data)` em sucesso → `router.back()`.
  - Em erro → `Alert.alert("Erro", …)`.
- **Estado local:** `name`, `sourceCategory`, `incomeType` (default `"fixed"`), `rawAmount`, `dueDate: Date | null`, `showDatePicker`, `installments`, `rawInstallmentValue`, `errors`.
- **Chamadas de API:** `POST /financial/incomes` em [[04c-api-financial]] via `useCreateIncome`.
- **Componentes:** [[06-componentes]] `Button`. Utilitários `maskCurrency`, `unmaskCurrency`, `validateWithZod`.

## New Expense

- **Caminho:** `apps/mobile/app/(modals)/new-expense.tsx`
- **Rota:** `/(modals)/new-expense`
- **O que o usuário vê:**
  - "Voltar", título "Nova despesa", subtítulo "Registre seus gastos fixos e recorrentes."
  - **Bloco 1**: `TextInput` Nome (max 100); chips wrap de categoria (`CATEGORY_OPTIONS`): Moradia, Contas, Alimentação, Transporte, Internet, Outros.
  - **Bloco 2** (após escolher categoria): pills de tipo (Fixa / Pontual / Recorrente) e `TextInput` Valor mascarado.
  - **Bloco 3** (após preencher valor): DateTimePicker para "Data de vencimento (se souber)".
  - `Button` **Salvar despesa**.
- **O que pode fazer:**
  - Submit cria `CreateExpenseInput` ([[09-shared]]) com `name`, `amount`, `type`, `category`, `dueDate?` ISO.
  - Validação via `createExpenseSchema` + checagem de categoria selecionada.
  - `useCreateExpense.mutate(data)` em sucesso → `router.back()`.
  - Erro → `Alert.alert("Erro", …)`.
- **Estado local:** `name`, `category` (default `null`), `expenseType` (default `"fixed"`), `rawAmount`, `dueDate`, `showDatePicker`, `errors`.
- **Chamadas de API:** `POST /financial/expenses` em [[04c-api-financial]] via `useCreateExpense`.
- **Componentes:** [[06-componentes]] `Button`. Helpers de máscara e validação.

## New Debt

- **Caminho:** `apps/mobile/app/(modals)/new-debt.tsx`
- **Rota:** `/(modals)/new-debt`
- **O que o usuário vê:** versão "modal" da tela de detalhe de dívida do onboarding ([[07b-telas-onboarding]] — Debt Detail), porém:
  - Mostra **carrossel horizontal de chips** para escolher a categoria (vindas de `useDebtCategories()`).
  - Sem progress bar, sem fluxo multi-categoria.
  - Mesmos blocos: Credor + natureza → Status/situação + campos por natureza (parcela atual/total, valor mensal/parcela, meses de atraso) → Valor total + juros + DateTimePicker de vencimento.
  - `Button` **Salvar dívida** no rodapé.
- **O que pode fazer:**
  - Validação local (categoria selecionada, credor preenchido, natureza, parcela atual ≤ total, custom de meses se "6+").
  - `validateWithZod(createDebtSchema, data)` ([[09-shared]]).
  - `useCreateDebt.mutate(data)` em sucesso → `router.back()`.
  - Erros → `setErrors` ou `Alert.alert("Erro", …)`.
  - Sugestão automática de valor total (clicável) baseada em parcela × meses ou parcela × parcelas restantes.
- **Estado local:** `selectedCategory: DebtCategory | null`, `credor`, `nature`, `status` (default `"ATRASADA"`), `overdueMonths`, `overdueCustom`, `valorMensal`, `valorTotal`, `totalParcelas`, `parcelaAtual`, `juros`, `dueDate`, `showDatePicker`, `errors`.
- **Chamadas de API:**
  - `useDebtCategories()` (query) → GET categorias em [[04d-api-debts]].
  - `useCreateDebt()` (mutation) → POST `/debts` em [[04d-api-debts]].
- **Componentes:** [[06-componentes]] `Button`.

## Pay Debt

- **Caminho:** `apps/mobile/app/(modals)/pay-debt.tsx`
- **Rota:** `/(modals)/pay-debt`
- **Params:** `debtId` via `useLocalSearchParams<{ debtId: string }>()`. Se ausente, mostra "Dívida não encontrada".
- **O que o usuário vê:**
  - Loader enquanto `useDebt(debtId)` carrega.
  - "Voltar", título "Marcar como pago", subtítulo `"{creditor} — R$ {totalAmount}"`.
  - 3 opções de radio (selecionada = borda teal + fundo info):
    - **Paguei o valor total** (`full`)
    - **Paguei um valor menor** (`partial`)
    - **Fiz um acordo / renegociei** (`renegotiated`)
  - Quando `partial` ou `renegotiated`: input "Quanto você pagou?" mascarado + helper "O saldo restante será atualizado…".
  - `Button` primário **Confirmar pagamento**.
  - Info box "Antes de confirmar" com texto explicativo + 2 links sublinhados ("Ver impacto no plano" / "Adicionar comprovante" — ambos exibem `Alert.alert("Em breve", …)`).
- **O que pode fazer:**
  - `handleConfirmPayment`: para `full`, usa `debt.totalAmount`; para `partial`/`renegotiated`, usa `parsedAmount` (centavos / 100).
  - Valida via `createPaymentSchema` ([[09-shared]]).
  - `useCreatePayment(debtId).mutate({ amount, paymentType })` → sucesso `router.back()`, erro `Alert.alert("Erro", …)`.
- **Estado local:** `selectedOption: "full" | "partial" | "renegotiated"`, `rawAmountPaid`, `errors`.
- **Chamadas de API:**
  - `useDebt(debtId)` → GET `/debts/:id` em [[04d-api-debts]].
  - `useCreatePayment(debtId)` → POST `/debts/:id/payments` em [[04d-api-debts]].
- **Componentes:** [[06-componentes]] `Button`.

## Payment Confirmed

- **Caminho:** `apps/mobile/app/(modals)/payment-confirmed.tsx`
- **Rota:** `/(modals)/payment-confirmed`
- **O que o usuário vê:**
  - Ícone check verde em círculo, título "Pagamento confirmado", subtítulo.
  - Card "Próximos passos" com 3 bullets explicando o recálculo do plano, anexo de comprovante e notificação futura.
  - `Button` primário **Ver impacto no plano** + secundário **Anexar comprovante** — ambos chamam `router.back()`.
- **Estado local:** nenhum.
- **Chamadas de API:** **nenhuma** — tela puramente confirmativa.
- **Componentes:** [[06-componentes]] `Button`.

## Celebration

- **Caminho:** `apps/mobile/app/(modals)/celebration.tsx`
- **Rota:** `/(modals)/celebration`
- **O que o usuário vê:**
  - Ícone `award` verde, título "Parabéns!", subtítulo "Você quitou uma dívida!" + descrição motivacional.
  - **Debt card** mockado: "Cartão Nubank" com badge "Quitada" + linhas Valor total pago, Duração, Economia em juros (verde).
  - **Progresso geral**: header "3 de 5 dívidas" + barra preenchida 60%.
  - `Button` primário **Ver minhas dívidas** + secundário **Compartilhar conquista** — ambos `router.back()`.
- **Estado local:** nenhum. Dados são constantes hardcoded.
- **Chamadas de API:** **nenhuma**.
- **Componentes:** [[06-componentes]] `Button`.

## Critical

- **Caminho:** `apps/mobile/app/(modals)/critical.tsx`
- **Rota:** `/(modals)/critical`
- **O que o usuário vê:**
  - Ícone `alert-triangle` vermelho em fundo `dangerBackground`.
  - Título "Situação crítica" + subtítulo "Suas despesas são iguais ou maiores que sua renda…".
  - **Tabela** com 3 linhas (mock `SUMMARY_ROWS`): Renda mensal R$ 2.800, Despesas fixas R$ 2.950, Sobra para dívidas -R$ 150 (em vermelho).
  - **Card de IA** (`infoBackground`, borda teal) com sugestões em bullet (`AI_SUGGESTIONS`).
  - `Button` primário **Revisar minhas despesas** + secundário **Falar com suporte** — ambos `router.back()`.
- **Estado local:** nenhum.
- **Chamadas de API:** **nenhuma** — alerta visual com dados hardcoded.
- **Componentes:** [[06-componentes]] `Button`.

## Blue Mode

- **Caminho:** `apps/mobile/app/(modals)/blue-mode.tsx`
- **Rota:** `/(modals)/blue-mode`
- **O que o usuário vê:**
  - Fundo com 3 camadas de gradiente brand (`blueModeGradientStart` / `Mid` / `End`).
  - Ícone `award` branco, título "Você está no azul!" + subtítulo "Todas as suas dívidas foram quitadas…".
  - Card "Sua jornada" com 3 stats (mock `STATS`): "5 dívidas quitadas", "8 meses de jornada", "R$ 1.2k economia em juros", separados por divider.
  - Card "Próximo passo" sugerindo reserva de emergência (3 meses).
  - 2 Pressables custom: primário branco **Criar reserva de emergência**, secundário transparente com borda **Ir para o início** — ambos `router.back()`.
- **Estado local:** nenhum.
- **Chamadas de API:** **nenhuma** — celebração final mockada.
- **Componentes:** Pressables nativos, sem `Button` do design system.

## Notas relacionadas

- [[07-telas-overview]]
- [[07a-telas-auth]]
- [[07b-telas-onboarding]]
- [[07c-telas-tabs]]
- [[07d-telas-financas]]
- [[07e-telas-profile]]
- [[04c-api-financial]]
- [[04d-api-debts]]
- [[06-componentes]]
- [[09-shared]]
