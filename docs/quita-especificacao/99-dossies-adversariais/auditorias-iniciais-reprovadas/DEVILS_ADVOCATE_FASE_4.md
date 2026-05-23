# Devils Advocate — Auditoria da Fase 4

> **Modo:** Estratégia
> **Escopo auditado:** `FASE_4_ARQUITETURA_TECNICA.md` (1.931 linhas, 19 seções)
> **Data:** 16 de maio de 2026
> **Mantra:** *"Se não sobreviver ao meu interrogatório, não merece produção."*

---

## Veredito provisório

# 🔴 REPROVADO

A Fase 4 cobre muito bem **estrutura, módulos, BullMQ, Pino, Sentry, OpenAPI, seed e testes**. Mas escorrega em **4 decisões arquiteturais omitidas** que afetam tudo abaixo:

1. Adapter HTTP (Express vs Fastify) não escolhido
2. Estratégia de refresh token (stateful vs stateless) não definida
3. Idempotência de jobs não tratada
4. Crons compartilham slots com jobs operacionais na mesma queue

Mais 7 altos, 4 médios. Padrão consistente com Fase 3 v1: documento sólido com lacunas finas. Patch v1.1 da Fase 4 deve resolver em ~6h.

---

## Resumo dos achados

| Severidade | Total | Categoria |
|---|---|---|
| 🔴 Bloqueadores | **4** | Decisões arquiteturais ausentes |
| 🟠 Altos | **7** | Detalhes operacionais subespecificados |
| 🟡 Médios | **4** | Refinamentos |

---

## Fase 1 — Radiografia

### 🔴 Bloqueadores (4)

---

#### BL-1 — Adapter HTTP (Express vs Fastify) não escolhido

NestJS 11 aceita dois adapters: Express (default) e Fastify. Impacta múltiplas decisões já feitas no documento:

| Componente | Express | Fastify |
|---|---|---|
| Cookies (`req.cookies`) | `cookie-parser` middleware | `@fastify/cookie` plugin |
| File upload (futuro OCR) | `multer` | `@fastify/multipart` |
| Swagger | OK em ambos | OK em ambos |
| Throttler | OK em ambos | OK em ambos |
| Performance bruta | ~30k req/s | ~50k req/s |
| Compatibilidade com pacotes Express middleware | 100% | parcial (precisa adapter) |

A Fase 4 §10.1 mostra `res.cookie(...)` no `@Res({ passthrough: true })` — sintaxe Express. Mas o `main.ts` não declara qual adapter usar. Se for Fastify, a sintaxe muda.

**Impacto.** Implementação fica refém de interpretação. Em produção, escolher errado obriga retrabalho em auth, cookies e (no futuro) upload de OCR.

**Custo de correção.** ~30min: explicitar decisão + ajustar sintaxe dos exemplos.

**Recomendação.** Express para o MVP. Compatibilidade total com cookie-parser, ecossistema maduro, e o ganho de performance do Fastify só compensa em escala > 10k req/s.

---

#### BL-2 — Refresh token: stateful ou stateless?

§10.1 cria refresh token e o seta em cookie httpOnly. Mas **não define** se:

- **Stateless (JWT puro):** o refresh é apenas um JWT com TTL maior. Não há tabela. Vantagem: simples. **Desvantagem: impossível revogar antes do TTL.**
- **Stateful (com tabela):** cria `RefreshToken` table com `userId`, `tokenHash`, `expiresAt`, `revoked`. Permite logout efetivo, "logout de outros dispositivos", e auditoria.

A escolha afeta:
- Schema (precisa de tabela `RefreshToken`?)
- Migrations (mais uma)
- Lógica de logout (apenas limpa cookie ou também invalida no DB?)
- Cenário de "senha trocada" (revoga todos os refresh tokens existentes?)

Para um app de **dados financeiros sensíveis**, a recomendação técnica é **stateful**. Permite revogação real, atende auditoria LGPD, e suporta segurança elevada (logout remoto se conta comprometida).

**Custo de correção.** ~1h: adicionar tabela `RefreshToken` ao schema Prisma + 1 migration + ajustar `AuthService`.

---

#### BL-3 — Idempotência de jobs não tratada

BullMQ tem `attempts: 5` (§7.1). Se um job falha no meio do processamento, ele retenta — e **pode duplicar trabalho parcial já feito**.

Cenário concreto:
1. `RecalculateStateProcessor` cria `FinancialStateSnapshot` (write 1)
2. Atualiza `User.lastFinancialState` (write 2)
3. Falha no write 3 (cria `MonthlyActionPlan`)
4. Job retenta

Mas espera — §7.3 `BaseProcessor` é **a porta** do worker. **Não cobre idempotência interna do handle()**.

Felizmente, `monthly-plan-generator.generate()` (§14.3 da Fase 3) envolve tudo em `prisma.$transaction` (§20.2 do patch). Então uma falha **dentro da transaction** faz rollback automático, garantindo idempotência *para o `RecalculateState`*.

**Mas e os outros processors?**

| Processor | Tem transaction? | Idempotência garantida? |
|---|---|---|
| `RecalculateStateProcessor` | Sim (via `generate()`) | ✅ |
| `MonthlyRolloverProcessor` | ? | ❓ Não definido |
| `DataFreshnessReviewProcessor` | ? | ❓ Gera ações `review` — se retenta, duplica ações |
| `DataRetentionCleanupProcessor` | ? | ❓ Deleta dados — se retenta, idempotente por natureza (já deletado) |
| `SettlementRevalidationProcessor` | ? | ❓ Cria nova `SettlementEvaluation` — se retenta, duplica |
| `LongTermPlanGenerationProcessor` | ? | ❓ Upsert do `PaymentPlan` é idempotente, mas o `replace` de `PlanTimelineItem` (deleta tudo + recria) precisa de transaction |
| `InterestRateUpdateProcessor` | ? | ❓ Upsert por `(slug, date)` — idempotente naturalmente |
| `RecalculateAllScoresProcessor` | ? | ❓ Update por debt — idempotente se calculado igual |

**Lacuna.** Falta declarar política: todo processor que cria registros deve ou (a) usar transaction, ou (b) usar upsert idempotente, ou (c) verificar existência antes de criar.

**Custo de correção.** ~1h: adicionar §7.x "Idempotência por processor" com check-list.

---

#### BL-4 — Crons compartilham slots com recálculos na mesma queue

§7.6 mostra todos os crons enfileirados em `'motor-recalc'`. Mas §7.4 define `concurrency: 20` global e `group: { concurrency: 1 }` por groupId.

**Problema.** Cron jobs (`monthly-rollover`, `data-freshness-review`, etc.) **não têm groupId**. Eles caem nos 20 slots globais. Cenário:

- 02:00 UTC: `monthly-rollover` cron dispara
- Dentro do cron, enfileira N recálculos (um por usuário com `nextReviewDate <= hoje`)
- Esses recálculos têm `groupId: userId`, então cada user só processa 1 por vez
- **Mas** o próprio job `monthly-rollover` (o "pai") fica nos 20 slots

Se 5 crons rodam simultaneamente (improvável mas possível com cron de hora cheia), eles podem ocupar slots. Pior: se um cron demora (ex: `data-retention-cleanup` varrendo milhões de linhas), ocupa slot por horas.

**Solução.** Separar em 2 queues:

```typescript
BullModule.registerQueue({ name: 'motor-recalc' }),    // recálculos com groupId
BullModule.registerQueue({ name: 'motor-scheduled' }), // crons
```

`motor-scheduled` com `concurrency: 2` (basta — crons são poucos e não-concorrentes entre si na maioria das vezes). `motor-recalc` com `concurrency: 20`.

**Custo de correção.** ~45min: refatorar `QueueModule` + ajustar onde enfileira.

---

### 🟠 Altos (7)

---

#### A-1 — Health check não detalhado

§4 menciona `health/health.controller.ts` mas não tem implementação. Health check é crítico para Railway/Fly fazerem deploy gradual e detectar app quebrado.

**Proposta:**

```typescript
// modules/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prisma.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
    ]);
  }

  @Get('live')
  liveness() {
    return { status: 'ok' };
  }
}
```

Usar `@nestjs/terminus`. Liveness é apenas "o processo está vivo"; readiness inclui DB e Redis. Railway/Fly precisam de ambos.

---

#### A-2 — Migration runner em deploy

§13 fala de `prisma migrate deploy` mas não onde roda. CI/CD step? Comando do Railway? Hook do app?

Sugestão: step pre-deploy no Railway:

```bash
pnpm prisma migrate deploy && pnpm db:seed:references
```

`db:seed:references` é um seed idempotente que só roda upsert das tabelas de referência (DebtCategory, ScoringWeight, etc.) — seguro rodar a cada deploy.

---

#### A-3 — Rate limiting por user, não só por IP

§10.4 usa `@nestjs/throttler` default (por IP). Para app de finanças, melhor por user-id quando autenticado.

```typescript
// Custom tracker em endpoint sensível
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 5, ttl: 60_000 } })
@Post('settlements/validate')
async validateSettlement(@CurrentUser() user) {
  // ThrottlerGuard precisa de tracker customizado que usa user.id em vez de IP
}
```

Solução: implementar `ThrottlerStorage` customizado ou override `getTracker(req)` para retornar `req.user?.id ?? req.ip`.

---

#### A-4 — `Decimal` vs `Number` (precisão financeira)

O schema Prisma usa `Decimal @db.Decimal(12, 2)` para valores monetários. Pseudocódigo do motor faz `Number(decimal)` em vários lugares (§7.3 detector, §11.3 validator, etc.).

`Number()` converte `Decimal` para `number` — perde precisão acima de ~15 dígitos significativos. Para valores até R$ 999.999.999,99 dá problema só em multiplicações encadeadas. Risco real:

- Cálculo de juros: `monthlyRate * balance` em sequência mensal pode acumular erro
- Soma de centenas de despesas pequenas pode dar diferença de centavos

**Solução.** Usar `decimal.js` (ou `bignumber.js`) consistentemente no motor. Conversão `decimal → number` só na borda de saída (UI). Custo: adicionar lib + ajustar cálculos no `priority-engine` e `simulator`.

Para o MVP com saldos típicos < R$ 100k, o erro é desprezível. **Aceitável adiar para v1.1**, registrando como limitação conhecida.

---

#### A-5 — Estratégia de segredos em produção

§16 mostra `.env.example` com `JWT_SECRET=change-me`. Mas onde ficam os segredos reais em prod?

Opções:
- Railway env vars (UI) — simples, OK para MVP
- Doppler / 1Password Secrets / Infisical — separa segredos do código
- HashiCorp Vault — overkill para MVP

**Recomendação MVP:** Railway env vars + rotação documentada de `JWT_SECRET` a cada 6 meses. Registrar.

---

#### A-6 — Listener de `onboarding.completed` ausente

§6.2 lista `onboarding.completed` mas não define o listener. Sem ele, o motor nunca roda na primeira vez que o usuário termina o Onboarding Crítico — só nas próximas mudanças.

```typescript
@Injectable()
export class OnboardingCompletedListener {
  constructor(@InjectQueue('motor-recalc') private motorQueue: Queue) {}

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
      { groupId: payload.userId, priority: 1 }, // alta prioridade — UX crítica
    );
  }
}
```

Detalhe: este enfileiramento precisa de **alta prioridade** porque o usuário acabou de terminar o onboarding e está esperando ver o "Espelho" — não pode demorar 5min na fila.

---

#### A-7 — Versionamento de API

Não decidido. `/api/me` ou `/api/v1/me`?

Para app que tem mobile (React Native), versionamento é importante porque app antigo precisa continuar funcionando enquanto novas versões saem.

**Recomendação:** `/api/v1/` em todos os endpoints desde o dia 1. Custo zero agora, evita refactoring quando precisar.

```typescript
// main.ts
app.setGlobalPrefix('api/v1');
```

---

### 🟡 Médios (4)

---

#### M-1 — Padrão de `tx` opcional pode gerar inconsistência

§5.1 mostra `tx?: Prisma.TransactionClient` em todos os métodos. Padrão correto, mas sem disciplina pode virar bagunça: alguns devs passam `tx`, outros não, e a mesma operação em contextos diferentes mostra comportamento diferente.

**Mitigação:** ESLint custom rule (`no-prisma-without-tx-in-service`) que avisa se um service chama repository sem passar tx. Ou doc no CONTRIBUTING.md com regra clara.

---

#### M-2 — Logs dentro de transaction Prisma

Pino loga antes do commit. Se a transaction faz rollback, o log fica descrevendo coisa que não aconteceu. Não crítico — mas vale anotar para debugging futuro.

**Mitigação:** logs dentro de transaction usam nível `debug`. Logs finais (depois do commit) usam `info`.

---

#### M-3 — Connection pool Prisma

Prisma tem pool padrão (10 conexões). Em prod com Railway, pode ser pouco se houver picos. Configurável via `DATABASE_URL?connection_limit=20`. Detalhe operacional, não bloqueia.

---

#### M-4 — Helmet não mencionado

`helmet` está na §15.1 (stack) mas não na configuração do main.ts. Headers de segurança (`X-Frame-Options`, `Strict-Transport-Security`, etc.) são importantes para LGPD. Adicionar:

```typescript
// main.ts
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));
```

---

## Fase 5 — Interrogatório

7 perguntas. As 4 técnicas eu decido como @claude-arquiteto; 3 envolvem decisão de @product ou são consulta.

---

**P1 @claude-arquiteto** (BL-1)
Express ou Fastify? Recomendo Express. Confirma?

---

**P2 @claude-arquiteto + @product** (BL-2)
Refresh token: stateful (tabela `RefreshToken`) ou stateless? Para app financeiro, **recomendo stateful** (permite revogação real, atende LGPD). Custo: 1 tabela + 1 migration. Confirma?

---

**P3 @claude-arquiteto** (BL-3)
Adicionar §7.x "Idempotência por processor" no patch, com check-list das 8 processors? Vou definir transaction ou upsert idempotente para cada.

---

**P4 @claude-arquiteto** (BL-4)
Separar em 2 queues (`motor-recalc` para recálculos com groupId; `motor-scheduled` para crons)? Recomendo. Confirma?

---

**P5 @claude-arquiteto** (A-1 a A-7)
Vou compilar resoluções dos 7 altos em uma §20 patch v1.1 da Fase 4, com:
- A-1: Health check com `@nestjs/terminus`
- A-2: Migration runner em pre-deploy do Railway
- A-3: Rate limiting per user-id
- A-4: Decimal.js — registrar como tarefa v1.1 (não bloqueia MVP)
- A-5: Railway env vars + rotação documentada
- A-6: `OnboardingCompletedListener` com prioridade alta
- A-7: `/api/v1/` global prefix

Confirma?

---

**P6 @claude-arquiteto** (M-1 a M-4)
Os 4 médios viram pendências operacionais:
- M-1: ESLint custom rule no CONTRIBUTING.md
- M-2: Convenção de log (debug dentro de tx, info depois)
- M-3: `?connection_limit=20` na DATABASE_URL prod
- M-4: `helmet()` no main.ts

Confirma?

---

**P7 @product** (consulta)
Versionamento API `/api/v1/` desde o dia 1 (custo zero, evita refactoring depois)? Confirma?

---

## Fase 7 — Critérios para APROVADO

| # | Critério | Status |
|---|---|---|
| 1 | BL-1: adapter HTTP escolhido e exemplos consistentes | ❌ |
| 2 | BL-2: estratégia de refresh token definida + schema atualizado | ❌ |
| 3 | BL-3: idempotência por processor documentada | ❌ |
| 4 | BL-4: queues separadas para recálculos e crons | ❌ |
| 5 | 7 altos endereçados em patch v1.1 (mesmo formato da Fase 3) | ❌ |
| 6 | 4 médios com decisão de "tratar agora" ou "tarefa pós-MVP" | ❌ |

---

## Comparativo

| Auditoria | Bloq | Altos | Médios | Veredito |
|---|---|---|---|---|
| Fases 1 e 2 v1 | 4 | 4 | 1 | 🔴 |
| Fases 1 e 2 v2 | 0 | 0 | 0 | ✅ |
| Fase 3 v1 | 4 | 7 | 4 | 🔴 |
| Fase 3 v1.1 | 0 | 0 | 0 | ✅ |
| **Fase 4 v1** | **4** | **7** | **4** | 🔴 |

Padrão consistente: documentos grandes sempre têm furos de detalhe que aparecem só sob lente adversarial. Patch v1.1 com ~6h de trabalho resolve.

---

## Comentário final

A Fase 4 é a tradução mais técnica do projeto até aqui — 18 módulos NestJS, 8 processors, event bus, cache Redis, observabilidade, OpenAPI, autenticação reescrita. Acertou no esqueleto e nas peças grandes. Errou em **decisões arquiteturais omitidas** que parecem detalhes mas tocam tudo abaixo.

Express vs Fastify muda a sintaxe de cookies. Refresh stateful vs stateless muda o schema. Queue única vs separada muda a resiliência. Idempotência por processor evita bugs que só aparecem em produção.

Resolva os 4 bloqueadores em um patch v1.1 (estrutura idêntica ao da Fase 3) e a Fase 4 vira APROVADA.

*Fim do dossiê. Aguardando ciclo adversarial.*
