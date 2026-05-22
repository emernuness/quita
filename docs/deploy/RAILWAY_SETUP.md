# Railway — apps/api deploy

## Pré-requisitos
- Conta Railway com método de pagamento.
- Repositório GitHub conectado.

## Serviços a criar
1. **Postgres** (`quita-postgres`) — region `us-east1`.
2. **Redis** (`quita-redis`) — mesma region.
3. **API service** (`quita-api`) — build de `apps/api` via Nixpacks ou Dockerfile.

## Variáveis de ambiente (`quita-api`)
```
DATABASE_URL          = ${{Postgres.DATABASE_URL}}
REDIS_URL             = ${{Redis.REDIS_URL}}
PORT                  = 3000
NODE_ENV              = production
JWT_SECRET            = [gerar 64 chars random]
REFRESH_TOKEN_HMAC_SECRET = [gerar 64 chars random, distinto do JWT]
CORS_ORIGINS          = https://quita.com.br,https://app.quita.com.br
SENTRY_DSN            = [Sentry project DSN]
POSTHOG_API_KEY       = [PostHog server key]
RESEND_API_KEY        = [Resend API key]
STRIPE_SECRET_KEY     = [Stripe live key — só na Onda 4]
STRIPE_WEBHOOK_SECRET = [Stripe webhook signing — Onda 4]
OPENAI_API_KEY        = [OpenAI billing-capped — Onda 4]
```

## Build settings
- Root: `/`
- Build command: `pnpm install --frozen-lockfile && pnpm --filter @quita/api db:generate && pnpm --filter @quita/api build`
- Start command: `pnpm --filter @quita/api start:prod`

## Migrations
Após primeiro deploy:
```sh
railway run --service quita-api -- pnpm --filter @quita/api exec prisma migrate deploy
railway run --service quita-api -- pnpm --filter @quita/api db:seed
```

## Health check
- Path: `/api`
- Espera resposta 404 (sem rota raiz mas API up).
- TODO Onda 7: criar `/api/health` retornando 200.

## Domínio
- `api.quita.com.br` → Railway service.
- Cloudflare proxy para mitigar DDoS.
