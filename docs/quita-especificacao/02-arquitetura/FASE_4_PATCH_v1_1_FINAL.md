# Fase 4 v1.1 — Patch Final (§20)

> **Anexar ao final do documento:** `FASE_4_ARQUITETURA_TECNICA.md`, antes da seção 19 ("Próximos passos")
> **Versão:** v1.1
> **Data:** 16 de maio de 2026
> **Origem:** ciclo adversarial completo (devils-advocate v1 + respostas + decisões @product)
> **Confirmações @product:** C1 (refresh token stateful) ✅, C2 (`/api/v1/`) ✅

---

## 20. Patch v1.1 — Refinamentos pós-ciclo adversarial

Resolução completa dos 4 bloqueadores + 7 altos + 4 médios detectados pelo devils-advocate. Esta seção é normativa: o que está aqui prevalece sobre as definições anteriores quando há conflito.

---

### 20.1 Adapter HTTP — Express (BL-1)

NestJS usa **Express adapter** (default). Justificativa: cookie-parser maduro, compatibilidade total com middlewares Express, performance suficiente para a escala prevista do MVP.

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); // Express adapter (default)

  app.use(cookieParser());
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    hsts: { maxAge: 31_536_000, includeSubDomains: true },
  }));

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'admin/queues/(.*)', method: RequestMethod.ALL },
    ],
  });

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // ... swagger, sentry, BullBoard etc.

  await app.listen(process.env.PORT ?? 3001);
}
```

**Migração futura para Fastify:** se um dia for necessário (escala > 10k req/s), o `NestFactory.create(AppModule, new FastifyAdapter())` resolve a maior parte. A sintaxe de cookies muda — abstraída no `AuthController`.

---

### 20.2 Refresh token stateful (BL-2) — DECISÃO C1

#### 20.2.1 Schema novo

```prisma
model RefreshToken {
  id            String    @id @default(uuid()) @db.Uuid
  userId        String    @map("user_id") @db.Uuid
  tokenHash     String    @unique @map("token_hash") @db.VarChar(255)
  expiresAt     DateTime  @map("expires_at")
  revokedAt     DateTime? @map("revoked_at")
  revokedReason String?   @map("revoked_reason") @db.VarChar(100)
  userAgent     String?   @map("user_agent") @db.VarChar(500)
  ipAddress     String?   @map("ip_address") @db.VarChar(45)
  createdAt     DateTime  @default(now()) @map("created_at")
  lastUsedAt    DateTime? @map("last_used_at")

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, revokedAt])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

// User ganha a relação:
model User {
  // ... campos existentes ...
  refreshTokens RefreshToken[]
}
```

#### 20.2.2 Política operacional

| Evento | Comportamento |
|---|---|
| Login | Gera token random 64 bytes; armazena `bcrypt(token)` em DB; define cookie httpOnly |
| Refresh | Valida hash + `expiresAt` + `revokedAt IS NULL`; cria novo token; marca antigo como revogado; rotação obrigatória |
| Logout único | `UPDATE refresh_tokens SET revoked_at = NOW(), revoked_reason = 'user_logout' WHERE token_hash = ?` |
| Logout global | `UPDATE refresh_tokens SET revoked_at = NOW(), revoked_reason = 'logout_all_devices' WHERE user_id = ? AND revoked_at IS NULL` |
| Trocar senha | `UPDATE refresh_tokens SET revoked_at = NOW(), revoked_reason = 'password_changed' WHERE user_id = ? AND revoked_at IS NULL` |
| TTL | 7 dias (`expiresAt = now + 7 days`) |
| Cleanup | Job diário 05:00 UTC deleta `expiresAt < now - 30 dias` |

#### 20.2.3 `AuthService` (esqueleto)

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly refreshRepo: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, meta: { userAgent?: string; ipAddress?: string }) {
    const user = await this.validateCredentials(dto.email, dto.password);
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id, meta);
    return { user, accessToken, refreshToken };
  }

  async refresh(rawToken: string, meta: { userAgent?: string; ipAddress?: string }) {
    const record = await this.findActiveRefreshToken(rawToken);
    if (!record) throw new UnauthorizedException('invalid_refresh_token');

    // Rotação: invalida antigo, cria novo
    await this.refreshRepo.revoke(record.id, 'rotated');
    const accessToken = await this.signAccessToken(record.user);
    const refreshToken = await this.issueRefreshToken(record.userId, meta);
    return { accessToken, refreshToken };
  }

  async logout(rawToken: string) {
    const record = await this.findActiveRefreshToken(rawToken);
    if (record) await this.refreshRepo.revoke(record.id, 'user_logout');
  }

  async logoutAllDevices(userId: string) {
    await this.refreshRepo.revokeAllForUser(userId, 'logout_all_devices');
  }

  private async issueRefreshToken(userId: string, meta) {
    const rawToken = randomBytes(64).toString('base64url');
    const tokenHash = await bcrypt.hash(rawToken, 10);
    await this.refreshRepo.create({
      userId,
      tokenHash,
      expiresAt: addDays(new Date(), 7),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });
    return rawToken;
  }

  private async findActiveRefreshToken(rawToken: string): Promise<RefreshTokenWithUser | null> {
    // bcrypt não permite busca direta — buscar candidates por TTL e comparar
    // Otimização: index por expiresAt + revokedAt
    const candidates = await this.refreshRepo.listActiveCandidates();
    for (const candidate of candidates) {
      if (await bcrypt.compare(rawToken, candidate.tokenHash)) {
        return candidate;
      }
    }
    return null;
  }
}
```

**Nota sobre performance:** `findActiveRefreshToken` faz N comparações `bcrypt`. Em escala, considerar HMAC determinístico (chave secreta como salt fixo) para permitir lookup direto por hash. Para o MVP, bcrypt é suficiente — total de tokens ativos < 5000 esperado.

#### 20.2.4 Job de cleanup

```typescript
// queues/processors/refresh-token-cleanup.processor.ts
@Processor('motor-scheduled')
export class RefreshTokenCleanupProcessor extends BaseProcessor {
  async handle(job: Job): Promise<any> {
    const cutoff = subDays(new Date(), 30);
    const deleted = await this.refreshRepo.deleteExpiredBefore(cutoff);
    this.logger.info({ deleted, cutoff }, 'refresh_tokens.cleanup.done');
    return { deleted };
  }
}
```

Cron diário 05:00 UTC.

---

### 20.3 Idempotência por processor (BL-3)

Check-list explícito de comportamento em caso de retry de cada processor.

| Processor | Idempotente naturalmente? | Estratégia |
|---|---|---|
| `RecalculateStateProcessor` | ✅ Sim | `generate()` envolve tudo em `prisma.$transaction`; falha → rollback |
| `MonthlyRolloverProcessor` | ✅ Sim | SELECT determinístico + enfileira recálculos (com `groupId`); duplicação evitada pelo BullMQ |
| `DataFreshnessReviewProcessor` | ✅ Sim | Gera ações `review`; `cycleNumber` previne duplicatas via `matchAction` |
| `DataRetentionCleanupProcessor` | ✅ Sim | DELETE com WHERE — idempotente por natureza |
| `SettlementRevalidationProcessor` | 🟠 Precisa de tx | Cria nova evaluation + invalida antiga — DEVE ser atômico |
| `LongTermPlanGenerationProcessor` | 🟠 Precisa de tx | DELETE TimelineItem + CREATE many — DEVE ser atômico |
| `InterestRateUpdateProcessor` | ✅ Sim | `upsert` por chave composta `(slug, effectiveDate)` |
| `RecalculateAllScoresProcessor` | 🟠 Precisa de tx | Múltiplos UPDATEs — DEVE ser atômico para consistência |
| `RefreshTokenCleanupProcessor` | ✅ Sim | DELETE com WHERE expirado |

#### 20.3.1 Implementação dos 3 processors que precisam de transaction

```typescript
// settlement-revalidation.processor.ts
@Injectable()
@Processor('motor-recalc', { concurrency: 20, group: { concurrency: 1 } })
export class SettlementRevalidationProcessor extends BaseProcessor {
  async handle(job: Job): Promise<any> {
    return await this.txRunner.run(async (tx) => {
      const evaluation = await this.settlementRepo.getById(job.data.evaluationId, tx);
      if (!evaluation || evaluation.invalidatedAt) return { skipped: true };

      const newResult = await this.validator.validate(
        this.toValidatorInput(evaluation),
        tx,
      );

      if (newResult.recommendation === evaluation.recommendation) {
        return { unchanged: true };
      }

      await this.settlementRepo.markInvalidated(
        evaluation.id,
        'capacity_changed_>20%',
        tx,
      );
      // Nova evaluation criada pelo validator dentro da mesma tx
      return newResult;
    });
  }
}
```

```typescript
// long-term-plan-generation.processor.ts
@Injectable()
@Processor('motor-scheduled', { concurrency: 5 })
export class LongTermPlanGenerationProcessor extends BaseProcessor {
  async handle(job: Job): Promise<any> {
    return await this.txRunner.run(async (tx) => {
      return await this.longTermService.generate(job.data.userId, tx);
    });
  }
}
```

```typescript
// recalculate-all-scores.processor.ts
@Injectable()
@Processor('motor-scheduled', { concurrency: 5 })
export class RecalculateAllScoresProcessor extends BaseProcessor {
  async handle(job: Job): Promise<any> {
    return await this.txRunner.run(async (tx) => {
      const debts = await this.debtRepo.listAllActive(tx);
      for (const debt of debts) {
        const score = await this.priorityEngine.calculate(
          { debt, /* outros params */ },
          tx,
        );
        await this.debtRepo.updateScore(debt.id, score.score, score.reason, tx);
      }
      return { count: debts.length };
    }, { timeout: 60_000 });
  }
}
```

---

### 20.4 Queues separadas (BL-4)

```typescript
// queues/queue.module.ts
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'motor-recalc' },
      { name: 'motor-scheduled' },
    ),
  ],
  providers: [
    RecalculateStateProcessor,         // motor-recalc
    SettlementRevalidationProcessor,    // motor-recalc
    MonthlyRolloverProcessor,           // motor-scheduled
    DataFreshnessReviewProcessor,       // motor-scheduled
    DataRetentionCleanupProcessor,      // motor-scheduled
    LongTermPlanGenerationProcessor,    // motor-scheduled
    InterestRateUpdateProcessor,        // motor-scheduled
    RecalculateAllScoresProcessor,      // motor-scheduled
    RefreshTokenCleanupProcessor,       // motor-scheduled
  ],
})
export class QueueModule {}
```

| Queue | Concurrency | Group | Quem usa |
|---|---|---|---|
| `motor-recalc` | 20 | 1 (por `groupId: userId`) | `RecalculateState`, `SettlementRevalidation` |
| `motor-scheduled` | 5 | — | Crons + jobs de sistema |

---

### 20.5 Health check com `@nestjs/terminus` (A-1)

```typescript
// modules/health/health.module.ts
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule, PrismaModule, RedisModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}

// modules/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private redisIndicator: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @Public()
  readiness() {
    return this.health.check([
      () => this.prismaIndicator.pingCheck('database'),
      () => this.redisIndicator.pingCheck('redis'),
    ]);
  }

  @Get('live')
  @Public()
  liveness() {
    return { status: 'ok', uptime: process.uptime() };
  }
}
```

`/health/live` é instantâneo (apenas confirma processo vivo). `/health` testa DB + Redis. Railway/Fly configuram health check apontando para `/health/live` (mais barato).

---

### 20.6 Migration runner pre-deploy (A-2)

```json
// package.json (apps/api)
"scripts": {
  "build": "nest build",
  "start:prod": "node dist/main.js",
  "db:migrate:deploy": "prisma migrate deploy",
  "db:seed:references": "ts-node packages/database/seeds/seed-references.ts",
  "deploy:start": "pnpm db:migrate:deploy && pnpm db:seed:references && pnpm start:prod"
}
```

Railway `Start Command`: `pnpm deploy:start`.

`seed-references.ts` faz upsert apenas das tabelas de referência (DebtCategory, ScoringWeight, RegionalMinimumVital, SupportChannel). NÃO toca dados de usuário, NÃO popula InterestRateReference (vem do cron BCB SGS).

---

### 20.7 Rate limiting per user-id (A-3)

```typescript
// common/guards/throttler-per-user.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerPerUserGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id ?? req.ip;
  }
}

// app.module.ts
providers: [
  {
    provide: APP_GUARD,
    useClass: ThrottlerPerUserGuard,
  },
],
```

Para autenticados: limite por `user.id`. Para anônimos: limite por IP.

---

### 20.8 Decimal.js — tarefa pós-MVP (A-4)

**Decisão:** NÃO entra no MVP. Saldos típicos < R$ 100k → erro de precisão `Number()` < R$ 0,01 em cálculos compostos, desprezível.

Registrado como tarefa pós-MVP em `BACKLOG_POS_MVP.md`:

```markdown
## Tarefa: Migrar cálculos monetários para decimal.js

**Por quê:** precisão financeira em escalas grandes ou cálculos compostos longos.

**Onde aplicar:**
- `priority-engine.service.ts` — fatores de score
- `simulator.service.ts` — `simulateScenario` (iterativo, acumula erro)
- `financial-state-detector.service.ts` — cálculos de capacidade

**Conversão `Decimal → number` permitida apenas na borda de saída** (UI/JSON).

**Estimativa:** 8h de refactoring + testes de regressão.

**Quando fazer:** após primeira escala (> 1k usuários ativos) ou primeiro relato de
divergência de centavos em planos.
```

---

### 20.9 Segredos via Railway env vars (A-5)

- Railway Settings → Variables
- `JWT_SECRET` e `JWT_REFRESH_SECRET` gerados com `openssl rand -base64 48`
- Rotação a cada 6 meses documentada em `RUNBOOK.md`
- Em incidente de vazamento: rotação imediata + `logoutAllDevices` em massa (job manual)

Para escalas maiores ou compliance externo: avaliar Doppler/Infisical. Fora do MVP.

---

### 20.10 `OnboardingCompletedListener` com prioridade alta (A-6)

```typescript
// events/listeners/onboarding-completed.listener.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { startOfMonth } from 'date-fns';

@Injectable()
export class OnboardingCompletedListener {
  constructor(@InjectQueue('motor-recalc') private readonly motorQueue: Queue) {}

  @OnEvent('onboarding.completed')
  async handle(payload: { userId: string }) {
    await this.motorQueue.add(
      'recalculate-state-and-plan',
      {
        userId: payload.userId,
        referenceMonth: startOfMonth(new Date()).toISOString(),
        triggerEvent: 'onboarding_completed',
        triggeredAt: new Date().toISOString(),
      },
      {
        groupId: payload.userId,
        priority: 1, // alta — UX crítica
      },
    );
  }
}
```

**Prioridade 1** garante que o job pula a fila se houver outros pendentes para o mesmo usuário ou na queue geral. O usuário acabou de terminar o onboarding e está esperando ver o Espelho.

---

### 20.11 Versionamento `/api/v1/` (A-7) — DECISÃO C2

```typescript
// main.ts
app.setGlobalPrefix('api/v1', {
  exclude: [
    { path: 'health', method: RequestMethod.GET },
    { path: 'health/live', method: RequestMethod.GET },
    { path: 'admin/queues/(.*)', method: RequestMethod.ALL }, // BullBoard
  ],
});
```

Endpoints versionados desde dia 1. Health checks e admin ficam fora do versionamento (internos).

Quando precisar de breaking changes no futuro: criar `/api/v2/` rodando paralelo, manter `/api/v1/` por X meses para clientes antigos (mobile).

---

### 20.12 Convenções operacionais (M-1, M-2)

Documentadas no `CONTRIBUTING.md` (arquivo a ser criado na raiz do repo):

```markdown
# Convenções do Quita

## Transações Prisma

**Regra:** services que orquestram múltiplas operações de write SEMPRE chamam
repositories passando o `tx` da transaction atual.

✅ Correto:
```typescript
async generate(ctx) {
  return this.txRunner.run(async (tx) => {
    const detector = await this.detector.detect(ctx, tx); // tx propagado
    await this.planRepo.upsert({...}, tx);                // tx propagado
  });
}
```

❌ Errado:
```typescript
async generate(ctx) {
  return this.txRunner.run(async (tx) => {
    const detector = await this.detector.detect(ctx); // ESQUECEU tx
    await this.planRepo.upsert({...}, tx);
  });
}
```

Code review obrigatório verifica isso.

## Logs e Transações

Dentro de transactions, use `logger.debug`. Após o commit (no service que chama
txRunner), use `logger.info`.

Razão: se a transaction faz rollback, logs `info` ficariam descrevendo eventos
que nunca aconteceram.

✅ Correto:
```typescript
async generate(ctx) {
  const result = await this.txRunner.run(async (tx) => {
    this.logger.debug({...}, 'plan.generating');  // debug dentro da tx
    return await this.planRepo.upsert({...}, tx);
  });
  this.logger.info({ planId: result.id }, 'plan.generated');  // info após commit
  return result;
}
```
```

---

### 20.13 Pool de conexões + helmet (M-3, M-4)

**Pool Prisma:**
```bash
DATABASE_URL=postgresql://...?connection_limit=20&pool_timeout=10
```

20 conexões por instância de API. Supabase Free permite 60 simultâneas → 20 é seguro com margem para worker BullMQ e cron jobs.

**Helmet:** já incluído em §20.1 (main.ts).

---

### 20.14 Atualização ao §7 (Jobs)

Tabela de jobs atualizada:

| Job | Queue | Disparo |
|---|---|---|
| `RecalculateStateAndPlanJob` | `motor-recalc` | Eventos CRUD; `onboarding.completed` (priority 1) |
| `SettlementRevalidationJob` | `motor-recalc` | Evento `state.detected` com `capacityDelta > 20%` |
| `MonthlyRolloverJob` | `motor-scheduled` | Cron diário 02:00 UTC |
| `DataFreshnessReviewJob` | `motor-scheduled` | Cron semanal domingo 03:00 UTC |
| `DataRetentionCleanupJob` | `motor-scheduled` | Cron diário 04:00 UTC |
| `RefreshTokenCleanupJob` | `motor-scheduled` | Cron diário 05:00 UTC |
| `InterestRateUpdateJob` | `motor-scheduled` | Cron mensal dia 1º 05:00 UTC |
| `LongTermPlanGenerationJob` | `motor-scheduled` | Junto com `MonthlyRollover` ou sob demanda |
| `RecalculateAllScoresJob` | `motor-scheduled` | Manual após mudança de `ScoringWeight` |

---

### 20.15 Atualização ao §15 (Stack)

Pacotes novos:

| Pacote | Versão alvo | Razão |
|---|---|---|
| `@nestjs/terminus` | ^11.x | Health check (A-1) |
| `crypto` (Node.js builtin) | — | `randomBytes` para refresh token |
| `decimal.js` | ^10.x | (registrado como pós-MVP, A-4) |

Demais permanecem como definidos no §15 original.

---

### 20.16 Migration 13 (nova)

```
13. 20260613_add_refresh_token
    - CREATE TABLE refresh_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP,
        revoked_reason VARCHAR(100),
        user_agent VARCHAR(500),
        ip_address VARCHAR(45),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_used_at TIMESTAMP
      )
    - CREATE INDEX idx_refresh_tokens_user_id_revoked_at ON refresh_tokens(user_id, revoked_at)
    - CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)
```

**Total acumulado de migrations: 13.**

---

### 20.17 Resumo do impacto do patch v1.1

| Categoria | Total |
|---|---|
| Adapter HTTP escolhido | Express |
| Refresh token strategy | Stateful (tabela `RefreshToken`) |
| Processors com transaction explícita | 3 dos 9 (`SettlementRevalidation`, `LongTermPlanGeneration`, `RecalculateAllScores`) |
| Queues | de 1 para 2 (`motor-recalc` + `motor-scheduled`) |
| Health check endpoints | 2 (`/health`, `/health/live`) |
| Listeners novos | 1 (`OnboardingCompletedListener`) |
| Jobs novos | 1 (`RefreshTokenCleanupJob`) |
| Migrations | 13 (era 12) |
| Pacotes novos no stack | 1 (`@nestjs/terminus`) — `decimal.js` registrado mas não incluso |
| Bloqueadores resolvidos | 4 de 4 |
| Altos resolvidos | 7 de 7 |
| Médios resolvidos | 4 de 4 |
| Versionamento de API | `/api/v1/` desde dia 1 |
| Convenções operacionais | CONTRIBUTING.md (a criar) |

---

*Fim do Patch v1.1.*

---

## Anexo — Atualização da Fase 2 (mini-patch v2.3)

Para refletir a nova tabela introduzida pelo patch v1.1 da Fase 4:

**Adicionar modelo `RefreshToken`** ao `schema.prisma` (§20.2.1 acima).

**Adicionar relação `refreshTokens` ao `User`:**

```prisma
model User {
  // ... campos existentes ...
  refreshTokens RefreshToken[]
}
```

**Atualização do total de tabelas:** de 24 para **25**.

**Migration 13** adicionada à série.

*Fim do anexo.*
