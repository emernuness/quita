# Quita — Fase 2: Modelagem de Domínio e Schema de Banco

> **Status:** rascunho para validação
> **Data:** 16 de maio de 2026
> **Insumo:** Fase 1 aprovada
> **Stack-alvo:** Prisma 6 + PostgreSQL (Supabase) + Zod no `@quita/shared`
> **Premissa de migração:** aditiva, não-destrutiva (preserva dados de testers)

---

## Sumário executivo

Estado atual do schema: **12 tabelas, ~120 campos, 11 enums**. Após esta fase: **20 tabelas, ~240 campos, 28 enums**. A maior parte do volume vem das tabelas de referência (mínimo vital regional, juros, canais de apoio) e do desdobramento do plano em "longo prazo" (mantém `PaymentPlan`) vs "ação do mês" (novo `MonthlyActionPlan` + `RecommendedAction`).

**Resumo numérico do diff:**

| Item | Antes | Depois | Δ |
|---|---|---|---|
| Tabelas | 12 | 20 | +8 |
| Campos totais | ~120 | ~240 | +120 |
| Enums | 11 | 28 | +17 |
| Migrations a aplicar | — | 7 | — |

**8 tabelas novas:**
`BehaviorProfile`, `MonthlyActionPlan`, `RecommendedAction`, `SettlementEvaluation`, `FinancialStateSnapshot`, `RegionalMinimumVital`, `InterestRateReference`, `SupportChannel`.

**6 tabelas alteradas:**
`User`, `Income`, `Expense`, `DebtCategory`, `Debt`, `PaymentPlan`.

**6 tabelas inalteradas:**
`Payment`, `PlanTimelineItem`, `AiInsight`, `NotificationPreference`, `DataExport`, `UserJourneyStats`.

**Pendências da Fase 1 registradas (não bloqueiam a Fase 2):**
- Fonte do mínimo vital regional (IBGE vs DIEESE) → afeta seed de `RegionalMinimumVital`
- Fonte dos juros de referência (BCB SGS via API) → afeta seed de `InterestRateReference`
- Validador de acordo: formulário, OCR, ou ambos → afeta apenas a Fase 5 (UI)
- Lista oficial de canais de apoio → afeta seed de `SupportChannel`

---

## 1. Princípios de modelagem

Cinco princípios que travam toda decisão de schema desta fase:

**1. Aditivo, não destrutivo.** Nenhum campo é renomeado nem removido nesta fase. Campos novos têm `default` ou são `nullable` para não exigir backfill imediato. Renomeações ficam para uma fase posterior, com plano de migração próprio.

**2. Campos calculados ficam fora do banco, exceto se forem usados em sort/filter.** `priority_score` e `interest_class` (na `Debt`) são calculados, mas armazenados porque a listagem de dívidas é ordenada por eles. Já `essentials_total` (no `MonthlyActionPlan`) é armazenado porque é um snapshot histórico.

**3. JSONB só onde o schema é fluido ou nunca há filtro por dentro.** `behavior_profile.preferences_extra` (jsonb) é OK. Listas de ações do plano viram tabela própria (`RecommendedAction`), não jsonb — porque queremos filtrar por status, listar pendentes, etc.

**4. Snapshots para histórico.** Quando o estado financeiro muda, gravamos uma linha em `FinancialStateSnapshot` em vez de sobrescrever. Permite análise longitudinal e gráficos de evolução.

**5. Tabelas de referência ficam fora do hot path.** `RegionalMinimumVital`, `InterestRateReference` e `SupportChannel` são tabelas seed, atualizadas por job/CLI, com `effective_date` para versionamento.

---

## 2. Diff de tabelas existentes

### 2.1 `User`

**Estado atual:** `id, name, email, phone, passwordHash, avatarInitials, googleId, biometricFingerprint, biometricFace, discreteMode, onboardingStep, onboardingCompleted, planType, planExpiresAt, lastSyncAt, createdAt, updatedAt, deletedAt`.

**Campos a adicionar:**

| Campo | Tipo | Default | Origem | Justificativa |
|---|---|---|---|---|
| `dependentsCount` | `Int? @db.SmallInt` | `0` | Onboarding passo 2 | Alimenta cálculo de mínimo vital |
| `city` | `String? @db.VarChar(100)` | `null` | Onboarding passo 2 | Alimenta consulta a `RegionalMinimumVital` |
| `stateCode` | `String? @db.VarChar(2)` | `null` | Onboarding passo 2 | UF (ex: "RS", "SP") |
| `cityIbgeCode` | `String? @db.VarChar(7)` | `null` | Inferido a partir de city+state | Código IBGE de 7 dígitos |
| `lastFinancialState` | `FinancialState?` | `null` | Calculado pelo motor | Cache do último estado detectado |
| `lastOperationMode` | `OperationMode?` | `null` | Calculado pelo motor | Cache do último modo |
| `lastDecisionAt` | `DateTime?` | `null` | Calculado pelo motor | Quando rodou a última decisão |

**Justificativa do cache (`lastFinancialState`, `lastOperationMode`):**
Embora o estado seja "calculado", ele aparece em quase toda tela autenticada (home, sidebar, badges). Cachear no `User` evita rodar o motor toda vez. O motor recalcula em eventos (mudança de renda/despesa/dívida, virada de mês) e atualiza o cache.

### 2.2 `Income`

**Estado atual:** `id, userId, name, amount, type, dueDate, installments, installmentAmount, sourceCategory, isActive, createdAt, updatedAt`.

**Campos a adicionar:**

| Campo | Tipo | Default | Origem | Justificativa |
|---|---|---|---|---|
| `paymentDay` | `Int? @db.SmallInt` | `null` | Onboarding passo 2 | Dia do mês em que entra (1-31) |
| `confidenceLevel` | `ConfidenceLevel?` | `null` | Onboarding (renda variável) | Alto/Médio/Baixo de confiabilidade |
| `historyMonths` | `Int? @db.SmallInt` | `null` | Onboarding | Meses considerados na média (renda variável) |

### 2.3 `Expense`

**Estado atual:** `id, userId, name, amount, type, category, dueDate, installments, installmentAmount, isActive, createdAt, updatedAt`.

**Campos a adicionar (essenciais para o motor):**

| Campo | Tipo | Default | Origem | Justificativa |
|---|---|---|---|---|
| `isEssential` | `Boolean` | `false` | Classificador ou onboarding | Define se entra em `essentials_total` |
| `isIncomeRelated` | `Boolean` | `false` | Onboarding ("depende para trabalhar?") | Protege fonte de renda |
| `isLegalObligation` | `Boolean` | `false` | Classificador (pensão, multa, etc.) | Obrigação legal |
| `canReduce` | `Boolean` | `false` | Onboarding | Se pode ser cortado |
| `canCancel` | `Boolean` | `false` | Onboarding | Se pode ser cancelado |
| `consequenceIfUnpaid` | `ConsequenceType?` | `null` | Inferido por categoria + onboarding | Auxilia mensagem de risco |

**Enum `ExpenseCategory` a expandir.** Estado atual: `housing, bills, food, transport, telecom, other`. Refatorado:

```prisma
enum ExpenseCategory {
  housing       // aluguel, financiamento, condomínio, IPTU
  utilities     // luz, água, gás (separado de telecom)
  telecom       // internet, celular, TV
  food          // mercado, refeições essenciais
  transport     // combustível, transporte público, manutenção
  health        // plano de saúde, medicamentos contínuos
  education     // mensalidade, material
  childcare     // creche, babá
  work_tools    // ferramentas/equipamentos para trabalhar
  insurance     // seguros essenciais
  legal         // pensão, multa, taxa judicial
  subscription  // assinaturas não essenciais
  leisure       // lazer, restaurante
  other
}
```

**Estratégia de migração de `bills`:** quem tinha `category = bills` precisa ser reclassificado em `utilities`. Como o MVP ainda não tem usuários reais, isso é um simples `UPDATE expenses SET category = 'utilities' WHERE category = 'bills'` na seed/migration. Removemos `bills` da enum.

### 2.4 `DebtCategory`

**Estado atual:** `id, slug, name, icon, createdAt`.

**Campos a adicionar:**

| Campo | Tipo | Default | Justificativa |
|---|---|---|---|
| `defaultRiskClass` | `RiskClass` | `medium` | Base para `priority_score` inicial |
| `affectsSurvivalDefault` | `Boolean` | `false` | Default que cada dívida pode sobrescrever |
| `affectsIncomeDefault` | `Boolean` | `false` | Idem |
| `hasLegalRiskDefault` | `Boolean` | `false` | Idem |
| `description` | `String? @db.VarChar(500)` | `null` | Texto explicativo no onboarding |
| `displayOrder` | `Int @db.SmallInt` | `100` | Ordem das categorias no onboarding |

**Estratégia:** essas categorias são alimentadas por seed. A `priority-engine` consulta primeiro a dívida (campos individuais); se não preenchidos, recorre ao default da categoria.

### 2.5 `Debt`

A maior alteração. Estado atual: `id, userId, categoryId, creditor, totalAmount, nature, monthlyAmount, amountPaid, hasInterest, dueDate, status, overdueMonths, totalInstallments, currentInstallment, priorityOrder, paidAt, interestSaved, createdAt, updatedAt`.

**Campos a adicionar (15):**

| Campo | Tipo | Default | Origem | Justificativa |
|---|---|---|---|---|
| `affectsSurvival` | `Boolean` | `false` | Onboarding passo 4 | Ameaça moradia/comida/saúde |
| `affectsIncome` | `Boolean` | `false` | Onboarding passo 4 | Ameaça fonte de renda |
| `hasLegalRisk` | `Boolean` | `false` | Onboarding passo 4 | Risco judicial |
| `hasCollateral` | `Boolean` | `false` | Onboarding passo 4 | Tem garantia |
| `collateralType` | `CollateralType?` | `null` | Onboarding passo 4 | Veículo, imóvel, consignado |
| `isNegotiable` | `Boolean` | `true` | Onboarding passo 4 | Aceita renegociação |
| `interestRateMonthly` | `Decimal? @db.Decimal(7,4)` | `null` | Onboarding ou referência | Taxa mensal |
| `interestRateAnnual` | `Decimal? @db.Decimal(7,4)` | `null` | Calculado ou onboarding | Taxa anual |
| `interestClass` | `InterestClass` | `unknown` | Calculado | Alto/Médio/Baixo/Desconhecido |
| `settlementCashAmount` | `Decimal? @db.Decimal(12,2)` | `null` | Onboarding passo 4 ou validador | Acordo à vista |
| `settlementInstallments` | `Int? @db.SmallInt` | `null` | Onboarding passo 4 | Parcelas do acordo |
| `settlementInstallmentAmount` | `Decimal? @db.Decimal(12,2)` | `null` | Onboarding passo 4 | Valor da parcela |
| `settlementDeadline` | `DateTime? @db.Date` | `null` | Onboarding passo 4 | Prazo da proposta |
| `stressLevel` | `Int? @db.SmallInt` | `null` | Onboarding passo 4 | Escala 1-3 ("tira o sono?") |
| `priorityScore` | `Decimal? @db.Decimal(7,2)` | `null` | Calculado | Score do `priority-engine` |
| `priorityReason` | `String? @db.VarChar(500)` | `null` | Calculado | Frase curta com o porquê |

**Campos existentes que mudam de uso:**
- `priorityOrder` (atual): vira **derivado** de `priorityScore`. Não removemos, mas a fonte da verdade vira `priorityScore`. Pode ser deprecado em fase futura.
- `monthlyAmount` (atual): permanece, é a parcela mínima atual.

### 2.6 `PaymentPlan`

Estado atual: `strategy, monthlyAvailable, totalDebtsCount, paidDebtsCount, progressPercent, isCritical, allPaid, isActive, generatedAt`.

**Decisão estrutural:** `PaymentPlan` continua sendo o **plano de longo prazo** (timeline com todas as dívidas — tela 13). O **plano do mês** (tela 09) vira a tabela nova `MonthlyActionPlan` (seção 3.2). Isso isola dois ciclos de vida diferentes (longo prazo recalcula raramente; plano do mês recalcula todo mês).

**Campos a adicionar em `PaymentPlan`:**

| Campo | Tipo | Default | Justificativa |
|---|---|---|---|
| `lastFinancialState` | `FinancialState?` | `null` | Estado quando o plano foi gerado |
| `safeCapacity` | `Decimal? @db.Decimal(12,2)` | `null` | Capacidade segura no momento da geração |
| `simulationConservative` | `Json?` | `null` | Cenário conservador |
| `simulationOptimized` | `Json?` | `null` | Cenário otimizado |
| `simulationAccelerated` | `Json?` | `null` | Cenário acelerado |
| `estimatedPayoffMonthsMin` | `Int? @db.SmallInt` | `null` | Faixa mínima |
| `estimatedPayoffMonthsMax` | `Int? @db.SmallInt` | `null` | Faixa máxima |

**Enum `PlanStrategy` a estender.** Estado atual: `smallest_first, highest_interest, custom`. Adicionar:
```prisma
enum PlanStrategy {
  smallest_first    // legado, equivale a snowball
  highest_interest  // legado, equivale a avalanche
  custom            // legado
  snowball          // novo, semântico
  avalanche         // novo, semântico
  hybrid            // novo, padrão para perfil real
  crisis            // novo, ativo em estados críticos
}
```

Os valores legados ficam mantidos por compatibilidade do schema atual. O motor novo grava sempre os 4 novos. Em fase futura, migrar dados antigos para os novos e remover os legados.

---

## 3. Tabelas novas

### 3.1 `BehaviorProfile` (1:1 com `User`)

Perfil comportamental do usuário, alimentado pelo passo 5 do onboarding e atualizado nas revisões mensais.

```prisma
model BehaviorProfile {
  id                String              @id @default(uuid())
  userId            String              @unique @map("user_id")
  preferredStrategy PreferredStrategy   @default(undecided) @map("preferred_strategy")
  mainConcern       MainConcern?        @map("main_concern")
  motivationLevel   Int?                @map("motivation_level") @db.SmallInt
  disciplineLevel   Int?                @map("discipline_level") @db.SmallInt
  preferencesExtra  Json?               @map("preferences_extra")
  createdAt         DateTime            @default(now()) @map("created_at")
  updatedAt         DateTime            @updatedAt @map("updated_at")

  user              User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("behavior_profiles")
}
```

`motivationLevel` e `disciplineLevel` são auto-declarados (1-3); o motor pode ajustá-los ao longo do tempo via heurística (ex: usuário marca todas as ações como feitas por 3 meses → disciplina +1).

### 3.2 `MonthlyActionPlan` (N:1 com `User`, 1 ativo por mês)

O plano do mês corrente — a tela mais importante do app.

```prisma
model MonthlyActionPlan {
  id                    String              @id @default(uuid())
  userId                String              @map("user_id")
  referenceMonth        DateTime            @map("reference_month") @db.Date
  financialState        FinancialState      @map("financial_state")
  operationMode         OperationMode       @map("operation_mode")
  incomeNetMonthly      Decimal             @map("income_net_monthly") @db.Decimal(12, 2)
  essentialsTotal       Decimal             @map("essentials_total") @db.Decimal(12, 2)
  incomeProtectiveTotal Decimal             @map("income_protective_total") @db.Decimal(12, 2)
  legalsTotal           Decimal             @map("legals_total") @db.Decimal(12, 2)
  minimumVital          Decimal             @map("minimum_vital") @db.Decimal(12, 2)
  safeCapacity          Decimal             @map("safe_capacity") @db.Decimal(12, 2)
  mainGoal              String              @map("main_goal") @db.VarChar(500)
  warnings              Json?               // string[]
  nextReviewDate        DateTime?           @map("next_review_date") @db.Date
  isActive              Boolean             @default(true) @map("is_active")
  generatedAt           DateTime            @default(now()) @map("generated_at")
  createdAt             DateTime            @default(now()) @map("created_at")
  updatedAt             DateTime            @updatedAt @map("updated_at")

  user                  User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  actions               RecommendedAction[]

  @@unique([userId, referenceMonth])
  @@index([userId, isActive])
  @@map("monthly_action_plans")
}
```

Há **um plano por usuário por mês de referência**. Quando o motor recalcula no meio do mês, o plano existente é atualizado in-place; ações antigas podem ser marcadas como obsoletas se necessário. Quando vira o mês, gera-se um novo plano.

### 3.3 `RecommendedAction` (N:1 com `MonthlyActionPlan`)

Cada item da lista "Plano do mês".

```prisma
model RecommendedAction {
  id                       String              @id @default(uuid())
  planId                   String              @map("plan_id")
  order                    Int                 @db.SmallInt
  actionType               ActionType          @map("action_type")
  targetType               TargetType          @map("target_type")
  targetDebtId             String?             @map("target_debt_id")
  targetExpenseId          String?             @map("target_expense_id")
  targetLabel              String              @map("target_label") @db.VarChar(255)
  amount                   Decimal?            @db.Decimal(12, 2)
  maxAffordableInstallment Decimal?            @map("max_affordable_installment") @db.Decimal(12, 2)
  reason                   String              @db.VarChar(500)
  dueDate                  DateTime?           @map("due_date") @db.Date
  status                   ActionStatus        @default(pending)
  completedAt              DateTime?           @map("completed_at")
  dismissedReason          String?             @map("dismissed_reason") @db.VarChar(255)
  createdAt                DateTime            @default(now()) @map("created_at")
  updatedAt                DateTime            @updatedAt @map("updated_at")

  plan                     MonthlyActionPlan   @relation(fields: [planId], references: [id], onDelete: Cascade)
  targetDebt               Debt?               @relation(fields: [targetDebtId], references: [id], onDelete: SetNull)
  targetExpense            Expense?            @relation(fields: [targetExpenseId], references: [id], onDelete: SetNull)

  @@index([planId, status])
  @@index([targetDebtId])
  @@map("recommended_actions")
}
```

Polimorfismo soft: `targetDebtId` ou `targetExpenseId` apontam para a entidade alvo (ou nenhum, no caso de ações gerais como "monitore o saldo"). `targetLabel` é a string de exibição cacheada (para não fazer join na tela).

### 3.4 `SettlementEvaluation` (N:1 com `Debt` e `User`)

Histórico de avaliações de propostas de acordo. Cada vez que o validador roda, uma linha é gravada.

```prisma
model SettlementEvaluation {
  id                          String                    @id @default(uuid())
  userId                      String                    @map("user_id")
  debtId                      String                    @map("debt_id")
  proposalCashAmount          Decimal?                  @map("proposal_cash_amount") @db.Decimal(12, 2)
  proposalInstallments        Int?                      @map("proposal_installments") @db.SmallInt
  proposalInstallmentAmount   Decimal?                  @map("proposal_installment_amount") @db.Decimal(12, 2)
  proposalDeadline            DateTime?                 @map("proposal_deadline") @db.Date
  recommendation              SettlementRecommendation
  maxSafeInstallment          Decimal?                  @map("max_safe_installment") @db.Decimal(12, 2)
  discountPercent             Decimal?                  @map("discount_percent") @db.Decimal(5, 2)
  wouldCauseNegativeCashflow  Boolean                   @default(false) @map("would_cause_negative_cashflow")
  reasoning                   String                    @db.VarChar(1000)
  capacityAtEvaluation        Decimal                   @map("capacity_at_evaluation") @db.Decimal(12, 2)
  evaluatedAt                 DateTime                  @default(now()) @map("evaluated_at")

  user                        User                      @relation(fields: [userId], references: [id], onDelete: Cascade)
  debt                        Debt                      @relation(fields: [debtId], references: [id], onDelete: Cascade)

  @@index([userId, evaluatedAt])
  @@index([debtId])
  @@map("settlement_evaluations")
}
```

Essa tabela atende três propósitos: auditoria (provar para o usuário que o app não recomendou um acordo ruim), histórico (Premium mostra todas as propostas avaliadas), e rate-limit (Free libera 1 avaliação por mês — basta contar registros).

### 3.5 `FinancialStateSnapshot` (histórico)

Toda vez que o motor recalcula o estado financeiro, grava-se um snapshot. Usado para gráficos de evolução, detecção de tendências, análise interna.

```prisma
model FinancialStateSnapshot {
  id                    String              @id @default(uuid())
  userId                String              @map("user_id")
  state                 FinancialState
  mode                  OperationMode
  incomeNetMonthly      Decimal             @map("income_net_monthly") @db.Decimal(12, 2)
  essentialsTotal       Decimal             @map("essentials_total") @db.Decimal(12, 2)
  debtsTotal            Decimal             @map("debts_total") @db.Decimal(12, 2)
  safeCapacity          Decimal             @map("safe_capacity") @db.Decimal(12, 2)
  triggerEvent          String?             @map("trigger_event") @db.VarChar(50)
  capturedAt            DateTime            @default(now()) @map("captured_at")

  user                  User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, capturedAt])
  @@map("financial_state_snapshots")
}
```

`triggerEvent` é uma string curta como `"income_added"`, `"expense_changed"`, `"month_rollover"`, `"manual_recalc"` — útil para entender o que motivou o recálculo.

### 3.6 `RegionalMinimumVital` (referência)

Tabela seed com mínimo vital sugerido por estado/região. **Pendência da Fase 1:** definir se a fonte é IBGE (POF — Pesquisa de Orçamentos Familiares) ou DIEESE (cesta básica regional).

```prisma
model RegionalMinimumVital {
  id              String      @id @default(uuid())
  stateCode       String      @map("state_code") @db.VarChar(2)
  regionType      RegionType  @map("region_type")
  baseAmountSingle Decimal    @map("base_amount_single") @db.Decimal(12, 2)
  basePerDependent Decimal    @map("base_per_dependent") @db.Decimal(12, 2)
  effectiveDate   DateTime    @map("effective_date") @db.Date
  source          String      @db.VarChar(50)
  sourceUrl       String?     @map("source_url") @db.VarChar(500)
  createdAt       DateTime    @default(now()) @map("created_at")

  @@unique([stateCode, regionType, effectiveDate])
  @@map("regional_minimum_vital")
}
```

Cálculo no motor: `minimum_vital = base_amount_single + (base_per_dependent * dependents_count)`.

### 3.7 `InterestRateReference` (referência)

Tabela seed com juros médios de mercado por categoria de dívida. **Pendência da Fase 1:** definir se a fonte é a série temporal do Banco Central (SGS / API pública), atualizada por job mensal.

```prisma
model InterestRateReference {
  id                  String              @id @default(uuid())
  debtCategorySlug    String              @map("debt_category_slug") @db.VarChar(50)
  monthlyRateMin      Decimal             @map("monthly_rate_min") @db.Decimal(7, 4)
  monthlyRateMax      Decimal             @map("monthly_rate_max") @db.Decimal(7, 4)
  monthlyRateMedian   Decimal             @map("monthly_rate_median") @db.Decimal(7, 4)
  effectiveDate       DateTime            @map("effective_date") @db.Date
  source              String              @db.VarChar(100)
  sourceSeriesCode    String?             @map("source_series_code") @db.VarChar(50)
  createdAt           DateTime            @default(now()) @map("created_at")

  @@unique([debtCategorySlug, effectiveDate])
  @@map("interest_rate_references")
}
```

Usado pelo `debt-classification-service` para classificar `interestClass` (high/medium/low) quando o usuário não sabe a taxa de uma dívida.

### 3.8 `SupportChannel` (referência)

Canais de encaminhamento (Procon, Defensoria, consumidor.gov.br, mutirões, etc.). **Pendência da Fase 1:** definir a lista inicial.

```prisma
model SupportChannel {
  id              String                @id @default(uuid())
  slug            String                @unique @db.VarChar(100)
  name            String                @db.VarChar(255)
  channelType     SupportChannelType    @map("channel_type")
  scope           SupportChannelScope
  stateCode       String?               @map("state_code") @db.VarChar(2)
  cityIbgeCode    String?               @map("city_ibge_code") @db.VarChar(7)
  phone           String?               @db.VarChar(30)
  url             String?               @db.VarChar(500)
  description     String?               @db.VarChar(1000)
  worksForStates  Json?                 @map("works_for_states") // string[] de UFs
  isActive        Boolean               @default(true) @map("is_active")
  displayOrder    Int                   @default(100) @map("display_order") @db.SmallInt
  createdAt       DateTime              @default(now()) @map("created_at")
  updatedAt       DateTime              @updatedAt @map("updated_at")

  @@index([scope, stateCode, isActive])
  @@map("support_channels")
}
```

Acionada pelos Modos Proteção e Sobrevivência. Filtragem por UF do usuário.

---

## 4. Enums novos (17)

```prisma
enum FinancialState {
  saudavel_com_divida
  apertado
  deficit_mensal
  superendividamento
  insolvencia_pratica
}

enum OperationMode {
  quitacao
  estabilizacao
  crise
  protecao
  sobrevivencia
}

enum ConsequenceType {
  service_cut
  loss_of_asset
  legal_action
  fine
  none
}

enum CollateralType {
  none
  vehicle
  property
  salary
  other
}

enum InterestClass {
  high
  medium
  low
  unknown
}

enum RiskClass {
  critical
  high
  medium
  low
}

enum ConfidenceLevel {
  high
  medium
  low
}

enum ActionType {
  pay
  negotiate
  pause
  cut
  wait
  review
  refuse
  monitor
}

enum TargetType {
  debt
  expense
  income
  general
}

enum ActionStatus {
  pending
  completed
  skipped
  dismissed
  expired
}

enum SettlementRecommendation {
  accept
  negotiate_lower
  reject
}

enum PreferredStrategy {
  snowball
  avalanche
  hybrid
  undecided
}

enum MainConcern {
  collection_pressure
  service_cut_risk
  disorganization
  shame
  where_to_start
}

enum RegionType {
  capital
  metro
  interior
}

enum SupportChannelType {
  procon
  defensoria
  federal_gov
  bank_mediation
  ngo
  serasa
  other
}

enum SupportChannelScope {
  federal
  state
  municipal
}
```

---

## 5. Schemas Zod no `@quita/shared`

Para cada entidade nova ou modificada, schemas Zod compartilhados entre `apps/api` (validação na borda) e `apps/web` / `apps/mobile` (validação no formulário). Mostro abaixo apenas os críticos.

### 5.1 `incomeInputSchema` (estende o atual)

```typescript
// packages/shared/src/schemas/income.schema.ts
import { z } from 'zod';

export const incomeInputSchema = z.object({
  name: z.string().min(1).max(255),
  amount: z.number().nonnegative(),
  type: z.enum(['fixed', 'one_time', 'recurring']),
  dueDate: z.string().date().optional(),
  installments: z.number().int().min(1).max(60).optional(),
  installmentAmount: z.number().nonnegative().optional(),
  sourceCategory: z.enum(['salary', 'extra', 'help', 'other']).optional(),
  // NOVO
  paymentDay: z.number().int().min(1).max(31).optional(),
  confidenceLevel: z.enum(['high', 'medium', 'low']).optional(),
  historyMonths: z.number().int().min(1).max(12).optional(),
});

export type IncomeInput = z.infer<typeof incomeInputSchema>;
```

### 5.2 `expenseInputSchema` (estende o atual)

```typescript
export const expenseInputSchema = z.object({
  name: z.string().min(1).max(255),
  amount: z.number().nonnegative(),
  type: z.enum(['fixed', 'one_time', 'recurring']),
  category: z.enum([
    'housing', 'utilities', 'telecom', 'food', 'transport',
    'health', 'education', 'childcare', 'work_tools',
    'insurance', 'legal', 'subscription', 'leisure', 'other',
  ]),
  dueDate: z.string().date().optional(),
  installments: z.number().int().min(1).max(60).optional(),
  installmentAmount: z.number().nonnegative().optional(),
  // NOVO
  isEssential: z.boolean().default(false),
  isIncomeRelated: z.boolean().default(false),
  isLegalObligation: z.boolean().default(false),
  canReduce: z.boolean().default(false),
  canCancel: z.boolean().default(false),
  consequenceIfUnpaid: z.enum([
    'service_cut', 'loss_of_asset', 'legal_action', 'fine', 'none',
  ]).optional(),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
```

### 5.3 `debtInputSchema` (estende muito)

```typescript
export const debtInputSchema = z.object({
  // Existentes
  categoryId: z.string().uuid(),
  creditor: z.string().min(1).max(255),
  totalAmount: z.number().nonnegative(),
  nature: z.enum(['installment', 'recurring', 'one_time']).default('one_time'),
  monthlyAmount: z.number().nonnegative().optional(),
  hasInterest: z.boolean().optional(),
  dueDate: z.string().date().optional(),
  totalInstallments: z.number().int().min(1).max(360).optional(),
  currentInstallment: z.number().int().min(0).optional(),
  // NOVOS — risco
  affectsSurvival: z.boolean().default(false),
  affectsIncome: z.boolean().default(false),
  hasLegalRisk: z.boolean().default(false),
  hasCollateral: z.boolean().default(false),
  collateralType: z.enum(['none', 'vehicle', 'property', 'salary', 'other']).optional(),
  isNegotiable: z.boolean().default(true),
  // NOVOS — juros
  interestRateMonthly: z.number().min(0).max(50).optional(), // % ao mês
  interestRateAnnual: z.number().min(0).max(1000).optional(), // % ao ano
  // NOVOS — acordo disponível
  settlementCashAmount: z.number().nonnegative().optional(),
  settlementInstallments: z.number().int().min(1).max(60).optional(),
  settlementInstallmentAmount: z.number().nonnegative().optional(),
  settlementDeadline: z.string().date().optional(),
  // NOVOS — comportamental
  stressLevel: z.number().int().min(1).max(3).optional(),
});

export type DebtInput = z.infer<typeof debtInputSchema>;
```

### 5.4 `settlementProposalSchema` (novo)

Para o validador de acordo.

```typescript
export const settlementProposalSchema = z.object({
  debtId: z.string().uuid(),
  proposalCashAmount: z.number().nonnegative().optional(),
  proposalInstallments: z.number().int().min(1).max(60).optional(),
  proposalInstallmentAmount: z.number().nonnegative().optional(),
  proposalDeadline: z.string().date().optional(),
}).refine(
  (data) =>
    (data.proposalCashAmount !== undefined) ||
    (data.proposalInstallments !== undefined && data.proposalInstallmentAmount !== undefined),
  { message: 'Informe o valor à vista ou a configuração de parcelamento.' },
);
```

### 5.5 `behaviorProfileInputSchema` (novo)

```typescript
export const behaviorProfileInputSchema = z.object({
  preferredStrategy: z.enum(['snowball', 'avalanche', 'hybrid', 'undecided']).default('undecided'),
  mainConcern: z.enum([
    'collection_pressure', 'service_cut_risk', 'disorganization',
    'shame', 'where_to_start',
  ]).optional(),
  motivationLevel: z.number().int().min(1).max(3).optional(),
  disciplineLevel: z.number().int().min(1).max(3).optional(),
});
```

### 5.6 `monthlyActionPlanSchema` (saída do motor — não-input)

Schema do payload que o front consome. Mesma estrutura da seção 7.10 da Fase 1.

```typescript
export const recommendedActionSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int(),
  actionType: z.enum([
    'pay', 'negotiate', 'pause', 'cut', 'wait', 'review', 'refuse', 'monitor',
  ]),
  targetType: z.enum(['debt', 'expense', 'income', 'general']),
  targetDebtId: z.string().uuid().nullable(),
  targetExpenseId: z.string().uuid().nullable(),
  targetLabel: z.string(),
  amount: z.number().nullable(),
  maxAffordableInstallment: z.number().nullable(),
  reason: z.string(),
  dueDate: z.string().date().nullable(),
  status: z.enum(['pending', 'completed', 'skipped', 'dismissed', 'expired']),
});

export const monthlyActionPlanSchema = z.object({
  id: z.string().uuid(),
  referenceMonth: z.string().date(),
  financialState: z.enum([
    'saudavel_com_divida', 'apertado', 'deficit_mensal',
    'superendividamento', 'insolvencia_pratica',
  ]),
  operationMode: z.enum([
    'quitacao', 'estabilizacao', 'crise', 'protecao', 'sobrevivencia',
  ]),
  safeCapacity: z.number(),
  mainGoal: z.string(),
  warnings: z.array(z.string()),
  nextReviewDate: z.string().date().nullable(),
  actions: z.array(recommendedActionSchema),
});

export type MonthlyActionPlan = z.infer<typeof monthlyActionPlanSchema>;
```

---

## 6. Estratégia de migrations (em ordem)

Sete migrations sequenciais, cada uma pequena e reversível:

| # | Nome | O que faz |
|---|---|---|
| 1 | `2026XX_add_enums` | Cria todos os 17 enums novos |
| 2 | `2026XX_extend_user_income_expense` | Adiciona campos novos em `User`, `Income`, `Expense`; expande enum `ExpenseCategory` (adiciona valores novos, mantém `bills` por enquanto) |
| 3 | `2026XX_extend_debt_category` | Adiciona campos novos em `DebtCategory` |
| 4 | `2026XX_extend_debt` | Adiciona os 15 campos novos em `Debt` |
| 5 | `2026XX_extend_payment_plan` | Adiciona campos novos em `PaymentPlan`; estende enum `PlanStrategy` |
| 6 | `2026XX_create_new_tables` | Cria as 8 tabelas novas + índices |
| 7 | `2026XX_seed_references` | Seed inicial de `DebtCategory` (com novos defaults), `RegionalMinimumVital` (placeholder), `InterestRateReference` (placeholder), `SupportChannel` (placeholder) |

**Sobre o seed:** as tabelas de referência ganham dados de **placeholder** nesta migration (ex: mínimo vital nacional único, juros médios genéricos, lista mínima de canais — consumidor.gov.br, Procon SP, Defensoria SP). Quando as fontes definitivas forem decididas (Fase 3), criamos a migration `2026XX_seed_references_v2`.

**Sobre testers existentes:** como o projeto ainda é MVP sem usuários reais, **não há backfill necessário**. Caso houvesse, faríamos uma 8ª migration `2026XX_backfill_classifications` que rodaria o classificador para popular `is_essential`, `priority_score`, etc., em registros existentes.

---

## 7. Índices recomendados

```sql
-- novos índices (além dos que já existem)
CREATE INDEX idx_monthly_action_plans_user_active
  ON monthly_action_plans(user_id, is_active);

CREATE UNIQUE INDEX uq_monthly_action_plans_user_month
  ON monthly_action_plans(user_id, reference_month);

CREATE INDEX idx_recommended_actions_plan_status
  ON recommended_actions(plan_id, status);

CREATE INDEX idx_recommended_actions_target_debt
  ON recommended_actions(target_debt_id) WHERE target_debt_id IS NOT NULL;

CREATE INDEX idx_settlement_evaluations_user_date
  ON settlement_evaluations(user_id, evaluated_at);

CREATE INDEX idx_settlement_evaluations_debt
  ON settlement_evaluations(debt_id);

CREATE INDEX idx_financial_state_snapshots_user_date
  ON financial_state_snapshots(user_id, captured_at);

CREATE INDEX idx_support_channels_scope_state
  ON support_channels(scope, state_code, is_active);

-- estendidos
CREATE INDEX idx_debts_priority
  ON debts(user_id, priority_score DESC) WHERE status != 'paid';

CREATE INDEX idx_expenses_user_essential
  ON expenses(user_id, is_essential) WHERE is_active = true;
```

---

## 8. Tabelas de referência — formato de seed (placeholder inicial)

### 8.1 `DebtCategory` (seed atualizado)

| slug | name | defaultRiskClass | affectsSurvival | affectsIncome | hasLegalRisk |
|---|---|---|---|---|---|
| `essential_arrears` | Atrasos em essenciais (luz, água, aluguel) | `critical` | true | true | false |
| `credit_card` | Cartão de crédito | `high` | false | false | false |
| `overdraft` | Cheque especial | `high` | false | false | false |
| `vehicle_financing` | Financiamento de veículo | `high` | false | false | true |
| `mortgage` | Financiamento imobiliário | `critical` | true | false | true |
| `personal_loan` | Empréstimo pessoal | `medium` | false | false | false |
| `payroll_loan` | Empréstimo consignado | `medium` | false | true | false |
| `negotiated_old` | Acordo antigo / negativado | `low` | false | false | false |
| `legal_debt` | Pensão, multa, dívida judicial | `critical` | false | true | true |
| `informal_debt` | Família, amigos | `low` | false | false | false |
| `other` | Outros | `medium` | false | false | false |

### 8.2 `RegionalMinimumVital` (placeholder nacional)

Enquanto a fonte definitiva não é escolhida, uma linha única:

| stateCode | regionType | baseAmountSingle | basePerDependent | source |
|---|---|---|---|---|
| `BR` | `metro` | 1320 | 400 | `placeholder_v1` |

Quando IBGE ou DIEESE for escolhido, populamos uma linha por UF/região.

### 8.3 `InterestRateReference` (placeholder)

Faixas conservadoras baseadas em estimativas públicas, todas com `source = "placeholder_v1"`. Quando a integração com o BCB for definida, substituímos.

### 8.4 `SupportChannel` (placeholder mínimo)

Comece com 4 canais federais que valem para todo o Brasil:
- `consumidor_gov_br` (federal_gov, todo Brasil)
- `procon_federal` (federal_gov, todo Brasil)
- `mutirao_renegociacao_febraban` (bank_mediation, todo Brasil)
- `serasa_limpa_nome` (serasa, todo Brasil)

Por UF, completamos depois.

---

## 9. Pendências para destravar Fase 3

Da Fase 1 que permanecem:

1. **Fonte do mínimo vital regional**: IBGE (POF) vs DIEESE (cesta básica) vs híbrido. Posso pesquisar e te trazer recomendação se quiser.
2. **Fonte dos juros de referência**: integração com BCB SGS (API pública gratuita) é a opção mais sólida; pendente confirmar.
3. **Lista oficial de canais de apoio**: 4 federais já dão para começar; lista por UF pode ser construída ao longo do tempo.
4. **Validador de acordo — modo de entrada**: formulário sempre, OCR como upgrade no Premium é uma sugestão minha; falta sua palavra final.

Nenhuma trava a Fase 3.

---

## 10. Próximos passos (Fase 3 — Motor de Decisão)

Com o schema definido, a Fase 3 entra no **comportamento** dos 8 módulos do motor:

- Contratos TypeScript (interfaces) de input/output de cada módulo
- Pseudocódigo detalhado de `financial-state-detector`, `priority-engine`, `strategy-selector`, `simulator` e `settlement-validator`
- Regras de classificação automática de despesa e dívida (quando o app pode inferir sem perguntar)
- Tabela de pesos do score de prioridade (refinamento da seção 7.5 da Fase 1)
- Eventos que disparam recálculo (mudança de renda, virada de mês, novo pagamento)
- Casos de borda (renda zerada, dívida sem credor, acordo expirado, etc.)
- Estratégia de testes (unit por módulo, integração por cenário)

A Fase 3 não toca em UI nem em endpoints HTTP — só especifica o comportamento puro. A Fase 4 traduz isso em arquitetura NestJS (controllers, services, jobs).

---

*Fim do documento da Fase 2.*
