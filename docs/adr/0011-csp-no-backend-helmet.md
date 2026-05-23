# ADR-0011: CSP gerenciado pelo Next.js, não pelo Helmet

- **Status:** Accepted
- **Data:** 2026-05-22
- **Onda:** 1

## Contexto

`helmet()` em `apps/api/src/main.ts` desabilita explicitamente
`contentSecurityPolicy`. A pergunta: por que não usar o CSP do Helmet
direto no backend?

A API NestJS serve apenas endpoints JSON sob `/api/*`. Não há HTML
renderizado pela API (exceto `/api/docs` do Swagger em dev). O CSP é
relevante para o frontend Next.js (`apps/web`), onde controlamos:
`script-src`, `style-src`, `connect-src` (precisa whitelistar API
origin, posthog.com, sentry.io), `frame-ancestors`, etc.

CSP no backend cobriria apenas o Swagger UI em dev. Em produção, o
Swagger não fica exposto (`NODE_ENV=production` desativa).

## Decisão

- Backend: `helmet({ contentSecurityPolicy: false })` propositalmente.
- Frontend (Next): CSP completo em `apps/web/next.config.mjs` via
  headers async — cobre todas as rotas servidas a usuário.
- Swagger `/api/docs`: desabilitado em produção; CSP fraco em dev é
  aceitável pois é página interna do time.

## Consequências

- **Positivas:** CSP único, centralizado no frontend, evita conflito
  com origens dinâmicas (preview deploys da Vercel).
- **Negativas / trade-offs:** Swagger UI em dev carrega CDN próprio
  sem CSP — aceitável pois não recebe input do usuário externo.
- **Reversibilidade:** alta — habilitar `contentSecurityPolicy` do
  Helmet exige apenas configurar policy.

## Alternativas consideradas

- **CSP duplicado (backend + frontend):** descartada — diverge entre
  camadas e cria fricção em deploys que mudam origens.
- **Bloquear Swagger até em dev:** descartada — atrita debugging diário.

## Referências

- `apps/api/src/main.ts` (helmet config)
- `apps/web/next.config.mjs` (CSP completo)
