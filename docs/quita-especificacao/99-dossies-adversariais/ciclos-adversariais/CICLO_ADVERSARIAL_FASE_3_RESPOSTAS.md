# Ciclo Adversarial Fase 3 — Respostas + Patch v1.1

> **Resposta ao:** `DEVILS_ADVOCATE_FASE_3.md`
> **Data:** 16 de maio de 2026
> **Status:** 6 decisões @claude-arquiteto tomadas; 2 confirmações @product pendentes
> **Output:** este documento contém ambos as respostas E o patch v1.1 a aplicar na Fase 3

---

## Sumário executivo

Das 8 perguntas do interrogatório:
- **6 decididas por @claude-arquiteto** com pseudocódigo e fundamentação (P1, P2, P3, P4, P7-parcial, P8)
- **2 pendentes de @product** (P5, P6) — propostas concretas para você escolher

Ao final do documento, **a Seção §20 do patch v1.1** consolida tudo em formato pronto para colar na Fase 3.

---

## P1 — @claude-arquiteto: Funções de domínio faltantes (BL-1)

### Decisão

Defino as 4 funções abaixo com pseudocódigo concreto. Stack de data: **`date-fns` v3+** (tree-shakeable, sem dependências circulares, modular).

### 1.1 `composeMainGoal`

Compõe a frase principal do `MonthlyActionPlan.mainGoal` (aparece na home).

```typescript
function composeMainGoal(
  mode: OperationMode,
  goals: UserGoal[]
): string {
  // 1. Goal primário ativo (menor priorityOrder = mais prioritário)
  const primary = goals
    .filter(g => g.isActive && !g.achievedAt)
    .sort((a, b) => a.priorityOrder - b.priorityOrder)[0];

  // 2. Mensagem por modo
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

### 1.2 `isExpectedThisMonth`

Determina se uma renda do tipo `installment` ou `one_time` é esperada no mês de referência.

```typescript
import { isSameMonth } from 'date-fns';

function isExpectedThisMonth(income: Income, referenceMonth: Date): boolean {
  // Recurring: sempre conta (renda mensal)
  if (income.frequency === 'recurring') return true;

  // Irregular: não conta como "esperado" — entra pelo guaranteed/média
  if (income.frequency === 'irregular') return false;

  // Installment e one_time: usa Income.dueDate
  if (!income.dueDate) return false;

  return isSameMonth(new Date(income.dueDate), referenceMonth);
}
```

### 1.3 `generateModeSpecificWarnings`

Warnings que aparecem no campo `MonthlyActionPlan.warnings` específicos por modo.

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

    case 'protection': {
      warnings.push('Considere agendamento no Procon ou Defensoria para repactuação assistida.');
      warnings.push('A Lei 14.181/2021 garante o mínimo existencial durante a renegociação.');
      break;
    }

    case 'survival': {
      warnings.push('Não aceite novos compromissos financeiros neste momento.');
      warnings.push('Verifique elegibilidade para benefícios sociais (BPC, Bolsa Família, auxílios estaduais).');
      break;
    }

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
      // Sem warnings padrão — tom é confiante
      break;
  }

  return warnings;
}
```

### 1.4 `computeMinimumVital`

Busca em `RegionalMinimumVital` com hierarquia de fallback de 3 níveis.

```typescript
async function computeMinimumVital(
  stateCode: string | null,
  dependentsCount: number,
  deps: { regionalMinimumVitalRepo: Repo; logger: Logger }
): Promise<number> {
  // Constantes hardcoded como último recurso
  const HARDCODED_BASE_SINGLE = 1320;
  const HARDCODED_PER_DEPENDENT = 400;

  // 1. Tenta UF do usuário com regionType=metro (padrão sem dados de cidade detalhados)
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

  // 2. Fallback nacional (stateCode='BR')
  const nationalMatch = await deps.regionalMinimumVitalRepo.findActive({
    stateCode: 'BR',
    regionType: 'metro',
  });
  if (nationalMatch) {
    return Number(nationalMatch.baseAmountSingle)
      + Number(nationalMatch.basePerDependent) * dependentsCount;
  }

  // 3. Hardcoded com warning de log
  deps.logger.warn({
    msg: 'RegionalMinimumVital empty — using hardcoded fallback',
    stateCode,
    dependentsCount,
  });
  return HARDCODED_BASE_SINGLE + HARDCODED_PER_DEPENDENT * dependentsCount;
}
```

**Definição de "active" no repositório** (resolve também A-2 indiretamente):

```typescript
// regionalMinimumVitalRepo
async findActive(filter: { stateCode: string; regionType: RegionType }): Promise<RegionalMinimumVital | null> {
  return await prisma.regionalMinimumVital.findFirst({
    where: {
      stateCode: filter.stateCode,
      regionType: filter.regionType,
      effectiveDate: { lte: new Date() },
    },
    orderBy: { effectiveDate: 'desc' },
  });
}
```

### 1.5 Stack de utilities de data

**Escolhido: `date-fns` v3+**. Funções usadas:
- `isSameMonth(a, b)` — comparação de mês
- `startOfMonth(date)` — primeiro dia do mês
- `endOfMonth(date)` — último dia do mês
- `addMonths(date, n)` — soma N meses
- `setDate(date, day)` — define o dia do mês
- `differenceInDays(later, earlier)` — substitui `daysSince`/`daysBetween`

Utility `formatBRL` fica em `@quita/shared/src/utils/format.ts`:

```typescript
export const formatBRL = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
```

---

## P2 — @claude-arquiteto: Atomicidade via transaction (BL-2)

### Decisão

`monthly-plan-generator.generate()` envelopa **todas** as escritas em `prisma.$transaction`.

```typescript
async function generate(ctx: MotorContext): Promise<MonthlyActionPlan> {
  return await prisma.$transaction(async (tx) => {
    // 1. Detector (recebe tx; passa adiante para repositórios internos)
    const detector = await financialStateDetector.detect(ctx, tx);

    // 2. Classify debts (read-only)
    const debts = await financialProfileService.listActiveDebts(ctx.userId, tx);
    const classifiedDebts = await Promise.all(
      debts.map(d => debtClassificationService.classify(d, tx))
    );

    // 3. Score
    const scoredDebts = await priorityEngine.calculateBatch(
      classifiedDebts,
      { userId: ctx.userId, safeCapacity: detector.capacity, financialState: detector.state, allDebts: classifiedDebts },
      tx
    );

    // 4. Persist scores (parte da mesma transaction)
    await Promise.all(scoredDebts.map(s =>
      tx.debt.update({
        where: { id: s.debtId },
        data: { priorityScore: s.score, priorityReason: s.reason },
      })
    ));

    // 5. Strategy
    const behaviorProfile = await behaviorProfileRepo.getByUserId(ctx.userId, tx);
    const strategy = strategySelector.select({ ... });

    // 6. Actions
    const expenses = await financialProfileService.listActiveExpenses(ctx.userId, tx);
    const goals = await goalTrackerService.list(ctx.userId, tx);
    const actions = generateActions({ ... });

    // 7. Warnings, mainGoal, nextReview
    const warnings = [...detector.confidenceWarnings, ...generateModeSpecificWarnings(detector.mode, classifiedDebts)];
    const mainGoal = composeMainGoal(detector.mode, goals);
    const nextReviewDate = await computeNextReviewDate(ctx.userId, ctx.referenceMonth, tx);

    // 8. Upsert plan + reconcile actions
    const plan = await monthlyPlanRepo.upsert({ ..., actions }, tx);

    return plan;
  }, {
    timeout: 10_000,           // 10s
    maxWait: 5_000,            // espera 5s pra começar
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  });
}
```

**Justificativa do timeout 10s:** detector + classify + score + upsert é tipicamente 100-500ms. 10s dá folga para casos de borda (usuário com 20+ dívidas). Em caso de timeout, BullMQ faz retry conforme política da §15.2.

**Justificativa do `ReadCommitted`:** combinado com lock por usuário (P3 abaixo), evita conflitos de leitura. `Serializable` seria overkill e degradaria performance.

**Notas importantes:**
- O `FinancialStateSnapshot` é criado **dentro** da transaction
- O cache `User.lastFinancialState` é atualizado **dentro** da transaction
- Os scores das dívidas são persistidos **dentro** da transaction
- Se a transaction falha em qualquer passo, **tudo** é revertido — não fica estado inconsistente
- Job BullMQ vê falha → retry conforme política

---

## P3 — @claude-arquiteto: Serialização de jobs (BL-3)

### Decisão

**BullMQ `groupKey: userId`.**

### Por quê em vez de advisory lock no Postgres

| Critério | BullMQ groupKey | Advisory lock |
|---|---|---|
| Já está no stack | ✅ Vamos usar BullMQ de qualquer jeito | ❌ Adiciona dependência |
| Round-trip extra | ❌ Não — serialização nativa da fila | ✅ Sim — chamada antes de cada operação |
| Throughput entre usuários | ✅ Paralelo natural | ✅ Igual |
| Visibilidade (dashboard, retry) | ✅ BullMQ Board mostra tudo | ❌ Sem dashboard nativo |
| Falha do worker | ✅ Job volta pra fila automaticamente | ⚠️ Precisa de TTL no lock |

### Configuração

```typescript
// apps/api/src/queues/motor.queue.ts
import { Queue, Worker } from 'bullmq';

export const motorQueue = new Queue('motor-recalc', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5 * 60 * 1000 }, // 5min inicial
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 1000 },
  },
});

// Enfileiramento sempre com groupId = userId
export async function enqueueRecalc(userId: string, payload: MotorContext) {
  await motorQueue.add('recalculate', payload, {
    groupId: userId, // <-- chave da serialização
  });
}

// Worker com concurrency por grupo
new Worker('motor-recalc', processMotorJob, {
  connection: redisConfig,
  concurrency: 20, // 20 jobs em paralelo no total (diferentes userIds)
  group: {
    concurrency: 1, // mas só 1 por groupId (= por userId)
  },
});
```

### Resultado prático

- Usuário A cadastra dívida + cron de rollover dispara para Usuário A → 2 jobs entram na fila com `groupId=A` → executam **sequencialmente** (A1 termina, depois A2)
- Usuários A e B disparam simultaneamente → executam **em paralelo** (groupIds diferentes)
- Throughput global: até 20 usuários processados por vez

---

## P4 — @claude-arquiteto: `estimatePayoffMonths` leve (BL-4)

### Decisão

Função fechada (não iterativa) baseada na fórmula de empréstimo padrão. Complexidade `O(N)` onde `N` é número de dívidas.

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

  // Juros médio ponderado da carteira
  const weightedRate = computeWeightedAverageRate(debts);

  // Sem juros: divisão simples
  if (weightedRate === 0) {
    return Math.ceil(totalBalance / monthlyPayment);
  }

  // Fórmula: N = -log(1 - PV*r/PMT) / log(1+r)
  const interestPerMonth = totalBalance * weightedRate;
  if (monthlyPayment <= interestPerMonth) {
    // Pagamento não cobre nem os juros: dívida cresce
    return Infinity;
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

### Cache

Para evitar recalcular em sequência (detector → `decideState` → `estimatePayoffMonths`), cache em Redis com TTL curto e invalidação por evento:

```typescript
async function estimatePayoffMonthsCached(
  userId: string,
  debts: ClassifiedDebt[],
  monthlyPayment: number
): Promise<number> {
  // Hash determinístico do input
  const inputHash = hashSync(JSON.stringify({
    debts: debts.map(d => ({ id: d.id, balance: d.totalAmount, paid: d.amountPaid, rate: d.interestRateMonthly })),
    monthlyPayment,
  }));
  const cacheKey = `payoff:${userId}:${inputHash}`;

  const cached = await redis.get(cacheKey);
  if (cached) return Number(cached);

  const result = estimatePayoffMonths(debts, monthlyPayment);
  await redis.set(cacheKey, result.toString(), 'EX', 60); // TTL 60s
  return result;
}
```

Invalidação: TTL 60s é suficiente porque qualquer evento (`debt_added`, `debt_updated`) dispara recálculo em < 60s na fila.

### Diferença vs `simulateScenario`

| | `estimatePayoffMonths` | `simulateScenario` |
|---|---|---|
| Complexidade | O(N) | O(N × M) onde M ≈ 60 |
| Usado por | `decideState` (no `detector`) | `simulator` (cenários completos) |
| Precisão | Aproximação fechada | Mês a mês |
| Quando usar | Decisão rápida de estado | Projeção detalhada do plano |

---

## P5 — @product (PENDENTE): Ações `completed` antigas (A-3)

### Proposta

**Opção (c) com auxílio de (a):** adicionar campo `cycleNumber` na `RecommendedAction` + UI esconde ciclos antigos completed.

**Patch de schema:**

```prisma
model RecommendedAction {
  // ... campos existentes ...
  cycleNumber  Int  @default(1) @map("cycle_number") @db.SmallInt
}
```

**Como funciona:**

1. Em 1º/jun: motor gera "pay R$ 180 conta luz" com `cycleNumber=1`
2. Usuário completa em 5/jun
3. Em 15/jun: usuário cadastra nova fatura da mesma conta; motor recalcula
4. `matchAction` agora compara `(actionType, targetDebtId, targetExpenseId, cycleNumber)` — não encontra
5. Motor cria nova ação com `cycleNumber=2`
6. UI mostra apenas ações do `cycleNumber` máximo por combinação `(actionType, targetDebtId)` por padrão; "ver histórico do mês" mostra todas

**Vantagens vs alternativas:**
- (a) UI esconde > 30 dias → perde rastreabilidade dentro do mês
- (b) `matchAction` considerar `dueDate` → frágil, depende de datas estarem certas

**Custo:** 1 campo no schema + ajuste em `matchAction` + ajuste na UI.

**Pendente sua confirmação @product:** OK com opção (c)?

---

## P6 — @product (PENDENTE): OCR Premium (A-5)

### Proposta

**Empurrar para spec própria antes da Fase 5.** OCR é feature complexa (provider, storage, parsing, LGPD) e **não bloqueia o motor** — `settlement-validator` funciona com input estruturado.

**Quando especificar:** entre Fase 4 (arquitetura técnica) e Fase 5 (telas).

**Direcionamento já definido (pra você confirmar):**
- **Provider:** OpenAI Vision (mais robusto que Tesseract, custo ~R$ 0,50/imagem em uso típico)
- **Storage:** Supabase Storage com auto-delete em 30 dias (LGPD minimização)
- **LGPD:** foto de proposta de acordo é dado financeiro sensível — exige consentimento específico via `ConsentLog` antes do upload
- **Quota Free vs Premium:** Free zero OCRs; Premium até 5/mês (controlado por contagem em `SettlementEvaluation` com flag `usedOcr: boolean`)

**Pendente sua confirmação @product:** OK empurrar para depois? OK com OpenAI Vision + Supabase Storage?

---

## P7 — Misto: `PaymentPlan` e `AiInsight` órfãos (A-6, A-7)

### Proposta @claude-arquiteto

**`PaymentPlan` + `PlanTimelineItem` (Plano de longo prazo, tela 13):**

Criar 12º módulo do motor: **`long-term-plan-service`**.

```typescript
export interface LongTermPlanService {
  generate(userId: string): Promise<PaymentPlan>;
  getActive(userId: string): Promise<PaymentPlan | null>;
}
```

**Trigger:** roda 1x/mês (junto com `MonthlyPlanRolloverJob`) OU sob demanda quando usuário abre tela 13 e o plano está com `generatedAt > 30 dias`.

**Conteúdo:** roda `simulator.simulate()` completo com 3 cenários, popula `PaymentPlan` + `PlanTimelineItem` (uma linha por dívida com ordem de quitação esperada).

**Custo:** 1 módulo novo. Já temos as funções (`simulateScenario`). É só orquestração.

### Proposta @product (PENDENTE): `AiInsight`

Depende de decisão sobre **Chat com IA Premium** mencionado na Fase 1 v2 §8.1:

**Opção A — É MVP:** adicionar 13º módulo `insight-generator-service` à Fase 3 v1.1, que gera insights contextuais (ex: "Sua despesa com streaming subiu 30% nos últimos 3 meses") e popula `AiInsight`. Custo: spec significativa.

**Opção B — É v2:** marcar `AiInsight` como `@deprecated` agora; remover na próxima migration. Custo: 1 migration drop.

**Recomendação técnica:** Opção B. Chat com IA tem complexidade de prompt engineering, custo de API (OpenAI/Anthropic) e responsabilidade legal (recomendação financeira via LLM). Empurrar para v2 é mais seguro.

**Pendente sua confirmação @product:** A ou B?

---

## P8 — @claude-arquiteto: Revalidação de acordo (A-4)

### Decisão

Aceito. Patch:

**Schema:**

```prisma
model SettlementEvaluation {
  // ... campos existentes ...
  expiresAt           DateTime  @map("expires_at")
  capacityAtEvaluation Decimal  @map("capacity_at_evaluation") @db.Decimal(12, 2) // já existe
  invalidatedAt       DateTime? @map("invalidated_at")
  invalidationReason  String?   @map("invalidation_reason") @db.VarChar(255)
}
```

**Lógica:**

1. Validator preenche `expiresAt = evaluatedAt + 7 dias`
2. UI mostra "Esta validação expira em X dias" e fica em destaque
3. `FinancialStateDetector` ao salvar snapshot calcula `capacityDelta = |novoCapacity - lastSnapshot.capacity| / lastSnapshot.capacity`
4. Se `capacityDelta > 20%` → dispara `SettlementRevalidationJob`
5. Job busca `SettlementEvaluation` ativas do usuário (não expiradas, não invalidadas) e re-roda validator
6. Se `recommendation` mudou de `accept` para `reject` ou `negotiate_lower`:
   - Marca antiga como `invalidatedAt = now()`, `invalidationReason = 'capacity_changed_>20%'`
   - Cria nova `SettlementEvaluation`
   - Gera notificação push: "Uma proposta de acordo precisa ser revista"

**Novo job na §15.1:**

| Job | Disparo |
|---|---|
| `SettlementRevalidationJob` | Evento `state_detected` com `capacityDelta > 0.20` |

---

## §20 (Patch) — Adição à Fase 3

> **A SEÇÃO ABAIXO É O PATCH OFICIAL DA FASE 3.** Cole como nova seção `§20 — Patch v1.1 (pós-ciclo adversarial)` no final do documento `FASE_3_MOTOR_DE_DECISAO.md`, antes da seção 19 ("Próximos passos").

```markdown
## 20. Patch v1.1 — Refinamentos pós-ciclo adversarial

Resolução dos 4 bloqueadores + 5 dos 7 altos detectados na auditoria. Os 2 altos
restantes (A-3 e A-7) aguardam confirmação @product.

### 20.1 Funções de domínio definidas (BL-1)

Quatro funções referenciadas mas não especificadas anteriormente:

[Cole o conteúdo das seções 1.1, 1.2, 1.3, 1.4 deste documento]

**Stack de utilities de data:** `date-fns` v3+. Funções específicas: `isSameMonth`,
`startOfMonth`, `endOfMonth`, `addMonths`, `setDate`, `differenceInDays`.

Utility `formatBRL` em `@quita/shared/src/utils/format.ts`.

### 20.2 Atomicidade via Prisma Transaction (BL-2)

`monthly-plan-generator.generate()` envelopa todos os writes em uma única transaction.

[Cole o conteúdo da P2]

**Garantia:** se qualquer escrita falha, todas são revertidas. Cache do User, snapshot,
scores das dívidas, plano e ações são consistentes ou nenhuma das mudanças se aplica.

### 20.3 Serialização de jobs por usuário (BL-3)

BullMQ com `groupId: userId`. Worker configurado com `concurrency: 1` por grupo,
20 jobs em paralelo no total.

[Cole o conteúdo da P3]

### 20.4 `estimatePayoffMonths` leve (BL-4)

Função fechada O(N) com cache Redis de 60s.

[Cole o conteúdo da P4]

### 20.5 `computeMinimumVital` com fallback (A-1)

Hierarquia de 3 níveis: UF do usuário → nacional (BR) → hardcoded com warning.

[Já incluído em 20.1]

### 20.6 "Active" em `InterestRateReference` (A-2)

Definição: `effectiveDate <= today`, ordenado por `effectiveDate DESC`, primeiro
resultado. Implementado em `interestRateRepo.findActiveByCategory`.

### 20.7 `SettlementEvaluation.expiresAt` + revalidação (A-4)

[Cole o conteúdo da P8]

### 20.8 `long-term-plan-service` (A-6)

Novo módulo (12º do motor) responsável por `PaymentPlan` + `PlanTimelineItem`.

```typescript
export interface LongTermPlanService {
  generate(userId: string): Promise<PaymentPlan>;
  getActive(userId: string): Promise<PaymentPlan | null>;
}
```

**Trigger:** mensal junto com rollover, ou sob demanda (tela 13) se `generatedAt > 30 dias`.

**Conteúdo:** roda `simulator.simulate()` completo, popula `PaymentPlan` + N linhas em `PlanTimelineItem`.

### 20.9 Pendências confirmadas como tarefas para Fase 4 ou posterior

| Item | Decisão |
|---|---|
| A-5 (OCR Premium) | Spec própria entre Fase 4 e Fase 5; OpenAI Vision + Supabase Storage; quota 0/5 Free/Premium |
| M-1 (`ActionType.monitor`) | Remover do enum se não for gerado em nenhum modo; ou gerar em casos específicos (dívidas com confiança baixa que precisam re-verificação) |
| M-2 (Telemetria) | Tarefa da Fase 4 (Pino + Sentry + métricas Prometheus opcional) |
| M-3 (Atualização `InterestRateReference`) | Job `InterestRateUpdateJob` mensal consumindo BCB SGS — tarefa da Fase 4 |
| M-4 (Recálculo após mudança de `ScoringWeight`) | Job `RecalculateAllScoresJob` disparado manualmente — adicionar na §15.1 |
| B-1 (`onboarding_completed`) | Adicionar como `TriggerEvent` na §2 |
| B-2 (Escala BullMQ) | Tarefa da Fase 4 (load test) |

### 20.10 Atualizações ao §15.1 (jobs)

Adicionar à tabela de jobs:

| Job | Disparo |
|---|---|
| `SettlementRevalidationJob` | Evento `state_detected` com `capacityDelta > 0.20` |
| `RecalculateAllScoresJob` | Manual após mudança de `ScoringWeight` |
| `LongTermPlanGenerationJob` | Junto com `MonthlyPlanRolloverJob` ou sob demanda |
| `InterestRateUpdateJob` | Scheduled mensal (1º do mês 05:00 UTC) |

### 20.11 Atualização ao §2 (Tipos compartilhados)

Adicionar a `TriggerEvent`:

```typescript
export type TriggerEvent =
  | // ... existentes ...
  | 'onboarding_completed'
  | 'settlement_revalidation'
  | 'long_term_plan_generation'
  | 'interest_rate_updated';
```

*Fim do Patch v1.1.*
```

---

## Confirmações pendentes @product

Antes de eu fechar o patch e re-submeter ao devils-advocate, preciso de você em **2 decisões**:

| # | Decisão | Opções |
|---|---|---|
| **C1 (A-3)** | Ações `completed` antigas: usar `cycleNumber`? | (a) Sim, opção (c) com `cycleNumber` <br> (b) Outra opção |
| **C2 (A-7)** | `AiInsight`: MVP ou v2? | (a) MVP — adicionar `insight-generator-service` na Fase 3 v1.1 <br> (b) v2 — marcar `@deprecated`, remover na próxima migration |

E uma sanity check rápida:

| # | Item | Sua palavra |
|---|---|---|
| **C3 (A-5)** | OCR Premium: empurrar para spec própria pré-Fase 5? OK com OpenAI Vision? | OK / ajustar |

---

## Após confirmação

Quando você responder, eu:

1. Aplico C1 + C2 + C3 no patch (~5min)
2. Atualizo a Fase 3 com a §20 colada
3. **Re-submeto ao devils-advocate**
4. Se virar APROVADO → seguimos para **Fase 4 (arquitetura técnica)**

---

*Fim do ciclo adversarial. Aguardando 3 confirmações.*
