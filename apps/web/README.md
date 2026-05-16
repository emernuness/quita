# @quita/web

Frontend web do Quita — Next.js 15 (App Router) + React 19 + Tailwind v4 + TypeScript strict.

## Como rodar

```bash
# 1) Backend (em outro terminal, na raiz do monorepo)
pnpm --filter @quita/api dev   # NestJS em http://localhost:3000

# 2) Web
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @quita/web dev   # http://localhost:4400
```

Build de produção: `pnpm --filter @quita/web build && pnpm --filter @quita/web start`.

## Variáveis de ambiente

| Nome | Default | Descrição |
|------|---------|-----------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | Base URL do backend NestJS, com o prefixo `/api`. Compilada no bundle pelo Next — mudar valor exige rebuild. |

## Arquitetura

- `src/app/**` — App Router. Rotas:
  - `/`, `/login`, `/register`, `/forgot-password` — área pública
  - `/onboarding/{income,categories,debt-detail,expenses}` — fluxo de cadastro inicial
  - `/app/**` — área autenticada com `AppShell` + sidebar
- `src/components/**` — UI (Button, Input, Card, Money, Modal, Sidebar…)
- `src/components/modals/**` — diálogos overlay (NewDebt, PayDebt, Confirm…)
- `src/hooks/**` — React Query wrappers por domínio
- `src/lib/api.ts` — axios instance + `apiGet/apiPost/apiPatch/apiDelete` + `ApiError`
- `src/lib/auth-redirect.ts` — única fonte de verdade para redirects baseados em auth + onboarding
- `src/lib/labels.ts` — labels e tones semânticos (DebtStatus, PaymentType, IncomeSource, ExpenseCategory)
- `src/lib/masks.ts` — `maskBRL`, `maskPhone`, `onlyDigits` etc.
- `src/lib/zod.ts` — `validateWithZod` com mensagens PT-BR
- `src/stores/auth.ts` — Zustand store de auth (token em `localStorage`)

## Decisões técnicas

- **Token em `localStorage`**: tradeoff conhecido — XSS expõe o token. Foi escolhido por simplicidade do MVP. Antes de produção, mover para httpOnly cookie + CSRF e adicionar CSP no `next.config.mjs`.
- **CORS**: backend usa `app.enableCors()` aberto — restringir para a origem real antes de produção.
- **Modais como overlays JS**: não usamos `<dialog>` HTML porque queremos backdrop animado + click-fora; trade-off documentado com `biome-ignore` em `components/Modal.tsx`.
- **`/forgot-password` e `/app/profile/export-data`**: telas com banner "Em desenvolvimento" — backend ainda não tem endpoints.
- **Modo discreto**: usa o componente `<Money>` que consulta `useAuthStore` e oculta valores (`R$ ••••`) quando `discreteMode = true`. Toggle em `/app/profile/discrete-mode`.
- **Design tokens**: CSS vars em `globals.css`. Tailwind v4 usa `@theme {}` para expor classes; valores arbitrários (`bg-[var(--color-teal)]`) ainda dominam — migração futura para classes nomeadas (`bg-teal`).

## Comandos úteis

```bash
pnpm --filter @quita/web typecheck    # tsc --noEmit
pnpm --filter @quita/web build        # produção
pnpm exec biome check apps/web --write  # lint/format
```

## Sem cobertura de testes ainda

Não há test runner configurado neste app. Adicionar Vitest + Playwright antes do go-live.
