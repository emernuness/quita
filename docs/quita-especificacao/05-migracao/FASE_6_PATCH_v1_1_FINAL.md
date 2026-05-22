# Fase 6 v1.1 — Patch Final (§13 e §14)

> **Anexar ao final do documento:** `FASE_6_PLANO_DE_MIGRACAO.md`, antes da seção 12 ("Próximos passos pós-Fase 6")
> **Versão:** v1.1
> **Data:** 17 de maio de 2026
> **Origem:** ciclo adversarial completo
> **Decisões aplicadas:** BL-1 (executores = agentes IA); BL-2/BL-3/BL-4/A-2/A-5 (fora do escopo técnico)

---

## 13. Patch v1.1 — Refinamentos pós-ciclo adversarial

Resolução completa dos 4 bloqueadores + 7 altos + 6 médios. Esta seção é normativa.

### 13.0 Decisão fundamental: executor são agentes de IA

A Fase 6 v1 assumia implicitamente devs humanos. **Os executores reais são agentes de IA especializados**, com Emerson (humano) como supervisor. Isso muda **cronograma**, **modelo de checkpoint**, **pré-mortem** e **critérios de GO**.

---

### 13.1 Modelo de execução com agentes de IA (BL-1, A-7)

#### Papéis

| Papel | Quem | Função |
|---|---|---|
| **Implementador** | Agente IA (Claude / similar) | Escreve código, testes, migrations conforme especificação |
| **Supervisor** | Emerson (humano) | Revisa PRs, aprova merges, decide trade-offs arquiteturais |
| **Validador** | CI automático | Lint, typecheck, testes unitários, testes E2E |
| **Auditor adversarial** | Agente devils-advocate | Revisa cada PR crítico antes do merge humano |

#### Especialização sugerida (múltiplos agentes em paralelo)

- **Agente Backend** — módulos NestJS, Prisma, jobs BullMQ
- **Agente Frontend** — componentes Next.js, RHF+Zod, Tailwind
- **Agente Testes** — Vitest, Playwright, cobertura
- **Agente Infra** — Railway, Supabase, Sentry, PostHog
- **Agente Auditor** — devils-advocate antes de cada PR crítico

Cada agente pode trabalhar em paralelo desde que respeite dependências entre ondas (§13.2).

#### Fluxo de trabalho por PR

```
[Agente Implementador]
   │ recebe issue com spec + critério de aceitação
   ▼
[Implementa em branch isolada]
   │ commits atômicos, mensagens convencionais
   ▼
[CI automático]
   │ lint, typecheck, unit tests
   │ ❌ falha → loop volta para Implementador
   │ ✅ passa
   ▼
[Auditor adversarial revisa]
   │ identifica bugs, edge cases, ausência de testes
   │ relatório anexado ao PR
   ▼
[Emerson revisa]
   │ aprova ou pede ajuste
   ▼
[Merge automático]
   │ deploy staging
   ▼
[Smoke tests em staging]
   │ ❌ falha → revert + nova issue
   │ ✅ passa → próximo PR
```

#### Limites do executor IA e mitigações

| Limite | Mitigação |
|---|---|
| Contexto limitado por sessão | Especificação granular por módulo (já garantida nas Fases 1-5) |
| Pode produzir código que passa testes mas tem bug semântico | Testes baseados nos **8 cenários canônicos** da Fase 3 §18 + revisão adversarial obrigatória |
| Pode entrar em loop em debugging complexo | Checkpoint humano a cada ~2h de execução contínua |
| Não decide arquitetura | ADR templates pré-aprovados; qualquer decisão arquitetural nova bloqueia PR e exige aprovação humana explícita |
| Pode "inventar" APIs/bibliotecas inexistentes | Validador CI roda `pnpm install` + typecheck; falhas de import → PR rejeitado |
| Code review de PR longo pode demorar | Cota máxima de **5 PRs abertos simultaneamente**; o limite força fluxo de trabalho focado |
| Inconsistência entre PRs de agentes diferentes | Auditor adversarial detecta conflito; padrões de código declarados em CONTRIBUTING.md (regra de Tailwind, RHF, etc.) |

---

### 13.2 Cronograma redefinido: dependências, não calendário

A noção de "semanas X-Y" das §5 e §8 da v1 **não se aplica diretamente** — agentes IA trabalham 24/7 e o fator limitante real é tempo de **revisão humana**. Substituir por **grafo de dependências entre ondas**:

```
                    Onda 1: Foundation (auth, infra, schema base)
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
        Onda 2: Motor                  Onda 3: Telas Core
        (backend isolado)              (frontend, depende de
                                       endpoints da Onda 2)
              │                               │
              └───────────────┬───────────────┘
                              ▼
                      Onda 4: Premium
                      (OCR + Stripe — exige motor estável + telas básicas)
                              │
                              ▼
                Onda 5: Notificações + Observability
                              │
                              ▼
                Onda 6: Beta privado fechado
                              │
                              ▼
                  Onda 7: Launch público
```

#### Paralelismo possível

- **Onda 2 e Onda 3 começam em paralelo** após Onda 1 fechar — mas Onda 3 integra com endpoints da Onda 2 conforme eles ficam prontos
- Dentro de uma onda, agentes especializados rodam paralelamente (backend + frontend + testes)
- Auditoria adversarial roda em paralelo com implementação seguinte (não bloqueia)

#### Fator limitante real

```
Tempo total = max(
  tempo de implementação (potencialmente curto),
  tempo de revisão humana (Emerson disponível)
)
```

Se Emerson dispõe de ~4-8h/semana para review, o tempo de revisão tende a dominar. Buffer humano é o gargalo.

#### Estimativa revisada (calendário)

Sem prometer datas absolutas, faixa estimada **dependente de disponibilidade do supervisor**:

| Disponibilidade Emerson para review | Estimativa total |
|---|---|
| 2h/dia (~14h/semana) | 6-10 semanas calendário |
| 1h/dia (~7h/semana) | 12-16 semanas calendário |
| 30min/dia (~3.5h/semana) | 20-30 semanas calendário |
| Menos | indeterminado — gargalo seria crítico |

**Recomendação:** alocar bloco fixo diário (1-2h) para review. Sem isso, PRs acumulam e o sistema trava.

---

### 13.3 Modelo de checkpoint e revisão humana

#### Cota de PRs abertos

- Máximo 5 PRs abertos simultaneamente
- Se cota atingida: agentes esperam ou trabalham em refatorações sem PR

#### Critérios de revisão humana

Cada PR deve responder antes do merge:
1. **Implementa o spec?** (referência: issue + Fase X seção Y)
2. **Tem testes adequados?** (alvo de cobertura por contexto — §13.6 técnico)
3. **Auditor adversarial reportou problemas?** (se sim: resolvidos?)
4. **CI passou?**
5. **Há refatoração disfarçada?** (PR deve fazer 1 coisa)
6. **Há novas dependências?** (justificadas?)
7. **Há mudança de schema?** (migration revisável?)

Aprovação humana é **gate único** — sem aprovação, não merge.

#### Threshold de qualidade

- 1ª revisão devolvida = normal (refactor pequeno)
- 2ª revisão devolvida = preocupante (spec ambíguo? agente confuso?)
- 3ª devolvida = bloqueio explícito; humano decide refazer manualmente ou reescrever spec

---

### 13.4 Pré-mortem estruturado (A-1)

**Cenário hipotético.** Estamos em outubro de 2026. O Quita lançou há 3 meses e foi descontinuado. Por quê?

**Top 7 causas candidatas (ordenadas por probabilidade percebida):**

1. **Tom adequado mas produto irrelevante** — usuários endividados não querem app, querem ajuda humana direta (Procon, Defensoria).
   *Mitigação existente:* beta privado de 15 pessoas detecta isso antes do launch. Critério "70% reportam entendi melhor" + "≥ 3 voltas espontâneas em 30 dias".

2. **PMF parcial com churn altíssimo** — usuário descobre seu estado, lê uma vez, vai embora.
   *Mitigação existente:* refinamento progressivo dá motivo para voltar. Plano de longo prazo regerável.
   *Mitigação nova:* eventos PostHog rastreiam "primeira volta espontânea". Se < 50% voltam em 7 dias, alerta.

3. **Bug em agente IA passou no review e gerou cálculo crítico errado** — usuário em `survival` recebeu recomendação "pagar R$ 800". Caso vira viral.
   *Mitigação nova:* testes baseados nos 8 cenários canônicos como gate obrigatório. Auditor adversarial revisa cada PR do motor especificamente.

4. **Custos OpenAI ultrapassaram receita** — abuso de quota Premium drenou margem.
   *Mitigação existente:* `OcrCostReportJob` mensal + cap 5 OCRs/mês por usuário.
   *Mitigação nova:* alerta em PostHog se custo mensal > R$ 200.

5. **Incidente LGPD inicial** — dados financeiros vazaram (bug, ataque, ou má configuração).
   *Mitigação existente:* `AuthAuditLog`, log redaction (§13.7), partial indexes, RLS no Supabase.
   *Mitigação nova:* checklist de segurança pré-launch obrigatório (revisão de configurações Supabase RLS, CSP no Next, headers HTTPS strict).

6. **Acúmulo de PRs sem revisão** — agentes IA produzem código mais rápido do que humano revisa. PRs ficam abertos, código diverge, refactor fica impossível.
   *Mitigação nova:* cota máx 5 PRs abertos (§13.3). Se atingir cota, pausa de implementação. Documentar como sinal vermelho.

7. **Conflito entre agentes** — Agente Frontend assumiu API forma X; Agente Backend implementou forma Y. PR de integração quebra tudo.
   *Mitigação existente:* `@quita/shared` com tipos Zod compartilhados.
   *Mitigação nova:* tipos compartilhados são "contrato" entre agentes; mudança em `@quita/shared` exige PR separado e aprovação explícita.

---

### 13.5 Resolução dos altos técnicos (A-3, A-4, A-6, A-7)

#### A-3: Política de log redaction

```typescript
// apps/api/src/main.ts
import pino from 'pino';

export const logger = pino({
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'req.body.cardNumber',
      'req.body.cvv',
      'res.body.refreshToken',
      'res.body.accessToken',
      'req.body.ocrExtractedData',
    ],
    censor: '[REDACTED]',
  },
  level: process.env.LOG_LEVEL ?? 'info',
});
```

```typescript
// apps/api/src/sentry.ts
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  beforeSend(event) {
    if (event.request?.cookies) delete event.request.cookies;
    if (event.request?.headers?.authorization) {
      event.request.headers.authorization = '[REDACTED]';
    }
    if (event.request?.data?.password) {
      event.request.data.password = '[REDACTED]';
    }
    return event;
  },
});
```

Adicionado às entregas da **Onda 1**.

#### A-4: 6º fluxo Playwright — isolamento multi-usuário

```typescript
// apps/web/tests/e2e/isolation.spec.ts
test('user B cannot access user A debt', async ({ browser }) => {
  // Setup: criar usuário A com 1 dívida
  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  await registerAndOnboard(pageA, 'userA@test.com');
  const debtId = await createDebt(pageA, { creditor: 'Banco X', amount: 1000 });

  // Setup: criar usuário B
  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  await registerAndOnboard(pageB, 'userB@test.com');

  // Test: usuário B tenta acessar dívida do A via URL direta
  await pageB.goto(`/dividas/${debtId}`);
  await expect(pageB.locator('text=403')).toBeVisible();
  // OU: redirect para /dividas com toast de erro
});
```

Aplicado a `/dividas/[id]`, `/dividas/[id]/pagar`, `/avaliar-acordo/[id]`, `/data-exports/[id]`. Adicionado às entregas da **Onda 3**.

#### A-6: Forgot/reset password na Onda 1

Adicionado às entregas backend da Onda 1:

```
- POST /api/v1/auth/forgot-password
  - body: { email }
  - sempre retorna 200 (não revela existência de email)
  - se email existe: cria token, enfileira email
  - rate limit: 3 tentativas/hora por email

- POST /api/v1/auth/reset-password
  - body: { token, newPassword }
  - verifica token válido + não expirado (1h TTL)
  - atualiza senha, invalida token, revoga todos refresh tokens do usuário
  - registra evento `password_changed` em AuthAuditLog
```

Schema novo (sub-tabela ou reuso de `RefreshToken` com `tokenType`):

```prisma
model PasswordResetToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  tokenHash String   @unique @map("token_hash") @db.VarChar(255) // HMAC-SHA256
  expiresAt DateTime @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("password_reset_tokens")
}
```

**Migration 20** (`add_password_reset_token`). Total acumulado: **20 migrations**.

Telas frontend `/forgot-password` e `/reset-password` (esqueletos da Fase 5 §15.1) ganham implementação completa na **Onda 1**.

#### A-7: Aviso de prazo dependente do modelo IA

Já tratado em §13.2 acima. Cronograma vira **dependência lógica**, não calendário fixo.

---

### 13.6 Resolução dos médios técnicos (M-1, M-2, M-3, M-4, M-5, M-6)

#### M-1: Backup off-site retention 12 meses

```yaml
# Política
- Supabase point-in-time backup: 7 dias (free tier)
- Export semanal para S3/GCS: 12 meses
- Após 12 meses: arquivamento glacial (S3 Glacier) por 5 anos (auditoria LGPD)
- Cleanup automatizado via job mensal
```

#### M-2: Preço Premium em env var + endpoint

```typescript
// apps/api/src/modules/config/config.controller.ts
@Get('config/pricing')
@Public()
@CacheTTL(60 * 60) // 1h
async getPricing() {
  return {
    premium: {
      monthlyBRL: Number(this.config.get('PREMIUM_MONTHLY_PRICE_BRL')),
      stripePriceId: this.config.get('STRIPE_PRICE_ID_PREMIUM'),
    },
  };
}
```

Frontend consome via TanStack Query com cache 1h. Mudança de preço: alterar env var + atualizar Stripe Price ID — sem deploy de código.

#### M-3: Alvos de cobertura

| Contexto | Cobertura mínima |
|---|---|
| Módulos do motor (12) | 85% |
| Outros módulos backend | 70% |
| Componentes frontend críticos (`<Money>`, OCR modals, forms de pagamento) | 80% |
| Outros componentes frontend | 60% |
| Hooks | 70% |
| E2E Playwright | 6 fluxos críticos (incluindo isolamento — A-4) |

Configurado no `vitest.config.ts` com `coverage.thresholds.lines/functions/branches/statements`.

#### M-4: Tracker de bugs e issues

**GitHub Issues** integrado a PRs. Labels:
- `bug`, `feature`, `tech-debt`, `documentation`, `security`
- `priority/p0` (bloqueador), `priority/p1` (alto), `priority/p2` (médio), `priority/p3` (baixo)
- `wave/1` a `wave/7` (onda associada)
- `agent/backend`, `agent/frontend`, `agent/tests`, `agent/infra`

Issues geradas pelo auditor adversarial recebem label `audit-finding`.

#### M-5: PostHog session recording masking

```typescript
// apps/web/src/lib/posthog.ts
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: 'https://app.posthog.com',
  session_recording: {
    maskAllInputs: true,
    maskTextSelector: '[data-sensitive], .money-value, .debt-amount',
    maskCapturedNetworkRequestFn: (request) => {
      // Redact auth headers
      if (request.requestHeaders?.authorization) {
        request.requestHeaders.authorization = '[REDACTED]';
      }
      return request;
    },
  },
});
```

Componente `<Money>` ganha `className="money-value"` para masking automático.

#### M-6: Decimal.js workaround temp

Vitest configurado com matcher de tolerância:

```typescript
// apps/api/src/test/setup.ts
import { expect } from 'vitest';

// Para asserções monetárias com 2 casas
expect.extend({
  toEqualMoney(received: number, expected: number) {
    const pass = Math.abs(received - expected) < 0.005;
    return {
      pass,
      message: () => `Expected R$ ${received} to equal R$ ${expected} (±R$ 0.005)`,
    };
  },
});
```

Uso nos testes do motor:
```typescript
expect(result.safeCapacity).toEqualMoney(350.00);
```

Quando decimal.js entrar (pós-MVP), substituir.

---

### 13.7 Pré-requisitos externos declarados (não tratados nesta especificação)

Os itens abaixo são **decisões de negócio/legais/operacionais** fora do escopo da especificação técnica. Não são bloqueadores do desenvolvimento, mas **são bloqueadores do launch**. Responsabilidade do supervisor humano (Emerson):

| # | Pré-requisito | Quando bloqueia | Responsável |
|---|---|---|---|
| **EXT-1** | Política de Privacidade publicada | Antes da Onda 6 (beta) | Emerson |
| **EXT-2** | Termos de Uso publicados | Antes da Onda 6 (beta) | Emerson |
| **EXT-3** | CNPJ ativo para Stripe Brasil | Antes da Onda 4 (Stripe Live mode) | Emerson |
| **EXT-4** | Conta bancária PJ (se necessário) | Antes da Onda 4 | Emerson |
| **EXT-5** | DPO designado + canal LGPD | Antes da Onda 6 | Emerson |
| **EXT-6** | Plano de suporte ao usuário | Antes da Onda 6 | Emerson |
| **EXT-7** | Plano de comunicação de launch | Antes da Onda 7 | Emerson |
| **EXT-8** | Domínio comprado e configurado | Antes da Onda 1 (deploy) | Emerson |
| **EXT-9** | Contas criadas (Stripe, Resend, OpenAI, Supabase, Railway, Vercel, Sentry, PostHog) | Antes da Onda 1 | Emerson |

Estes itens **não bloqueiam** a especificação técnica nem o início do desenvolvimento da Onda 1, **desde que** o desenvolvimento aconteça em ambiente local/staging primeiro. EXT-9 é o único que efetivamente trava Onda 1 — sem contas criadas, agentes não conseguem configurar infra.

Recomenda-se iniciar EXT-1, EXT-2, EXT-3, EXT-4 em paralelo com a Onda 1 (semanas iniciais).

---

## 14. Atualização das §5 (ondas) e §8 (cronograma) e §9 (GO/NO-GO)

### 14.1 §5 — entregas adicionais por onda

**Onda 1 — Foundation:**
- + Forgot/reset password (backend + frontend)
- + Migration 20 (`password_reset_tokens`)
- + Política de redact (pino + Sentry)
- + Setup PostHog com masking
- + Setup Vitest com matcher monetário customizado

**Onda 3 — Telas Core:**
- + 6º fluxo Playwright (isolamento multi-usuário)

### 14.2 §8 — cronograma substituído por §13.2

A tabela de "16 semanas" da v1 é substituída pelo modelo de dependências lógicas + estimativa dependente de disponibilidade do supervisor (§13.2).

### 14.3 §9 — critérios GO/NO-GO refinados

Adicionar aos critérios de **Beta Privado (Onda 6)**:
- ✅ Política de Privacidade publicada (EXT-1)
- ✅ Termos de Uso publicados (EXT-2)
- ✅ DPO designado (EXT-5)
- ✅ Plano de suporte ativo (EXT-6)

Adicionar aos critérios de **Launch Público (Onda 7)**:
- ✅ Plano de comunicação executado parcialmente (EXT-7)
- ✅ CNPJ + conta PJ operacionais para Stripe Live (EXT-3, EXT-4)

---

## 15. Migrations finais consolidadas (20 totais)

| # | Migration | Origem | Fase |
|---|---|---|---|
| 01-10 | Schema base | Fase 2 | — |
| 11 | `phase3_v1_1_adjustments` | Fase 3 v1.1 | 3 |
| 12 | `drop_ai_insight` | Fase 3 v1.1 | 3 |
| 13 | `add_refresh_token` | Fase 4 v1.1 | 4 |
| 14 | `add_ocr_fields_to_settlement_evaluation` | Bridge OCR v1.1 | Bridge |
| 15 | `create_ocr_bucket` | Bridge OCR v1.1 | Bridge |
| 16 | `add_auth_audit_log` | Fase 4 NM-6 | 4 |
| 17 | `add_subscription_table` | Fase 5 v1.1 | 5 |
| 18 | `add_notification_table` | Fase 5 v1.1 | 5 |
| 19 | `add_processed_stripe_events` | Fase 5 v2 NM-1 | 5 |
| **20** | **`add_password_reset_token`** | **Fase 6 v1.1 (A-6)** | **6** |

**Total: 20 migrations.**

---

## 16. Resumo do impacto do patch v1.1

| Categoria | Total |
|---|---|
| Bloqueadores resolvidos | 4 de 4 (1 técnico + 3 declarados como externos) |
| Altos resolvidos | 7 de 7 (5 técnicos + 2 declarados como externos) |
| Médios resolvidos | 6 de 6 (todos técnicos) |
| Modelo de execução | Agentes IA + supervisor humano com cota PRs + auditor adversarial |
| Novo schema | `password_reset_tokens` (Migration 20) |
| Novos arquivos de configuração | pino redact, Sentry beforeSend, PostHog masking, Vitest matcher |
| Pré-requisitos externos declarados | 9 (responsabilidade Emerson) |

---

*Fim do Patch v1.1.*
