# Changelog

Todas mudanças notáveis deste projeto. Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Unreleased] — refactor/onda-1-foundation

### Added (Foundation)

**Motor event-driven** (Spec Fase 4 §7.5):
- `MotorTriggerService` injetado em 7 services CRUD (debts, financial, settlements, goals, emergency-reserve, behavior-profile, onboarding)
- 14 mutates enfileiram triggers tipados em `motor-recalc` queue
- `RecalculateStateProcessor` reage + emite notificação in-app

**Onboarding fracionado** (Spec Fase 1 §6.1.1 + §7.1):
- 5 telas: bem-vindo (consent) → income (paymentDay/stability/guaranteed) → location (UF + dependentes) → concern (MainConcern) → categories
- `complete()` enfileira primeiro recálculo + seta `diagnosisLevel="minimal"`
- `BehaviorProfileService.upsert` promove para `basic` quando `preferredStrategy != undecided`

**OCR Premium 4 telas** (Spec Bridge OCR §E1.1-E1.4):
- `/app/ocr/{consent,capture,confirm,quota}` com state machine via search params
- Upload direto browser → R2 via signed URL (sem trafegar base64)
- `OcrConsentGuard` (NM-2) bloqueia sem ConsentLog `data_processing` v="ocr-v1"
- `OcrController` com endpoints quota/signed-upload-url/extract-by-key
- `R2StorageService` ganhou `getSignedUploadUrl()` + `getObjectBuffer()`

**Modos operacionais diferenciados** (Spec §8):
- `/app/modo-protecao` — reserva mínima + pausa dívidas + dignidade
- `/app/modo-sobrevivencia` — Lei 14.181/2021 + canais apoio + sem julgamento
- Mantém `/app/modo-crise` existente
- Sidebar item por modo

**Notifications in-app** (Spec Fase 5 §10):
- Tabela `notifications` + enums `NotificationCategory` (8) + `NotificationSeverity` (4)
- `NotificationBell` no AppShell com badge + dropdown 360px + polling 60s
- Processor emite após recálculo para 10 trigger events relevantes

**Telas Spec faltantes:**
- §6.12 C1 Refinamento: agrupado por 4 dimensões com score % + sugestões (`useDataFreshness` + `/user/data-freshness`)
- §6.13 G3 Segurança: change password + logout-all (revoga refresh tokens) + listagem AuthAuditLog 50 últimos eventos
- §6.15 H2 Apoio: 10 canais reais (CVV 188, CRAS, Defensoria UF, IDEC, Proteste, Anatel 1331 + 4 anteriores)

**Conteúdo legal templated:**
- `/termos` v1.0.0 com banner "revisão jurídica pendente"
- `/privacidade` v1.0.0 LGPD compliant (Art. 7, 18, 33) com banner
- Issue `legal-review` aberta para revisão real

**Dark mode** (Tailwind 4):
- `@variant dark` + tokens em `html.dark` selector
- `useTheme()` (light/dark/system) + ThemeToggle em `/app/profile`
- Script inline previne FOUC

**A11y + SEO + Responsive:**
- Skip link "Pular para conteúdo" no AppShell
- Input com `aria-invalid` + `aria-describedby` + role="alert"
- Focus rings globais via `:focus-visible`
- Open Graph + Twitter + robots.ts + sitemap.ts
- Padding responsivo + NotificationBell `w-[min(90vw,360px)]`

**Storage R2** (Cloudflare):
- `R2StorageService` com upload/download/delete
- Retenção 30d via `OcrCleanupProcessor` diário 05:00 UTC

**Testes (165 total):**
- 105 motor (cobertura ~95%)
- 59 API (services + processors + auth + env)
- 1 web smoke
- Coverage threshold 30% enforced no CI (target progressivo 50→70)

**Infra:**
- `.env.example` completo
- CI com Postgres + Redis services + migrate + seed + typecheck + lint + coverage + docker build smoke
- Deploy workflows Vercel + Railway (manual approval gate via secrets)
- Dependabot weekly (npm + github-actions)
- PR template com self-review checklist
- Sentry interceptor (5xx + contexto)
- Env validation Zod global (`validateEnv()` antes do bootstrap)
- 6 schedulers BullMQ (monthly-rollover, data-retention, ocr-cleanup, data-freshness, interest-rate, settlement-revalidation)

### Changed

- Schema Prisma: +1 tabela `notifications`, +2 enums
- 7 modules importam `QueueModule` para injetar `MotorTriggerService`
- Onboarding API: +2 endpoints (`/location`, `/concern`)
- Auth API: +1 endpoint (`/audit-log`)
- User API: +1 endpoint (`/data-freshness`)

### Removed

- Migration 0005 dropou colunas legadas (vide `docs/MIGRATIONS.md`)

### Security

- bcrypt cost 12 nas senhas
- JWT_SECRET + REFRESH_TOKEN_HMAC_SECRET min 32 chars em prod (Zod)
- Refresh token rotação atômica + detecção de reuso
- Helmet + Throttler + CORS restrito
- Cookies httpOnly + secure (prod) + sameSite=lax

### Compliance

- LGPD: ConsentLog versionado, soft-delete 30d
- Lei 14.181/2021: canais apoio + modos crise/proteção/sobrevivência

---

## Dívidas técnicas declaradas (rastreadas via issues)

1. `legal-review` — Termos + Privacy templates precisam revisão jurídica
2. `notification-tz-per-user` — Janela 9-21h fixa em America/Sao_Paulo (MVP)
3. `enable-branch-protection` — Branch protection não-configurável via código
4. `coverage-progressivo` — 30%→50%→70% target
5. `dieese-data-refresh` — Atualização anual manual do seed RegionalMinimumVital
