# Quita — Fase 3: Motor de Decisão

> **Status:** rascunho para validação
> **Data:** 16 de maio de 2026
> **Insumo:** Fase 1 v2 + Fase 2 v2.1 aprovadas
> **Escopo:** comportamento puro dos 11 módulos do motor + 4 pendências do devils-advocate v2
> **Não faz parte:** arquitetura técnica NestJS (Fase 4), telas (Fase 5), migração (Fase 6)

---

## Sumário executivo

A Fase 3 traduz o "o quê" (Fases 1 e 2) em "como". Cada um dos 11 módulos do motor ganha aqui:
- **Contrato TypeScript** (interface de entrada e saída)
- **Pseudocódigo** dos algoritmos críticos
- **Regras de negócio** explícitas
- **Casos de borda** mapeados
- **Estratégia de testes**

Resolve também as 4 pendências menores do devils-advocate v2:
1. Política de retenção LGPD por tabela (§16)
2. Algoritmo fino da regra de suavização de estado (§7.4)
3. Fallback agressivo para `diagnosisLevel='minimal'` (§7.5)
4. Comportamento de update in-place do `MonthlyActionPlan` (§14.4)

**O motor é uma cadeia de funções puras.** A maioria dos módulos não tem efeito colateral além de persistir o resultado final. Side effects vivem em camada separada (jobs BullMQ + repositories). Isso isola lógica de negócio do framework, facilita testes, e mantém o motor independente de NestJS.

---

## 1. Princípios de design dos módulos

**1.1 Funções puras onde possível.**
Cada módulo recebe input explícito, devolve output determinístico. Sem acesso a `this.userRepo` dentro do core — dependências entram via parâmetro. Repositórios são chamados nas bordas do orquestrador (`monthly-plan-generator`), não dentro do `priority-engine`.

**1.2 Tipos como contrato vivo.**
Toda interface de input/output vira tipo TypeScript exportado no `@quita/shared`. Mudanças quebram em compilação, não em runtime.

**1.3 Repositórios são finos.**
Repositórios fazem CRUD e queries específicas. Não contêm regra de negócio. Se uma query precisa de cálculo, esse cálculo fica no service.

**1.4 Snapshots, não overrides.**
Estado financeiro detectado vira linha em `FinancialStateSnapshot`. Plano do mês vira linha em `MonthlyActionPlan`. Histórico é a fonte de verdade — não sobrescrevemos sem rastro.

**1.5 Falha visível para o time, invisível para o usuário.**
Erros do motor vão para Sentry. Usuário continua vendo o último plano válido. Plano antigo é melhor que plano errado.

**1.6 Dados externos sempre com fallback.**
Toda chamada a `InterestRateReference`, `RegionalMinimumVital`, `ScoringWeight` tem default agressivo se a tabela está vazia ou desatualizada. O motor nunca para por falta de seed.

**1.7 Idempotência.**
Rodar o mesmo cálculo duas vezes no mesmo input produz o mesmo output. Recálculos não criam linhas duplicadas em `MonthlyActionPlan` (upsert por `userId + referenceMonth`).

---

## 2. Tipos compartilhados (foundation)

Tipos base usados por múltiplos módulos. Ficam em `@quita/shared/src/types/motor.ts`.

```typescript
// =================================================================
// Contexto e gatilhos
// =================================================================

export type TriggerEvent =
  | 'income_added' | 'income_updated' | 'income_removed'
  | 'expense_added' | 'expense_updated' | 'expense_removed'
  | 'debt_added' | 'debt_updated' | 'debt_removed'
  | 'payment_recorded' | 'payment_reverted'
  | 'settlement_evaluated'
  | 'behavior_profile_updated'
  | 'goal_added' | 'goal_updated'
  | 'emergency_reserve_updated'
  | 'month_rollover'
  | 'manual_recalc'
  | 'data_freshness_review';

export interface MotorContext {
  userId: string;
  referenceMonth: Date;  // primeiro dia do mês
  triggerEvent: TriggerEvent;
  triggeredAt: Date;
}

// =================================================================
// Resultado padrão
// =================================================================

export interface MotorResult<T> {
  data: T;
  warnings: string[];        // mostrar ao usuário
  internalWarnings: string[]; // log do time
}

// =================================================================
// Enums (espelham o schema Prisma)
// =================================================================

export type FinancialState =
  | 'healthy_with_debt'
  | 'tight_budget'
  | 'monthly_deficit'
  | 'overindebtedness'
  | 'practical_insolvency';

export type OperationMode =
  | 'payoff' | 'stabilization' | 'crisis_mode'
  | 'protection' | 'survival';

export type ActionType =
  | 'pay' | 'negotiate' | 'pause' | 'cut'
  | 'wait' | 'review' | 'refuse' | 'monitor';

export type DiagnosisLevel = 'minimal' | 'basic' | 'detailed';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// =================================================================
// Breakdown da capacidade segura
// =================================================================

export interface CapacityBreakdown {
  incomeNetMonthly: number;
  essentialsTotal: number;
  seasonalProvisionTotal: number;
  incomeProtectiveTotal: number;
  legalsTotal: number;
  minimumVital: number;
  operationalReserve: number;
  emergencyReserveContribution: number;
  safeCapacity: number;  // resultado
}
```

---

## 3. Mapa do motor — visão geral

```
                       ┌──────────────────────────────┐
                       │  TRIGGER (evento ou job)     │
                       └──────────────┬───────────────┘
                                      │
                                      ▼
                       ┌──────────────────────────────┐
                       │  monthly-plan-generator      │  ◄── orquestrador
                       │  (Seção 14)                  │
                       └──────────────┬───────────────┘
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       ▼                              ▼                              ▼
┌───────────────┐         ┌──────────────────────┐         ┌──────────────────┐
│ financial-    │         │ expense-             │         │ debt-            │
│ profile-      │         │ classification-      │         │ classification-  │
│ service       │         │ service              │         │ service          │
│ (Seção 4)     │         │ (Seção 5)            │         │ (Seção 6)        │
└───────┬───────┘         └──────────┬───────────┘         └─────────┬────────┘
        │                            │                                │
        └────────────┬───────────────┴────────────────────────────────┘
                     ▼
              ┌──────────────────────────────┐
              │ financial-state-detector     │
              │ (Seção 7) ◄── núcleo lógico  │
              │  → estado + capacidade       │
              └──────────────┬───────────────┘
                             │
              ┌──────────────┴───────────────┐
              ▼                              ▼
       ┌──────────────────┐         ┌──────────────────┐
       │ priority-engine  │         │ strategy-        │
       │ (Seção 8)        │         │ selector         │
       │ → score          │         │ (Seção 9)        │
       └─────────┬────────┘         └─────────┬────────┘
                 │                            │
                 └──────────────┬─────────────┘
                                ▼
                     ┌──────────────────────┐
                     │ simulator (Seção 10) │
                     │ → 3 cenários         │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │ ações geradas        │
                     │ + warnings           │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │ MonthlyActionPlan    │
                     │ + RecommendedAction  │
                     │ (persistidos)        │
                     └──────────────────────┘

  ┌─────────────────────────────────────────┐
  │ Módulos auxiliares (chamadas ad-hoc):   │
  │  • settlement-validator (Seção 11)      │
  │  • goal-tracker-service (Seção 12)      │
  │  • seasonal-expense-service (Seção 13)  │
  └─────────────────────────────────────────┘
```

---

## 4. financial-profile-service

### 4.1 Responsabilidade

CRUDs de `User`, `Income`, `Expense`, `Debt`, `BehaviorProfile`, `EmergencyReserve`, `UserGoal`. Aplica regras de unicidade, validações básicas (via Zod), e mantém integridade referencial.

### 4.2 Contrato

```typescript
export interface FinancialProfileService {
  // Renda
  addIncome(userId: string, input: IncomeInput): Promise<Income>;
  updateIncome(incomeId: string, input: Partial<IncomeInput>): Promise<Income>;
  removeIncome(incomeId: string): Promise<void>;
  listActiveIncomes(userId: string): Promise<Income[]>;

  // Despesa
  addExpense(userId: string, input: ExpenseInput): Promise<Expense>;
  updateExpense(expenseId: string, input: Partial<ExpenseInput>): Promise<Expense>;
  removeExpense(expenseId: string): Promise<void>;
  listActiveExpenses(userId: string): Promise<Expense[]>;

  // Dívida
  addDebt(userId: string, input: DebtInput): Promise<Debt>;
  updateDebt(debtId: string, input: Partial<DebtInput>): Promise<Debt>;
  removeDebt(debtId: string): Promise<void>;
  listActiveDebts(userId: string): Promise<Debt[]>;
  markDebtPaid(debtId: string): Promise<Debt>;

  // Perfil comportamental
  upsertBehaviorProfile(userId: string, input: BehaviorProfileInput): Promise<BehaviorProfile>;

  // Reserva e Goals
  upsertEmergencyReserve(userId: string, input: EmergencyReserveInput): Promise<EmergencyReserve>;
  addGoal(userId: string, input: UserGoalInput): Promise<UserGoal>;
  updateGoal(goalId: string, input: Partial<UserGoalInput>): Promise<UserGoal>;
}
```

### 4.3 Regras de negócio

- **Toda mutação** dispara `TriggerEvent` correspondente para recálculo (via fila assíncrona).
- **Pagamento desfeito em até 24h** já está implementado; mantém.
- **Soft delete** em `Debt` quando `status = 'paid'` ou `removed` — não apaga linha do banco.
- **Validação Zod no controller** (não no service) — service confia que o input chegou validado.

### 4.4 Casos de borda

| Caso | Comportamento |
|---|---|
| Adicionar dívida sem categoria | Atribui `category = 'other'` automaticamente |
| Atualizar dívida em modo Sobrevivência | Permitido (cadastro é diferente de pagamento) |
| Remover renda principal única | Permitido, mas dispara warning de "renda zerada" no detector |
| `Income.frequency='installment'` sem `installments` | Zod rejeita no controller |
| Dois `EmergencyReserve` ativos por usuário | Unique constraint impede; service faz upsert por `userId` |

---

## 5. expense-classification-service

### 5.1 Responsabilidade

Atribuir flags de classificação (`isEssential`, `isIncomeRelated`, `isLegalObligation`, `canReduce`, `canCancel`, `consequenceIfUnpaid`, `dataConfidence`) a despesas. Combina:
- Declaração do usuário (quando disponível — Refinamento Progressivo)
- Default da categoria
- Heurísticas determinísticas

### 5.2 Contrato

```typescript
export interface ExpenseClassificationService {
  classify(expense: Expense, options?: { aggressiveFallback?: boolean }): ClassifiedExpense;
  classifyBatch(expenses: Expense[], options?: ClassifyOptions): ClassifiedExpense[];
}

export interface ClassifiedExpense extends Expense {
  // Flags já garantidamente preenchidas
  isEssential: boolean;
  isIncomeRelated: boolean;
  isLegalObligation: boolean;
  canReduce: boolean;
  canCancel: boolean;
  consequenceIfUnpaid: ConsequenceType;
  dataConfidence: ConfidenceLevel;
}
```

### 5.3 Algoritmo de classificação

```typescript
function classify(expense: Expense, options): ClassifiedExpense {
  // 1. Se o usuário já preencheu manualmente, respeita
  if (expense.dataConfidence === 'high' && expense.isEssential !== null) {
    return expense as ClassifiedExpense;
  }

  // 2. Aplicar default por categoria
  const defaults = CATEGORY_DEFAULTS[expense.category];

  // 3. Fallback agressivo (quando diagnosisLevel='minimal')
  if (options?.aggressiveFallback) {
    // Em modo minimal: assumir tudo como essencial salvo categorias claramente supérfluas
    const clearlyNonEssential = ['leisure', 'subscription'];
    return {
      ...expense,
      isEssential: !clearlyNonEssential.includes(expense.category),
      isIncomeRelated: defaults.isIncomeRelated ?? false,
      isLegalObligation: defaults.isLegalObligation ?? false,
      canReduce: defaults.canReduce ?? true,
      canCancel: defaults.canCancel ?? false,
      consequenceIfUnpaid: defaults.consequenceIfUnpaid ?? 'none',
      dataConfidence: 'low',
    };
  }

  // 4. Modo normal: mistura defaults com declarações
  return {
    ...expense,
    isEssential: expense.isEssential ?? defaults.isEssential,
    isIncomeRelated: expense.isIncomeRelated ?? defaults.isIncomeRelated,
    isLegalObligation: expense.isLegalObligation ?? defaults.isLegalObligation,
    canReduce: expense.canReduce ?? defaults.canReduce,
    canCancel: expense.canCancel ?? defaults.canCancel,
    consequenceIfUnpaid: expense.consequenceIfUnpaid ?? defaults.consequenceIfUnpaid,
    dataConfidence: expense.dataConfidence ?? 'medium',
  };
}
```

### 5.4 Tabela de defaults por categoria

```typescript
const CATEGORY_DEFAULTS: Record<ExpenseCategory, ExpenseDefaults> = {
  housing:      { isEssential: true,  consequenceIfUnpaid: 'loss_of_asset', canReduce: false, canCancel: false, isIncomeRelated: false, isLegalObligation: false },
  utilities:    { isEssential: true,  consequenceIfUnpaid: 'service_cut',   canReduce: true,  canCancel: false, isIncomeRelated: false, isLegalObligation: false },
  telecom:      { isEssential: false, consequenceIfUnpaid: 'service_cut',   canReduce: true,  canCancel: true,  isIncomeRelated: false, isLegalObligation: false },
  food:         { isEssential: true,  consequenceIfUnpaid: 'none',          canReduce: true,  canCancel: false, isIncomeRelated: false, isLegalObligation: false },
  transport:    { isEssential: true,  consequenceIfUnpaid: 'none',          canReduce: true,  canCancel: false, isIncomeRelated: true,  isLegalObligation: false },
  health:       { isEssential: true,  consequenceIfUnpaid: 'none',          canReduce: false, canCancel: false, isIncomeRelated: false, isLegalObligation: false },
  education:    { isEssential: true,  consequenceIfUnpaid: 'none',          canReduce: true,  canCancel: true,  isIncomeRelated: false, isLegalObligation: false },
  childcare:    { isEssential: true,  consequenceIfUnpaid: 'none',          canReduce: false, canCancel: false, isIncomeRelated: true,  isLegalObligation: false },
  work_tools:   { isEssential: true,  consequenceIfUnpaid: 'none',          canReduce: true,  canCancel: false, isIncomeRelated: true,  isLegalObligation: false },
  insurance:    { isEssential: false, consequenceIfUnpaid: 'none',          canReduce: true,  canCancel: true,  isIncomeRelated: false, isLegalObligation: false },
  legal:        { isEssential: true,  consequenceIfUnpaid: 'legal_action',  canReduce: false, canCancel: false, isIncomeRelated: false, isLegalObligation: true  },
  subscription: { isEssential: false, consequenceIfUnpaid: 'service_cut',   canReduce: true,  canCancel: true,  isIncomeRelated: false, isLegalObligation: false },
  leisure:      { isEssential: false, consequenceIfUnpaid: 'none',          canReduce: true,  canCancel: true,  isIncomeRelated: false, isLegalObligation: false },
  other:        { isEssential: false, consequenceIfUnpaid: 'none',          canReduce: true,  canCancel: true,  isIncomeRelated: false, isLegalObligation: false },
};
```

### 5.5 Casos de borda

| Caso | Comportamento |
|---|---|
| Categoria `transport` mas declarado `canCancel=true` | Respeita declaração (usuário trabalha em casa, por exemplo) |
| `frequency='annual'` (IPVA) com `monthlyProvision=null` | Service calcula automaticamente: `monthlyProvision = amount / 12` |
| Despesa nova sem nenhum dado de risco | Aplica defaults da categoria; `dataConfidence='medium'` |
| `diagnosisLevel='minimal'` + categoria `leisure` | Mantém `isEssential=false` (não é fallback agressivo nessa direção) |

---

## 6. debt-classification-service

### 6.1 Responsabilidade

Atribuir flags de risco (`affectsSurvival`, `affectsIncome`, `hasLegalRisk`, `interestClass`, `dataConfidence`, `interestRateSource`). Aplicar **fallback automático de juros** via `InterestRateReference` quando o usuário não declara taxa.

### 6.2 Contrato

```typescript
export interface DebtClassificationService {
  classify(debt: Debt, options?: { aggressiveFallback?: boolean }): Promise<ClassifiedDebt>;
  classifyBatch(debts: Debt[]): Promise<ClassifiedDebt[]>;
  fetchInterestRate(categorySlug: string): Promise<InterestRateReference | null>;
}

export interface ClassifiedDebt extends Debt {
  affectsSurvival: boolean;
  affectsIncome: boolean;
  hasLegalRisk: boolean;
  interestClass: InterestClass;
  interestRateMonthly: number | null;
  interestRateSource: RateSource;
  dataConfidence: ConfidenceLevel;
}
```

### 6.3 Algoritmo

```typescript
async function classify(debt: Debt): Promise<ClassifiedDebt> {
  const category = await debtCategoryRepo.findBySlug(debt.categorySlug);

  // 1. Aplicar defaults da categoria onde o usuário não declarou
  const affectsSurvival = debt.affectsSurvival ?? category.affectsSurvivalDefault;
  const affectsIncome = debt.affectsIncome ?? category.affectsIncomeDefault;
  const hasLegalRisk = debt.hasLegalRisk ?? category.hasLegalRiskDefault;

  // 2. Fallback de juros — busca em InterestRateReference
  let interestRateMonthly = debt.interestRateMonthly;
  let interestRateSource: RateSource = 'user_provided';
  let interestClass: InterestClass = 'unknown';
  let dataConfidence: ConfidenceLevel = 'high';

  if (interestRateMonthly === null) {
    const reference = await interestRateRepo.findActiveByCategory(category.slug);
    if (reference) {
      interestRateMonthly = Number(reference.monthlyRateMedian);
      interestRateSource = 'market_reference';
      dataConfidence = 'low';
    } else {
      interestRateSource = 'unknown';
      dataConfidence = 'low';
    }
  }

  // 3. Classificar a faixa de juros
  if (interestRateMonthly !== null) {
    interestClass = classifyInterestRate(interestRateMonthly);
  }

  return {
    ...debt,
    affectsSurvival, affectsIncome, hasLegalRisk,
    interestRateMonthly, interestRateSource,
    interestClass, dataConfidence,
  };
}

function classifyInterestRate(monthlyRate: number): InterestClass {
  // Limiares baseados em juros médios do mercado brasileiro
  if (monthlyRate >= 0.08) return 'high';     // ≥ 8% a.m.
  if (monthlyRate >= 0.03) return 'medium';   // 3-8% a.m.
  return 'low';                               // < 3% a.m.
}
```

### 6.4 Casos de borda

| Caso | Comportamento |
|---|---|
| Dívida em categoria sem `InterestRateReference` | `interestRateSource='unknown'`, `interestClass='unknown'`, peso do fator juros zerado no score |
| Usuário declarou taxa zero | Respeita; `interestClass='low'` |
| Dívida com `lastVerifiedAt > 90 dias` | `dataConfidence='low'` automaticamente; gera ação `review` posteriormente |
| Categoria `informal_debt` (família) | `hasLegalRisk=false` default, mas usuário pode declarar `true` se virou caso judicial |

---

## 7. financial-state-detector

### 7.1 Responsabilidade

Calcular capacidade segura, classificar o usuário em um dos 5 estados, mapear para o modo de operação, aplicar **regra de suavização** (pendência #2), aplicar **fallback agressivo para `diagnosisLevel='minimal'`** (pendência #3), salvar snapshot, atualizar cache no `User`.

### 7.2 Contrato

```typescript
export interface FinancialStateDetector {
  detect(context: MotorContext): Promise<DetectorOutput>;
}

export interface DetectorOutput {
  state: FinancialState;
  mode: OperationMode;
  capacity: number;
  breakdown: CapacityBreakdown;
  diagnosisLevel: DiagnosisLevel;
  confidenceWarnings: string[];
  snapshotId: string;
}
```

### 7.3 Pseudocódigo principal

```typescript
async function detect(ctx: MotorContext): Promise<DetectorOutput> {
  const user = await userRepo.getById(ctx.userId);
  const incomes = await incomeRepo.getActiveByUser(ctx.userId);
  const expenses = await expenseRepo.getActiveByUser(ctx.userId);
  const debts = await debtRepo.getActiveByUser(ctx.userId);
  const reserve = await emergencyReserveRepo.getByUserId(ctx.userId);

  // 1. Renda líquida (com fallback para guaranteedAmount se diagnosisLevel='minimal')
  const incomeNetMonthly = computeNetMonthlyIncome(incomes, user);

  // 2. Classificar despesas (fallback agressivo se minimal)
  const aggressiveFallback = user.diagnosisLevel === 'minimal';
  const expensesClassified = expenses.map(e =>
    expenseClassificationService.classify(e, { aggressiveFallback })
  );

  // 3. Agrupar
  const essentialsTotal = sum(
    expensesClassified
      .filter(e => e.isEssential && e.frequency === 'monthly')
      .map(e => Number(e.amount))
  );

  const seasonalProvisionTotal = sum(
    expensesClassified
      .filter(e => e.frequency !== 'monthly' && e.monthlyProvision)
      .map(e => Number(e.monthlyProvision))
  );

  const incomeProtectiveTotal = sum(
    expensesClassified.filter(e => e.isIncomeRelated && !e.isEssential).map(e => Number(e.amount))
  );

  const legalsTotal = sum(
    expensesClassified.filter(e => e.isLegalObligation).map(e => Number(e.amount))
  );

  // 4. Mínimo vital regional
  const minimumVital = await computeMinimumVital(user.stateCode, user.dependentsCount);

  // 5. Reserva operacional (sempre presente)
  const operationalReserve = Math.max(incomeNetMonthly * 0.05, 100);

  // 6. Aporte para reserva de emergência (opcional)
  const emergencyReserveContribution =
    reserve?.isActive ? Number(reserve.monthlyTarget ?? 0) : 0;

  // 7. Capacidade segura
  const safeCapacity =
    incomeNetMonthly
    - essentialsTotal
    - seasonalProvisionTotal
    - incomeProtectiveTotal
    - legalsTotal
    - operationalReserve
    - emergencyReserveContribution;

  // 8. Total mínimos das dívidas
  const minimosTotalDividas = sum(debts.map(d => Number(d.monthlyAmount ?? 0)));

  // 9. Decidir estado bruto
  const rawState = decideState({
    incomeNetMonthly,
    essentialsTotal,
    safeCapacity,
    minimosTotalDividas,
    debts,
  });

  // 10. Suavização (pendência #2)
  const smoothedState = await applySmoothingRule(ctx.userId, rawState);

  // 11. Mapear estado → modo
  const mode = mapStateToMode(smoothedState);

  // 12. Warnings de confiança
  const confidenceWarnings = generateConfidenceWarnings({
    user, expensesClassified, incomes, debts,
  });

  // 13. Snapshot
  const snapshot = await snapshotRepo.create({
    userId: ctx.userId,
    state: smoothedState,
    mode,
    incomeNetMonthly,
    essentialsTotal,
    debtsTotal: sum(debts.map(d => Number(d.totalAmount) - Number(d.amountPaid ?? 0))),
    safeCapacity,
    triggerEvent: ctx.triggerEvent,
  });

  // 14. Cache no User
  await userRepo.updateCache(ctx.userId, {
    lastFinancialState: smoothedState,
    lastOperationMode: mode,
    lastDecisionAt: new Date(),
  });

  return {
    state: smoothedState,
    mode,
    capacity: safeCapacity,
    breakdown: {
      incomeNetMonthly, essentialsTotal, seasonalProvisionTotal,
      incomeProtectiveTotal, legalsTotal, minimumVital,
      operationalReserve, emergencyReserveContribution, safeCapacity,
    },
    diagnosisLevel: user.diagnosisLevel,
    confidenceWarnings,
    snapshotId: snapshot.id,
  };
}
```

### 7.4 Algoritmo de decisão de estado (pure function)

```typescript
function decideState(input: {
  incomeNetMonthly: number;
  essentialsTotal: number;
  safeCapacity: number;
  minimosTotalDividas: number;
  debts: Debt[];
}): FinancialState {
  // 1. Insolvência prática: renda nem cobre o essencial
  if (input.incomeNetMonthly < input.essentialsTotal) {
    return 'practical_insolvency';
  }

  // 2. Déficit ou superendividamento: capacidade segura negativa ou insuficiente
  if (input.safeCapacity < 0) {
    return 'monthly_deficit';
  }

  if (input.safeCapacity < input.minimosTotalDividas) {
    // Simular: usando capacidade segura como pagamento mensal, quantos meses pra quitar tudo?
    const monthsToPayoff = simulator.estimatePayoffMonths(input.debts, input.safeCapacity);
    if (monthsToPayoff > 60) {
      return 'overindebtedness';
    }
    return 'monthly_deficit';
  }

  // 3. Saudável ou apertado: depende da folga
  const folga = input.safeCapacity - input.minimosTotalDividas;
  const folgaPercent = folga / input.incomeNetMonthly;

  if (folgaPercent <= 0.10) {
    return 'tight_budget';
  }

  return 'healthy_with_debt';
}
```

### 7.5 Regra de suavização (pendência #2 do devils-advocate v2)

**Premissa.** Mudança para **PIOR** estado exige 2 detecções consecutivas abaixo do limiar. Mudança para **MELHOR** é imediata. "Consecutivo" se mede por **execução do detector**, não por mês civil.

```typescript
const STATE_RANK: Record<FinancialState, number> = {
  healthy_with_debt: 0,
  tight_budget: 1,
  monthly_deficit: 2,
  overindebtedness: 3,
  practical_insolvency: 4,
};

async function applySmoothingRule(
  userId: string,
  rawState: FinancialState
): Promise<FinancialState> {
  const lastSnapshot = await snapshotRepo.getLastForUser(userId, { maxAgeDays: 45 });

  // Primeira vez: sem suavização
  if (!lastSnapshot) return rawState;

  const lastRank = STATE_RANK[lastSnapshot.state];
  const newRank = STATE_RANK[rawState];

  // Melhora ou estabilidade: aplica imediatamente
  if (newRank <= lastRank) return rawState;

  // Piora: precisa de confirmação consecutiva
  // Buscar o snapshot anterior ao último
  const previousSnapshot = await snapshotRepo.getPreviousBefore(
    userId,
    lastSnapshot.capturedAt,
    { maxAgeDays: 45 }
  );

  // Se não há histórico suficiente, mantém estado anterior (não confirma piora)
  if (!previousSnapshot) return lastSnapshot.state;

  const previousRank = STATE_RANK[previousSnapshot.state];

  // Caso A: snapshot anterior já era pior ou igual ao novo bruto
  //         → 2 detecções consecutivas de piora → confirma
  if (previousRank >= newRank) return rawState;

  // Caso B: piora é nova → mantém o estado anterior (não confirma ainda)
  return lastSnapshot.state;
}
```

**Casos de borda da suavização:**

| Cenário | Comportamento |
|---|---|
| Primeira vez que o detector roda | Sem suavização — usa `rawState` |
| Último snapshot > 45 dias | Considera "primeira vez" novamente |
| Apenas 1 snapshot anterior, e piora | Mantém estado anterior, aguarda confirmação |
| 2 snapshots iguais ao piorado | Confirma piora |
| Volta a melhorar antes da confirmação | Cancela a "piora em curso", reverte ao melhor |
| Salto extremo (Saudável → Insolvência em 1 detecção) | Pula para `monthly_deficit` (intermediário), aguarda confirmação para descer mais |

**Nota sobre o último caso (anti-whiplash extremo):** quando `newRank - lastRank > 1`, em vez de aplicar a regra padrão, o motor desce **apenas um nível por detecção**. Evita transições absurdas como "Saudável → Insolvência" entre janeiros e fevereiros.

### 7.6 Fallback agressivo para `diagnosisLevel='minimal'` (pendência #3)

Quando o usuário só fez Onboarding Crítico, despesas têm campos nulos. Sem fallback, `total_essenciais=0` e capacidade segura infla.

**Estratégia:**

```typescript
function computeNetMonthlyIncome(incomes: Income[], user: User): number {
  const isMinimal = user.diagnosisLevel === 'minimal';

  return sum(incomes.map(income => {
    if (income.frequency === 'recurring') {
      // Para usuários minimal com renda variável: usar piso garantido se existir
      if (isMinimal && income.stabilityType === 'variable' && income.guaranteedAmount) {
        return Number(income.guaranteedAmount);
      }
      return Number(income.amount);
    }

    if (income.frequency === 'installment') {
      // Verificar se há parcela esperada nesse mês
      return isExpectedThisMonth(income) ? Number(income.installmentAmount) : 0;
    }

    if (income.frequency === 'irregular') {
      // Para irregulares: usar média ponderada, descontando 30% como margem
      const baseline = Number(income.guaranteedAmount ?? income.amount * 0.7);
      return baseline;
    }

    // one_time: só conta no mês correspondente
    return isExpectedThisMonth(income) ? Number(income.amount) : 0;
  }));
}
```

A classificação agressiva de despesas (`aggressiveFallback`) também é parte do fallback: assume tudo como essencial exceto `leisure` e `subscription` (ver §5.3).

### 7.7 Warnings de confiança

```typescript
function generateConfidenceWarnings(input): string[] {
  const warnings: string[] = [];

  if (input.user.diagnosisLevel === 'minimal') {
    warnings.push('Diagnóstico inicial — refine seus dados para um plano mais preciso.');
  }

  const lowConfidenceDebts = input.debts.filter(d => d.dataConfidence !== 'high');
  if (lowConfidenceDebts.length > 0) {
    warnings.push(`${lowConfidenceDebts.length} dívida(s) com dados estimados.`);
  }

  const staleDebts = input.debts.filter(d =>
    d.lastVerifiedAt && daysSince(d.lastVerifiedAt) > 90
  );
  if (staleDebts.length > 0) {
    warnings.push(`${staleDebts.length} dívida(s) com dados desatualizados há mais de 90 dias.`);
  }

  if (input.incomes.some(i => i.stabilityType === 'variable')) {
    warnings.push('Renda variável detectada — projeções consideram piso garantido.');
  }

  return warnings;
}
```

### 7.8 Mapeamento estado → modo

```typescript
const STATE_TO_MODE: Record<FinancialState, OperationMode> = {
  healthy_with_debt: 'payoff',
  tight_budget: 'stabilization',
  monthly_deficit: 'crisis_mode',
  overindebtedness: 'protection',
  practical_insolvency: 'survival',
};
```

---

## 8. priority-engine

### 8.1 Responsabilidade

Calcular `priorityScore` de cada dívida usando os pesos vivos em `ScoringWeight`. Gerar `priorityReason` em frase curta.

### 8.2 Contrato

```typescript
export interface PriorityEngine {
  calculate(input: PriorityScoreInput): Promise<PriorityScoreOutput>;
  calculateBatch(debts: ClassifiedDebt[], context: ScoringContext): Promise<PriorityScoreOutput[]>;
}

export interface PriorityScoreInput {
  debt: ClassifiedDebt;
  context: ScoringContext;
}

export interface ScoringContext {
  userId: string;
  safeCapacity: number;
  financialState: FinancialState;
  allDebts: ClassifiedDebt[];
}

export interface PriorityScoreOutput {
  debtId: string;
  score: number;
  reason: string;
  topFactors: FactorContribution[];
}

export interface FactorContribution {
  factorKey: string;
  rawValue: number;        // 0-1 normalizado
  weight: number;
  contribution: number;    // rawValue * weight * sign
}
```

### 8.3 Algoritmo

```typescript
async function calculate(input: PriorityScoreInput): Promise<PriorityScoreOutput> {
  const weights = await scoringWeightRepo.getActiveAsMap();

  // Calcular cada fator (sempre 0-1)
  const factors: Record<string, number> = {
    risco_moradia: calcRiscoMoradia(input.debt),
    risco_renda: calcRiscoRenda(input.debt),
    risco_legal: input.debt.hasLegalRisk ? 1 : 0,
    risco_servico_essencial: calcRiscoServicoEssencial(input.debt),
    juros_mensal_normalizado: calcJurosNormalizado(input.debt),
    dias_atraso_normalizado: Math.min(input.debt.daysOverdue / 90, 1),
    parcelas_em_atraso_normalizado: Math.min((input.debt.installmentsOverdue ?? 0) / 3, 1),
    desconto_disponivel_sustentavel: calcDescontoSustentavel(input.debt, input.context),
    valor_pequeno_quitavel: calcValorPequenoQuitavel(input.debt, input.context),
    parcela_insustentavel: calcParcelaInsustentavel(input.debt, input.context),
    acordo_sem_folga: calcAcordoSemFolga(input.debt, input.context),
  };

  // Somar contribuições
  let score = 0;
  const contributions: FactorContribution[] = [];

  for (const [key, rawValue] of Object.entries(factors)) {
    const weight = weights.get(key);
    if (!weight) continue;
    const contribution = rawValue * Number(weight.weight) * (weight.isPositive ? 1 : -1);
    score += contribution;
    if (Math.abs(contribution) > 0.5) {
      contributions.push({ factorKey: key, rawValue, weight: Number(weight.weight), contribution });
    }
  }

  // Razão = top 2 fatores
  const top2 = contributions
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 2);
  const reason = formatReason(top2, input.debt);

  return { debtId: input.debt.id, score, reason, topFactors: top2 };
}
```

### 8.4 Cálculos individuais de fator (exemplos)

```typescript
function calcRiscoMoradia(debt: ClassifiedDebt): number {
  if (debt.affectsSurvival && debt.collateralType === 'property') return 1;
  if (debt.affectsSurvival) return 0.6;
  return 0;
}

function calcJurosNormalizado(debt: ClassifiedDebt): number {
  if (!debt.interestRateMonthly) return 0;
  return Math.min(debt.interestRateMonthly / 0.15, 1); // 15% a.m. = teto
}

function calcParcelaInsustentavel(debt: ClassifiedDebt, ctx: ScoringContext): number {
  const parcela = Number(debt.monthlyAmount ?? 0);
  if (parcela === 0) return 0;
  // Se a parcela ultrapassa 30% da capacidade segura, é insustentável
  const ratio = parcela / ctx.safeCapacity;
  if (ratio > 0.5) return 1;
  if (ratio > 0.3) return 0.5;
  return 0;
}

function calcValorPequenoQuitavel(debt: ClassifiedDebt, ctx: ScoringContext): number {
  const restante = Number(debt.totalAmount) - Number(debt.amountPaid ?? 0);
  if (restante <= ctx.safeCapacity * 0.8) return 1; // cabe pra quitar este mês
  if (restante <= ctx.safeCapacity * 2) return 0.5; // cabe em 2 meses
  return 0;
}
```

### 8.5 Formatação de `reason`

```typescript
function formatReason(top: FactorContribution[], debt: ClassifiedDebt): string {
  if (top.length === 0) return 'Prioridade padrão por categoria.';

  const reasons: Record<string, string> = {
    risco_moradia: 'risco de perder a moradia',
    risco_renda: 'risco de perder a fonte de renda',
    risco_legal: 'risco de ação judicial',
    risco_servico_essencial: 'risco de corte de serviço essencial',
    juros_mensal_normalizado: `juros altos (${(debt.interestRateMonthly! * 100).toFixed(1)}% ao mês)`,
    dias_atraso_normalizado: `${debt.daysOverdue} dias em atraso`,
    parcelas_em_atraso_normalizado: `${debt.installmentsOverdue} parcelas atrasadas`,
    desconto_disponivel_sustentavel: 'acordo com desconto disponível',
    valor_pequeno_quitavel: 'pode ser quitada rapidamente',
    parcela_insustentavel: 'parcela compromete o orçamento',
    acordo_sem_folga: 'acordo atual não cabe',
  };

  const main = reasons[top[0].factorKey] ?? top[0].factorKey;
  if (top.length === 1) return capitalize(main);

  const secondary = reasons[top[1].factorKey] ?? '';
  return `${capitalize(main)} e ${secondary}.`;
}
```

---

## 9. strategy-selector

### 9.1 Responsabilidade

Escolher a estratégia (`snowball`, `avalanche`, `hybrid`, `crisis`) e travar quais `ActionType` são permitidos no modo de operação atual.

### 9.2 Contrato

```typescript
export interface StrategySelector {
  select(input: StrategySelectorInput): PlanStrategy;
  getAllowedActions(mode: OperationMode): ActionType[];
}

export interface StrategySelectorInput {
  financialState: FinancialState;
  mode: OperationMode;
  debts: ClassifiedDebt[];
  behaviorProfile: BehaviorProfile | null;
}
```

### 9.3 Constante crítica — `OPERATION_MODE_RULES`

```typescript
export const OPERATION_MODE_RULES: Record<OperationMode, ActionType[]> = {
  payoff:        ['pay', 'negotiate', 'cut', 'review', 'monitor'],
  stabilization: ['pay', 'negotiate', 'cut', 'review', 'monitor'],
  crisis_mode:   ['pay', 'negotiate', 'pause', 'cut', 'wait', 'refuse', 'review'],
  protection:    ['negotiate', 'pause', 'wait', 'refuse', 'review', 'monitor'],
  survival:      ['pause', 'wait', 'review', 'monitor'],
};
```

**Modo `survival` NUNCA gera `pay` ou `negotiate`.** Validação inviolável.

### 9.4 Algoritmo de seleção

```typescript
function select(input: StrategySelectorInput): PlanStrategy {
  // 1. Estados críticos forçam crisis
  if (['monthly_deficit', 'overindebtedness', 'practical_insolvency'].includes(input.financialState)) {
    return 'crisis';
  }

  // 2. Se o usuário declarou preferência, respeita (em estados não-críticos)
  if (input.behaviorProfile?.preferredStrategy && input.behaviorProfile.preferredStrategy !== 'undecided') {
    return input.behaviorProfile.preferredStrategy as PlanStrategy;
  }

  // 3. Auto-seleção baseada em composição da carteira
  const hasManySmallDebts = input.debts.filter(d => Number(d.totalAmount) < 1000).length >= 3;
  const hasCriticalDebt = input.debts.some(d => d.affectsSurvival || d.hasLegalRisk);
  const hasExpensiveDebt = input.debts.some(d => d.interestClass === 'high');

  if (hasCriticalDebt || (hasExpensiveDebt && hasManySmallDebts)) {
    return 'hybrid';  // padrão para casos reais
  }

  if (hasExpensiveDebt) return 'avalanche';
  if (hasManySmallDebts) return 'snowball';

  return 'hybrid';
}
```

---

## 10. simulator

### 10.1 Responsabilidade

Gerar 3 cenários de quitação (conservador, otimizado, acelerado) e estimar faixa de prazo. Nunca promete data exata.

### 10.2 Contrato

```typescript
export interface Simulator {
  simulate(input: SimulatorInput): SimulatorOutput;
  estimatePayoffMonths(debts: Debt[], monthlyPayment: number): number;
}

export interface SimulatorInput {
  debts: ClassifiedDebt[];
  safeCapacity: number;
  strategy: PlanStrategy;
  potentialCuts?: number;       // economia extra confirmada
  potentialExtraIncome?: number; // renda extra esperada
}

export interface SimulatorOutput {
  conservative: ScenarioResult;
  optimized: ScenarioResult;
  accelerated: ScenarioResult;
  estimatedPayoffMonthsMin: number;
  estimatedPayoffMonthsMax: number;
}

export interface ScenarioResult {
  monthlyPayment: number;
  totalMonths: number;
  totalInterestPaid: number;
  totalPaid: number;
  debtsOrder: { debtId: string; monthQuitada: number }[];
}
```

### 10.3 Algoritmo (cenário conservador)

```typescript
function simulateScenario(
  debts: ClassifiedDebt[],
  monthlyPayment: number,
  strategy: PlanStrategy
): ScenarioResult {
  let remainingDebts = debts.map(d => ({
    id: d.id,
    balance: Number(d.totalAmount) - Number(d.amountPaid ?? 0),
    monthlyRate: d.interestRateMonthly ?? 0,
    minimum: Number(d.monthlyAmount ?? 0),
  }));

  let month = 0;
  let totalInterestPaid = 0;
  const debtsOrder: { debtId: string; monthQuitada: number }[] = [];
  const maxMonths = 120; // teto de 10 anos pra não loopar infinito

  while (remainingDebts.length > 0 && month < maxMonths) {
    month++;
    let availableThisMonth = monthlyPayment;

    // 1. Pagar todos os mínimos
    for (const debt of remainingDebts) {
      const pay = Math.min(debt.minimum, availableThisMonth, debt.balance);
      debt.balance -= pay;
      availableThisMonth -= pay;
    }

    // 2. Aplicar juros sobre o saldo
    for (const debt of remainingDebts) {
      const interest = debt.balance * debt.monthlyRate;
      debt.balance += interest;
      totalInterestPaid += interest;
    }

    // 3. Direcionar excedente conforme estratégia
    if (availableThisMonth > 0) {
      const target = pickTargetDebt(remainingDebts, strategy);
      if (target) {
        const pay = Math.min(target.balance, availableThisMonth);
        target.balance -= pay;
      }
    }

    // 4. Remover quitadas
    const newRemaining = [];
    for (const debt of remainingDebts) {
      if (debt.balance <= 0.01) {
        debtsOrder.push({ debtId: debt.id, monthQuitada: month });
      } else {
        newRemaining.push(debt);
      }
    }
    remainingDebts = newRemaining;
  }

  return {
    monthlyPayment,
    totalMonths: month,
    totalInterestPaid,
    totalPaid: monthlyPayment * month,
    debtsOrder,
  };
}

function pickTargetDebt(debts: any[], strategy: PlanStrategy) {
  if (strategy === 'snowball') {
    return [...debts].sort((a, b) => a.balance - b.balance)[0];
  }
  if (strategy === 'avalanche') {
    return [...debts].sort((a, b) => b.monthlyRate - a.monthlyRate)[0];
  }
  // hybrid: critical first, then highest rate
  // crisis: não aplica excedente (tudo vai pra essenciais)
  return null;
}
```

### 10.4 Os 3 cenários

| Cenário | `monthlyPayment` |
|---|---|
| Conservador | `safeCapacity` |
| Otimizado | `safeCapacity + potentialCuts` |
| Acelerado | `safeCapacity + potentialCuts + potentialExtraIncome` |

Faixa de prazo final: `min(conservative.months, accelerated.months)` a `max`.

---

## 11. settlement-validator

### 11.1 Responsabilidade

Validar uma proposta de acordo. Recusar se não cabe no orçamento. Sugerir negociação se desconto é pequeno. Persistir em `SettlementEvaluation`.

### 11.2 Contrato

```typescript
export interface SettlementValidator {
  validate(input: SettlementValidatorInput): Promise<SettlementValidatorOutput>;
}

export interface SettlementValidatorInput {
  userId: string;
  debtId: string;
  proposalCashAmount?: number;
  proposalInstallments?: number;
  proposalInstallmentAmount?: number;
  proposalDeadline?: Date;
}

export interface SettlementValidatorOutput {
  recommendation: 'accept' | 'negotiate_lower' | 'reject';
  maxSafeInstallment: number;
  discountPercent?: number;
  reasoning: string;
  wouldCauseNegativeCashflow: boolean;
  evaluationId: string;
}
```

### 11.3 Algoritmo

```typescript
async function validate(input: SettlementValidatorInput): Promise<SettlementValidatorOutput> {
  const debt = await debtRepo.getById(input.debtId);
  const detector = await financialStateDetector.detect({
    userId: input.userId,
    referenceMonth: firstDayOfCurrentMonth(),
    triggerEvent: 'settlement_evaluated',
    triggeredAt: new Date(),
  });

  const safeCapacity = detector.capacity;

  // Reservar pra outras dívidas críticas
  const otherCriticalDebts = await debtRepo.getCritical(input.userId, { excludeId: input.debtId });
  const reservedForOthers = sum(otherCriticalDebts.map(d => Number(d.monthlyAmount ?? 0)));
  const maxSafeInstallment = Math.max(0, safeCapacity - reservedForOthers);

  // Desconto
  const debtTotal = Number(debt.totalAmount) - Number(debt.amountPaid ?? 0);
  let discountPercent: number | undefined;
  let proposalTotal = 0;

  if (input.proposalCashAmount) {
    proposalTotal = input.proposalCashAmount;
    discountPercent = ((debtTotal - input.proposalCashAmount) / debtTotal) * 100;
  } else if (input.proposalInstallmentAmount && input.proposalInstallments) {
    proposalTotal = input.proposalInstallmentAmount * input.proposalInstallments;
    discountPercent = ((debtTotal - proposalTotal) / debtTotal) * 100;
  }

  let recommendation: 'accept' | 'negotiate_lower' | 'reject';
  let reasoning: string;
  let wouldCauseNegativeCashflow = false;

  // Decisão
  if (input.proposalInstallmentAmount && input.proposalInstallmentAmount > maxSafeInstallment) {
    wouldCauseNegativeCashflow = true;
    if (input.proposalInstallmentAmount > maxSafeInstallment * 1.5) {
      recommendation = 'reject';
      reasoning = `A parcela de R$ ${formatBRL(input.proposalInstallmentAmount)} ultrapassa muito sua capacidade segura (R$ ${formatBRL(maxSafeInstallment)}). Esse acordo deixaria seu caixa negativo.`;
    } else {
      recommendation = 'negotiate_lower';
      reasoning = `A parcela de R$ ${formatBRL(input.proposalInstallmentAmount)} aperta seu mês. Tente negociar até R$ ${formatBRL(maxSafeInstallment)}.`;
    }
  } else if (input.proposalCashAmount && input.proposalCashAmount > safeCapacity) {
    recommendation = 'reject';
    reasoning = `O valor à vista compromete seu mês inteiro. Vale pedir parcelamento.`;
    wouldCauseNegativeCashflow = true;
  } else if (input.proposalInstallments && input.proposalInstallments > 12 && (discountPercent ?? 0) < 15) {
    recommendation = 'negotiate_lower';
    reasoning = `Desconto pequeno (${discountPercent?.toFixed(0)}%) para um parcelamento longo. Vale tentar mais desconto ou prazo menor.`;
  } else if (input.proposalDeadline && input.proposalDeadline < new Date()) {
    recommendation = 'reject';
    reasoning = 'A proposta está expirada. Peça uma nova proposta atualizada.';
  } else {
    recommendation = 'accept';
    reasoning = discountPercent && discountPercent > 0
      ? `Cabe no seu orçamento e oferece ${discountPercent.toFixed(0)}% de desconto.`
      : 'Cabe no seu orçamento.';
  }

  // Persistir
  const evaluation = await settlementEvaluationRepo.create({
    userId: input.userId,
    debtId: input.debtId,
    proposalCashAmount: input.proposalCashAmount,
    proposalInstallments: input.proposalInstallments,
    proposalInstallmentAmount: input.proposalInstallmentAmount,
    proposalDeadline: input.proposalDeadline,
    recommendation,
    maxSafeInstallment,
    discountPercent,
    wouldCauseNegativeCashflow,
    reasoning,
    capacityAtEvaluation: safeCapacity,
  });

  return {
    recommendation,
    maxSafeInstallment,
    discountPercent,
    reasoning,
    wouldCauseNegativeCashflow,
    evaluationId: evaluation.id,
  };
}
```

### 11.4 Rate-limit Free vs Premium

```typescript
async function checkRateLimit(userId: string, planType: PlanType): Promise<void> {
  if (planType === 'premium') return; // ilimitado

  const evaluationsThisMonth = await settlementEvaluationRepo.countByUserSince(
    userId,
    firstDayOfCurrentMonth()
  );

  if (evaluationsThisMonth >= 1) {
    throw new SettlementRateLimitError('Free libera 1 avaliação por mês. Faça upgrade para Premium.');
  }
}
```

---

## 12. goal-tracker-service

### 12.1 Responsabilidade

Gerenciar `UserGoal`. Não influencia o score do `priority-engine`, mas alimenta a comunicação do app (banner motivacional, projeção contextualizada).

### 12.2 Contrato

```typescript
export interface GoalTrackerService {
  list(userId: string): Promise<UserGoal[]>;
  add(userId: string, input: UserGoalInput): Promise<UserGoal>;
  update(goalId: string, input: Partial<UserGoalInput>): Promise<UserGoal>;
  markAchieved(goalId: string): Promise<UserGoal>;
  getPrimaryGoal(userId: string): Promise<UserGoal | null>;  // o de maior prioridade ativo
  composeMotivationalText(userId: string, mode: OperationMode): Promise<string | null>;
}
```

### 12.3 Texto motivacional contextualizado

```typescript
async function composeMotivationalText(userId: string, mode: OperationMode): Promise<string | null> {
  const goal = await this.getPrimaryGoal(userId);
  if (!goal) return null;

  const goalLabels: Record<GoalType, string> = {
    debt_freedom: 'sair das dívidas',
    house: 'sua casa própria',
    education: 'seus estudos',
    family: 'sua família',
    travel: 'sua viagem',
    peace: 'tranquilidade',
    security: 'segurança financeira',
    retirement: 'sua aposentadoria',
    other: 'seu objetivo',
  };

  const label = goalLabels[goal.goalType];

  // Variações por modo (não banalizar em Modo Crise/Sobrevivência)
  if (['crisis_mode', 'protection', 'survival'].includes(mode)) {
    return null; // não exibe banner motivacional em momentos sensíveis
  }

  if (mode === 'payoff') {
    return `Mais perto de ${label}.`;
  }

  if (mode === 'stabilization') {
    return `Um passo por vez até ${label}.`;
  }

  return null;
}
```

---

## 13. seasonal-expense-service

### 13.1 Responsabilidade

Calcular `monthlyProvision` automaticamente quando o usuário cadastra despesa não-mensal. Gerar ações `review` quando o `nextOccurrence` se aproxima.

### 13.2 Contrato

```typescript
export interface SeasonalExpenseService {
  computeMonthlyProvision(expense: Expense): number;
  shouldGenerateReviewAction(expense: Expense, today: Date): boolean;
  listUpcomingProvisions(userId: string, monthsAhead: number): Promise<UpcomingProvision[]>;
}

export interface UpcomingProvision {
  expenseId: string;
  expenseName: string;
  amount: number;
  expectedDate: Date;
  monthsUntil: number;
}
```

### 13.3 Cálculo

```typescript
const FREQUENCY_DIVISORS: Record<ExpenseFrequency, number> = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
  irregular: 12, // assume 1x ao ano se não souber
};

function computeMonthlyProvision(expense: Expense): number {
  if (expense.frequency === 'monthly') return 0; // mensal já entra no essentialsTotal direto
  const divisor = FREQUENCY_DIVISORS[expense.frequency];
  return Number(expense.amount) / divisor;
}

function shouldGenerateReviewAction(expense: Expense, today: Date): boolean {
  if (!expense.nextOccurrence) return false;
  const daysUntil = daysBetween(today, expense.nextOccurrence);
  return daysUntil > 0 && daysUntil <= 30;  // próximos 30 dias
}
```

---

## 14. monthly-plan-generator (orquestrador)

### 14.1 Responsabilidade

Orquestrar todos os módulos acima. Gerar o `MonthlyActionPlan` com sua lista de `RecommendedAction`. Decidir update in-place vs criação.

### 14.2 Contrato

```typescript
export interface MonthlyPlanGenerator {
  generate(context: MotorContext): Promise<MonthlyActionPlan>;
  generateActions(input: ActionGenerationInput): RecommendedAction[];
}
```

### 14.3 Pipeline completo

```typescript
async function generate(ctx: MotorContext): Promise<MonthlyActionPlan> {
  // 1. Detectar estado e capacidade
  const detector = await financialStateDetector.detect(ctx);

  // 2. Buscar e classificar dívidas
  const debts = await financialProfileService.listActiveDebts(ctx.userId);
  const classifiedDebts = await Promise.all(
    debts.map(d => debtClassificationService.classify(d))
  );

  // 3. Calcular score
  const scoredDebts = await priorityEngine.calculateBatch(classifiedDebts, {
    userId: ctx.userId,
    safeCapacity: detector.capacity,
    financialState: detector.state,
    allDebts: classifiedDebts,
  });

  // Persistir score em cada Debt
  await Promise.all(scoredDebts.map(s =>
    debtRepo.updateScore(s.debtId, s.score, s.reason)
  ));

  // 4. Selecionar estratégia
  const behaviorProfile = await behaviorProfileRepo.getByUserId(ctx.userId);
  const strategy = strategySelector.select({
    financialState: detector.state,
    mode: detector.mode,
    debts: classifiedDebts,
    behaviorProfile,
  });

  // 5. Gerar ações conforme regras do modo
  const allowedActions = OPERATION_MODE_RULES[detector.mode];
  const expenses = await financialProfileService.listActiveExpenses(ctx.userId);
  const goals = await goalTrackerService.list(ctx.userId);

  const actions = generateActions({
    debts: classifiedDebts.map(d => ({ ...d, score: scoredDebts.find(s => s.debtId === d.id)!.score })),
    expenses,
    capacity: detector.capacity,
    mode: detector.mode,
    strategy,
    allowedActions,
    goals,
  });

  // 6. Compor warnings
  const warnings = [
    ...detector.confidenceWarnings,
    ...generateModeSpecificWarnings(detector.mode, classifiedDebts),
  ];

  // 7. Próxima revisão
  const nextReviewDate = await computeNextReviewDate(ctx.userId, ctx.referenceMonth);

  // 8. Upsert (in-place update)
  const plan = await monthlyPlanRepo.upsert({
    userId: ctx.userId,
    referenceMonth: ctx.referenceMonth,
    financialState: detector.state,
    operationMode: detector.mode,
    incomeNetMonthly: detector.breakdown.incomeNetMonthly,
    essentialsTotal: detector.breakdown.essentialsTotal,
    seasonalProvisionTotal: detector.breakdown.seasonalProvisionTotal,
    incomeProtectiveTotal: detector.breakdown.incomeProtectiveTotal,
    legalsTotal: detector.breakdown.legalsTotal,
    minimumVital: detector.breakdown.minimumVital,
    emergencyReserveContribution: detector.breakdown.emergencyReserveContribution,
    safeCapacity: detector.capacity,
    mainGoal: composeMainGoal(detector.mode, goals),
    warnings,
    nextReviewDate,
    actions,
  });

  return plan;
}
```

### 14.4 Comportamento de update in-place (pendência #4 do devils-advocate v2)

```typescript
async function upsertPlan(input: PlanUpsertInput): Promise<MonthlyActionPlan> {
  const existing = await monthlyPlanRepo.findActive(input.userId, input.referenceMonth);

  if (!existing) {
    return await monthlyPlanRepo.createFull(input);  // primeira vez no mês
  }

  // Atualiza campos do plano
  const updated = await monthlyPlanRepo.update(existing.id, {
    financialState: input.financialState,
    operationMode: input.operationMode,
    safeCapacity: input.safeCapacity,
    // ... todos os outros campos do breakdown
    mainGoal: input.mainGoal,
    warnings: input.warnings,
    nextReviewDate: input.nextReviewDate,
  });

  // Reconciliar ações:
  //   - Ações pending que ainda fazem sentido: mantém
  //   - Ações pending que sumiram do novo plano: marca expired
  //   - Ações completed: mantém intactas (histórico)
  //   - Ações novas: insere
  await reconcileActions(existing.id, input.actions);

  return updated;
}

async function reconcileActions(planId: string, newActions: RecommendedAction[]): Promise<void> {
  const existing = await recommendedActionRepo.listByPlan(planId);
  const existingPending = existing.filter(a => a.status === 'pending');

  // Marcar como expired as pending que não correspondem a nenhuma nova
  for (const old of existingPending) {
    const stillExists = newActions.some(n => matchAction(old, n));
    if (!stillExists) {
      await recommendedActionRepo.markExpired(old.id);
    }
  }

  // Inserir/atualizar as novas
  for (const newAction of newActions) {
    const match = existing.find(e => matchAction(e, newAction));
    if (match && match.status === 'pending') {
      await recommendedActionRepo.update(match.id, newAction);
    } else if (!match) {
      await recommendedActionRepo.create({ ...newAction, planId });
    }
  }
}

function matchAction(a: RecommendedAction, b: RecommendedAction): boolean {
  return a.actionType === b.actionType
    && a.targetDebtId === b.targetDebtId
    && a.targetExpenseId === b.targetExpenseId;
}
```

### 14.5 Geração de ações (resumo)

A função `generateActions` é a mais densa do motor. Em alto nível:

```typescript
function generateActions(input: ActionGenerationInput): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  // 1. Ações de PAY/NEGOTIATE para dívidas — só se modo permite
  if (input.allowedActions.includes('pay')) {
    // Ordenar dívidas por score; alocar capacidade conforme estratégia
    const sortedDebts = input.debts.sort((a, b) => b.score - a.score);
    let remainingCapacity = input.capacity;

    for (const debt of sortedDebts) {
      if (remainingCapacity <= 0) break;
      const minimum = Number(debt.monthlyAmount ?? 0);

      if (minimum > 0 && minimum <= remainingCapacity) {
        actions.push(createPayAction(debt, minimum));
        remainingCapacity -= minimum;
      } else if (minimum > remainingCapacity && input.allowedActions.includes('negotiate')) {
        actions.push(createNegotiateAction(debt, remainingCapacity));
      } else if (input.allowedActions.includes('pause')) {
        actions.push(createPauseAction(debt));
      }
    }
  }

  // 2. Ações de CUT para despesas com canCancel/canReduce — só em estados não saudáveis
  if (input.allowedActions.includes('cut') && input.mode !== 'payoff') {
    const cutCandidates = input.expenses
      .filter(e => !e.isEssential && (e.canCancel || e.canReduce))
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 2);

    cutCandidates.forEach(e => actions.push(createCutAction(e)));
  }

  // 3. Ações de REVIEW para dados desatualizados — limite de 1 por mês
  if (input.allowedActions.includes('review')) {
    const stale = input.debts.find(d =>
      d.lastVerifiedAt && daysSince(d.lastVerifiedAt) > 90
    );
    if (stale) actions.push(createReviewAction(stale));
  }

  // 4. Ações de WAIT para dívidas sem caixa neste mês — só em crise/proteção
  if (input.allowedActions.includes('wait')) {
    const waiting = input.debts.filter(d =>
      !actions.some(a => a.targetDebtId === d.id)
      && !d.affectsSurvival
    );
    waiting.forEach(d => actions.push(createWaitAction(d)));
  }

  // 5. Limitar a 3-6 ações
  return actions
    .map((a, i) => ({ ...a, order: i + 1 }))
    .slice(0, 6);
}
```

### 14.6 Cálculo de `nextReviewDate`

```typescript
async function computeNextReviewDate(userId: string, currentMonth: Date): Promise<Date> {
  const incomes = await incomeRepo.getActiveByUser(userId);
  const primaryIncome = incomes
    .filter(i => i.frequency === 'recurring' && i.paymentDay)
    .sort((a, b) => Number(b.amount) - Number(a.amount))[0];

  const nextMonth = addMonths(currentMonth, 1);

  if (primaryIncome?.paymentDay) {
    // Revisar 1 dia antes do pagamento
    return setDate(nextMonth, primaryIncome.paymentDay - 1);
  }

  // Default: dia 1 do próximo mês
  return startOfMonth(nextMonth);
}
```

---

## 15. Eventos e jobs do sistema

### 15.1 Jobs BullMQ definidos

| Job | Disparo | Conteúdo |
|---|---|---|
| `RecalculateFinancialStateJob` | Evento CRUD em Income/Expense/Debt | Chama `financialStateDetector.detect()` |
| `RecalculateMonthlyPlanJob` | Evento CRUD ou `RecalculateFinancialStateJob` concluído | Chama `monthlyPlanGenerator.generate()` |
| `MonthlyPlanRolloverJob` | Scheduled diário 02:00 UTC | Para usuários com `nextReviewDate <= hoje`, dispara novo `RecalculateMonthlyPlanJob` |
| `DataFreshnessReviewJob` | Scheduled semanal (domingo 03:00 UTC) | Identifica dívidas com `lastVerifiedAt > 90 dias`; agenda ações `review` |
| `DataRetentionCleanupJob` | Scheduled diário 04:00 UTC | Aplica política de retenção (§16) |
| `SettlementEvaluationJob` | Sob demanda do controller | Chama `settlementValidator.validate()` (síncrono, é o caso) |

### 15.2 Política de retry

| Tentativa | Atraso |
|---|---|
| 1ª | 5 minutos |
| 2ª | 30 minutos |
| 3ª | 2 horas |
| 4ª | 8 horas |
| 5ª (último) | Dead-letter queue + log no Sentry |

Após 5 falhas, o plano antigo permanece válido. Usuário não nota.

### 15.3 Fluxo de eventos (exemplo)

```
Usuário cadastra dívida
  └─ DebtController.create()
       └─ FinancialProfileService.addDebt()
            └─ eventBus.publish('debt_added', { userId, debtId })
                 └─ BullMQ queue: RecalculateFinancialStateJob
                      └─ FinancialStateDetector.detect()
                           ├─ Snapshot persistido
                           ├─ User cache atualizado
                           └─ eventBus.publish('state_detected', { userId })
                                └─ BullMQ queue: RecalculateMonthlyPlanJob
                                     └─ MonthlyPlanGenerator.generate()
                                          ├─ MonthlyActionPlan upserted
                                          └─ Pronto. App mostra plano atualizado quando usuário voltar.
```

---

## 16. Política de retenção de dados (LGPD)

Pendência #1 do devils-advocate v2. Matriz por tabela.

| Tabela | Tipo | Tempo de retenção | Trigger de eliminação |
|---|---|---|---|
| `User` | dado primário | enquanto conta ativa | 30 dias após delete request: hard delete + cascade |
| `Income`, `Expense`, `Debt`, `Payment`, `BehaviorProfile`, `EmergencyReserve`, `UserGoal` | dados de negócio | enquanto conta ativa | cascade do `User` |
| `MonthlyActionPlan` (ativo) | operacional | 12 meses | `DataRetentionCleanupJob` deleta `isActive=false` com `referenceMonth < hoje - 12m` |
| `RecommendedAction` (terminal) | histórico | 12 meses | cascade do plano deletado |
| `SettlementEvaluation` | auditoria | 5 anos (CDC art. 27 — prescrição) | `DataRetentionCleanupJob` mensal deleta > 5 anos |
| `FinancialStateSnapshot` | histórico | 2 anos | `DataRetentionCleanupJob` mensal deleta > 2 anos |
| `ConsentLog` | auditoria LGPD | 5 anos após revogação | Manual ou expurgo após 5 anos pós `accepted=false` |
| `DataExport` | operacional | 30 dias | `DataRetentionCleanupJob` deleta > 30 dias |
| `NotificationPreference` | preferências | enquanto conta ativa | cascade do `User` |
| `DebtCategory`, `RegionalMinimumVital`, `InterestRateReference`, `SupportChannel`, `ScoringWeight` | referência | indefinido | manual via seed |

### 16.1 Direitos do titular (LGPD art. 18)

| Direito | Como implementado |
|---|---|
| Confirmação e acesso | `DataExport` (já existe) |
| Correção | Edição via app |
| Anonimização/eliminação | Soft delete; após 30 dias hard delete + cascade |
| Portabilidade | `DataExport` em JSON |
| Revogação de consentimento | Tela "Configurações > Privacidade" → grava em `ConsentLog` com `accepted=false` |
| Informações sobre uso compartilhado | Política de Privacidade |

---

## 17. Casos de borda do sistema

### 17.1 Inventário de casos críticos

| Caso | Comportamento |
|---|---|
| **Usuário sem renda cadastrada** | `incomeNetMonthly=0` → automaticamente `practical_insolvency` → Modo `survival`. Warning: "Cadastre sua renda para ver recomendações personalizadas." |
| **Usuário sem dívidas** | Não roda `monthly-plan-generator` no fluxo padrão. App mostra "Você está sem dívidas cadastradas — ótimo lugar pra começar!" |
| **Renda zero ativa** | Mesmo comportamento que renda não cadastrada |
| **Dívida com `monthlyAmount=null`** | Score calculado normalmente; ação gerada é `review` ("informe o valor da parcela") em vez de `pay` |
| **Dívida com `totalAmount=0`** | Auto-marca `status='paid'` |
| **Acordo expirado** (`proposalDeadline < hoje`) | `settlement-validator` retorna `recommendation='reject'` com motivo "Proposta expirada" |
| **Recálculo durante o mês** | Update in-place (§14.4) |
| **Job falhou 5x** | Dead-letter queue + log; plano anterior permanece válido; sem notificação ao usuário |
| **Usuário em `survival` cadastra nova dívida** | Aceito normalmente; motor recalcula e mantém modo (provavelmente) — sem `pay` gerado |
| **`diagnosisLevel='minimal'` com 1 só dívida** | Fallback agressivo aplica; score calculado com `dataConfidence='low'`; warning explícito |
| **Usuário muda `paymentDay` no meio do mês** | `nextReviewDate` recalculado; pode antecipar ou postergar próxima revisão |
| **Dívida com `installmentsOverdue > totalInstallments`** | Validação rejeita; deve ser erro de cadastro |
| **`ScoringWeight` tabela vazia** | Motor usa hardcoded fallback (constantes na Fase 1 §7.5) |
| **`InterestRateReference` sem entrada pra categoria** | `interestRateMonthly=null`; peso do fator juros zerado; warning ao usuário |
| **Dois snapshots no mesmo dia (idempotência)** | Permitido — cada execução gera um, mas o último vence o cache |

---

## 18. Estratégia de testes

### 18.1 Pirâmide de testes

```
       ┌────────────┐
       │   E2E      │  3-5 cenários canônicos completos
       └────────────┘
     ┌──────────────────┐
     │   Integration    │  por módulo + repositórios reais (test DB)
     └──────────────────┘
   ┌────────────────────────┐
   │      Unit              │  todas as funções puras
   └────────────────────────┘
```

### 18.2 Funções puras (unit, 100% coverage)

- `decideState()`
- `applySmoothingRule()`
- `computeNetMonthlyIncome()`
- `classifyInterestRate()`
- `calc*` (todos os fatores do score)
- `formatReason()`
- `simulateScenario()`
- `pickTargetDebt()`
- `composeMotivationalText()`
- `computeMonthlyProvision()`
- `matchAction()`

### 18.3 Validações inviolaveis (testes obrigatórios)

```typescript
describe('OperationMode rules — invariantes do motor', () => {
  it('NUNCA gera actionType=pay em modo survival', async () => {
    const ctx = buildContextForSurvival();
    const plan = await generator.generate(ctx);
    expect(plan.actions.every(a => a.actionType !== 'pay')).toBe(true);
  });

  it('NUNCA gera actionType=negotiate em modo survival', async () => {
    const ctx = buildContextForSurvival();
    const plan = await generator.generate(ctx);
    expect(plan.actions.every(a => a.actionType !== 'negotiate')).toBe(true);
  });

  it('NUNCA gera pay em protection', async () => {
    const ctx = buildContextForProtection();
    const plan = await generator.generate(ctx);
    expect(plan.actions.every(a => a.actionType !== 'pay')).toBe(true);
  });
});
```

### 18.4 8 cenários canônicos (fixtures + integration tests)

| Personagem | Cenário | Estado esperado | Modo esperado |
|---|---|---|---|
| **Maria CLT saudável** | Salário R$ 5.000 fixo, 1 dívida de R$ 1.200 (parcela R$ 80), aluguel R$ 1.500, contas R$ 400 | `healthy_with_debt` | `payoff` |
| **João autônomo apertado** | Renda média R$ 2.500 (guaranteed R$ 1.500), 3 dívidas somando R$ 8.000 | `tight_budget` | `stabilization` |
| **Pedro afogado** | Salário R$ 2.800, 6 dívidas somando R$ 22.000, essenciais R$ 2.000, mínimos R$ 1.400 | `monthly_deficit` | `crisis_mode` |
| **Ana superendividada** | Salário R$ 3.500, 8 dívidas somando R$ 60.000, prazo simulado > 60 meses | `overindebtedness` | `protection` |
| **Carlos insolvente** | Renda informal R$ 1.000, essenciais R$ 1.800 | `practical_insolvency` | `survival` |
| **Lucia minimal** | Só Onboarding Crítico: renda R$ 3.000, 2 dívidas básicas | testar fallback agressivo + warning |
| **Roberto sazonal** | IPVA R$ 2.400/ano + IPTU R$ 1.800/ano → testa `monthlyProvision` |
| **Beatriz oscilante** | Renda variável, alterna estados — testa regra de suavização |

### 18.5 Testes da regra de suavização

```typescript
describe('Smoothing rule', () => {
  it('NÃO desce de healthy para tight em 1 detecção isolada', async () => {
    await seedSnapshot(userId, 'healthy_with_debt', daysAgo(10));
    const result = await detector.detect(ctx);
    expect(result.state).toBe('healthy_with_debt'); // mantém apesar do raw ser tight
  });

  it('Desce após 2 detecções consecutivas de tight', async () => {
    await seedSnapshot(userId, 'healthy_with_debt', daysAgo(20));
    await seedSnapshot(userId, 'tight_budget', daysAgo(5)); // 1ª piora não confirmada
    // o raw atual é tight → 2ª confirmação
    const result = await detector.detect(ctx);
    expect(result.state).toBe('tight_budget');
  });

  it('Melhora é imediata', async () => {
    await seedSnapshot(userId, 'monthly_deficit', daysAgo(10));
    // raw atual é healthy
    const result = await detector.detect(ctx);
    expect(result.state).toBe('healthy_with_debt');
  });

  it('Não pula mais de 1 nível por detecção', async () => {
    await seedSnapshot(userId, 'healthy_with_debt', daysAgo(10));
    // raw atual é practical_insolvency (catástrofe)
    const result = await detector.detect(ctx);
    expect(result.state).toBe('tight_budget'); // desce só 1 nível
  });
});
```

### 18.6 Cobertura mínima

- Unit: 95% das funções puras
- Integration: todos os 11 módulos
- E2E: 8 cenários canônicos
- Mutation testing (Stryker) recomendado para `decideState` e `applySmoothingRule`

---

## 19. Próximos passos (Fase 4)

Com o motor especificado, a Fase 4 traduz tudo isso em **arquitetura técnica NestJS**:

- Estrutura de pastas em `apps/api/src/modules/`
- Decoradores Nest (`@Injectable`, `@Module`)
- Configuração do BullMQ + Upstash Redis
- Repositórios Prisma com tipos corretos
- Event bus interno (Nest EventEmitter ou similar)
- Estratégia de cache (Redis cache de cálculos pesados, TTL curto)
- Logging estruturado (Pino) + integração com Sentry
- Healthchecks + métricas (Prometheus opcional)
- Estratégia de seed (`packages/database/seeds/`)
- Estrutura de testes (Vitest configurado por workspace)
- Configuração CORS, rate limiting (express-rate-limit ou Throttler do Nest)
- Documentação OpenAPI gerada (`@nestjs/swagger`)

A Fase 4 não muda a especificação do motor — apenas decide **onde** cada arquivo vai e **como** os módulos se comunicam.

---

*Fim do documento da Fase 3.*
