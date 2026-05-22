# Vercel — apps/web deploy

## Pré-requisitos
- Conta Vercel.
- Repositório GitHub conectado.
- Domínio `quita.com.br` apontando para Vercel.

## Configuração do projeto
- Framework preset: **Next.js**.
- Root directory: `apps/web`.
- Build command: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @quita/web build`.
- Output directory: `.next`.
- Install command: `cd ../.. && pnpm install --frozen-lockfile`.
- Node version: 20.x.

## Variáveis de ambiente

### Production
```
NEXT_PUBLIC_API_URL        = https://api.quita.com.br/api
NEXT_PUBLIC_POSTHOG_KEY    = [PostHog client key]
NEXT_PUBLIC_POSTHOG_HOST   = https://app.posthog.com
NEXT_PUBLIC_SENTRY_DSN     = [Sentry web DSN]
```

### Preview (PRs)
Mesmas variáveis apontando para `api-staging.quita.com.br`.

## Headers de segurança
Já configurados em `next.config.mjs` (Onda 3):
- Content-Security-Policy (com posthog/sentry whitelisted)
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: bloqueia camera/microphone/geolocation/FLoC

## Domínio
- `quita.com.br` → projeto Vercel.
- `app.quita.com.br` → mesma deploy (alias).

## Functions
- Runtime: edge para rotas estáticas, nodejs para SSR/RSC.
- Region: gru1 (São Paulo).
