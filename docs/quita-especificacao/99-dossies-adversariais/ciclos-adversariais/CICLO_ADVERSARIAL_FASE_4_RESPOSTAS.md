# Ciclo Adversarial Fase 4 — Respostas + Patch v1.1

> **Resposta ao:** `DEVILS_ADVOCATE_FASE_4.md`
> **Data:** 16 de maio de 2026
> **Status:** 6 decisões @claude-arquiteto tomadas; 2 confirmações @product pendentes
> **Output:** este documento contém respostas E o patch v1.1 a aplicar na Fase 4

---

## Sumário executivo

Das 7 perguntas do interrogatório:
- **6 decididas por @claude-arquiteto** com fundamentação (P1, P3, P4, P5, P6 — mais P2 técnico-parcial)
- **2 confirmações pendentes** do @product (P2-LGPD e P7 versionamento)

A §20 do patch consolida tudo em formato pronto para colar na Fase 4.

---

## P1 — @claude-arquiteto: Express vs Fastify (BL-1)

### Decisão: **Express**

### Fundamentação

| Critério | Express | Fastify | Decisão |
|---|---|---|---|
| Default do NestJS | ✅ | precisa configurar | Express |
| `cookie-parser` (cookies httpOnly) | maduro, sem fricção | requer `@fastify/cookie` | Express |
| Documentação NestJS | exemplos default | tem section dedicada mas menos comum | Express |
| Ecossistema de middlewares | 100% compatibilidade | maioria precisa adapter | Express |
| Performance bruta | ~30k req/s | ~50k req/s | Empate para nossa escala |
| Necessário para MVP? | Sim, suficiente | Excessivo | Express |

**Carga esperada do MVP:** dezenas a centenas de requests/min nos primeiros meses. Fastify só compensa em > 10k req/s — fora do horizonte. Trocar depois é abstraído pelo NestJS.

### Ajustes no documento

§10.1 (auth.controller.ts) e demais exemplos com `@Res({ passthrough: true })` permanecem como estão — sintaxe Express. Adicionar nota explícita no §16:

```typescript
// main.ts
const app = await NestFactory.create(AppModule); // Express adapter (default)
app.use(cookieParser());
```

---

## P2 — @claude-arquiteto + @product (PARCIALMENTE PENDENTE): Refresh token (BL-2)

### Decisão técnica: **Stateful** com tabela `RefreshToken`

### Fundamentação

App de **dados financeiros sensíveis** + LGPD = necessidade real de:
- Revogação efetiva (não esperar TTL de 7 dias)
- "Sair de outros dispositivos" (segurança)
- Invalidação em massa quando trocar senha
- Auditoria de sessões

JWT puro (stateless) não permite nada disso. Custo do stateful: 1 tabela + 1 migration + ~20 linhas de código extra no `AuthService`. Vale.

### Schema novo

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
```

### Política

- **Geração:** ao login, gera token random 64 bytes; armazena `bcrypt(token)` no DB
- **Validade:** 7 dias
- **Rotação:** cada `POST /auth/refresh` cria novo token, marca antigo como `revoked`
- **Logout único:** marca atual `revokedAt = now()`, `revokedReason = 'user_logout'`
- **Logout global:** marca todos do `userId` como revogados; usado em "sair de todos os dispositivos"
- **Trocar senha:** marca todos do `userId` como revogados, `revokedReason = 'password_changed'`
- **Cleanup:** job `RefreshTokenCleanupJob` (cron diário 05:00 UTC) deleta tokens com `expiresAt < now - 30 dias`

### Migration

Migration **13** (após 11 e 12 já registradas):

```
13. 20260613_add_refresh_token
    - CREATE TABLE refresh_tokens (...)
    - CREATE INDEX idx_refresh_tokens_user_id_revoked_at
    - CREATE INDEX idx_refresh_tokens_expires_at
```

### Pendência @product

**Decidir:** OK com stateful + tabela `RefreshToken`? Custo adicional já contabilizado (1 tabela, +20 linhas no auth, +1 cron). Recomendação técnica é clara: **sim**.

---

## P3 — @claude-arquiteto: Idempotência por processor (BL-3)

### Decisão

Adicionar §7.x "Idempotência por processor" na Fase 4 com check-list explícito.

### Check-list

| Processor | Estratégia de idempotência | Status |
|---|---|---|
| `RecalculateStateProcessor` | Já protegido — `generate()` envolve tudo em `prisma.$transaction` (§20.2 da Fase 3 v1.1). Retry seguro: rollback automático em falha. | ✅ Pronto |
| `MonthlyRolloverProcessor` | Identifica usuários com `nextReviewDate <= hoje` e enfileira `RecalculateStateJob` para cada. Idempotência via groupId + upsert no plano. | ✅ Pronto |
| `DataFreshnessReviewProcessor` | Gera ações `review` com `cycleNumber` correto via `determineCycleNumber`. Conflito de `RecommendedAction.unique` previne duplicatas. | ✅ Pronto |
| `DataRetentionCleanupProcessor` | `DELETE WHERE updated_at < cutoff` — idempotente por natureza (retry deleta o que ficou). | ✅ Pronto |
| `SettlementRevalidationProcessor` | **Risco:** pode criar `SettlementEvaluation` duplicada se retentar entre create e marcar antiga como `invalidatedAt`. **Solução:** envolver em `prisma.$transaction`. | 🟠 Patch |
| `LongTermPlanGenerationProcessor` | **Risco:** faz `DELETE PlanTimelineItem + CREATE many`. Retry entre os 2 passos perde estado. **Solução:** envolver em `prisma.$transaction`. | 🟠 Patch |
| `InterestRateUpdateProcessor` | `prisma.interestRateReference.upsert({ where: { debtCategorySlug_effectiveDate } })` — idempotente por chave composta. | ✅ Pronto |
| `RecalculateAllScoresProcessor` | `UPDATE Debt SET priorityScore = ...` — cálculo determinístico, idempotente. Mas envolver em transaction para consistência entre múltiplos updates. | 🟠 Patch |

### Implementação dos 3 processors que precisam de transaction

```typescript
// settlement-revalidation.processor.ts
async handle(job: Job): Promise<any> {
  return await this.txRunner.run(async (tx) => {
    const evaluation = await this.settlementRepo.getById(job.data.evaluationId, tx);
    if (!evaluation || evaluation.invalidatedAt) return { skipped: true };

    const newResult = await this.validator.validate({ ...evaluation }, tx);
    if (newResult.recommendation === evaluation.recommendation) return { unchanged: true };

    await this.settlementRepo.markInvalidated(evaluation.id, 'capacity_changed_>20%', tx);
    // Novo registro criado dentro do mesmo escopo
    return newResult;
  });
}
```

```typescript
// long-term-plan-generation.processor.ts
async handle(job: Job): Promise<any> {
  return await this.txRunner.run(async (tx) => {
    const plan = await this.longTermService.generate(job.data.userId, tx);
    return plan;
  });
}
```

```typescript
// recalculate-all-scores.processor.ts
async handle(job: Job): Promise<any> {
  return await this.txRunner.run(async (tx) => {
    const debts = await this.debtRepo.listAllActive(tx);
    for (const debt of debts) {
      const score = await this.priorityEngine.calculate({ debt, /* ... */ }, tx);
      await this.debtRepo.updateScore(debt.id, score.score, score.reason, tx);
    }
    return { count: debts.length };
  }, { timeout: 60_000 }); // mais tempo — pode ser muitas dívidas
}
```

---

## P4 — @claude-arquiteto: Queues separadas (BL-4)

### Decisão

**2 queues:**

| Queue | concurrency | group concurrency | Uso |
|---|---|---|---|
| `motor-recalc` | 20 | 1 (por `groupId: userId`) | Recálculos de usuário (todos com `groupId`) |
| `motor-scheduled` | 5 | n/a | Crons (`monthly-rollover`, `data-freshness-review`, `data-retention-cleanup`, `interest-rate-update`) + jobs de sistema (`recalculate-all-scores`, `refresh-token-cleanup`) |

### Por que 2 e não 3

Originalmente cogitei 3 queues (recalc, scheduled, system) mas:
- Crons e jobs de sistema têm perfil similar: rodam ocasionalmente, sem urgência, sem groupId
- 5 slots em `motor-scheduled` é suficiente — nunca há > 3 crons concorrentes na prática
- Menos queues = menos complexidade

### Ajustes em código

```typescript
// queues/queue.module.ts
BullModule.registerQueue({
  name: 'motor-recalc',
}),
BullModule.registerQueue({
  name: 'motor-scheduled',
}),
```

```typescript
// queues/processors/recalculate-state.processor.ts
@Processor('motor-recalc', { concurrency: 20, group: { concurrency: 1 } })

// queues/processors/monthly-rollover.processor.ts
@Processor('motor-scheduled', { concurrency: 5 })

// ... etc
```

### Enfileiramento

Listeners de evento (CRUDs) → `motor-recalc` (com `groupId`)
Crons (`onModuleInit`) → `motor-scheduled` (sem `groupId`)

`MonthlyRolloverProcessor` (que enfileira recálculos individuais) → roda em `motor-scheduled`, mas o que ele enfileira (`RecalculateStateJob` para cada usuário) vai para `motor-recalc` com `groupId: userId`.

---

## P5 — @claude-arquiteto: 7 altos resolvidos (A-1 a A-7)

### A-1 — Health check com `@nestjs/terminus`

```typescript
// modules/health/health.module.ts
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule, PrismaModule],
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

Endpoints `/health` (readiness, com checks) e `/health/live` (liveness, instantâneo). Railway/Fly configuram health check apontando para `/health/live` (mais barato) e checagem completa via `/health`.

### A-2 — Migration runner pre-deploy

```bash
# Railway / Fly.io — comando de start ou release phase
pnpm prisma migrate deploy && pnpm db:seed:references && pnpm start:prod
```

`db:seed:references` é seed idempotente, só upsert de tabelas de referência (DebtCategory, ScoringWeight, RegionalMinimumVital, SupportChannel). NÃO popula `InterestRateReference` (vem do cron BCB SGS).

```json
// package.json
"scripts": {
  "db:seed:references": "ts-node packages/database/seeds/seed-references.ts",
  "db:seed:dev": "ts-node packages/database/seeds/seed-dev.ts"
}
```

### A-3 — Rate limiting por user-id

```typescript
// common/guards/throttler-per-user.guard.ts
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerPerUserGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id ?? req.ip;
  }
}

// app.module.ts
{
  provide: APP_GUARD,
  useClass: ThrottlerPerUserGuard,
}
```

Para usuários autenticados: limite por `user.id`. Para anônimos (login, register): limite por IP.

### A-4 — `Decimal.js` no motor: registrar como tarefa v1.1

**Decisão:** NÃO entra no MVP.

Justificativa: saldos típicos do MVP < R$ 100k, erro de precisão `Number()` é desprezível (< R$ 0,01 em cálculos compostos). Migração para `decimal.js` é refactoring grande sem ganho imediato.

Registrar como tarefa pós-MVP:

```markdown
## Tarefa pós-MVP
- Migrar cálculos monetários do motor para `decimal.js`
- Pontos de conversão `Decimal → number` mapeados em §X
- Risco mitigado por testes de precisão (snapshot de cálculos conhecidos)
```

### A-5 — Segredos em produção

**Decisão:** Railway env vars + rotação documentada.

- Segredos vivem em Railway Settings → Variables
- `JWT_SECRET` rotacionado a cada 6 meses (documentado em `RUNBOOK.md`)
- Em incidente de vazamento: rotação imediata + invalidação de todos refresh tokens (job manual)

Para escalas maiores (> 5k usuários ou compliance externo): considerar Doppler ou Infisical. Não MVP.

### A-6 — `OnboardingCompletedListener`

```typescript
// events/listeners/onboarding-completed.listener.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { startOfMonth } from 'date-fns';

@Injectable()
export class OnboardingCompletedListener {
  constructor(
    @InjectQueue('motor-recalc') private readonly motorQueue: Queue,
  ) {}

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
        priority: 1, // mais alta — UX crítica (usuário esperando o Espelho)
      },
    );
  }
}
```

**Prioridade 1** garante que esse job pula a fila se houver outros recálculos pendentes.

### A-7 — `/api/v1/` global prefix

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

Endpoints versionados desde dia 1. Health e admin ficam fora do versionamento (são internos).

---

## P6 — @claude-arquiteto: 4 médios resolvidos (M-1 a M-4)

### M-1 — Padrão de `tx` via convenção (não ESLint custom)

ESLint custom rule é custoso. Substituir por convenção documentada:

```markdown
# CONTRIBUTING.md — Seção "Transações"

## Quando passar `tx`

REGRA: services que orquestram múltiplas operações de write SEMPRE chamam
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

Code review obrigatório verifica isso. Em runtime, vazamento de tx aparece
como inconsistência detectável por testes integrados.
```

### M-2 — Convenção de log dentro de transaction

```typescript
// Dentro de transaction:
this.logger.debug({ /* ... */ }, 'event'); // debug

// Depois de commit (no service que chama txRunner):
this.logger.info({ /* ... */ }, 'event');  // info
```

Documentado no CONTRIBUTING.md.

### M-3 — Connection pool Prisma

Ajustar `DATABASE_URL` em prod:

```bash
DATABASE_URL=postgresql://...?connection_limit=20&pool_timeout=10
```

20 conexões por instância de API. Supabase Free permite até 60 simultâneas — 20 é seguro para 1 instância + retomada de jobs.

### M-4 — `helmet()` no main.ts

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  hsts: {
    maxAge: 31_536_000, // 1 ano
    includeSubDomains: true,
  },
}));
```

Headers de segurança críticos: `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-XSS-Protection`.

---

## P7 — @product (PENDENTE): Versionamento `/api/v1/`

### Proposta

Adotar `/api/v1/` global prefix desde o dia 1 (§A-7 acima).

### Vantagens

- Custo zero hoje
- Quando precisar de breaking changes, basta criar `/api/v2/` rodando paralelo
- Mobile (Expo) consegue suportar versões antigas
- Boas práticas REST/OpenAPI

### Desvantagens

- URLs ligeiramente mais longas: `/api/v1/auth/login` vs `/api/auth/login`
- Nenhuma outra

### Pendente @product

Confirma `/api/v1/` desde o dia 1?

---

## §20 (Patch) — Adição à Fase 4

> **A SEÇÃO ABAIXO É O PATCH OFICIAL DA FASE 4 v1.1.** Anexar ao final do documento `FASE_4_ARQUITETURA_TECNICA.md`, antes da seção 19 ("Próximos passos").

```markdown
## 20. Patch v1.1 — Refinamentos pós-ciclo adversarial

Resolução dos 4 bloqueadores + 7 altos + 4 médios detectados pelo devils-advocate.
Esta seção é normativa: o que está aqui prevalece sobre as definições anteriores
quando há conflito.

### 20.1 Adapter HTTP — Express (BL-1)

Express adapter (NestJS default). Justificativa: cookie-parser maduro,
compatibilidade total com middlewares, performance suficiente para a escala
prevista do MVP.

[Cole o conteúdo de P1]

### 20.2 Refresh token stateful (BL-2)

Tabela `RefreshToken` adicionada ao schema. Permite revogação efetiva,
"sair de todos os dispositivos", auditoria LGPD.

[Cole o schema e a política de P2]

### 20.3 Idempotência por processor (BL-3)

Check-list de 8 processors. Três precisam de transaction explícita:
`SettlementRevalidationProcessor`, `LongTermPlanGenerationProcessor`,
`RecalculateAllScoresProcessor`.

[Cole o check-list e os 3 exemplos de P3]

### 20.4 Queues separadas (BL-4)

2 queues: `motor-recalc` (concurrency 20, group concurrency 1) e
`motor-scheduled` (concurrency 5, sem grupo).

[Cole o setup de P4]

### 20.5 Health check com @nestjs/terminus (A-1)

Endpoints `/health` (readiness com DB + Redis) e `/health/live` (liveness).

[Cole código de A-1]

### 20.6 Migration runner pre-deploy (A-2)

`pnpm prisma migrate deploy && pnpm db:seed:references` no start de prod.

### 20.7 Rate limiting per user-id (A-3)

`ThrottlerPerUserGuard` com `getTracker` customizado.

[Cole código de A-3]

### 20.8 Decimal.js — tarefa pós-MVP (A-4)

NÃO entra no MVP. Cálculos com `Number()` mantidos. Migração para `decimal.js`
fica registrada como tarefa pós-MVP, sem prazo definido.

### 20.9 Segredos via Railway env vars (A-5)

Railway Settings → Variables. `JWT_SECRET` rotacionado a cada 6 meses.
Em incidente: rotação + invalidação de refresh tokens.

### 20.10 OnboardingCompletedListener (A-6)

Listener com prioridade 1 (alta) para o primeiro recálculo após onboarding.

[Cole código de A-6]

### 20.11 Versionamento /api/v1/ (A-7)

`app.setGlobalPrefix('api/v1', { exclude: [health, admin] })`.

### 20.12 Convenções operacionais (M-1, M-2)

Documentadas no CONTRIBUTING.md:
- Passagem de `tx` em services orquestradores (M-1)
- `logger.debug` dentro de transaction, `logger.info` depois do commit (M-2)

### 20.13 Pool e helmet (M-3, M-4)

- `DATABASE_URL?connection_limit=20&pool_timeout=10` em prod (M-3)
- `app.use(helmet({...}))` no main.ts (M-4)

### 20.14 Atualizações ao §15 (stack consolidada)

Adicionar:

| Pacote | Versão alvo | Razão |
|---|---|---|
| `@nestjs/terminus` | ^11.x | Health check |
| `decimal.js` | ^10.x | (pós-MVP, registrado) |
| `helmet` | ^8.x | (já estava) |

### 20.15 Atualização ao §7 (jobs)

Adicionar:

| Job | Queue | Disparo |
|---|---|---|
| `RefreshTokenCleanupJob` | `motor-scheduled` | Cron diário 05:00 UTC — deleta `RefreshToken` com `expiresAt < now - 30 dias` |

### 20.16 Migration 13 (novo)

```
13. 20260613_add_refresh_token
    - CREATE TABLE refresh_tokens
    - INDEX idx_refresh_tokens_user_id_revoked_at
    - INDEX idx_refresh_tokens_expires_at
```

Total acumulado: 13 migrations.

*Fim do Patch v1.1.*
```

---

## Confirmações pendentes @product

Antes de eu fechar o patch e re-submeter ao devils-advocate, preciso de você em **2 decisões**:

| # | Decisão | Recomendação técnica |
|---|---|---|
| **C1 (BL-2)** | Refresh token stateful com tabela `RefreshToken`? Custo: 1 tabela + 1 migration + ~20 linhas. Benefício: revogação efetiva, "logout de todos os dispositivos", LGPD auditoria. | ✅ Sim |
| **C2 (A-7)** | Adotar `/api/v1/` global prefix desde o dia 1? Custo zero. | ✅ Sim |

---

## Após confirmação

Quando você responder, eu:

1. Aplico C1 + C2 no patch (~5min)
2. Atualizo a Fase 4 com a §20 colada
3. **Re-submeto ao devils-advocate**
4. Se virar APROVADO → seguimos para **Bridge OCR Premium** (entre Fase 4 e Fase 5)

---

*Fim do ciclo adversarial. Aguardando 2 confirmações.*
