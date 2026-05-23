# Arquitetura — Quita

Visão alto nível dos componentes e suas fronteiras.

## Diagrama

```
┌──────────────────────────────────────────────────────────────┐
│                          Cliente Web                         │
│  Next.js 15 (App Router) + React 19 + Tailwind 4             │
│  TanStack Query (cache) + Zustand (auth state)               │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTPS + httpOnly cookies
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                          API (NestJS 11)                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Controllers (20 módulos)                              │  │
│  │  - auth, debts, financial, settlements, motor, ocr     │  │
│  │  - onboarding, notifications, consent, user, etc       │  │
│  └─────────────────┬──────────────────────────────────────┘  │
│                    │                                          │
│  ┌─────────────────▼──────────────────────────────────────┐  │
│  │  Services (regras de negócio)                          │  │
│  │  - 7 services CRUD injetam MotorTriggerService         │  │
│  │  - Mutação → enqueue motor-recalc                      │  │
│  └─────────────────┬──────────────────────────────────────┘  │
│                    │                                          │
│  ┌─────────────────▼──────────────────────────────────────┐  │
│  │  Prisma 6 → PostgreSQL                                 │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────┬─────────────────────────────────┬───────────────┘
             │                                 │
             ▼                                 ▼
┌─────────────────────────┐       ┌────────────────────────────┐
│   Motor (packages/motor)│       │  BullMQ + Redis            │
│   13 módulos puros TS   │       │  2 queues:                 │
│   - state-classifier    │◄──────┤  - motor-recalc (dyn)      │
│   - mode-selector       │       │  - motor-scheduled (cron)  │
│   - capacity-calculator │       │                            │
│   - simulator           │       │  8 processors + scheduler  │
│   - settlement-validator│       │  Emite Notification ao fim │
│   - smoothing-rule      │       └────────────────────────────┘
│   - monthly-plan-gen    │
│   ... (13 total)        │
└─────────────────────────┘

       ┌────────────────────────────────────────┐
       │  Storage / Integrações externas        │
       │  - Cloudflare R2 (S3-compat) — OCR     │
       │  - Stripe — pagamentos                 │
       │  - OpenAI gpt-4o-mini — OCR Vision     │
       │  - Resend — email transacional         │
       │  - Sentry — erros + perf               │
       │  - PostHog — analytics                 │
       └────────────────────────────────────────┘
```

## Decisões arquiteturais chave

### 1. Motor isolado em `packages/motor`
Módulos puros (sem Prisma, sem Nest). API orquestra: lê dados via Prisma → passa para motor → persiste resultado. Permite **105 testes unitários** sem mock de DB.

### 2. Pipeline event-driven
Toda mutação CRUD enfileira `motor-recalc` via `MotorTriggerService`. Garante consistência: usuário edita renda → plano recalcula → notification chega. Falha de enqueue não quebra CRUD (warning log apenas).

### 3. Onboarding fracionado
Spec Fase 1 §7.1: 3 níveis (`minimal`/`basic`/`detailed`). Completar 5 passos críticos → `minimal`. Preencher behavior profile → promove `basic`. Refinar dimensões → `detailed`.

### 4. OCR sem trafegar base64
Browser solicita signed URL → PUT direto no R2 → backend recebe apenas `key` e processa. Reduz payload + latência + risco LGPD.

### 5. Notifications in-app
Tabela própria + componente sino + polling 60s. Emissor (processor) decide quando criar. Frequency rules (max 3/sem por categoria, janela 9-21h SP) aplicadas no service.

### 6. Auth stateful refresh
JWT access curto (15min) + refresh hash HMAC-SHA256 stateful em DB (15d). Rotação atômica via `updateMany` com `WHERE revokedAt=NULL` evita race. Detecção de reuse → revoga todos.

### 7. Migrations forward-only em prod
0005 dropou colunas legadas em dev (DB vazio). Prod nunca rodou — primeiro deploy aplica todas. Subsequentes: snapshot + idempotente. Rollback = restaurar snapshot.

## Boundaries de segurança

- Cliente nunca recebe `passwordHash`, secrets, tokens internos
- R2 keys isoladas por prefix `ocr/${userId}/` + validação no backend
- Stripe webhooks com signature verification
- LGPD: dados primários no Brasil (Postgres BR), processadores estrangeiros (Stripe US, OpenAI US) declarados em Política de Privacidade

## Pontos de extensão

- **Worker separado**: hoje processors rodam no mesmo processo da API. Para escala, mover `QueueModule` para serviço dedicado (consumindo mesmo Redis).
- **Cache Redis**: BullMQ usa Redis. Service-level cache pode reusar (não implementado).
- **Real-time notifications**: hoje polling 60s. Migrar para SSE ou WebSocket sem mudar API contract.
- **Multi-currency**: motor assume BRL. Refactor envolve `Money` value object.
