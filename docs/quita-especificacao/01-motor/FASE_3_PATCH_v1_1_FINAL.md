# Fase 3 v1.1 — Patch Final (§20)

> **Anexar ao final do documento:** `FASE_3_MOTOR_DE_DECISAO.md`, antes da seção 19 ("Próximos passos")
> **Versão:** v1.1
> **Data:** 16 de maio de 2026
> **Origem:** ciclo adversarial completo (devils-advocate v2 + respostas + decisões @product)

---

## 20. Patch v1.1 — Refinamentos pós-ciclo adversarial

Resolução completa dos 4 bloqueadores + 7 altos detectados pelo devils-advocate. Esta seção é normativa: o que está aqui prevalece sobre as definições anteriores quando há conflito.

---

### 20.1 Funções de domínio definidas (BL-1)

#### 20.1.1 `composeMainGoal`

Compõe a frase principal do `MonthlyActionPlan.mainGoal` (aparece na home).

```typescript
function composeMainGoal(mode: OperationMode, goals: UserGoal[]): string {
  const primary = goals
    .filter(g => g.isActive && !g.achievedAt)
    .sort((a, b) => a.priorityOrder - b.priorityOrder)[0];

  switch (mode) {
    case 'payoff':
      if (primary && primary.goalType !== 'debt_freedom') {
        return `Mais perto de ${getGoalLabel(primary.goalType)}.`;
      }
      return 'Mais perto de sair das dívidas.';

    case 'stabilization':
      return 'Criar margem este mês.';

    case 'crisis_mode':
      return 'Proteger contas essenciais e evitar novas dívidas caras.';

    case 'protection':
      return 'Renegociar coletivamente e proteger o mínimo vital.';

    case 'survival':
      return 'Garantir o essencial e buscar suporte.';
  }
}

const GOAL_LABELS: Record<GoalType, string> = {
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

const getGoalLabel = (type: GoalType) => GOAL_LABELS[type];
```

#### 20.1.2 `isExpectedThisMonth`

```typescript
import { isSameMonth } from 'date-fns';

function isExpectedThisMonth(income: Income, referenceMonth: Date): boolean {
  if (income.frequency === 'recurring') return true;
  if (income.frequency === 'irregular') return false;
  if (!income.dueDate) return false;
  return isSameMonth(new Date(income.dueDate), referenceMonth);
}
```

#### 20.1.3 `generateModeSpecificWarnings`

```typescript
function generateModeSpecificWarnings(
  mode: OperationMode,
  debts: ClassifiedDebt[]
): string[] {
  const warnings: string[] = [];

  switch (mode) {
    case 'crisis_mode': {
      warnings.push('Evite usar cheque especial ou cartão para pagar parcelas.');
      const criticalOverdue = debts.filter(d =>
        d.affectsSurvival && d.daysOverdue > 30
      );
      if (criticalOverdue.length > 0) {
        warnings.push(
          `${criticalOverdue.length} dívida(s) essencial(is) há mais de 30 dias em atraso — negocie com urgência.`
        );
      }
      break;
    }

    case 'protection':
      warnings.push('Considere agendamento no Procon ou Defensoria para repactuação assistida.');
      warnings.push('A Lei 14.181/2021 garante o mínimo existencial durante a renegociação.');
      break;

    case 'survival':
      warnings.push('Não aceite novos compromissos financeiros neste momento.');
      warnings.push('Verifique elegibilidade para benefícios sociais (BPC, Bolsa Família, auxílios estaduais).');
      break;

    case 'stabilization': {
      const expensiveCount = debts.filter(d =>
        !d.affectsSurvival && d.interestClass === 'high'
      ).length;
      if (expensiveCount > 0) {
        warnings.push(`${expensiveCount} dívida(s) com juros altos — priorize negociação.`);
      }
      break;
    }

    case 'payoff':
      break; // sem warnings — tom confiante
  }

  return warnings;
}
```

#### 20.1.4 `computeMinimumVital`

```typescript
async function computeMinimumVital(
  stateCode: string | null,
  dependentsCount: number,
  deps: { regionalMinimumVitalRepo: Repo; logger: Logger }
): Promise<number> {
  const HARDCODED_BASE_SINGLE = 1320;
  const HARDCODED_PER_DEPENDENT = 400;

  // Nível 1: UF do usuário
  if (stateCode) {
    const stateMatch = await deps.regionalMinimumVitalRepo.findActive({
      stateCode,
      regionType: 'metro',
    });
    if (stateMatch) {
      return Number(stateMatch.baseAmountSingle)
        + Number(stateMatch.basePerDependent) * dependentsCount;
    }
  }

  // Nível 2: fallback nacional
  const nationalMatch = await deps.regionalMinimumVitalRepo.findActive({
    stateCode: 'BR',
    regionType: 'metro',
  });
  if (nationalMatch) {
    return Number(nationalMatch.baseAmountSingle)
      + Number(nationalMatch.basePerDependent) * dependentsCount;
  }

  // Nível 3: hardcoded com warning
  deps.logger.warn({ msg: 'RegionalMinimumVital empty', stateCode, dependentsCount });
  return HARDCODED_BASE_SINGLE + HARDCODED_PER_DEPENDENT * dependentsCount;
}
```

#### 20.1.5 Stack de utilities de data

**`date-fns` v3+**. Funções específicas usadas no motor:
- `isSameMonth`, `startOfMonth`, `endOfMonth`, `addMonths`, `setDate`, `differenceInDays`

`formatBRL` em `@quita/shared/src/utils/format.ts`:

```typescript
export const formatBRL = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
```

---

### 20.2 Atomicidade via Prisma Transaction (BL-2)

`monthly-plan-generator.generate()` envelopa todos os writes em transaction única.

```typescript
async function generate(ctx: MotorContext): Promise<MonthlyActionPlan> {
  return await prisma.$transaction(async (tx) => {
    const detector = await financialStateDetector.detect(ctx, tx);
    const debts = await financialProfileService.listActiveDebts(ctx.userId, tx);
    const classifiedDebts = await Promise.all(
      debts.map(d => debtClassificationService.classify(d, tx))
    );
    const scoredDebts = await priorityEngine.calculateBatch(
      classifiedDebts,
      { userId: ctx.userId, safeCapacity: detector.capacity, financialState: detector.state, allDebts: classifiedDebts },
      tx
    );

    await Promise.all(scoredDebts.map(s =>
      tx.debt.update({
        where: { id: s.debtId },
        data: { priorityScore: s.score, priorityReason: s.reason },
      })
    ));

    const behaviorProfile = await behaviorProfileRepo.getByUserId(ctx.userId, tx);
    const strategy = strategySelector.select({ /* ... */ });
    const expenses = await financialProfileService.listActiveExpenses(ctx.userId, tx);
    const goals = await goalTrackerService.list(ctx.userId, tx);
    const actions = generateActions({ /* ... */ });

    const warnings = [
      ...detector.confidenceWarnings,
      ...generateModeSpecificWarnings(detector.mode, classifiedDebts),
    ];
    const mainGoal = composeMainGoal(detector.mode, goals);
    const nextReviewDate = await computeNextReviewDate(ctx.userId, ctx.referenceMonth, tx);

    const plan = await monthlyPlanRepo.upsert({
      userId: ctx.userId,
      referenceMonth: ctx.referenceMonth,
      financialState: detector.state,
      operationMode: detector.mode,
      safeCapacity: detector.capacity,
      mainGoal,
      warnings,
      nextReviewDate,
      actions,
      // ... breakdown completo
    }, tx);

    return plan;
  }, {
    timeout: 10_000,
    maxWait: 5_000,
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  });
}
```

**Garantia:** snapshot, cache do User, scores, plano e ações são consistentes ou nada é aplicado.

---

### 20.3 Serialização de jobs por usuário (BL-3)

**BullMQ com `groupId: userId`.** Configuração:

```typescript
// Enfileiramento
await motorQueue.add('recalculate', payload, { groupId: userId });

// Worker
new Worker('motor-recalc', processJob, {
  connection: redisConfig,
  concurrency: 20,             // 20 jobs paralelos no total
  group: { concurrency: 1 },   // mas só 1 por groupId (= userId)
});
```

**Resultado:** dois jobs do mesmo usuário executam sequencialmente; jobs de usuários diferentes em paralelo.

---

### 20.4 `estimatePayoffMonths` leve (BL-4)

Função fechada O(N), separada de `simulateScenario` (O(N×M)).

```typescript
function estimatePayoffMonths(
  debts: ClassifiedDebt[],
  monthlyPayment: number
): number {
  const totalBalance = sum(debts.map(d =>
    Number(d.totalAmount) - Number(d.amountPaid ?? 0)
  ));

  if (totalBalance <= 0) return 0;
  if (monthlyPayment <= 0) return Infinity;

  const weightedRate = computeWeightedAverageRate(debts);

  if (weightedRate === 0) {
    return Math.ceil(totalBalance / monthlyPayment);
  }

  const interestPerMonth = totalBalance * weightedRate;
  if (monthlyPayment <= interestPerMonth) {
    return Infinity; // pagamento não cobre juros
  }

  const ratio = interestPerMonth / monthlyPayment;
  const months = -Math.log(1 - ratio) / Math.log(1 + weightedRate);
  return Math.ceil(months);
}

function computeWeightedAverageRate(debts: ClassifiedDebt[]): number {
  const totalBalance = sum(debts.map(d =>
    Number(d.totalAmount) - Number(d.amountPaid ?? 0)
  ));
  if (totalBalance === 0) return 0;

  const weightedSum = sum(debts.map(d => {
    const balance = Number(d.totalAmount) - Number(d.amountPaid ?? 0);
    const rate = Number(d.interestRateMonthly ?? 0);
    return balance * rate;
  }));

  return weightedSum / totalBalance;
}
```

**Cache em Redis** (TTL 60s):

```typescript
async function estimatePayoffMonthsCached(
  userId: string,
  debts: ClassifiedDebt[],
  monthlyPayment: number
): Promise<number> {
  const inputHash = hashSync(JSON.stringify({
    debts: debts.map(d => ({ id: d.id, balance: d.totalAmount, paid: d.amountPaid, rate: d.interestRateMonthly })),
    monthlyPayment,
  }));
  const cacheKey = `payoff:${userId}:${inputHash}`;

  const cached = await redis.get(cacheKey);
  if (cached) return Number(cached);

  const result = estimatePayoffMonths(debts, monthlyPayment);
  await redis.set(cacheKey, result.toString(), 'EX', 60);
  return result;
}
```

---

### 20.5 Definição de "active" em `InterestRateReference` (A-2)

```typescript
async findActiveByCategory(categorySlug: string): Promise<InterestRateReference | null> {
  return await prisma.interestRateReference.findFirst({
    where: {
      debtCategorySlug: categorySlug,
      effectiveDate: { lte: new Date() },
    },
    orderBy: { effectiveDate: 'desc' },
  });
}
```

Mesma definição vale para `regionalMinimumVitalRepo.findActive`.

---

### 20.6 `SettlementEvaluation` expiração + revalidação (A-4)

#### 20.6.1 Patch no schema

```prisma
model SettlementEvaluation {
  // ... campos existentes ...
  expiresAt           DateTime    @map("expires_at")
  invalidatedAt       DateTime?   @map("invalidated_at")
  invalidationReason  String?     @map("invalidation_reason") @db.VarChar(255)
}
```

#### 20.6.2 Lógica de revalidação

1. Validator preenche `expiresAt = evaluatedAt + 7 dias`
2. UI mostra "Esta validação expira em X dias"
3. `FinancialStateDetector` ao salvar snapshot calcula:
   ```
   capacityDelta = |novoCapacity - lastSnapshot.safeCapacity| / lastSnapshot.safeCapacity
   ```
4. Se `capacityDelta > 0.20` → enfileira `SettlementRevalidationJob`
5. Job:
   - Busca `SettlementEvaluation` do usuário com `expiresAt > now()` AND `invalidatedAt IS NULL`
   - Re-roda `settlement-validator`
   - Se `recommendation` mudou para pior (accept → reject/negotiate_lower):
     - Marca antiga: `invalidatedAt = now()`, `invalidationReason = 'capacity_changed_>20%'`
     - Cria nova `SettlementEvaluation`
     - Gera notificação push: "Uma proposta de acordo precisa ser revista"

---

### 20.7 `long-term-plan-service` — módulo 12 do motor (A-6)

#### 20.7.1 Responsabilidade

Gera o **Plano de longo prazo** (tela 13 da Fase 1). Responsável pelas tabelas `PaymentPlan` e `PlanTimelineItem` (não tinham módulo dono).

#### 20.7.2 Contrato

```typescript
export interface LongTermPlanService {
  generate(userId: string): Promise<PaymentPlan>;
  getActive(userId: string): Promise<PaymentPlan | null>;
}
```

#### 20.7.3 Pseudocódigo

```typescript
async function generate(userId: string): Promise<PaymentPlan> {
  const ctx = buildMotorContext(userId, 'long_term_plan_generation');

  // Detector + dívidas classificadas (reuso do motor)
  const detector = await financialStateDetector.detect(ctx);
  const debts = await financialProfileService.listActiveDebts(userId);
  const classifiedDebts = await Promise.all(debts.map(d => debtClassificationService.classify(d)));
  const behaviorProfile = await behaviorProfileRepo.getByUserId(userId);
  const strategy = strategySelector.select({ /* ... */ });

  // Simulador completo com 3 cenários
  const simulation = simulator.simulate({
    debts: classifiedDebts,
    safeCapacity: detector.capacity,
    strategy,
    potentialCuts: await estimatePotentialCuts(userId),
    potentialExtraIncome: 0, // pode evoluir
  });

  // Upsert PaymentPlan + replace PlanTimelineItem
  const plan = await paymentPlanRepo.upsert({
    userId,
    strategy,
    monthlyAvailable: detector.capacity,
    lastFinancialState: detector.state,
    safeCapacity: detector.capacity,
    simulationConservative: simulation.conservative,
    simulationOptimized: simulation.optimized,
    simulationAccelerated: simulation.accelerated,
    estimatedPayoffMonthsMin: simulation.estimatedPayoffMonthsMin,
    estimatedPayoffMonthsMax: simulation.estimatedPayoffMonthsMax,
    generatedAt: new Date(),
    isActive: true,
  });

  // Recriar timeline com ordem de quitação do cenário conservador
  await planTimelineItemRepo.deleteByPlanId(plan.id);
  await planTimelineItemRepo.createMany(
    simulation.conservative.debtsOrder.map((item, index) => ({
      planId: plan.id,
      debtId: item.debtId,
      monthQuitada: item.monthQuitada,
      orderInPlan: index + 1,
    }))
  );

  return plan;
}
```

#### 20.7.4 Triggers

| Trigger | Quando |
|---|---|
| Scheduled | 1x/mês, junto com `MonthlyPlanRolloverJob` (mesmo cron) |
| Sob demanda | Quando usuário abre tela 13 E `generatedAt > 30 dias` (ou nunca foi gerado) |

#### 20.7.5 `estimatePotentialCuts`

```typescript
async function estimatePotentialCuts(userId: string): Promise<number> {
  const expenses = await financialProfileService.listActiveExpenses(userId);
  const reducible = expenses.filter(e =>
    !e.isEssential && (e.canCancel || e.canReduce)
  );
  // Estimativa conservadora: 50% das despesas redutíveis
  return sum(reducible.map(e => Number(e.amount))) * 0.5;
}
```

---

### 20.8 `RecommendedAction.cycleNumber` (A-3) — DECISÃO C1

#### 20.8.1 Patch no schema

```prisma
model RecommendedAction {
  // ... campos existentes ...
  cycleNumber  Int  @default(1) @map("cycle_number") @db.SmallInt
}
```

#### 20.8.2 Atualização de `matchAction` (§14.4)

```typescript
function matchAction(a: RecommendedAction, b: RecommendedAction): boolean {
  return a.actionType === b.actionType
    && a.targetDebtId === b.targetDebtId
    && a.targetExpenseId === b.targetExpenseId
    && a.cycleNumber === b.cycleNumber;
}
```

#### 20.8.3 Determinação automática do `cycleNumber`

```typescript
function determineCycleNumber(
  newAction: Omit<RecommendedAction, 'cycleNumber'>,
  existingActions: RecommendedAction[]
): number {
  const sameCombination = existingActions.filter(e =>
    e.actionType === newAction.actionType
    && e.targetDebtId === newAction.targetDebtId
    && e.targetExpenseId === newAction.targetExpenseId
  );

  if (sameCombination.length === 0) return 1;

  const lastCycle = Math.max(...sameCombination.map(e => e.cycleNumber));
  const lastInCycle = sameCombination.find(e => e.cycleNumber === lastCycle);

  // Se o último ciclo está pending, reusa (motor está só atualizando)
  if (lastInCycle?.status === 'pending') return lastCycle;

  // Se está em status terminal (completed/skipped/dismissed/expired), novo ciclo
  return lastCycle + 1;
}
```

#### 20.8.4 Comportamento na UI

- **Padrão:** mostra apenas ações do `cycleNumber` máximo por combinação `(actionType, targetDebtId)`
- **"Ver histórico do mês":** mostra todos os ciclos (transparência total)
- Ações com `status='completed'` de ciclos antigos aparecem com cor sutil ou colapsadas

#### 20.8.5 Cenário canônico

```
1º jun: Motor gera "pay R$ 180 conta luz" cycleNumber=1
5  jun: Usuário marca completed
15 jun: Usuário cadastra novo pagamento da mesma conta
        Motor recalcula → encontra cycleNumber=1 com status=completed
        Determina cycleNumber=2 → cria nova ação
UI:     Mostra a nova ação (cycleNumber=2) por padrão
        Em "histórico do mês": mostra ambas
```

---

### 20.9 `AiInsight` marcada como deprecated (A-7) — DECISÃO C2

#### 20.9.1 Patch no schema

```prisma
/// @deprecated Funcionalidade movida para v2. Tabela será removida em migration futura.
/// Chat com IA Premium será especificado em fase posterior, com módulo dedicado
/// `insight-generator-service` quando for ativado.
model AiInsight {
  // ... mantém estrutura atual ...
}
```

#### 20.9.2 Migration

Migration **11** (não no MVP, mas registrada como tarefa):

```
11. 20260611_deprecate_ai_insight
    - DROP TABLE ai_insights
    - Remove referências em FK (se houver)
```

**Quando rodar a 11:** quando confirmado que `AiInsight` nunca foi populada em produção (pré-release). Como o MVP ainda não rodou em produção, é seguro dropar.

#### 20.9.3 Reposicionamento

Chat com IA Premium volta a ser feature **v2** do produto. A spec virá em ciclo próprio, com:
- Módulo `insight-generator-service` (13º do motor)
- Provider de LLM (OpenAI ou Anthropic)
- Custo unitário por insight
- Limitação de Free vs Premium
- Cláusulas de Termos de Uso específicas

Nada disso bloqueia o MVP.

---

### 20.10 OCR Premium — spec própria pré-Fase 5 (A-5) — DECISÃO C3

Registrado como tarefa explícita entre Fase 4 e Fase 5.

**Direcionamento já fechado:**

| Item | Decisão |
|---|---|
| Provider | OpenAI Vision API |
| Storage | Supabase Storage |
| Retenção da imagem | Auto-delete em 30 dias |
| Quota Free | 0 OCRs/mês |
| Quota Premium | 5 OCRs/mês (campo `usedOcr: boolean` em `SettlementEvaluation` para contar) |
| LGPD | Consentimento específico via `ConsentLog` antes do primeiro OCR |
| Fluxo | Upload imagem → Vision API → parser estruturado → input do `settlement-validator` |

**Spec completa virá em documento próprio:** `FASE_4_5_BRIDGE_OCR_PREMIUM.md` (a ser criado entre Fase 4 e Fase 5).

---

### 20.11 Atualização do §15.1 — Jobs novos

Adicionar à tabela de jobs do motor:

| Job | Disparo |
|---|---|
| `SettlementRevalidationJob` | Evento `state_detected` com `capacityDelta > 0.20` |
| `RecalculateAllScoresJob` | Manual após mudança de `ScoringWeight` |
| `LongTermPlanGenerationJob` | Junto com `MonthlyPlanRolloverJob` ou sob demanda |
| `InterestRateUpdateJob` | Scheduled mensal (1º de cada mês, 05:00 UTC) — consome BCB SGS |

---

### 20.12 Atualização do §2 — Novos `TriggerEvent`

```typescript
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
  | 'data_freshness_review'
  | 'onboarding_completed'          // NOVO v1.1
  | 'settlement_revalidation'        // NOVO v1.1
  | 'long_term_plan_generation'      // NOVO v1.1
  | 'interest_rate_updated'          // NOVO v1.1
  | 'scoring_weights_updated';       // NOVO v1.1
```

---

### 20.13 Pendências confirmadas para Fase 4 ou posterior

| Item | Status | Fase responsável |
|---|---|---|
| OCR Premium (spec completa) | Tarefa registrada | Bridge Fase 4↔5 |
| `ActionType.monitor` — gerar ou remover | Decisão diferida | Fase 4 (com teste de cenários) |
| Telemetria/observabilidade do motor (Pino + Sentry + métricas) | Tarefa registrada | Fase 4 |
| `InterestRateUpdateJob` consumindo BCB SGS | Tarefa registrada | Fase 4 (implementação) |
| `RecalculateAllScoresJob` após mudança de pesos | Tarefa registrada | Fase 4 |
| Load test de workers BullMQ em escala | Tarefa registrada | Pré-release |
| `AiInsight` (Chat com IA) | Empurrado para v2 | v2 do produto |

---

### 20.14 Resumo do impacto do patch v1.1

| Categoria | Total |
|---|---|
| Funções de domínio novas/especificadas | 7 |
| Campos novos no schema | 4 (`cycleNumber`, `expiresAt`, `invalidatedAt`, `invalidationReason`) |
| Módulos do motor | de 11 para 12 (`long-term-plan-service`) |
| `TriggerEvents` novos | 5 |
| Jobs novos | 4 |
| Migrations adicionadas | 1 (a 11, opcional) |
| Bloqueadores resolvidos | 4 de 4 |
| Altos resolvidos | 7 de 7 |
| Naming convention | `date-fns` v3+ adotado |
| Stack de runtime adicionada | Upstash Redis para BullMQ e cache de `estimatePayoffMonths` |

---

*Fim do Patch v1.1.*

---

## Anexo — Atualização da Fase 2 (mini-patch v2.2)

Para refletir os campos novos introduzidos pelo patch v1.1:

**`RecommendedAction` ganha:**
- `cycleNumber Int @default(1) @db.SmallInt`

**`SettlementEvaluation` ganha:**
- `expiresAt DateTime`
- `invalidatedAt DateTime?`
- `invalidationReason String? @db.VarChar(255)`

**`AiInsight` ganha:**
- Comentário `/// @deprecated`

**Migration adicional:**

```
11. 20260611_phase3_v1_1_adjustments
    - ALTER TABLE recommended_actions ADD COLUMN cycle_number SMALLINT NOT NULL DEFAULT 1
    - ALTER TABLE settlement_evaluations ADD COLUMN expires_at TIMESTAMP NOT NULL
    - ALTER TABLE settlement_evaluations ADD COLUMN invalidated_at TIMESTAMP NULL
    - ALTER TABLE settlement_evaluations ADD COLUMN invalidation_reason VARCHAR(255) NULL
    - Backfill: UPDATE settlement_evaluations SET expires_at = evaluated_at + INTERVAL '7 days'
```

**Total acumulado:** 11 migrations.

*Fim do anexo.*
