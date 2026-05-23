# Quita — Fase 2 v2: Modelagem de Domínio e Schema de Banco

> **Status:** versão 2 — pós ciclo adversarial
> **Data:** 16 de maio de 2026
> **Insumo:** Fase 1 v2 aprovada + Respostas do Ciclo Adversarial aprovadas
> **Stack-alvo:** Prisma 6 + PostgreSQL (Supabase) + Zod no `@quita/shared`
> **Premissa de migração:** aditiva, não-destrutiva
> **Mudanças vs v1:** +12 campos, +4 tabelas, +6 enums novos, naming em inglês, 2 migrations extras

---

## Sumário executivo

**Resumo numérico atualizado:**

| Item | Antes (atual) | v1 | v2 final | Δ vs v1 |
|---|---|---|---|---|
| Tabelas | 12 | 20 | **24** | +4 |
| Campos totais | ~120 | ~240 | **~280** | +40 |
| Enums | 11 | 28 | **34** | +6 |
| Migrations | — | 7 | **9** | +2 |

**12 tabelas novas (8 da v1 + 4 da v2):**
`BehaviorProfile`, `MonthlyActionPlan`, `RecommendedAction`, `SettlementEvaluation`, `FinancialStateSnapshot`, `RegionalMinimumVital`, `InterestRateReference`, `SupportChannel`, **`EmergencyReserve`**, **`UserGoal`**, **`ConsentLog`**, **`ScoringWeight`**.

**6 tabelas alteradas:**
`User`, `Income`, `Expense`, `DebtCategory`, `Debt`, `PaymentPlan`.

**6 tabelas inalteradas:**
`Payment`, `PlanTimelineItem`, `AiInsight`, `NotificationPreference`, `DataExport`, `UserJourneyStats`.

**6 enums novos da v2** (somam aos 17 da v1):
`ExpenseFrequency`, `IncomeStability`, `DiagnosisLevel`, `GoalType`, `RateSource`, `ConsentType`.

**3 enums com mudança de naming (PT-BR → EN):**
`FinancialState`, `OperationMode`, `PlanStrategy` (limpa legados).

---

## 1. Princípios de modelagem

Mantidos da v1 com complemento da v2:

**1. Aditivo, não destrutivo.** Campos novos têm `default` ou são `nullable`.

**2. Campos calculados fora do banco, exceto se usados em sort/filter.** `priorityScore` armazenado. `essentialsTotal` em `MonthlyActionPlan` também (snapshot).

**3. JSONB só onde o schema é fluido ou nunca há filtro por dentro.**

**4. Snapshots para histórico.** `FinancialStateSnapshot` registra mudanças, não sobrescreve.

**5. Tabelas de referência ficam fora do hot path.** Atualizadas por seed/job.

**6. Naming em inglês *(NOVO v2)*.** Tudo no banco e código em EN snake_case. Tradução para PT-BR fica na camada de UI via i18n.

**7. Pesos do motor são dados, não código *(NOVO v2)*.** `ScoringWeight` permite ajustar fórmula sem deploy.

---

## 2. Diff de tabelas existentes

### 2.1 `User`

**Estado atual:** `id, name, email, phone, passwordHash, avatarInitials, googleId, biometricFingerprint, biometricFace, discreteMode, onboardingStep, onboardingCompleted, planType, planExpiresAt, lastSyncAt, createdAt, updatedAt, deletedAt`.

**Campos a adicionar (13 — 7 da v1 + 6 da v2):**

| Campo | Tipo | Default | Origem | Versão |
|---|---|---|---|---|
| `dependentsCount` | `Int? @db.SmallInt` | `0` | Onboarding | v1 |
| `city` | `String? @db.VarChar(100)` | `null` | Onboarding | v1 |
| `stateCode` | `String? @db.VarChar(2)` | `null` | Onboarding | v1 |
| `cityIbgeCode` | `String? @db.VarChar(7)` | `null` | Inferido | v1 |
| `lastFinancialState` | `FinancialState?` | `null` | Cache do motor | v1 |
| `lastOperationMode` | `OperationMode?` | `null` | Cache do motor | v1 |
| `lastDecisionAt` | `DateTime?` | `null` | Cache do motor | v1 |
| `overallIncomeStability` | `IncomeStability?` | `null` | Derivado | **v2** |
| `diagnosisLevel` | `DiagnosisLevel` | `minimal` | Onboarding | **v2** |
| `onboardingCompletedSteps` | `Json?` | `null` | string[] | **v2** |
| `nextReviewDate` | `DateTime? @db.Date` | `null` | Calculado | **v2** |
| `acceptedTermsAt` | `DateTime?` | `null` | Aceite | **v2** |
| `acceptedTermsVersion` | `String? @db.VarChar(20)` | `null` | Aceite | **v2** |

### 2.2 `Income`

**Campos a adicionar (6 — 3 da v1 + 3 da v2):**

| Campo | Tipo | Default | Versão |
|---|---|---|---|
| `paymentDay` | `Int? @db.SmallInt` | `null` | v1 |
| `confidenceLevel` | `ConfidenceLevel?` | `null` | v1 |
| `historyMonths` | `Int? @db.SmallInt` | `null` | v1 |
| `guaranteedAmount` | `Decimal? @db.Decimal(12,2)` | `null` | **v2** |
| `upperBoundAmount` | `Decimal? @db.Decimal(12,2)` | `null` | **v2** |
| `stabilityType` | `IncomeStability` | `stable` | **v2** |

### 2.3 `Expense`

**Campos a adicionar (11 — 6 da v1 + 5 da v2):**

| Campo | Tipo | Default | Versão |
|---|---|---|---|
| `isEssential` | `Boolean` | `false` | v1 |
| `isIncomeRelated` | `Boolean` | `false` | v1 |
| `isLegalObligation` | `Boolean` | `false` | v1 |
| `canReduce` | `Boolean` | `false` | v1 |
| `canCancel` | `Boolean` | `false` | v1 |
| `consequenceIfUnpaid` | `ConsequenceType?` | `null` | v1 |
| `frequency` | `ExpenseFrequency` | `monthly` | **v2** |
| `monthlyProvision` | `Decimal? @db.Decimal(12,2)` | `null` | **v2** |
| `nextOccurrence` | `DateTime? @db.Date` | `null` | **v2** |
| `provisionStartedAt` | `DateTime? @db.Date` | `null` | **v2** |
| `dataConfidence` | `ConfidenceLevel` | `medium` | **v2** |

**Enum `ExpenseCategory` expandido** (mantido da v1; `bills` substituído por `utilities`):

```prisma
enum ExpenseCategory {
  housing       // aluguel, financiamento, condomínio, IPTU
  utilities     // luz, água, gás
  telecom       // internet, celular, TV
  food          // mercado, refeições essenciais
  transport     // combustível, transporte público
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

### 2.4 `DebtCategory`

**Campos a adicionar (6, todos v1):**

| Campo | Tipo | Default |
|---|---|---|
| `defaultRiskClass` | `RiskClass` | `medium` |
| `affectsSurvivalDefault` | `Boolean` | `false` |
| `affectsIncomeDefault` | `Boolean` | `false` |
| `hasLegalRiskDefault` | `Boolean` | `false` |
| `description` | `String? @db.VarChar(500)` | `null` |
| `displayOrder` | `Int @db.SmallInt` | `100` |

### 2.5 `Debt`

**Campos a adicionar (18 — 15 da v1 + 3 da v2 + 1 substituição):**

| Campo | Tipo | Default | Versão |
|---|---|---|---|
| `affectsSurvival` | `Boolean` | `false` | v1 |
| `affectsIncome` | `Boolean` | `false` | v1 |
| `hasLegalRisk` | `Boolean` | `false` | v1 |
| `hasCollateral` | `Boolean` | `false` | v1 |
| `collateralType` | `CollateralType?` | `null` | v1 |
| `isNegotiable` | `Boolean` | `true` | v1 |
| `interestRateMonthly` | `Decimal? @db.Decimal(7,4)` | `null` | v1 |
| `interestRateAnnual` | `Decimal? @db.Decimal(7,4)` | `null` | v1 |
| `interestClass` | `InterestClass` | `unknown` | v1 |
| `settlementCashAmount` | `Decimal? @db.Decimal(12,2)` | `null` | v1 |
| `settlementInstallments` | `Int? @db.SmallInt` | `null` | v1 |
| `settlementInstallmentAmount` | `Decimal? @db.Decimal(12,2)` | `null` | v1 |
| `settlementDeadline` | `DateTime? @db.Date` | `null` | v1 |
| `stressLevel` | `Int? @db.SmallInt` | `null` | v1 |
| `priorityScore` | `Decimal? @db.Decimal(7,2)` | `null` | v1 |
| `priorityReason` | `String? @db.VarChar(500)` | `null` | v1 |
| `interestRateSource` | `RateSource` | `unknown` | **v2** |
| `lastVerifiedAt` | `DateTime?` | `null` | **v2** |
| `dataConfidence` | `ConfidenceLevel` | `medium` | **v2** |

**Campos removidos *(NOVO v2)*:**
- `priorityOrder` (substituído por `priorityScore`)
- `overdueMonths` (substituído por `daysOverdue` — mais granular)

**Campos com tipo alterado *(NOVO v2)*:**
- `daysOverdue` (Int, substituindo `overdueMonths`)

### 2.6 `PaymentPlan`

**Campos a adicionar (7 da v1):**

| Campo | Tipo | Default |
|---|---|---|
| `lastFinancialState` | `FinancialState?` | `null` |
| `safeCapacity` | `Decimal? @db.Decimal(12,2)` | `null` |
| `simulationConservative` | `Json?` | `null` |
| `simulationOptimized` | `Json?` | `null` |
| `simulationAccelerated` | `Json?` | `null` |
| `estimatedPayoffMonthsMin` | `Int? @db.SmallInt` | `null` |
| `estimatedPayoffMonthsMax` | `Int? @db.SmallInt` | `null` |

**Enum `PlanStrategy` limpo *(NOVO v2)*:**

```prisma
enum PlanStrategy {
  snowball       // bola de neve (era smallest_first)
  avalanche      // avalanche (era highest_interest)
  hybrid         // híbrido (default para casos reais)
  crisis         // ativo em estados críticos
}
```

Legados removidos (`smallest_first`, `highest_interest`, `custom`). Como não há usuários reais, a migration faz `UPDATE` antes de remover valores.

---

## 3. Tabelas novas (12)

### 3.1 `BehaviorProfile` (1:1 com `User`) — v1

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

### 3.2 `MonthlyActionPlan` (N:1 com `User`, 1 ativo por mês) — v1

```prisma
model MonthlyActionPlan {
  id                    String              @id @default(uuid())
  userId                String              @map("user_id")
  referenceMonth        DateTime            @map("reference_month") @db.Date
  financialState        FinancialState      @map("financial_state")
  operationMode         OperationMode       @map("operation_mode")
  incomeNetMonthly      Decimal             @map("income_net_monthly") @db.Decimal(12, 2)
  essentialsTotal       Decimal             @map("essentials_total") @db.Decimal(12, 2)
  seasonalProvisionTotal Decimal            @default(0) @map("seasonal_provision_total") @db.Decimal(12, 2)
  incomeProtectiveTotal Decimal             @map("income_protective_total") @db.Decimal(12, 2)
  legalsTotal           Decimal             @map("legals_total") @db.Decimal(12, 2)
  minimumVital          Decimal             @map("minimum_vital") @db.Decimal(12, 2)
  emergencyReserveContribution Decimal      @default(0) @map("emergency_reserve_contribution") @db.Decimal(12, 2)
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

**Nota v2:** adicionados `seasonalProvisionTotal` e `emergencyReserveContribution` (snapshots da fórmula).

### 3.3 `RecommendedAction` (N:1 com `MonthlyActionPlan`) — v1

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
  dataConfidence           ConfidenceLevel     @default(medium) @map("data_confidence")
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

**Nota v2:** adicionado `dataConfidence` (propaga a confiabilidade da dívida-alvo para a ação, alimenta o ícone visual).

### 3.4 `SettlementEvaluation` (N:1 com `Debt` e `User`) — v1

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

### 3.5 `FinancialStateSnapshot` (histórico) — v1

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

### 3.6 `RegionalMinimumVital` (referência) — v1

```prisma
model RegionalMinimumVital {
  id                String      @id @default(uuid())
  stateCode         String      @map("state_code") @db.VarChar(2)
  regionType        RegionType  @map("region_type")
  baseAmountSingle  Decimal     @map("base_amount_single") @db.Decimal(12, 2)
  basePerDependent  Decimal     @map("base_per_dependent") @db.Decimal(12, 2)
  effectiveDate     DateTime    @map("effective_date") @db.Date
  source            String      @db.VarChar(50)
  sourceUrl         String?     @map("source_url") @db.VarChar(500)
  createdAt         DateTime    @default(now()) @map("created_at")

  @@unique([stateCode, regionType, effectiveDate])
  @@map("regional_minimum_vital")
}
```

### 3.7 `InterestRateReference` (referência) — v1

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

### 3.8 `SupportChannel` (referência) — v1

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
  worksForStates  Json?                 @map("works_for_states")
  isActive        Boolean               @default(true) @map("is_active")
  displayOrder    Int                   @default(100) @map("display_order") @db.SmallInt
  createdAt       DateTime              @default(now()) @map("created_at")
  updatedAt       DateTime              @updatedAt @map("updated_at")

  @@index([scope, stateCode, isActive])
  @@map("support_channels")
}
```

### 3.9 `EmergencyReserve` (1:1 com `User`) *(NOVO v2)*

```prisma
model EmergencyReserve {
  id              String      @id @default(uuid())
  userId          String      @unique @map("user_id")
  currentAmount   Decimal     @default(0) @map("current_amount") @db.Decimal(12, 2)
  targetAmount    Decimal?    @map("target_amount") @db.Decimal(12, 2)
  monthlyTarget   Decimal?    @map("monthly_target") @db.Decimal(12, 2)
  isActive        Boolean     @default(false) @map("is_active")
  startedAt       DateTime?   @map("started_at")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("emergency_reserves")
}
```

**Notas:**
- Criada apenas quando o usuário decide ativar (`isActive = true`) — geralmente no Modo Quitação.
- `currentAmount` é o saldo declarado pelo usuário (Quita não faz custódia financeira).
- `monthlyTarget` entra no cálculo de `capacidade_segura` como subtração.

### 3.10 `UserGoal` (N:1 com `User`) *(NOVO v2)*

```prisma
model UserGoal {
  id              String      @id @default(uuid())
  userId          String      @map("user_id")
  goalType        GoalType    @map("goal_type")
  description     String      @db.VarChar(500)
  targetAmount    Decimal?    @map("target_amount") @db.Decimal(12, 2)
  targetDate      DateTime?   @map("target_date") @db.Date
  priorityOrder   Int         @default(100) @map("priority_order") @db.SmallInt
  isActive        Boolean     @default(true) @map("is_active")
  achievedAt      DateTime?   @map("achieved_at")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isActive])
  @@map("user_goals")
}
```

### 3.11 `ConsentLog` (N:1 com `User`, auditoria LGPD) *(NOVO v2)*

```prisma
model ConsentLog {
  id              String      @id @default(uuid())
  userId          String      @map("user_id")
  consentType     ConsentType @map("consent_type")
  version         String      @db.VarChar(20)
  accepted        Boolean     @default(true)
  acceptedAt      DateTime    @default(now()) @map("accepted_at")
  ipAddress       String?     @map("ip_address") @db.VarChar(45)
  userAgent       String?     @map("user_agent") @db.VarChar(500)

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, consentType])
  @@map("consent_logs")
}
```

**Notas LGPD:**
- Toda aceitação ou revogação de termo é log imutável (não sobrescreve).
- `version` rastreia versões de Termos de Uso (ex: `"1.0"`, `"1.1"`).
- IP e User Agent ajudam em auditoria de origem (ANPD pode pedir).

### 3.12 `ScoringWeight` (configuração do `priority-engine`) *(NOVO v2)*

```prisma
model ScoringWeight {
  id              String      @id @default(uuid())
  factorKey       String      @unique @map("factor_key") @db.VarChar(50)
  weight          Decimal     @db.Decimal(6, 2)
  isPositive      Boolean     @default(true) @map("is_positive")
  effectiveDate   DateTime    @map("effective_date") @db.Date
  description     String?     @db.VarChar(255)
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  @@map("scoring_weights")
}
```

**Seed inicial alinhado com Fase 1 §7.5:**

| factorKey | weight | isPositive |
|---|---|---|
| `risco_moradia` | 30 | true |
| `risco_renda` | 25 | true |
| `risco_legal` | 25 | true |
| `risco_servico_essencial` | 20 | true |
| `juros_mensal_normalizado` | 15 | true |
| `dias_atraso_normalizado` | 10 | true |
| `desconto_disponivel_sustentavel` | 10 | true |
| `valor_pequeno_quitavel` | 8 | true |
| `parcela_insustentavel` | 30 | false |
| `acordo_sem_folga` | 20 | false |

---

## 4. Enums (34 ao todo)

### 4.1 Enums com naming em inglês *(REVISADOS v2)*

```prisma
enum FinancialState {
  healthy_with_debt
  tight_budget
  monthly_deficit
  overindebtedness
  practical_insolvency
}

enum OperationMode {
  payoff
  stabilization
  crisis_mode
  protection
  survival
}

enum PlanStrategy {
  snowball
  avalanche
  hybrid
  crisis
}
```

### 4.2 Enums novos da v1 (15)

```prisma
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

### 4.3 Enums novos da v2 (6) *(NOVOS)*

```prisma
enum ExpenseFrequency {
  monthly       // mensal (default)
  bimonthly     // a cada 2 meses
  quarterly     // trimestral
  semiannual    // semestral
  annual        // anual (IPTU, IPVA)
  irregular     // sem padrão (manutenção, dentista)
}

enum IncomeStability {
  stable        // CLT, aposentadoria
  variable      // freelancer, autônomo
  seasonal      // contratos, vendedor sazonal
}

enum DiagnosisLevel {
  minimal       // só onboarding crítico
  basic         // + despesas e risco de dívida
  detailed      // + comportamental + goals + provisão
}

enum GoalType {
  debt_freedom
  house
  education
  family
  travel
  peace
  security
  retirement
  other
}

enum RateSource {
  user_provided      // declarado pelo usuário
  market_reference   // estimado via InterestRateReference
  unknown
}

enum ConsentType {
  terms_of_use
  privacy_policy
  data_processing
  marketing_communications
}
```

---

## 5. Schemas Zod no `@quita/shared`

Apenas os schemas críticos (os demais inferem-se do schema Prisma). Mostro os que sofreram mudança na v2.

### 5.1 `incomeInputSchema` *(v2)*

```typescript
export const incomeInputSchema = z.object({
  name: z.string().min(1).max(255),
  amount: z.number().nonnegative(),
  type: z.enum(['fixed', 'one_time', 'recurring']),
  dueDate: z.string().date().optional(),
  installments: z.number().int().min(1).max(60).optional(),
  installmentAmount: z.number().nonnegative().optional(),
  sourceCategory: z.enum(['salary', 'extra', 'help', 'other']).optional(),
  paymentDay: z.number().int().min(1).max(31).optional(),
  confidenceLevel: z.enum(['high', 'medium', 'low']).optional(),
  historyMonths: z.number().int().min(1).max(12).optional(),
  // NOVOS v2
  guaranteedAmount: z.number().nonnegative().optional(),
  upperBoundAmount: z.number().nonnegative().optional(),
  stabilityType: z.enum(['stable', 'variable', 'seasonal']).default('stable'),
}).refine(
  (data) => !data.upperBoundAmount || !data.guaranteedAmount || data.upperBoundAmount >= data.guaranteedAmount,
  { message: 'O teto deve ser maior ou igual ao piso garantido.' },
);
```

### 5.2 `expenseInputSchema` *(v2)*

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
  isEssential: z.boolean().default(false),
  isIncomeRelated: z.boolean().default(false),
  isLegalObligation: z.boolean().default(false),
  canReduce: z.boolean().default(false),
  canCancel: z.boolean().default(false),
  consequenceIfUnpaid: z.enum([
    'service_cut', 'loss_of_asset', 'legal_action', 'fine', 'none',
  ]).optional(),
  // NOVOS v2
  frequency: z.enum([
    'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'irregular',
  ]).default('monthly'),
  monthlyProvision: z.number().nonnegative().optional(),
  nextOccurrence: z.string().date().optional(),
  dataConfidence: z.enum(['high', 'medium', 'low']).default('medium'),
});
```

### 5.3 `debtInputSchema` *(v2 — atualizado)*

```typescript
export const debtInputSchema = z.object({
  categoryId: z.string().uuid(),
  creditor: z.string().min(1).max(255),
  totalAmount: z.number().nonnegative(),
  nature: z.enum(['installment', 'recurring', 'one_time']).default('one_time'),
  monthlyAmount: z.number().nonnegative().optional(),
  hasInterest: z.boolean().optional(),
  dueDate: z.string().date().optional(),
  totalInstallments: z.number().int().min(1).max(360).optional(),
  currentInstallment: z.number().int().min(0).optional(),
  affectsSurvival: z.boolean().default(false),
  affectsIncome: z.boolean().default(false),
  hasLegalRisk: z.boolean().default(false),
  hasCollateral: z.boolean().default(false),
  collateralType: z.enum(['none', 'vehicle', 'property', 'salary', 'other']).optional(),
  isNegotiable: z.boolean().default(true),
  interestRateMonthly: z.number().min(0).max(50).optional(),
  interestRateAnnual: z.number().min(0).max(1000).optional(),
  settlementCashAmount: z.number().nonnegative().optional(),
  settlementInstallments: z.number().int().min(1).max(60).optional(),
  settlementInstallmentAmount: z.number().nonnegative().optional(),
  settlementDeadline: z.string().date().optional(),
  stressLevel: z.number().int().min(1).max(3).optional(),
  // NOVOS v2
  daysOverdue: z.number().int().min(0).default(0),  // substitui overdueMonths
  dataConfidence: z.enum(['high', 'medium', 'low']).default('medium'),
});
```

### 5.4 `userGoalInputSchema` *(NOVO v2)*

```typescript
export const userGoalInputSchema = z.object({
  goalType: z.enum([
    'debt_freedom', 'house', 'education', 'family',
    'travel', 'peace', 'security', 'retirement', 'other',
  ]),
  description: z.string().min(1).max(500),
  targetAmount: z.number().nonnegative().optional(),
  targetDate: z.string().date().optional(),
  priorityOrder: z.number().int().default(100),
});
```

### 5.5 `emergencyReserveInputSchema` *(NOVO v2)*

```typescript
export const emergencyReserveInputSchema = z.object({
  currentAmount: z.number().nonnegative().default(0),
  targetAmount: z.number().nonnegative().optional(),
  monthlyTarget: z.number().nonnegative().optional(),
  isActive: z.boolean().default(false),
});
```

### 5.6 `consentLogInputSchema` *(NOVO v2)*

```typescript
export const consentLogInputSchema = z.object({
  consentType: z.enum([
    'terms_of_use', 'privacy_policy', 'data_processing', 'marketing_communications',
  ]),
  version: z.string().min(1).max(20),
  accepted: z.boolean().default(true),
});
```

### 5.7 `monthlyActionPlanSchema` *(saída do motor)*

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
  dataConfidence: z.enum(['high', 'medium', 'low']),
  status: z.enum(['pending', 'completed', 'skipped', 'dismissed', 'expired']),
});

export const monthlyActionPlanSchema = z.object({
  id: z.string().uuid(),
  referenceMonth: z.string().date(),
  financialState: z.enum([
    'healthy_with_debt', 'tight_budget', 'monthly_deficit',
    'overindebtedness', 'practical_insolvency',
  ]),
  operationMode: z.enum([
    'payoff', 'stabilization', 'crisis_mode', 'protection', 'survival',
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

## 6. Estratégia de migrations (9 ao todo)

| # | Nome | O que faz | Versão |
|---|---|---|---|
| 1 | `20260601_add_enums` | Cria todos os 23 enums novos (17 v1 + 6 v2) | v1+v2 |
| 2 | `20260602_extend_user_income_expense` | Adiciona campos novos em `User`, `Income`, `Expense`; expande enum `ExpenseCategory`; substitui `bills` por `utilities` | v1+v2 |
| 3 | `20260603_extend_debt_category` | Campos novos em `DebtCategory` | v1 |
| 4 | `20260604_extend_debt` | 18 campos novos em `Debt`; substitui `overdueMonths` por `daysOverdue`; remove `priorityOrder` | v1+v2 |
| 5 | `20260605_extend_payment_plan` | Campos novos em `PaymentPlan`; limpa enum `PlanStrategy` (remove legados) | v1+v2 |
| 6 | `20260606_create_new_tables_core` | Cria 8 tabelas: `BehaviorProfile`, `MonthlyActionPlan`, `RecommendedAction`, `SettlementEvaluation`, `FinancialStateSnapshot`, `RegionalMinimumVital`, `InterestRateReference`, `SupportChannel` + índices | v1 |
| 7 | `20260607_seed_references` | Seed inicial de `DebtCategory` atualizado, `RegionalMinimumVital` (placeholder), `InterestRateReference` (placeholder), `SupportChannel` (4 federais) | v1 |
| 8 | `20260608_add_seasonal_expense_emergency_reserve` | Cria `EmergencyReserve` + adiciona campos `frequency`, `monthlyProvision`, `nextOccurrence`, `provisionStartedAt`, `dataConfidence` em `Expense` | **v2** |
| 9 | `20260609_add_user_goals_consent_logs_scoring_weights` | Cria `UserGoal`, `ConsentLog`, `ScoringWeight` + seed inicial dos 10 pesos + índices | **v2** |

**Pode separar 2 em 8?** Sim — a migration 8 inclui tanto a tabela `EmergencyReserve` quanto a extensão de `Expense` porque ambas servem ao bloqueador #1 (sazonais). Posso separar em 8a (extend_expense_seasonal) e 8b (create_emergency_reserve) se preferir granularidade.

---

## 7. Índices recomendados *(consolidado v2)*

```sql
-- Existentes da v1
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

CREATE INDEX idx_debts_priority
  ON debts(user_id, priority_score DESC) WHERE status != 'paid';

CREATE INDEX idx_expenses_user_essential
  ON expenses(user_id, is_essential) WHERE is_active = true;

-- Novos v2
CREATE INDEX idx_user_goals_user_active
  ON user_goals(user_id, is_active);

CREATE INDEX idx_consent_logs_user_type
  ON consent_logs(user_id, consent_type);

CREATE INDEX idx_users_next_review
  ON users(next_review_date) WHERE next_review_date IS NOT NULL;

CREATE INDEX idx_expenses_frequency_next_occurrence
  ON expenses(frequency, next_occurrence) WHERE frequency != 'monthly';
```

---

## 8. Tabelas de referência — formato de seed (placeholder inicial)

### 8.1 `DebtCategory` (seed atualizado)

| slug | name | defaultRiskClass | affectsSurvival | affectsIncome | hasLegalRisk |
|---|---|---|---|---|---|
| `essential_arrears` | Atrasos em essenciais | `critical` | true | true | false |
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

| stateCode | regionType | baseAmountSingle | basePerDependent | source |
|---|---|---|---|---|
| `BR` | `metro` | 1320 | 400 | `placeholder_v1` |

### 8.3 `InterestRateReference` (placeholder)

Faixas conservadoras por categoria, `source = "placeholder_v1"`.

### 8.4 `SupportChannel` (placeholder mínimo, 4 federais)

| slug | scope | type |
|---|---|---|
| `consumidor_gov_br` | federal | federal_gov |
| `procon_federal` | federal | procon |
| `mutirao_renegociacao_febraban` | federal | bank_mediation |
| `serasa_limpa_nome` | federal | serasa |

### 8.5 `ScoringWeight` *(NOVO v2)*

Seed dos 10 fatores da seção 3.12.

---

## 9. Pendências para destravar Fase 3

Da Fase 1/Ciclo Adversarial que permanecem informacionais:

1. **Fonte do mínimo vital regional** — IBGE (POF) vs DIEESE. Decisão impacta seed da migration 7.
2. **Fonte dos juros de referência** — integração com BCB SGS via API pública. Impacta seed da migration 7.
3. **Lista completa de canais de apoio** — 4 federais bastam para começar; ampliação por UF é evolutiva.
4. **Validador de acordo — modo de entrada** — formulário sempre; OCR como Premium decidido.
5. **Contratação de advogado fintech** — bloqueia release público, não bloqueia Fase 3 nem 4.

Nenhuma trava a Fase 3 do motor de decisão.

---

## 10. Próximos passos (Fase 3 — Motor de Decisão)

Com o schema definido, a Fase 3 entra no **comportamento** dos módulos do motor:

- Contratos TypeScript (interfaces) de input/output de cada módulo
- Pseudocódigo detalhado de `financial-state-detector`, `priority-engine`, `strategy-selector`, `simulator` e `settlement-validator`
- Regras de classificação automática de despesa e dívida
- Tabela de pesos do score (já existe em `ScoringWeight` — falta detalhar a fórmula)
- Eventos que disparam recálculo (mudança de renda, virada de mês, novo pagamento)
- Casos de borda (renda zerada, dívida sem credor, acordo expirado, oscilação de modo, etc.)
- Estratégia de testes (unit por módulo, integração por cenário)
- Validações inviolaveis: `survival` jamais gera `pay`/`negotiate` (teste obrigatório)
- Lógica de suavização de transição de estado

---

*Fim do documento da Fase 2 v2.*
