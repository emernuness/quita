# Quita — Fase 4: Arquitetura Técnica NestJS

> **Status:** rascunho para validação
> **Data:** 16 de maio de 2026
> **Insumo:** Fase 3 v1.1 aprovada (motor especificado)
> **Escopo:** como o motor especificado vira código NestJS — estrutura, decoradores, eventos, jobs, cache, observabilidade
> **Não cobre:** telas (Fase 5), migração do código atual (Fase 6), OCR Premium (Bridge 4↔5)

---

## Sumário executivo

A Fase 4 traduz o motor da Fase 3 em **arquitetura NestJS executável**. Cada um dos 12 módulos do motor vira um módulo Nest com responsabilidades isoladas. A camada de infraestrutura (Prisma, Redis, BullMQ, Sentry) fica nas bordas; o domínio do motor permanece puro.

**12 módulos do motor + 6 módulos auxiliares** (auth, onboarding, consent, data-export, profile, health) compõem a aplicação completa. Total: **18 módulos NestJS**.

**Stack adicionado nesta fase:**
- `@nestjs/bullmq` + `bullmq` + `ioredis` — fila de jobs assíncronos
- `nestjs-pino` + `pino-pretty` — logging estruturado
- `@sentry/node` — observabilidade de erros
- `@nestjs/swagger` — OpenAPI gerada automaticamente
- `@nestjs/throttler` — rate limiting
- `@nestjs/event-emitter` — event bus interno
- `date-fns` v3+ — utilities de data

**As 4 pendências menores (NM-1 a NM-4)** da Fase 3 v1.1 estão resolvidas no §14.

---

## 1. Princípios de arquitetura

**1.1 Domínio puro, infraestrutura nas bordas.**
O motor é um conjunto de funções e classes que recebem o que precisam por parâmetro. Nada de `@Inject(REQUEST)` no `priority-engine`. Repositórios e clients externos ficam nas bordas (controllers, processors, services orquestradores).

**1.2 Type-safe ponta-a-ponta.**
Prisma gera tipos do schema → `@quita/shared` exporta Zod schemas → DTOs Nest derivam dos schemas → Controllers expõem com `@ApiProperty()`. Quebra de tipo é erro de compilação, não de runtime.

**1.3 Eventos para acoplamento solto.**
Módulos não conhecem uns aos outros diretamente; comunicam-se via `EventEmitter` interno do Nest. `financial-profile-service` emite `debt.added`; `monthly-plan-generator` ouve. Trocar implementação de qualquer módulo não quebra o resto.

**1.4 Transactions na borda, não distribuídas.**
A `prisma.$transaction` envolve o orquestrador (`monthly-plan-generator.generate`). Módulos internos não criam transactions próprias — recebem `tx` opcionalmente e usam.

**1.5 Fail fast, recover gracefully.**
Validação Zod no controller rejeita input ruim antes do service. Erros internos vão pro Sentry com contexto. Jobs falham e retentam; plano antigo permanece válido.

**1.6 Observabilidade desde o dia 1.**
Cada job tem log de início/fim/duração. Cada erro tem fingerprint. Métricas básicas (jobs/min, p95 de tempo) ficam visíveis no BullMQ Board e no Sentry.

**1.7 Configuração via env, sem hardcoded.**
Toda string que muda entre dev/staging/prod (DB URL, Redis URL, JWT secret, Sentry DSN) vem de `process.env` via `@nestjs/config`.

---

## 2. Estrutura de pastas do `apps/api`

### 2.1 Estado atual

```
apps/api/
  src/
    auth/
    common/
    config/
    dashboard/
    debts/
    financial/
    main.ts
    onboarding/
    profile/
    app.module.ts
  prisma/
    schema.prisma
    migrations/
  package.json
```

### 2.2 Estrutura-alvo

```
apps/api/
  src/
    main.ts
    app.module.ts

    common/
      decorators/
        current-user.decorator.ts
        public.decorator.ts
      filters/
        all-exceptions.filter.ts
        prisma-exception.filter.ts
      guards/
        jwt-auth.guard.ts
        throttler-behind-proxy.guard.ts
      interceptors/
        logging.interceptor.ts
        sentry.interceptor.ts
      pipes/
        zod-validation.pipe.ts
      utils/
        date.utils.ts
        money.utils.ts

    config/
      app.config.ts
      database.config.ts
      redis.config.ts
      bullmq.config.ts
      sentry.config.ts
      jwt.config.ts
      validation.schema.ts

    database/
      prisma.module.ts
      prisma.service.ts
      transaction.runner.ts

    auth/
      auth.module.ts
      auth.service.ts
      auth.controller.ts
      jwt.strategy.ts
      refresh.strategy.ts
      dto/
        login.dto.ts
        register.dto.ts
        refresh-token.dto.ts

    modules/
      financial-profile/         # módulo 1 do motor (CRUDs)
        financial-profile.module.ts
        financial-profile.service.ts
        financial-profile.controller.ts
        repositories/
          income.repository.ts
          expense.repository.ts
          debt.repository.ts
          behavior-profile.repository.ts
          emergency-reserve.repository.ts
          user-goal.repository.ts
        dto/
        events/
          income-added.event.ts
          income-updated.event.ts
          income-removed.event.ts
          expense-added.event.ts
          # ... etc
        tests/

      expense-classification/    # módulo 2
        expense-classification.module.ts
        expense-classification.service.ts
        category-defaults.constant.ts

      debt-classification/       # módulo 3
        debt-classification.module.ts
        debt-classification.service.ts
        repositories/
          interest-rate-reference.repository.ts
          debt-category.repository.ts

      financial-state-detector/  # módulo 4
        financial-state-detector.module.ts
        financial-state-detector.service.ts
        smoothing-rule.helper.ts
        minimum-vital.helper.ts
        repositories/
          financial-state-snapshot.repository.ts
          regional-minimum-vital.repository.ts

      priority-engine/           # módulo 5
        priority-engine.module.ts
        priority-engine.service.ts
        score-factors.helper.ts
        reason-formatter.helper.ts
        repositories/
          scoring-weight.repository.ts

      strategy-selector/         # módulo 6
        strategy-selector.module.ts
        strategy-selector.service.ts
        operation-mode-rules.constant.ts

      simulator/                 # módulo 7
        simulator.module.ts
        simulator.service.ts
        payoff-estimator.helper.ts

      settlement-validator/      # módulo 8
        settlement-validator.module.ts
        settlement-validator.service.ts
        settlement-validator.controller.ts
        repositories/
          settlement-evaluation.repository.ts
        dto/

      goal-tracker/              # módulo 9
        goal-tracker.module.ts
        goal-tracker.service.ts
        motivational-text.helper.ts

      seasonal-expense/          # módulo 10
        seasonal-expense.module.ts
        seasonal-expense.service.ts

      monthly-plan-generator/    # módulo 11 (orquestrador)
        monthly-plan-generator.module.ts
        monthly-plan-generator.service.ts
        monthly-plan-generator.controller.ts
        actions-generator.helper.ts
        action-reconciler.helper.ts
        repositories/
          monthly-action-plan.repository.ts
          recommended-action.repository.ts

      long-term-plan/            # módulo 12
        long-term-plan.module.ts
        long-term-plan.service.ts
        long-term-plan.controller.ts
        repositories/
          payment-plan.repository.ts
          plan-timeline-item.repository.ts

      onboarding/                # módulo auxiliar
        onboarding.module.ts
        onboarding.service.ts
        onboarding.controller.ts

      consent/                   # módulo auxiliar LGPD
        consent.module.ts
        consent.service.ts
        consent.controller.ts
        repositories/
          consent-log.repository.ts

      data-export/               # módulo auxiliar LGPD
        data-export.module.ts
        data-export.service.ts
        data-export.controller.ts

      profile/                   # perfil do User
        profile.module.ts
        profile.service.ts
        profile.controller.ts

      notification/              # preferências de notificação
        notification.module.ts
        notification.service.ts
        notification.controller.ts

      health/                    # healthcheck
        health.module.ts
        health.controller.ts

    queues/
      motor.queue.ts
      queue.module.ts
      processors/
        recalculate-state.processor.ts
        recalculate-plan.processor.ts
        monthly-rollover.processor.ts
        data-freshness-review.processor.ts
        data-retention-cleanup.processor.ts
        settlement-revalidation.processor.ts
        long-term-plan-generation.processor.ts
        interest-rate-update.processor.ts
        recalculate-all-scores.processor.ts
      base.processor.ts

    events/
      event-bus.module.ts
      event-publisher.service.ts
      listeners/
        debt-changed.listener.ts
        expense-changed.listener.ts
        income-changed.listener.ts
        onboarding-completed.listener.ts
        # ... etc

    seeds/
      seed.ts
      data/
        debt-categories.json
        regional-minimum-vital.json
        interest-rate-references.json
        support-channels.json
        scoring-weights.json
      seeders/
        debt-category.seeder.ts
        regional-minimum-vital.seeder.ts
        interest-rate-reference.seeder.ts
        support-channel.seeder.ts
        scoring-weight.seeder.ts

  prisma/
    schema.prisma
    migrations/

  test/
    e2e/
    fixtures/
      maria-clt-saudavel.fixture.ts
      joao-autonomo-apertado.fixture.ts
      pedro-afogado.fixture.ts
      ana-superendividada.fixture.ts
      carlos-insolvente.fixture.ts
      lucia-minimal.fixture.ts
      roberto-sazonal.fixture.ts
      beatriz-oscilante.fixture.ts

  package.json
  vitest.config.ts
  tsconfig.json
```

**Princípio.** Cada subpasta de `modules/` é autocontida: services, repositories, helpers, dto, events, tests. Trocar um módulo é mover uma pasta inteira.

---

## 3. Mapeamento dos 12 módulos do motor → módulos NestJS

| # | Módulo do motor (Fase 3) | Módulo NestJS | Expõe Controller? | Triggers eventos |
|---|---|---|---|---|
| 1 | `financial-profile-service` | `FinancialProfileModule` | Sim — CRUDs REST | Emite `income.*`, `expense.*`, `debt.*`, `behavior-profile.*`, `goal.*`, `emergency-reserve.*` |
| 2 | `expense-classification-service` | `ExpenseClassificationModule` | Não — interno | — |
| 3 | `debt-classification-service` | `DebtClassificationModule` | Não — interno | — |
| 4 | `financial-state-detector` | `FinancialStateDetectorModule` | Não — interno | Emite `state.detected` (para revalidação de acordo) |
| 5 | `priority-engine` | `PriorityEngineModule` | Não — interno | — |
| 6 | `strategy-selector` | `StrategySelectorModule` | Não — interno | — |
| 7 | `simulator` | `SimulatorModule` | Não — interno | — |
| 8 | `settlement-validator` | `SettlementValidatorModule` | Sim — `POST /settlements/validate` | Emite `settlement.evaluated` |
| 9 | `goal-tracker-service` | `GoalTrackerModule` | Compartilha controller de `FinancialProfile` (CRUD de Goal) | Junto com FinancialProfile |
| 10 | `seasonal-expense-service` | `SeasonalExpenseModule` | Não — interno | — |
| 11 | `monthly-plan-generator` | `MonthlyPlanGeneratorModule` | Sim — `GET /monthly-plan/active`, `POST /monthly-plan/recalculate` | — |
| 12 | `long-term-plan-service` | `LongTermPlanModule` | Sim — `GET /long-term-plan`, `POST /long-term-plan/regenerate` | — |

---

## 4. Anatomia de um módulo (template usando `financial-state-detector`)

### 4.1 `financial-state-detector.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '@/database/prisma.module';
import { ExpenseClassificationModule } from '../expense-classification/expense-classification.module';
import { SimulatorModule } from '../simulator/simulator.module';
import { FinancialStateDetectorService } from './financial-state-detector.service';
import { FinancialStateSnapshotRepository } from './repositories/financial-state-snapshot.repository';
import { RegionalMinimumVitalRepository } from './repositories/regional-minimum-vital.repository';
import { SmoothingRuleHelper } from './smoothing-rule.helper';
import { MinimumVitalHelper } from './minimum-vital.helper';

@Module({
  imports: [
    PrismaModule,
    ExpenseClassificationModule,
    SimulatorModule,
  ],
  providers: [
    FinancialStateDetectorService,
    FinancialStateSnapshotRepository,
    RegionalMinimumVitalRepository,
    SmoothingRuleHelper,
    MinimumVitalHelper,
  ],
  exports: [FinancialStateDetectorService],
})
export class FinancialStateDetectorModule {}
```

### 4.2 `financial-state-detector.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/database/prisma.service';
import { ExpenseClassificationService } from '../expense-classification/expense-classification.service';
import { SimulatorService } from '../simulator/simulator.service';
import { FinancialStateSnapshotRepository } from './repositories/financial-state-snapshot.repository';
import { SmoothingRuleHelper } from './smoothing-rule.helper';
import { MinimumVitalHelper } from './minimum-vital.helper';
import { MotorContext, DetectorOutput } from '@quita/shared';

@Injectable()
export class FinancialStateDetectorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly expenseClassification: ExpenseClassificationService,
    private readonly simulator: SimulatorService,
    private readonly snapshotRepo: FinancialStateSnapshotRepository,
    private readonly smoothing: SmoothingRuleHelper,
    private readonly minimumVital: MinimumVitalHelper,
    private readonly eventEmitter: EventEmitter2,
    @InjectPinoLogger(FinancialStateDetectorService.name)
    private readonly logger: PinoLogger,
  ) {}

  async detect(
    ctx: MotorContext,
    tx?: Prisma.TransactionClient,
  ): Promise<DetectorOutput> {
    const client = tx ?? this.prisma;
    this.logger.debug({ ctx }, 'detect.start');

    // ... pseudocódigo da §7.3 da Fase 3 ...

    const detectorOutput = { /* ... */ };

    // Emite evento para o SettlementRevalidationJob (NM-3 considerado)
    const lastSnapshot = await this.snapshotRepo.getLastForUser(ctx.userId, { maxAgeDays: 30 }, client);
    if (lastSnapshot) {
      const capacityDelta = Math.abs(
        (detectorOutput.capacity - Number(lastSnapshot.safeCapacity)) / Number(lastSnapshot.safeCapacity)
      );
      if (capacityDelta > 0.20) {
        this.eventEmitter.emit('state.detected', {
          userId: ctx.userId,
          capacityDelta,
          previousCapacity: Number(lastSnapshot.safeCapacity),
          newCapacity: detectorOutput.capacity,
        });
      }
    }

    this.logger.debug({ state: detectorOutput.state, mode: detectorOutput.mode }, 'detect.done');
    return detectorOutput;
  }
}
```

### 4.3 `repositories/financial-state-snapshot.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Prisma, FinancialStateSnapshot } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { differenceInDays } from 'date-fns';

@Injectable()
export class FinancialStateSnapshotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    input: Prisma.FinancialStateSnapshotCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<FinancialStateSnapshot> {
    const client = tx ?? this.prisma;
    return client.financialStateSnapshot.create({ data: input });
  }

  async getLastForUser(
    userId: string,
    options: { maxAgeDays?: number } = {},
    tx?: Prisma.TransactionClient,
  ): Promise<FinancialStateSnapshot | null> {
    const client = tx ?? this.prisma;
    const snapshot = await client.financialStateSnapshot.findFirst({
      where: { userId },
      orderBy: { capturedAt: 'desc' },
    });

    if (!snapshot) return null;
    if (options.maxAgeDays && differenceInDays(new Date(), snapshot.capturedAt) > options.maxAgeDays) {
      return null;
    }
    return snapshot;
  }

  async getPreviousBefore(
    userId: string,
    before: Date,
    options: { maxAgeDays?: number } = {},
    tx?: Prisma.TransactionClient,
  ): Promise<FinancialStateSnapshot | null> {
    // ... similar à getLastForUser, com filtro capturedAt < before
  }
}
```

### 4.4 Padrão para todos os outros módulos do motor

Cada módulo segue o mesmo esqueleto:
- `*.module.ts` — declara providers, imports, exports
- `*.service.ts` — implementa o pseudocódigo da Fase 3
- `repositories/*.repository.ts` — encapsula Prisma queries; aceita `tx` opcional
- `*.helper.ts` — funções puras testáveis isoladamente
- `dto/` (se controller) — DTOs com `@ApiProperty()`
- `events/` (se emite) — classes de evento tipadas
- `tests/` — unit por arquivo

---

## 5. Repositórios Prisma com transactions

### 5.1 Padrão de injeção de `tx`

Todo método que escreve aceita `tx?: Prisma.TransactionClient` como último parâmetro. Métodos read-only podem aceitar também (útil para read-your-writes dentro da transaction).

```typescript
@Injectable()
export class DebtRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.DebtCreateInput, tx?: Prisma.TransactionClient): Promise<Debt> {
    const client = tx ?? this.prisma;
    return client.debt.create({ data });
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<Debt | null> {
    const client = tx ?? this.prisma;
    return client.debt.findUnique({ where: { id } });
  }

  async updateScore(
    id: string,
    score: number,
    reason: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Debt> {
    const client = tx ?? this.prisma;
    return client.debt.update({
      where: { id },
      data: { priorityScore: score, priorityReason: reason },
    });
  }
}
```

### 5.2 `TransactionRunner` (utility)

Para orquestrador, expor utility que envolve `prisma.$transaction`:

```typescript
// database/transaction.runner.ts
@Injectable()
export class TransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: { timeout?: number; maxWait?: number },
  ): Promise<T> {
    return this.prisma.$transaction(fn, {
      timeout: options?.timeout ?? 10_000,
      maxWait: options?.maxWait ?? 5_000,
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    });
  }
}
```

Uso em `monthly-plan-generator.service.ts`:

```typescript
async generate(ctx: MotorContext): Promise<MonthlyActionPlan> {
  return this.txRunner.run(async (tx) => {
    const detector = await this.detector.detect(ctx, tx);
    // ... todo o pipeline dentro da tx ...
    return await this.planRepo.upsert({ /* ... */ }, tx);
  });
}
```

### 5.3 `PrismaService`

```typescript
// database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

---

## 6. Event bus com Nest `EventEmitter`

### 6.1 Setup

```typescript
// app.module.ts
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      verboseMemoryLeak: true,
    }),
    // ...
  ],
})
export class AppModule {}
```

### 6.2 Convenção de eventos

Eventos no formato `<domain>.<verb>`. Lista completa:

| Evento | Disparado por | Listener principal |
|---|---|---|
| `income.added` | `FinancialProfileService.addIncome` | `IncomeChangedListener` → enfileira `RecalculateStateJob` |
| `income.updated` | `FinancialProfileService.updateIncome` | idem |
| `income.removed` | `FinancialProfileService.removeIncome` | idem |
| `expense.added/updated/removed` | `FinancialProfileService` | `ExpenseChangedListener` |
| `debt.added/updated/removed` | `FinancialProfileService` | `DebtChangedListener` |
| `payment.recorded` | `PaymentController` | `PaymentRecordedListener` |
| `payment.reverted` | `PaymentController` | idem |
| `settlement.evaluated` | `SettlementValidatorService.validate` | — (só registro) |
| `behavior-profile.updated` | `FinancialProfileService` | `BehaviorProfileChangedListener` |
| `goal.added/updated` | `GoalTrackerService` | `GoalChangedListener` |
| `emergency-reserve.updated` | `FinancialProfileService` | `EmergencyReserveChangedListener` |
| `onboarding.completed` | `OnboardingService.complete` | `OnboardingCompletedListener` → primeira execução do motor |
| `state.detected` | `FinancialStateDetectorService` (se delta > 20%) | `SettlementRevalidationListener` |

### 6.3 Padrão de listener

```typescript
// events/listeners/debt-changed.listener.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { startOfMonth } from 'date-fns';

@Injectable()
export class DebtChangedListener {
  constructor(@InjectQueue('motor-recalc') private readonly motorQueue: Queue) {}

  @OnEvent('debt.added')
  async handleDebtAdded(payload: { userId: string; debtId: string }) {
    await this.enqueueRecalc(payload.userId, 'debt_added');
  }

  @OnEvent('debt.updated')
  async handleDebtUpdated(payload: { userId: string; debtId: string }) {
    await this.enqueueRecalc(payload.userId, 'debt_updated');
  }

  @OnEvent('debt.removed')
  async handleDebtRemoved(payload: { userId: string; debtId: string }) {
    await this.enqueueRecalc(payload.userId, 'debt_removed');
  }

  private async enqueueRecalc(userId: string, triggerEvent: string) {
    await this.motorQueue.add(
      'recalculate-state-and-plan',
      {
        userId,
        referenceMonth: startOfMonth(new Date()).toISOString(),
        triggerEvent,
        triggeredAt: new Date().toISOString(),
      },
      { groupId: userId },
    );
  }
}
```

### 6.4 Por que `EventEmitter` em vez de chamada direta

- **Desacoplamento.** `FinancialProfileService` não conhece `MonthlyPlanGenerator`. Mudança em um não força mudança no outro.
- **Múltiplos listeners.** O mesmo evento `debt.added` pode disparar recálculo (motor) + audit log + notificação push, sem cada um modificar `FinancialProfileService`.
- **Testabilidade.** Em testes unitários, mocka-se `EventEmitter` e verifica-se que o evento foi emitido. Não precisa instanciar BullMQ.

---

## 7. BullMQ + Upstash Redis

### 7.1 Setup

```typescript
// config/bullmq.config.ts
import { registerAs } from '@nestjs/config';

export const bullmqConfig = registerAs('bullmq', () => ({
  connection: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential' as const, delay: 5 * 60 * 1000 },
    removeOnComplete: { count: 100, age: 24 * 3600 },
    removeOnFail: { count: 1000, age: 7 * 24 * 3600 },
  },
}));
```

### 7.2 `QueueModule`

```typescript
// queues/queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { RecalculateStateProcessor } from './processors/recalculate-state.processor';
// ... outros processors

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: config.get('bullmq.connection'),
        defaultJobOptions: config.get('bullmq.defaultJobOptions'),
      }),
    }),
    BullModule.registerQueue({
      name: 'motor-recalc',
    }),
  ],
  providers: [
    RecalculateStateProcessor,
    // ... outros
  ],
  exports: [BullModule],
})
export class QueueModule {}
```

### 7.3 Padrão de Processor com `BaseProcessor` (NM-2 resolvida)

NM-2 (Fase 3 v1.1): jobs precisam verificar `userExists` antes de processar. Solução: `BaseProcessor` com pré-step.

```typescript
// queues/base.processor.ts
import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserRepository } from '../modules/profile/repositories/user.repository';

export abstract class BaseProcessor extends WorkerHost {
  protected abstract logger: PinoLogger;

  constructor(protected readonly userRepo: UserRepository) {
    super();
  }

  async process(job: Job): Promise<any> {
    const userId = job.data.userId;
    if (!userId) {
      this.logger.warn({ jobId: job.id }, 'job.skipped.no_user_id');
      return { skipped: true, reason: 'no_user_id' };
    }

    // NM-2: pré-step de verificação
    const exists = await this.userRepo.exists(userId);
    if (!exists) {
      this.logger.info({ jobId: job.id, userId }, 'job.skipped.user_deleted');
      return { skipped: true, reason: 'user_deleted' };
    }

    this.logger.debug({ jobId: job.id, userId, jobName: job.name }, 'job.start');
    const start = Date.now();
    try {
      const result = await this.handle(job);
      this.logger.debug({ jobId: job.id, ms: Date.now() - start }, 'job.done');
      return result;
    } catch (error) {
      this.logger.error({ jobId: job.id, error, attempt: job.attemptsMade }, 'job.failed');
      throw error;
    }
  }

  protected abstract handle(job: Job): Promise<any>;
}
```

### 7.4 Exemplo de processor concreto

```typescript
// queues/processors/recalculate-state.processor.ts
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { BaseProcessor } from '../base.processor';
import { UserRepository } from '../../modules/profile/repositories/user.repository';
import { MonthlyPlanGeneratorService } from '../../modules/monthly-plan-generator/monthly-plan-generator.service';

@Injectable()
@Processor('motor-recalc', {
  concurrency: 20,
  group: { concurrency: 1 }, // serialização por groupId (= userId)
})
export class RecalculateStateProcessor extends BaseProcessor {
  constructor(
    userRepo: UserRepository,
    private readonly planGenerator: MonthlyPlanGeneratorService,
    @InjectPinoLogger(RecalculateStateProcessor.name)
    protected readonly logger: PinoLogger,
  ) {
    super(userRepo);
  }

  async handle(job: Job): Promise<any> {
    const { userId, referenceMonth, triggerEvent, triggeredAt } = job.data;
    return await this.planGenerator.generate({
      userId,
      referenceMonth: new Date(referenceMonth),
      triggerEvent,
      triggeredAt: new Date(triggeredAt),
    });
  }
}
```

### 7.5 Inventário completo de processors

| Processor | Job name | Fonte do trigger |
|---|---|---|
| `RecalculateStateProcessor` | `recalculate-state-and-plan` | Eventos CRUD (income/expense/debt/etc.) |
| `MonthlyRolloverProcessor` | `monthly-rollover` | Cron diário 02:00 UTC |
| `DataFreshnessReviewProcessor` | `data-freshness-review` | Cron semanal domingo 03:00 UTC |
| `DataRetentionCleanupProcessor` | `data-retention-cleanup` | Cron diário 04:00 UTC |
| `SettlementRevalidationProcessor` | `settlement-revalidation` | Evento `state.detected` com delta > 20% |
| `LongTermPlanGenerationProcessor` | `long-term-plan-generation` | Cron mensal ou sob demanda |
| `InterestRateUpdateProcessor` | `interest-rate-update` | Cron mensal dia 1º 05:00 UTC |
| `RecalculateAllScoresProcessor` | `recalculate-all-scores` | Manual após mudança de `ScoringWeight` |

### 7.6 Schedulers (crons)

```typescript
// queues/queue.module.ts
@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'motor-recalc',
    }),
  ],
})
export class QueueModule implements OnModuleInit {
  constructor(@InjectQueue('motor-recalc') private readonly queue: Queue) {}

  async onModuleInit() {
    // Crons
    await this.queue.add(
      'monthly-rollover',
      {},
      {
        repeat: { pattern: '0 2 * * *' }, // diário 02:00 UTC
        jobId: 'cron:monthly-rollover',
      },
    );

    await this.queue.add(
      'data-freshness-review',
      {},
      {
        repeat: { pattern: '0 3 * * 0' }, // domingos 03:00 UTC
        jobId: 'cron:data-freshness-review',
      },
    );

    await this.queue.add(
      'data-retention-cleanup',
      {},
      {
        repeat: { pattern: '0 4 * * *' }, // diário 04:00 UTC
        jobId: 'cron:data-retention-cleanup',
      },
    );

    await this.queue.add(
      'interest-rate-update',
      {},
      {
        repeat: { pattern: '0 5 1 * *' }, // dia 1º de cada mês 05:00 UTC
        jobId: 'cron:interest-rate-update',
      },
    );
  }
}
```

### 7.7 BullMQ Board (dashboard)

```typescript
// apps/api/src/main.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

// ... no bootstrap:
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(motorQueue)],
  serverAdapter,
});

app.use('/admin/queues', BasicAuthMiddleware, serverAdapter.getRouter());
```

Visualização visual de filas, jobs falhados, retries, dead-letter — protegido por basic auth ou whitelist de IP.

---

## 8. Cache em Redis

### 8.1 Casos de cache identificados

| Caso | TTL | Invalidação |
|---|---|---|
| `estimatePayoffMonths` resultado | 60s | Auto-expira |
| `InterestRateReference` por categoria | 1 hora | Invalidação manual após `interest-rate-update` job |
| `RegionalMinimumVital` por UF | 24 horas | Manual após seed update |
| `DebtCategory` lista completa | 1 hora | Manual após seed update |

### 8.2 `CacheService`

```typescript
// common/services/cache.service.ts
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return raw ? JSON.parse(raw) as T : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) await this.redis.del(...keys);
  }
}
```

### 8.3 Uso em `SimulatorService.estimatePayoffMonths`

```typescript
import { createHash } from 'crypto';

async estimatePayoffMonthsCached(
  userId: string,
  debts: ClassifiedDebt[],
  monthlyPayment: number,
): Promise<number> {
  const inputHash = createHash('sha256')
    .update(JSON.stringify({
      debts: debts.map(d => ({ id: d.id, balance: d.totalAmount, paid: d.amountPaid, rate: d.interestRateMonthly })),
      monthlyPayment,
    }))
    .digest('hex')
    .slice(0, 16);

  const cacheKey = `payoff:${userId}:${inputHash}`;
  const cached = await this.cache.get<number>(cacheKey);
  if (cached !== null) return cached;

  const result = this.estimatePayoffMonths(debts, monthlyPayment);
  await this.cache.set(cacheKey, result, 60);
  return result;
}
```

---

## 9. Logging estruturado (Pino) + Sentry

### 9.1 Setup do Pino via `nestjs-pino`

```typescript
// app.module.ts
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport: process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.passwordHash',
            'res.headers["set-cookie"]',
          ],
          remove: true,
        },
        customLogLevel(req, res, err) {
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            userId: req.user?.id, // injetado pelo guard
          }),
        },
      },
    }),
    // ...
  ],
})
export class AppModule {}
```

### 9.2 Convenções de log

Toda mensagem de log tem **dois campos mínimos**: contexto estruturado (objeto) e descrição curta (string).

```typescript
this.logger.info({ userId, planId, state }, 'plan.generated');
this.logger.warn({ userId, snapshotId, capacityDelta }, 'detector.large_capacity_change');
this.logger.error({ userId, jobId, err }, 'job.failed.persistent');
```

A descrição é sempre `<domain>.<event>` em snake_case — facilita filtros e dashboards.

### 9.3 Setup do Sentry

```typescript
// config/sentry.config.ts
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  if (!process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 0.1,
    integrations: [nodeProfilingIntegration()],
    beforeSend(event) {
      // Sanitize: nunca enviar PII
      if (event.request?.cookies) delete event.request.cookies;
      if (event.user?.email) event.user.email = '[redacted]';
      return event;
    },
  });
}
```

### 9.4 `SentryInterceptor`

```typescript
// common/interceptors/sentry.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        Sentry.withScope((scope) => {
          const req = context.switchToHttp().getRequest();
          if (req.user?.id) scope.setUser({ id: req.user.id });
          scope.setExtra('url', req.url);
          scope.setExtra('method', req.method);
          Sentry.captureException(err);
        });
        return throwError(() => err);
      }),
    );
  }
}
```

### 9.5 Métricas opcionais (Prometheus)

Para escalas maiores, adicionar `@willsoto/nestjs-prometheus`:

```typescript
// métricas críticas para o motor:
const motorJobDuration = new Histogram({
  name: 'quita_motor_job_duration_seconds',
  help: 'Duração de jobs do motor',
  labelNames: ['job_name', 'status'],
});

const planGenerationCount = new Counter({
  name: 'quita_plan_generations_total',
  help: 'Total de planos gerados',
  labelNames: ['financial_state', 'mode'],
});
```

Não obrigatório para o MVP — só se a Vercel/Supabase Pro mostrarem sinais de gargalo.

---

## 10. Autenticação e Guards

### 10.1 Migração de `localStorage` → `httpOnly cookie`

O código atual tem TODO de migrar token para `httpOnly cookie`. Resolver agora.

```typescript
// auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.authService.login(dto);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15min
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 3600 * 1000, // 7 dias
    });

    return { user }; // sem token no body
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // ...
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { ok: true };
  }
}
```

### 10.2 `JwtStrategy` lê do cookie

```typescript
// auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['access_token'] ?? null,
      ]),
      secretOrKey: configService.get<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email };
  }
}
```

### 10.3 `@CurrentUser()` decorator

```typescript
// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
```

Uso:

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@CurrentUser() user: AuthenticatedUser) {
  return this.profileService.getById(user.id);
}
```

### 10.4 Rate limiting (`@nestjs/throttler`)

```typescript
// app.module.ts
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60_000, // 1 min
        limit: 60,   // 60 req/min globais
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 10,   // 10 tentativas de login por minuto
      },
    ]),
  ],
})
export class AppModule {}

// Em endpoint sensível:
@Post('login')
@Throttle({ auth: { limit: 10, ttl: 60_000 } })
login(@Body() dto: LoginDto) { /* ... */ }
```

### 10.5 CORS

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
  credentials: true, // necessário para cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  exposedHeaders: ['X-Request-Id'],
});
```

---

## 11. OpenAPI gerada

### 11.1 Setup

```typescript
// main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('Quita API')
    .setDescription('Motor de decisão financeira')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
```

### 11.2 DTOs com decoradores

DTOs nas pastas `modules/*/dto/`. Usam `@ApiProperty()` para gerar schema.

```typescript
// modules/financial-profile/dto/create-income.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { incomeInputSchema } from '@quita/shared';

export class CreateIncomeDto extends createZodDto(incomeInputSchema) {
  @ApiProperty({ example: 'Salário CLT' })
  declare name: string;

  @ApiProperty({ example: 5000 })
  declare amount: number;

  @ApiProperty({ enum: ['recurring', 'installment', 'one_time', 'irregular'] })
  declare frequency: 'recurring' | 'installment' | 'one_time' | 'irregular';

  // ... etc
}
```

A integração com Zod via `nestjs-zod` mantém o schema único compartilhado em `@quita/shared` — Zod validação + Swagger doc + tipo TypeScript a partir de uma fonte.

---

## 12. Estratégia de seed

### 12.1 Estrutura

```
packages/database/seeds/
  seed.ts                    # entry point
  data/
    debt-categories.json
    regional-minimum-vital.json
    interest-rate-references.json
    support-channels.json
    scoring-weights.json
  seeders/
    debt-category.seeder.ts
    regional-minimum-vital.seeder.ts
    interest-rate-reference.seeder.ts
    support-channel.seeder.ts
    scoring-weight.seeder.ts
```

### 12.2 `seed.ts`

```typescript
// packages/database/seeds/seed.ts
import { PrismaClient } from '@prisma/client';
import { DebtCategorySeeder } from './seeders/debt-category.seeder';
import { RegionalMinimumVitalSeeder } from './seeders/regional-minimum-vital.seeder';
import { InterestRateReferenceSeeder } from './seeders/interest-rate-reference.seeder';
import { SupportChannelSeeder } from './seeders/support-channel.seeder';
import { ScoringWeightSeeder } from './seeders/scoring-weight.seeder';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');
  await new DebtCategorySeeder(prisma).run();
  await new RegionalMinimumVitalSeeder(prisma).run();
  await new InterestRateReferenceSeeder(prisma).run();
  await new SupportChannelSeeder(prisma).run();
  await new ScoringWeightSeeder(prisma).run();
  console.log('✅ Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 12.3 Padrão de Seeder

```typescript
// packages/database/seeds/seeders/scoring-weight.seeder.ts
import { PrismaClient } from '@prisma/client';
import data from '../data/scoring-weights.json';

export class ScoringWeightSeeder {
  constructor(private readonly prisma: PrismaClient) {}

  async run() {
    for (const item of data) {
      await this.prisma.scoringWeight.upsert({
        where: { factorKey: item.factorKey },
        update: item,
        create: item,
      });
    }
    console.log(`  ✓ ScoringWeight: ${data.length} entries`);
  }
}
```

### 12.4 Comando

```json
// package.json
{
  "scripts": {
    "db:seed": "ts-node packages/database/seeds/seed.ts",
    "db:reset": "prisma migrate reset --force && pnpm db:seed"
  }
}
```

### 12.5 Atualização contínua de `InterestRateReference` (via BCB SGS)

`InterestRateUpdateProcessor` (cron mensal) consulta a API do BCB SGS:

```typescript
// modules/debt-classification/services/bcb-sgs.client.ts
@Injectable()
export class BcbSgsClient {
  // BCB SGS séries relevantes (códigos SGS):
  // 20754 - Taxa média de juros - Cartão de crédito rotativo total
  // 25467 - Taxa média de juros - Cheque especial total
  // 20739 - Taxa média de juros - Empréstimo pessoal total
  // 20741 - Taxa média de juros - Crédito consignado total
  // 20771 - Taxa média de juros - Veículos financiamento total
  // 20756 - Taxa média de juros - Crédito imobiliário pré-fixado

  async fetchSeries(seriesCode: string, year: number, month: number) {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesCode}/dados?formato=json&dataInicial=01/${String(month).padStart(2, '0')}/${year}&dataFinal=28/${String(month).padStart(2, '0')}/${year}`;
    const response = await fetch(url);
    return await response.json();
  }
}
```

```typescript
// queues/processors/interest-rate-update.processor.ts
@Processor('motor-recalc')
export class InterestRateUpdateProcessor extends BaseProcessor {
  async handle(job: Job): Promise<any> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // mês anterior (BCB atrasa 1 mês)

    const seriesMap = {
      credit_card: '20754',
      overdraft: '25467',
      personal_loan: '20739',
      payroll_loan: '20741',
      vehicle_financing: '20771',
      mortgage: '20756',
    };

    for (const [categorySlug, seriesCode] of Object.entries(seriesMap)) {
      const data = await this.bcbClient.fetchSeries(seriesCode, year, month);
      if (data.length === 0) continue;

      const annualRate = parseFloat(data[0].valor) / 100;
      const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

      await this.interestRateRepo.upsert({
        debtCategorySlug: categorySlug,
        monthlyRateMedian: monthlyRate,
        monthlyRateMin: monthlyRate * 0.7,
        monthlyRateMax: monthlyRate * 1.3,
        effectiveDate: new Date(year, month, 1),
        source: 'BCB_SGS',
        sourceSeriesCode: seriesCode,
      });
    }

    // Invalida cache
    await this.cache.delPattern('interest-rate:*');
  }
}
```

**Custo: zero.** BCB SGS é gratuito, sem rate limit oficial, sem autenticação. Conforme confirmado pelo @product.

---

## 13. Testes

### 13.1 Vitest configurado

```typescript
// vitest.config.ts (apps/api)
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
  },
});
```

### 13.2 Pirâmide

- **Unit tests** (`*.spec.ts`) — testam funções/classes isoladamente; mockam Prisma com `vitest-mock-extended`
- **Integration tests** (`*.integration.spec.ts`) — usam test DB (`testcontainers` ou Supabase local)
- **E2E tests** (`*.e2e-spec.ts`) — em `apps/api/test/e2e/` — usam `supertest` contra app real

### 13.3 Mock de Prisma para unit tests

```typescript
// test/setup.ts
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { beforeEach } from 'vitest';

export type MockPrisma = DeepMockProxy<PrismaClient>;
export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});
```

### 13.4 Os 8 cenários canônicos como fixtures

```typescript
// test/fixtures/maria-clt-saudavel.fixture.ts
export const mariaCltSaudavel = {
  user: {
    id: 'maria-uuid',
    name: 'Maria',
    email: 'maria@example.com',
    stateCode: 'SP',
    dependentsCount: 0,
    diagnosisLevel: 'detailed',
  },
  incomes: [
    {
      name: 'Salário CLT',
      amount: 5000,
      frequency: 'recurring',
      stabilityType: 'stable',
      paymentDay: 5,
    },
  ],
  expenses: [
    { name: 'Aluguel', amount: 1500, category: 'housing', frequency: 'monthly', isEssential: true },
    { name: 'Luz', amount: 200, category: 'utilities', frequency: 'monthly', isEssential: true },
    { name: 'Internet', amount: 200, category: 'telecom', frequency: 'monthly', isEssential: false },
  ],
  debts: [
    {
      creditor: 'Banco X',
      categorySlug: 'credit_card',
      totalAmount: 1200,
      monthlyAmount: 80,
      interestRateMonthly: 0.12,
    },
  ],
  expectations: {
    state: 'healthy_with_debt',
    mode: 'payoff',
    minPlanActions: 1,
  },
};
```

### 13.5 Teste integrado de cenário

```typescript
// modules/monthly-plan-generator/tests/monthly-plan-generator.integration.spec.ts
describe('MonthlyPlanGenerator (integration)', () => {
  let module: TestingModule;
  let generator: MonthlyPlanGeneratorService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    generator = module.get(MonthlyPlanGeneratorService);
    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    await resetTestDb(prisma);
  });

  describe('Cenário: Maria CLT saudável', () => {
    it('detecta healthy_with_debt e gera plano em modo payoff', async () => {
      const fixture = await seedFixture(prisma, mariaCltSaudavel);

      const plan = await generator.generate({
        userId: fixture.user.id,
        referenceMonth: new Date('2026-06-01'),
        triggerEvent: 'manual_recalc',
        triggeredAt: new Date(),
      });

      expect(plan.financialState).toBe('healthy_with_debt');
      expect(plan.operationMode).toBe('payoff');
      expect(plan.actions.length).toBeGreaterThanOrEqual(1);
      expect(plan.actions.every(a => ['pay', 'review', 'monitor'].includes(a.actionType))).toBe(true);
    });
  });

  describe('Cenário: Carlos insolvente', () => {
    it('detecta practical_insolvency e NÃO gera ações de pay/negotiate', async () => {
      await seedFixture(prisma, carlosInsolvente);
      const plan = await generator.generate({ /* ... */ });

      expect(plan.financialState).toBe('practical_insolvency');
      expect(plan.operationMode).toBe('survival');
      expect(plan.actions.every(a => a.actionType !== 'pay' && a.actionType !== 'negotiate')).toBe(true);
    });
  });

  describe('Cenário: Beatriz oscilante (regra de suavização)', () => {
    it('NÃO desce de healthy para tight com 1 detecção isolada', async () => {
      // seed: 1 snapshot anterior healthy
      // setup: nova condição = tight
      // resultado esperado: mantém healthy
    });

    it('desce após 2 detecções consecutivas', async () => { /* ... */ });
  });
});
```

### 13.6 Validações inviolaveis (testes obrigatórios)

Já especificados na Fase 3 §18.3:

```typescript
describe('Invariantes do motor', () => {
  it.each([
    'practical_insolvency',
  ])('modo survival NUNCA gera pay/negotiate', async (state) => {
    // ...
  });

  it('modo protection NUNCA gera pay', async () => {
    // ...
  });
});
```

---

## 14. Pendências menores resolvidas (NM-1 a NM-4)

### 14.1 NM-1 — Refine no `incomeInputSchema`

```typescript
// packages/shared/src/schemas/income.schema.ts
export const incomeInputSchema = z.object({
  // ...
})
.refine(
  (d) => d.frequency !== 'installment' || (d.installments && d.installmentAmount && d.dueDate),
  { message: 'Para renda parcelada, informe número de parcelas, valor de cada uma e a próxima data de pagamento.' },
)
.refine(
  (d) => !d.upperBoundAmount || !d.guaranteedAmount || d.upperBoundAmount >= d.guaranteedAmount,
  { message: 'O teto deve ser maior ou igual ao piso garantido.' },
);
```

### 14.2 NM-2 — `BaseProcessor` com pré-step

Já implementado em §7.3.

### 14.3 NM-3 — `SettlementRevalidationJob` com snapshot recente

No `FinancialStateDetectorService.detect()`, comparação só dispara revalidação se `lastSnapshot.capturedAt > 30 dias atrás`:

```typescript
const lastSnapshot = await this.snapshotRepo.getLastForUser(
  ctx.userId,
  { maxAgeDays: 30 }, // <-- filtro
  client,
);
if (lastSnapshot) {
  const capacityDelta = Math.abs(
    (detectorOutput.capacity - Number(lastSnapshot.safeCapacity)) / Number(lastSnapshot.safeCapacity)
  );
  if (capacityDelta > 0.20) {
    this.eventEmitter.emit('state.detected', { /* ... */ });
  }
}
```

`getLastForUser` com `maxAgeDays` retorna `null` se o snapshot for mais antigo, evitando comparação contra dado obsoleto.

### 14.4 NM-4 — Migrations 11 e 12 separadas

Em vez de uma migration 11 confusa, duas migrations:

```
11. 20260611_phase3_v1_1_adjustments
    - ALTER TABLE recommended_actions ADD COLUMN cycle_number SMALLINT NOT NULL DEFAULT 1
    - ALTER TABLE settlement_evaluations ADD COLUMN expires_at TIMESTAMP NOT NULL
    - ALTER TABLE settlement_evaluations ADD COLUMN invalidated_at TIMESTAMP NULL
    - ALTER TABLE settlement_evaluations ADD COLUMN invalidation_reason VARCHAR(255) NULL
    - Backfill: UPDATE settlement_evaluations SET expires_at = evaluated_at + INTERVAL '7 days'

12. 20260612_drop_ai_insight
    - DROP TABLE ai_insights
    - Confirmar antes que nenhum registro existe em produção
```

Migration **12 fica gated** atrás de uma verificação: rodar apenas após confirmar que `SELECT COUNT(*) FROM ai_insights` = 0 em produção.

---

## 15. Stack consolidada — versões e justificativas

| Pacote | Versão alvo | Razão |
|---|---|---|
| `@nestjs/core` | ^11.x | Match com versão atual do projeto |
| `@nestjs/common` | ^11.x | idem |
| `@nestjs/config` | ^4.x | Gestão de env vars |
| `@nestjs/event-emitter` | ^3.x | Event bus interno |
| `@nestjs/bullmq` | ^11.x | Integração nativa Nest + BullMQ |
| `@nestjs/swagger` | ^11.x | OpenAPI gerada |
| `@nestjs/throttler` | ^6.x | Rate limiting |
| `@nestjs/passport` | ^11.x | Auth strategies |
| `@nestjs/jwt` | ^11.x | JWT |
| `bullmq` | ^5.x | Filas com groupId |
| `ioredis` | ^5.x | Cliente Redis (BullMQ requer) |
| `@prisma/client` | ^6.x | Match com versão atual |
| `prisma` | ^6.x | idem |
| `zod` | ^3.x | Validação compartilhada |
| `nestjs-zod` | ^4.x | Integração Zod + Swagger |
| `nestjs-pino` | ^4.x | Logger estruturado |
| `pino` | ^9.x | underlying |
| `pino-pretty` | ^11.x | Pretty print dev |
| `@sentry/node` | ^8.x | Observabilidade de erros |
| `@sentry/profiling-node` | ^8.x | Profiling opcional |
| `date-fns` | ^3.x | Utilities de data |
| `passport` | ^0.7.x | Required by Nest passport |
| `passport-jwt` | ^4.x | JWT strategy |
| `bcryptjs` | ^2.x | Hash de senha (match atual) |
| `cookie-parser` | ^1.x | Parsing de cookies |
| `helmet` | ^8.x | Security headers |

### 15.1 DevDependencies relevantes

| Pacote | Versão | Razão |
|---|---|---|
| `vitest` | ^2.x | Test runner (mais rápido que Jest) |
| `vitest-mock-extended` | ^2.x | Mock de Prisma |
| `@vitest/coverage-v8` | ^2.x | Coverage |
| `supertest` | ^7.x | Testes E2E HTTP |
| `@bull-board/api` + `@bull-board/express` | ^6.x | Dashboard BullMQ |

---

## 16. Configuração de ambiente

### 16.1 `.env.example`

```bash
# App
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3001
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/quita

# Auth
JWT_SECRET=change-me
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d
JWT_REFRESH_SECRET=change-me-too

# CORS
CORS_ORIGINS=http://localhost:3000

# Redis (Upstash em prod)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# BullMQ Board
BULLBOARD_USER=admin
BULLBOARD_PASSWORD=change-me

# Sentry
SENTRY_DSN=
SENTRY_ENVIRONMENT=development

# BCB SGS (sem credencial — API pública)
BCB_SGS_BASE_URL=https://api.bcb.gov.br/dados/serie
```

### 16.2 Validação de env vars (boot fail-fast)

```typescript
// config/validation.schema.ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  // ... etc
});

// app.module.ts
ConfigModule.forRoot({
  validate: (config) => envSchema.parse(config),
  isGlobal: true,
});
```

App falha no boot se faltarem variáveis — melhor que erro silencioso em runtime.

### 16.3 Diferenças dev/staging/prod

| Var | dev | staging | prod |
|---|---|---|---|
| `LOG_LEVEL` | `debug` | `info` | `info` |
| `SENTRY_DSN` | vazio | preenchido | preenchido |
| `REDIS_TLS` | `false` | `true` (Upstash) | `true` |
| `CORS_ORIGINS` | localhost:3000 | staging URL | prod URL |
| `tracesSampleRate` Sentry | 1.0 | 0.5 | 0.1 |
| Swagger habilitado | sim | sim | **não** |

---

## 17. Deploy

### 17.1 Topologia

| Componente | Provedor | Plano |
|---|---|---|
| Web (Next.js) | Vercel | Hobby → Pro quando passar quota |
| API (NestJS) | **Railway** ou **Fly.io** (sugestão) | Hobby → Pro |
| Database | Supabase | Free → Pro (~R$ 130/mês a partir de 500 usuários) |
| Storage (futuro OCR) | Supabase Storage | incluso no plano DB |
| Redis | **Upstash** | Pay-per-use, free tier 10k/dia |
| Logs/erros | Sentry | Free 5k events/mês |

### 17.2 Por que Railway/Fly.io para API e não Vercel

Vercel Serverless Functions têm:
- Timeout de 10s no Hobby, 60s no Pro — incompatível com workers BullMQ
- Workers BullMQ precisam de processo long-running, não funções stateless

Railway e Fly.io oferecem **containers persistentes**, BullMQ workers podem rodar continuamente. Custo similar ao Vercel Pro.

**Decisão recomendada:** Railway (mais simples, deploy via GitHub) para o MVP.

### 17.3 GitHub Actions de CI/CD

```yaml
# .github/workflows/api-ci.yml (esqueleto)
name: API CI
on:
  push:
    paths: ['apps/api/**', 'packages/**']

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        ports: [5432:5432]
      redis:
        image: redis:7
        ports: [6379:6379]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm install
      - run: pnpm --filter @quita/api typecheck
      - run: pnpm --filter @quita/api lint
      - run: pnpm --filter @quita/api test
      - run: pnpm --filter @quita/api test:e2e
```

---

## 18. Riscos e contingências

| Cenário | Probabilidade | Comportamento esperado | Mitigação |
|---|---|---|---|
| BullMQ worker cai | Média | Jobs ficam em fila; volta a processar quando worker sobe | Health check + auto-restart no Railway/Fly |
| Redis indisponível (Upstash incidente) | Baixa | Sem cache, sem fila — apenas leituras síncronas funcionam | Plano antigo permanece válido; recálculo sob demanda quando Redis volta |
| Supabase indisponível | Baixa | API inteira fora do ar | Status page + Sentry alert; SLA da Supabase |
| BCB SGS fora do ar (cron mensal) | Baixa | `InterestRateReference` não atualiza no mês | Job retenta no dia seguinte; dados antigos permanecem |
| OpenAI Vision indisponível (Premium OCR — futuro) | Média | Usuário não consegue fazer OCR | Fallback: formulário manual; mensagem no app |
| Vazamento de cookie httpOnly | Muito baixa | Token comprometido | TTL curto (15min) + refresh; rotação manual de `JWT_SECRET` |
| Lentidão de queries Prisma | Média | Operações arrastam, timeout em transactions | Índices da Fase 2 §7; monitorar p95 |
| Pico de jobs (10k cadastros simultâneos) | Baixa | Fila enche, processamento atrasado | Scaling de workers (Railway permite horizontal scale) |

---

## 19. Próximos passos

**Bridge entre Fase 4 e Fase 5 — Spec do OCR Premium.**
Antes da Fase 5, criar documento `FASE_4_5_BRIDGE_OCR_PREMIUM.md`:
- Provider: OpenAI Vision API
- Storage: Supabase Storage com auto-delete 30 dias
- Quota: Free 0/mês, Premium 5/mês (campo `usedOcr: boolean` em `SettlementEvaluation`)
- LGPD: consentimento específico via `ConsentLog` antes do primeiro upload
- Endpoint: `POST /settlements/validate-from-image` (Premium only)

**Fase 5 — Fluxo de telas (web first).**
- Wireframes em texto + estrutura de cada nova tela em `apps/web`
- Como pedir informações pesadas de forma leve (refinamento progressivo)
- Estados de loading, erro, empty
- Copy final em PT-BR
- Plano de beta privado com 10-20 pessoas endividadas reais

**Fase 6 — Plano de migração do código atual.**
- O que migrar primeiro (estrutura de pastas → módulos → repositórios → controllers)
- Ordem de aplicação das 12 migrations
- Estratégia de feature flags se necessário
- Preservação dos dados de testers (se houver)

---

*Fim do documento da Fase 4.*
