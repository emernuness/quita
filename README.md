# Quita

App de quitação de dívidas e organização financeira pessoal (BR). Motor classifica usuário em 5 estados financeiros e seleciona 1 de 5 modos operacionais (payoff/stabilization/protection/crisis/survival), gerando plano mensal personalizado.

**Status:** MVP refactor `refactor/onda-1-foundation`. Foundation completa: motor event-driven, onboarding fracionado, OCR Premium, modos diferenciados, notifications in-app, dark mode.

## Stack

- **Monorepo**: pnpm + Turbo
- **API**: NestJS 11 + Prisma 6 + BullMQ + Redis + PostgreSQL
- **Web**: Next.js 15 (App Router) + React 19 + Tailwind 4 + TanStack Query + Zustand
- **Motor**: TypeScript puro em `packages/motor` (13 módulos, 105 testes)
- **Compartilhado**: `packages/shared` (Zod schemas + tipos)
- **Storage**: Cloudflare R2 (S3-compatible, zero egress)
- **Auth**: bcrypt + JWT httpOnly cookies + refresh stateful (HMAC-SHA256 rotação atômica)
- **Pagamentos**: Stripe Checkout + webhooks
- **OCR**: OpenAI gpt-4o-mini Vision
- **Email**: Resend
- **Observability**: Sentry + PostHog
- **Quality**: Biome (lint+format) + Vitest + Playwright (E2E planned)

## Setup dev (5 minutos)

```bash
# 1. Clone
git clone https://github.com/emernuness/quita.git
cd quita

# 2. Dependências
pnpm install

# 3. Subir Postgres + Redis local (docker-compose.dev.yml já configurado)
docker compose up -d

# 4. Configurar env
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
# Edite apenas DATABASE_URL e REDIS_URL se diferentes do default

# 5. Migrate + seed
pnpm --filter @quita/api exec prisma migrate deploy
pnpm --filter @quita/api db:seed

# 6. Rodar
pnpm dev   # api em :3001, web em :3000
```

Acesse http://localhost:3000.

## Scripts úteis

```bash
pnpm typecheck                                      # 6/6 packages
pnpm lint                                           # Biome
pnpm test                                           # Vitest todos
pnpm --filter @quita/api exec vitest run --coverage # API coverage threshold
pnpm --filter @quita/api db:seed                    # Re-seed tabelas referência
pnpm --filter @quita/api exec prisma studio         # GUI database
```

## Estrutura

```
apps/
  api/          # NestJS — controllers/services/processors BullMQ
    src/modules/  # 20 módulos: auth, debts, financial, settlements, motor, ocr, etc
    src/queues/   # 8 processors + scheduler + motor-trigger
    prisma/       # schema + 6 migrations + seed
  web/          # Next 15 App Router
    src/app/
      (public)/   # /, /termos, /privacidade
      (auth)/     # /login, /register, /forgot-password
      (onboarding)/ # /bem-vindo, /income, /location, /concern, /categories
      (app)/      # painel autenticado (20+ telas) + /ocr/{consent,capture,confirm,quota}
packages/
  motor/        # 13 módulos puros + 105 testes
  shared/       # Zod schemas + enums + tipos cross-package
docs/
  quita-especificacao/  # spec original (Fases 1-6)
  runbook.md            # on-call
  MIGRATIONS.md         # plano por migration
  CHANGELOG.md
  ARCHITECTURE.md
```

## Conceitos do motor

5 **estados financeiros**: `healthy_with_debt | tight_budget | monthly_deficit | overindebtedness | practical_insolvency`

5 **modos operacionais**: `payoff | stabilization | crisis_mode | protection | survival`

3 **níveis de diagnóstico**: `minimal | basic | detailed` (onboarding fracionado, Spec Fase 1 §7.1)

Pipeline event-driven: cada mutação CRUD (income/expense/debt/payment/settlement/goal/reserve/behavior) enfileira `motor-recalc` via `MotorTriggerService`. Processor recalcula + emite notificação in-app.

## Compliance

- **LGPD**: ConsentLog versionado, soft-delete 30d + DataRetentionCleanupProcessor, anonimização AuthAuditLog
- **Lei 14.181/2021** (superendividamento): canais apoio (CRAS, Defensoria, IDEC) integrados, modos crise/proteção/sobrevivência respeitam dignidade

## Contribuir

Veja `.github/PULL_REQUEST_TEMPLATE.md` para checklist do PR. Padrão: conventional commits + squash merge.

## Licença

Privado / proprietário.
