# Quita — Fase 6: Plano de Migração e Rollout

> **Status:** rascunho para validação
> **Data:** 17 de maio de 2026
> **Insumo:** Fases 1-5 aprovadas + Bridge OCR aprovado + inventário do código atual em `/mnt/project`
> **Escopo:** plano completo de transição do código atual para o Quita v1.0 especificado nas Fases 1-5
> **Não cobre:** implementação real (fica para o desenvolvimento); marketing pós-launch

---

## Sumário executivo

A Fase 6 traduz **~11.000 linhas de especificação** em um plano executável de migração e rollout. O código atual do Quita tem **12 tabelas, 1 migration, 25 telas, 8 jobs, sem testes, token em localStorage, CORS aberto e sem usuários reais**. A vantagem de não ter usuários é decisiva: a migração pode ser **clean** (drop + recreate) em vez de schema-evolving complexo, mas precisa preservar **decisões técnicas válidas** (modo discreto, design tokens, `resolveAuthRedirect`, hooks React Query, máscaras BRL).

O plano se divide em **7 ondas** ao longo de **~14-16 semanas**:
1. Foundation (auth, schema base, infra)
2. Motor de Decisão (12 módulos + BullMQ)
3. Telas Core + Refinamento Progressivo
4. Premium (OCR + Stripe)
5. Notificações + Observability
6. Beta privado fechado (15 testers)
7. Launch público

Cada onda tem **feature flags PostHog**, critérios de saída, plano de rollback e checkpoints de qualidade. As **18 migrations** seguem ordem estrita de dependências. **Riscos identificados** estão tabulados com mitigação.

---

## 1. Estado do código atual

### 1.1 Stack confirmada (alinha com especificação)

| Camada | Atual | Especificado | Match |
|---|---|---|---|
| Monorepo | pnpm + `apps/api` + `apps/web` + `@quita/shared` | mesmo | ✅ |
| Backend | NestJS 11 + Prisma 6 | mesmo | ✅ |
| Frontend | Next 15 (App Router) + React 19 + Tailwind 4 | mesmo | ✅ |
| Validação | Zod 3 compartilhada | mesmo | ✅ |
| Autenticação | JWT + Passport + bcryptjs | refresh stateful + httpOnly cookie + HMAC-SHA256 | 🟡 refatorar |
| Banco | PostgreSQL via Supabase | mesmo | ✅ |
| Storage | (não implementado) | Supabase Storage para OCR | 🟢 adicionar |
| Jobs | (não implementado — listados em doc) | BullMQ + Redis | 🟢 adicionar |
| Estado client | Zustand + React Query (axios) | mesmo | ✅ |
| Testes | nenhum | Vitest + Playwright antes do go-live | 🟢 adicionar |

**Diagnóstico.** Stack base está correta. Mudanças concentradas em: autenticação, jobs, storage, OCR, Stripe, notificações, testes.

### 1.2 Schema atual (12 tabelas)

| # | Tabela | Status na refatoração |
|---|---|---|
| 1 | `users` | 🟡 Manter, adicionar 7 campos (stateCode, dependentsCount, deletedAt, onboardingStep refinado, behaviorProfileId opcional, etc.) |
| 2 | `incomes` | 🟡 Refatorar — adicionar `frequency`, `floor`/`ceiling`, `isProtectedMinimum` |
| 3 | `expenses` | 🟡 Refatorar — enum `category` ganha valores; campos `isEssential`, `canCut`, `canReduce`, `consequenceIfSkipped` |
| 4 | `debt_categories` | ✅ Manter |
| 5 | `debts` | 🟡 Refatorar — adicionar `interestRateMonthly`, `priorityScore`, `priorityFactors`, `riskConsequence`, `hasCollateral`, `isNegotiable`, etc. |
| 6 | `payments` | ✅ Manter |
| 7 | `payment_plans` | 🔴 Renomear para `monthly_plans` (esquema diferente — Fase 2) |
| 8 | `plan_timeline_items` | 🔴 Substituir por `recommended_actions` (esquema diferente) |
| 9 | `ai_insights` | 🔴 **DROP** — empurrada para v2 do produto (Fase 3 §9.4) |
| 10 | `notification_preferences` | ✅ Manter |
| 11 | `data_exports` | 🟡 Refatorar para incluir imagens OCR (LGPD art. 18 V) |
| 12 | `user_journey_stats` | 🔴 **DROP** — campos calculáveis em runtime ou redundantes |

**Migration única atual:** `20260313043124_init`.

### 1.3 Tabelas a adicionar (17 novas)

| Tabela | Origem | Fase | Migration |
|---|---|---|---|
| `behavior_profile` | Refinamento C5 | Fase 2 | (parte da migration base nova) |
| `user_goals` | Refinamento C6 | Fase 2 | idem |
| `support_channels` | Modo Crise/Sobrevivência | Fase 2 | idem |
| `regional_minimum_vital` | Cálculo de mínimo existencial | Fase 2 | idem |
| `interest_rate_history` | Job `InterestRateUpdate` | Fase 2 | idem |
| `consent_logs` | LGPD | Fase 2 | idem |
| `settlement_evaluations` | Motor de avaliação de acordos | Fase 2 + 3 + Bridge | idem + Migration 14 (campos OCR) |
| `seasonal_expenses` | IPVA/IPTU | Fase 2 + 3 | idem |
| `emergency_reserve_targets` | Reserva de emergência | Fase 2 | idem |
| `monthly_plans` (substitui `payment_plans`) | Motor de Decisão | Fase 2 | idem |
| `recommended_actions` (substitui `plan_timeline_items`) | Motor de Decisão | Fase 2 | idem |
| `refresh_tokens` | Auth refresh stateful | Fase 4 | Migration 13 |
| `auth_audit_logs` | LGPD + segurança | Fase 4 NM-6 | Migration 16 |
| `subscriptions` | Stripe | Fase 5 | Migration 17 |
| `notifications` | In-app | Fase 5 | Migration 18 |
| `processed_stripe_events` | Idempotência webhook | Fase 5 v2 NM-1 | Migration 19 |
| `ocr-uploads` (bucket Supabase) | OCR Premium | Bridge | Migration 15 |

**Schema final:** ~29 tabelas (12 originais menos 2 descartadas = 10 mantidas + 17 novas + 2 renomeadas).

### 1.4 Endpoints atuais (~45) e mudanças

Os ~45 endpoints atuais cobrem CRUD básico de:
- Auth (login, register, refresh, logout)
- Incomes, Expenses, Debts, Payments
- Plans (generate, strategy)
- Insights (will be deprecated)
- Exports
- Preferences

**Novos endpoints a adicionar (estimativa 30+):**
- Settlement evaluations (avaliar, listar, expirar)
- OCR (upload, confirm, refresh-signed-url)
- Subscription (Stripe checkout, portal, webhook, cancel)
- Notifications (list, mark read, delete, mark all)
- Refinement endpoints (behavior, goals, seasonals, emergency reserve)
- Support channels (lookup by state)
- Consent (give, revoke, history)
- Data export (request, status, download — refatorado)
- Account deletion (request, confirm)

**Total final:** ~75-80 endpoints.

### 1.5 Telas atuais (25 mapeadas) e mudanças

Telas atuais (parcial — baseado no doc do projeto):
- Tela 06 — Cadastro de Dívidas (onboarding)
- Tela 07 — Detalhe Dívida (onboarding)
- Tela 08 — Onboarding (renda + despesas pré-categorizadas)
- Tela 09 — Home
- Tela 11 — Finanças
- Tela 12 — Histórico mensal
- Tela 13 — Plano
- Tela 15 — Detalhe de dívida com insights
- Tela 16 — Registrar pagamento
- Tela 17 — Receitas
- Tela 18 — Despesas
- Tela 22 — Exportação
- Tela 23 — Situação crítica
- Tela 24 — Quitação
- Tela 25 — Jornada (gamificação)

**Telas a refatorar:** 09 (home), 13 (plano), 15 (insights → recommended actions), 23 (crítica → Modo Sobrevivência), 25 (jornada → talvez remover ou simplificar).

**Telas a descartar:** Tela 25 da forma atual (gamificação não condiz com tom sóbrio); insights individuais.

**Telas a adicionar** (Fase 5 §3 + §15.1): ~15+ telas novas — refinamento progressivo, OCR fluxo, configurações expandidas, modo crise, canais de apoio, plano Premium, exportar/excluir conta, plano de longo prazo, despesas sazonais.

### 1.6 Jobs atuais (8) vs especificado (14)

| Job atual | Status | Equivalente na especificação |
|---|---|---|
| `check-overdue-debts` | ✅ Manter | `OverdueDebtsCheckJob` |
| `generate-weekly-progress` | 🟡 Repensar | Sem equivalente direto (tom sóbrio descarta progresso semanal) |
| `send-due-date-alerts` | ✅ Manter | `PaymentReminderJob` (Fase 5 §15.16) |
| `process-exports` | ✅ Manter | `DataExportJob` |
| `expire-exports` | ✅ Manter | `DataRetentionCleanupJob` |
| `cleanup-undone-payments` | ✅ Manter | `UndonePaymentCleanupJob` |
| `recalculate-plans` | 🟡 Refatorar | `MotorRecalcJob` (orquestrador dos 12 módulos) |
| `detect-critical-state` | 🟡 Refatorar | Integrado ao `MotorRecalcJob` (não é mais job separado) |

**Jobs novos (6):**
- `InterestRateUpdateJob` (BCB SGS — mensal)
- `SeasonalExpenseReminderJob` (sazonais próximas)
- `SettlementExpiringReminderJob` (Fase 5)
- `EmailDispatchJob` (Resend)
- `OcrCleanupJob` (30 dias)
- `OcrCostReportJob` (mensal)

**Total final: 14 jobs em 2 queues** (`motor-recalc` + `motor-scheduled`).

### 1.7 Decisões técnicas atuais — preservar ou refatorar

| Decisão atual | Decisão na refatoração | Razão |
|---|---|---|
| Token em `localStorage` | 🔴 httpOnly cookie + refresh stateful | Segurança (XSS) |
| CORS aberto (`enableCors()`) | 🔴 Restrito à origem real + CSRF token | Segurança (CSRF) |
| Modais como overlays JS (não `<dialog>`) | ✅ Manter | Convenção válida; trade-off documentado |
| Modo discreto (`<Money>` oculta valores) | ✅✅ **Preservar como feature** | Crítica para usuário endividado em ambiente público |
| Design tokens em CSS vars | ✅ Manter | Boa prática |
| `resolveAuthRedirect` | 🟡 Estender para suportar novos passos do onboarding | Refatoração leve |
| React Query wrappers em `src/hooks/**` | ✅ Manter padrão | Boa convenção |
| `src/lib/labels.ts` + `src/lib/masks.ts` | ✅ Manter | Boa convenção |
| Zustand store de auth | ✅ Manter, mas sem token (cookie cuida) | Refatoração leve |
| Sem testes | 🔴 Adicionar Vitest + Playwright na Onda 1 | Crítico antes do beta |
| 1 migration `init` única | 🔴 Substituir por migrations sequenciais 01→19 | Histórico limpo |

### 1.8 Riscos do código atual

| # | Risco | Severidade | Mitigação |
|---|---|---|---|
| R1 | Token JWT em localStorage exposto a XSS | 🔴 Alto | Migrar para httpOnly cookie (Onda 1) |
| R2 | CORS aberto permite CSRF | 🔴 Alto | Restringir CORS + CSRF token (Onda 1) |
| R3 | Sem CSP no `next.config.mjs` | 🟠 Médio | Adicionar Content-Security-Policy (Onda 1) |
| R4 | Sem testes — bugs em produção | 🔴 Alto | Vitest + Playwright (Onda 1 + ao longo) |
| R5 | bcrypt rounds default | 🟠 Médio | Subir para 12 rounds (Onda 1) |
| R6 | Schema único migration → difícil rollback | 🟠 Médio | Refazer com sequência (Onda 1) |
| R7 | Estado da queue indefinido | 🟡 Baixo | BullMQ + Redis na Onda 1 |

---

## 2. Princípios da migração

**2.1 Sem usuários reais → migração clean.**
O código atual não tem usuários em produção. Isso permite drop + recreate sem preocupação com perda de dados. Não precisa de zero-downtime deploy nesta etapa. Após o beta privado, todo deploy deve respeitar ZDD.

**2.2 Feature flags desde o dia 1.**
PostHog configurado na Onda 1. Toda nova feature entra atrás de flag. Permite rollout gradual para testers e kill switch instantâneo se algo der errado.

**2.3 Reversibilidade obrigatória.**
Toda migration Prisma tem operação de rollback documentada. Toda feature behind-flag pode ser desligada via PostHog sem deploy. Backup snapshot antes de cada onda.

**2.4 Testes antes de merge.**
Vitest para unit tests dos serviços do motor (matemática, regras de decisão). Playwright para fluxos críticos (onboarding completo, pagamento Premium, fluxo OCR). Cobertura alvo do motor: ≥ 85% (cenários canônicos da Fase 3 §18).

**2.5 Documentação como código.**
Cada novo módulo backend tem README curto. Cada componente UI complexo tem Storybook (pós-Onda 1). ADRs (Architecture Decision Records) em `/docs/adr/` para decisões reversíveis.

**2.6 Observability desde a Onda 1.**
Sentry para erros, PostHog para analytics, logs estruturados (JSON) com pino. Sem isso, beta vira chute.

**2.7 LGPD-first.**
Antes do beta privado: política de privacidade, termos de uso, fluxos de export/delete funcionando. Sem isso, NO-GO mesmo internamente.

---

## 3. Inventário completo de mudanças

### 3.1 Tabelas

**Mantém (4):** `debt_categories`, `payments`, `notification_preferences`, e parcialmente o esqueleto de `users`, `incomes`, `expenses`, `debts` (com adição de campos).

**Renomeia (2):**
- `payment_plans` → `monthly_plans` (esquema diferente)
- `plan_timeline_items` → `recommended_actions` (esquema diferente)

**Descarta (2):**
- `ai_insights`
- `user_journey_stats`

**Adiciona (17):** listadas em §1.3.

### 3.2 Enums

**Adicionar:**
- `financial_state` (5 valores: healthy_with_debt, tight_budget, monthly_deficit, overindebtedness, practical_insolvency)
- `operation_mode` (5 valores: payoff, stabilization, crisis_mode, protection, survival)
- `recommended_action_type` (~7 valores: pay, negotiate, reject, wait, pause, cut_expense, review)
- `behavior_aversion` (avalanche, snowball, hybrid, indifferent)
- `consent_type` (ocr_data_processing, data_processing_general, marketing_communications, beta_program)
- `notification_type` (8 tipos)
- `subscription_status` (active, past_due, canceled, incomplete)
- `expense_strict_category` (essencial, protetiva_renda, legal, ajustavel, superflua_cortavel) — substitui o `expense_category` atual ou estende
- `income_frequency` (recurring, variable, one_time, seasonal)
- `seasonal_expense_frequency` (annual, semiannual, etc.)
- `auth_event_type` (login_success, login_failure, logout, refresh, password_changed, logout_all)

**Modificar:**
- `expense_category` atual (housing, bills, food, transport, telecom, other) — adicionar valores OU substituir por novo enum estruturado

**Decisão.** Manter `expense_category` atual como **categoria de domínio** (o que é a despesa) e adicionar **`expense_strict_category`** como **classificação estratégica** (essencial vs ajustável vs supérflua). São dimensões ortogonais.

### 3.3 Endpoints

Endpoints atuais (~45) classificados:
- **Manter inalterado** (~20): CRUD básico
- **Refatorar** (~15): mudanças de payload, novos campos, validação Zod compartilhada
- **Substituir** (~5): `/plan/generate` → `/plans/recalc`; `/insights` → `/recommended-actions`
- **Descartar** (~5): endpoints de `ai_insights`, `user_journey_stats`

Endpoints novos: ~30 (listados em §1.4).

### 3.4 Jobs

(Já listados em §1.6.)

### 3.5 Telas

Refatorar telas atuais (parcial — exemplos):

| Tela atual | Mudanças |
|---|---|
| Tela 09 Home | Reestruturar para Espelho (estado + capacidade + 3 ações), preservar componente `<Money>` |
| Tela 13 Plano | Renomear "estratégia" para "modo de operação"; mostrar 5 modos; ações = `recommended_actions` |
| Tela 15 Detalhe Dívida | Adicionar `priority_score`, `priority_factors`, remover insights individuais |
| Tela 23 Crítica | Refatorar para Modo Sobrevivência (UI mais sóbria; sem botão de pagar; canais de apoio) |
| Tela 24 Quitação | Manter mas sem celebração visual |
| Tela 25 Jornada | Simplificar — remover "5 dívidas quitadas", "X em juros economizado" (gamificação descartada); manter apenas histórico de pagamentos |

Telas novas (~20+ — Fase 5 §15.1 tem 22 wireframes ASCII completos + 8 esqueletos).

### 3.6 Componentes UI a preservar

| Componente atual | Status |
|---|---|
| `<Money>` (com modo discreto) | ✅ Preservar — feature crítica |
| `<Button>`, `<Input>`, `<Card>`, `<Modal>` | ✅ Preservar — base shadcn-like já implementada |
| `<Sidebar>` | 🟡 Estender para suportar item "Apoio" condicional |
| Modais (`NewDebt`, `PayDebt`, `Confirm`) | ✅ Preservar; adicionar variantes |

### 3.7 Decisões a preservar do código atual

- Estrutura de pastas (`apps/web/src/**`)
- `src/lib/auth-redirect.ts` (estender)
- `src/lib/labels.ts` (estender com novos rótulos da Fase 5 §7.1-7.2)
- `src/lib/masks.ts` (manter — `maskBRL`, `maskPhone`, `onlyDigits`)
- `src/stores/auth.ts` (refatorar — sem token em localStorage)
- React Query wrappers em `src/hooks/**`
- Design tokens em `globals.css` (atualizar com paleta Fase 5 §4.1)

---

## 4. Schema migration plan

### 4.1 Estratégia: clean migration

Como não há usuários reais, a estratégia mais barata e segura é:

1. **Backup do banco atual** (snapshot Supabase)
2. **Drop do schema atual** (todas as 12 tabelas)
3. **Aplicar migrations 01-19 em sequência** no banco novo
4. **Seeds**: `debt_categories`, `regional_minimum_vital` (27 estados + faixas), `support_channels` (lista por estado)

Vantagens: histórico limpo, sem campos legados, sem dúvida sobre estado intermediário.

Desvantagem: testers do beta privado precisam recadastrar tudo. Aceitável pelo perfil deles (sabem que é beta).

### 4.2 Ordem das migrations (final: 19 migrations)

| # | Migration | Conteúdo | Dependências |
|---|---|---|---|
| **01** | `init_users_auth` | Tabela `users` (completa, com novos campos); cria extensão `uuid-ossp` | — |
| **02** | `init_domain_basics` | `debt_categories` (com seed), `incomes`, `expenses` (com novos campos) | 01 |
| **03** | `init_debts_payments` | `debts` (refatorada), `payments` | 02 |
| **04** | `init_refinement_tables` | `behavior_profile`, `user_goals`, `seasonal_expenses`, `emergency_reserve_targets` | 01 |
| **05** | `init_motor_state` | `monthly_plans`, `recommended_actions` | 03 |
| **06** | `init_settlement` | `settlement_evaluations` (sem campos OCR ainda) | 03 |
| **07** | `init_reference_data` | `regional_minimum_vital` (com seed 27 UFs), `support_channels` (com seed), `interest_rate_history` | — |
| **08** | `init_lgpd` | `consent_logs`, `data_exports` (refatorada) | 01 |
| **09** | `init_notification_prefs` | `notification_preferences` (mantida) | 01 |
| **10** | `init_indexes_perf` | Índices compostos críticos | 01-09 |
| **11** | `phase3_v1_1_adjustments` | `cycleNumber` em `monthly_plans`; `expiresAt`/`invalidatedAt` em `settlement_evaluations` | 05, 06 |
| **12** | `drop_ai_insight_table` | DROP `ai_insights` se zero rows; abort se houver dados | — |
| **13** | `add_refresh_token` | `refresh_tokens` (Fase 4) | 01 |
| **14** | `add_ocr_fields_settlement` | `used_ocr`, `ocr_object_key`, `ocr_extracted_data`, `ocr_confidence` em `settlement_evaluations` | 06 |
| **15** | `create_ocr_bucket` | `INSERT INTO storage.buckets ('ocr-uploads', ...)` | — |
| **16** | `add_auth_audit_log` | `auth_audit_logs` (Fase 4 NM-6) | 01 |
| **17** | `add_subscription_table` | `subscriptions` (Stripe — Fase 5) | 01 |
| **18** | `add_notification_table` | `notifications` (in-app — Fase 5) | 01 |
| **19** | `add_processed_stripe_events` | `processed_stripe_events` (idempotência — Fase 5 v2 NM-1) | 17 |

**Total: 19 migrations.**

### 4.3 Estado intermediário

Durante o desenvolvimento (Ondas 1-5), o banco passa por estados parciais. Critério: **sempre que uma onda termina, as migrations daquela onda devem ser aplicáveis em ambiente limpo via `prisma migrate deploy`**.

```
Onda 1 finaliza → migrations 01-10 + 12 + 13 aplicadas
Onda 2 finaliza → + 11
Onda 4 finaliza → + 14-15 + 17-19
Onda 5 finaliza → + 16 + 18
```

(Ordem por aplicação real difere de ordem cronológica de criação — Prisma aplica em ordem alfabética dos diretórios timestampados.)

---

## 5. Implementação em 7 ondas

### Onda 1 — Foundation (semanas 1-2)

**Objetivo:** ambiente saudável antes de qualquer feature.

**Entregas backend:**
- Migrations 01-10 + 12 (drop ai_insights) + 13 (refresh tokens) aplicadas
- Auth refatorada: cookie httpOnly + refresh stateful + HMAC-SHA256 + `bcrypt rounds=12`
- BullMQ + Redis (Railway) configurado
- 2 queues criadas: `motor-recalc`, `motor-scheduled`
- `BaseProcessor` implementada (Fase 4 §10)
- Configuração de env vars + validação Zod no boot
- CORS restrito a origem real
- Helmet middleware
- Health checks (`/api/v1/health`)
- Logs estruturados com pino
- Sentry instrumentation

**Entregas frontend:**
- Stack atualizada: Tailwind v4 com nova paleta (Fase 5 §4.1)
- Design tokens em CSS vars atualizados
- `<Money>` preservado com modo discreto
- Layout `(app)/layout.tsx` com nova navegação (bottom nav mobile + sidebar desktop)
- Auth store sem token em localStorage
- Interceptor axios para refresh automático
- PWA manifest.json + ícones

**Entregas infra:**
- Railway: backend NestJS + Redis
- Supabase: PostgreSQL + Storage (bucket `ocr-uploads` criado via migration)
- Sentry projeto criado
- PostHog projeto criado (feature flags habilitadas)
- Domínio: `app.quita.com.br` (frontend) + `api.quita.com.br` (backend)

**Entregas qualidade:**
- Vitest configurado em `apps/api`
- Playwright configurado em `apps/web`
- CI: GitHub Actions com lint + typecheck + tests
- Cobertura inicial: smoke tests de auth + health

**Feature flags (PostHog):**
- `motor_recalc_enabled` (off — só liga na Onda 2)
- `ocr_premium_enabled` (off)
- `stripe_checkout_enabled` (off)
- `notifications_enabled` (off)

**Critérios de saída:**
- ✅ `pnpm typecheck` passa em todos os apps
- ✅ `pnpm test` passa
- ✅ `pnpm playwright test` passa com smoke tests
- ✅ Deploy em Railway funciona
- ✅ Auth completo: register → login → refresh → logout funcionando em produção (ambiente staging)
- ✅ Sentry recebe primeiro erro de teste
- ✅ PostHog recebe primeiro evento de teste

**Riscos da Onda 1:**
- Refatoração de auth quebra dev workflow (mitigar: branch separada, code review estrito)
- Setup do BullMQ no Railway pode ter pegadinhas (mitigar: dia 1-2 dedicados a infra)

---

### Onda 2 — Motor de Decisão (semanas 3-5)

**Objetivo:** os 12 módulos do motor funcionando com cenários canônicos passando.

**Entregas backend:**
- Migration 11 aplicada (cycleNumber + expiresAt)
- 12 módulos implementados em `apps/api/src/modules/motor/**`:
  1. `capacity-calculator` (renda líquida → capacidade segura)
  2. `state-classifier` (5 estados)
  3. `mode-selector` (5 modos)
  4. `priority-scorer` (10 fatores → score)
  5. `action-generator` (gera `recommended_actions`)
  6. `settlement-validator` (avalia acordo)
  7. `long-term-projector` (3 cenários)
  8. `seasonal-expense-service` (provisão IPVA/IPTU)
  9. `emergency-reserve-service` (aporte sugerido)
  10. `behavior-profile-service` (avalanche/snowball/hybrid)
  11. `goal-tracker` (UserGoals)
  12. `motor-orchestrator` (composição)
- Jobs BullMQ implementados:
  - `MotorRecalcJob` (orquestrador)
  - `InterestRateUpdateJob` (BCB SGS — gratuito)
  - `UndonePaymentCleanupJob`
  - `OverdueDebtsCheckJob`
- Listener `OnboardingCompletedListener` priority 1 enfileira primeiro recálculo
- Endpoints novos: `/api/v1/plans/current`, `/api/v1/recommended-actions`, `/api/v1/settlements/validate`

**Entregas frontend:**
- Onboarding refatorado (4 passos: renda, cidade+dependentes, despesas essenciais, dívidas) + tela do Espelho
- Home com novo layout (Espelho + plano de ações)
- Detalhe de dívida com `priority_score` + breakdown

**Entregas qualidade:**
- **8 cenários canônicos** (Fase 3 §18) implementados como testes Vitest
- Cobertura do motor ≥ 85%
- Playwright: fluxo completo de onboarding → Espelho

**Feature flags:**
- `motor_recalc_enabled` (on para internos, off para externos)
- `seasonal_expenses_enabled` (off — Onda 3)
- `emergency_reserve_enabled` (off — Onda 3)

**Critérios de saída:**
- ✅ 8 cenários canônicos passam consistentemente
- ✅ Onboarding → Espelho em < 5s (p95)
- ✅ `MotorRecalcJob` consome eventos e atualiza `monthly_plans` corretamente
- ✅ State transitions corretas (testes em todos os 5 estados)

**Riscos da Onda 2:**
- Cenários canônicos podem expor furos no pseudocódigo (mitigar: revisar Fase 3 a cada falha; documentar discrepâncias)
- Performance do motor < 3s pode ser desafio (mitigar: profiling com pino-pretty + Sentry)

---

### Onda 3 — Telas Core + Refinamento Progressivo (semanas 6-8)

**Objetivo:** todas as telas mapeadas na Fase 5 funcionando para Free user.

**Entregas backend:**
- Endpoints de refinamento: `/refinement/behavior`, `/refinement/goals`, `/refinement/seasonals`, `/refinement/emergency-reserve`
- Endpoint de `support-channels` (lookup por UF)
- Endpoint de plano de longo prazo: `/plans/long-term`
- Endpoint de consentimentos: `/consents` (give, revoke, history)
- LGPD: `/data-export` (request, status, download — sem OCR ainda)
- LGPD: `/account/delete` (request com double confirmation)

**Entregas frontend:**
- Todas as 22 telas com wireframe ASCII da Fase 5 implementadas
- 8 esqueletos preenchidos
- Refinamento progressivo: 7 fluxos (C1-C7)
- `<UpcomingSeasonalsList />` na home
- `<CapacityBreakdownTrigger />` (Drawer)
- Tela `/configuracoes/excluir-conta` com double confirmation
- Tela `/apoio` com canais por estado (condicional em modos críticos)
- Modo discreto preservado em todas as telas com valores monetários

**Entregas qualidade:**
- Playwright: 5 fluxos críticos automatizados:
  1. Onboarding completo
  2. Cadastrar dívida + ver plano atualizado
  3. Registrar pagamento + desfazer
  4. Refinamento de comportamento + ver mudança no plano
  5. Exclusão de conta com double confirmation

**Feature flags:**
- `refinement_progressive_enabled` (on para todos)
- `seasonal_expenses_enabled` (on)
- `emergency_reserve_enabled` (on)
- `support_channels_visible` (on, mas item só aparece em modos críticos)

**Critérios de saída:**
- ✅ Free user consegue completar todo o fluxo do app sem encontrar tela em branco
- ✅ 5 fluxos Playwright passam
- ✅ Modo Sobrevivência verificado em ambiente de teste (cenário Carlos da Fase 3)
- ✅ Excluir conta funciona com retention 30d

---

### Onda 4 — Premium: OCR + Stripe (semanas 9-10)

**Objetivo:** funcionalidades Premium operacionais.

**Entregas backend:**
- Migrations 14, 15, 17, 19 aplicadas
- Módulo `ocr/` completo:
  - `OcrService` (OpenAI Vision)
  - `OcrConsentGuard`
  - `OcrQuotaGuard` com lock pessimista
  - Endpoints: `validate-from-image`, `validate-from-image/confirm`, `refresh-signed-url`
  - `OcrCleanupJob` + `OcrCostReportJob`
  - Adição de campos no `SettlementEvaluation`
- Módulo `subscription/` completo:
  - Endpoints: `/checkout`, `/portal`, `/cancel`
  - Webhook `/webhooks/stripe` com idempotência (`processed_stripe_events`)
  - Schema `Subscription`
  - Atualização atômica de `User.planType` + `Subscription` no webhook

**Entregas frontend:**
- Tela `/configuracoes/plano` (Free + Premium views)
- Modal de consentimento OCR (Bridge §5.2)
- Fluxo de câmera/upload de imagem
- Modal de confirmação manual (confidence < 0.7)
- Banner de quota usada
- Indicação visual de Premium ativo

**Entregas qualidade:**
- Testes E2E: fluxo de upgrade Premium (mock do Stripe)
- Testes E2E: fluxo OCR end-to-end (mock do OpenAI Vision)
- Testes unitários: idempotência do webhook Stripe
- Testes unitários: cleanup OCR após 30 dias

**Feature flags:**
- `ocr_premium_enabled` (on)
- `stripe_checkout_enabled` (on)

**Critérios de saída:**
- ✅ Usuário Free vê paywall ao tentar OCR
- ✅ Usuário Premium consegue OCR completo
- ✅ Pagamento Premium (sandbox Stripe) flui de checkout → webhook → User.planType=premium
- ✅ Customer Portal funciona (cancelar, atualizar cartão)
- ✅ Webhook duplicado é detectado e ignorado
- ✅ Quota de 5 OCRs/mês respeita lock pessimista

**Riscos da Onda 4:**
- OpenAI Vision pode mudar formato de resposta (mitigar: parser robusto + fallback para manual)
- Stripe webhook signature verification pode falhar em ambiente local (mitigar: testar com Stripe CLI)
- Custos de OCR podem escalar se quota for burlada (mitigar: monitoramento via `OcrCostReportJob`)

---

### Onda 5 — Notificações + Observability (semana 11)

**Objetivo:** notificações + observability completa antes do beta.

**Entregas backend:**
- Migrations 16 (auth_audit_logs) + 18 (notifications) aplicadas
- Módulo `notification/`:
  - `NotificationService` (in-app)
  - `EmailService` (Resend)
  - Templates React Email para 5 tipos com email
  - Jobs: `PaymentReminderJob`, `SettlementExpiringReminderJob`, `EmailDispatchJob`
  - Marker de email enviado (NM-3 Fase 5 v2)
- Auth audit logs implementado (login, logout, refresh, password change, logout_all)
- Endpoint `/auth/logout-all` (Fase 4 NM-4)

**Entregas frontend:**
- Centro de notificações (popover do sino)
- Polling a cada 60s
- Tela de segurança (`/configuracoes/seguranca`) com sessões ativas + logout all
- Atualização da tela de privacidade com histórico de consentimentos

**Entregas observability:**
- Dashboard PostHog com funnels:
  - Onboarding completion rate por passo
  - Tempo até primeiro Espelho
  - Taxa de refinamento (C1-C7)
  - Conversão Free → Premium
- Alertas Sentry para erros > threshold
- Alertas PostHog para drop em métricas-chave

**Feature flags:**
- `notifications_enabled` (on)
- `email_dispatch_enabled` (on)

**Critérios de saída:**
- ✅ Email de teste chega via Resend
- ✅ Notificação in-app aparece após pagamento ser registrado
- ✅ `PaymentReminderJob` envia lembrete 3 dias antes (testado com data manipulada)
- ✅ Auth audit log registra eventos corretamente
- ✅ Logout all funciona — revoga todos os refresh tokens do usuário
- ✅ Dashboard PostHog mostra eventos reais

---

### Onda 6 — Beta privado fechado (semanas 12-13)

**Objetivo:** validar o produto com 15 testers reais antes do launch.

**Pré-beta (final da semana 11 / início da 12):**
- ✅ Política de Privacidade publicada
- ✅ Termos de Uso publicados
- ✅ Pré-cadastro dos 15 testers (Fase 5 §11.2)
- ✅ Consentimento `beta_program` capturado de cada um
- ✅ Sessão de onboarding por chamada de vídeo (Fase 5 §11.4)

**Durante o beta (semanas 12-13):**
- Diário: acompanhar Sentry + PostHog
- Dia 7: check-in WhatsApp (Fase 5 §11.4)
- Dia 14: entrevistas individuais

**Métricas observadas (Fase 5 §11.3):**
- Tempo médio do Onboarding: alvo < 5min
- Drop-off por passo: < 25%
- Taxa de refinamento em 14 dias: > 40%
- Voltas espontâneas em 30 dias: ≥ 3x/usuário
- NPS dia 14: > 30
- Reportes de tom inadequado: 0

**Feature flags PostHog:**
- Habilitadas seletivamente para os 15 testers (whitelist via `posthog.identify({ beta_user: true })`)
- Resto do mundo não tem acesso ao app

**Entregas adicionais:**
- Canal de feedback direto (Slack ou WhatsApp privado)
- Documento de issues conhecidos
- Cadência de hotfixes (deploys diários se necessário)

**Critérios de saída do beta (= Critérios de GO para launch público):**
- ✅ 70%+ dos testers reportam "entendi melhor minha situação"
- ✅ Retenção dia 30: 70%+
- ✅ NPS médio: > 30
- ✅ Zero bugs críticos abertos
- ✅ Zero reportes de tom "desumano" ou "julgador"
- ✅ Performance: p95 do motor < 3s
- ✅ Disponibilidade: > 99% durante o beta
- ✅ Métricas de OCR: avg confidence > 0.75, taxa de "não consegui ler" < 15%
- ✅ Conversão Free → Premium: ≥ 1 tester converteu (sinal de PMF)

---

### Onda 7 — Launch público (semana 14+)

**Objetivo:** abrir o Quita para qualquer pessoa cadastrar-se.

**Pré-launch (semana 14):**
- Auditoria final de segurança (revisão de pen-test interno)
- Backup snapshot do banco
- Verificação de quotas em todos os providers (Supabase, Stripe, OpenAI, Resend, PostHog)
- Plano de comunicação (anúncio interno → primeiros usuários convidados → ampliação gradual)

**Rollout gradual:**
- Semana 14: convite via PostHog para 100 usuários (whitelist)
- Semana 15: 500 usuários
- Semana 16: público amplo (sem whitelist)

**Monitoramento intensivo:**
- 24h on-call rotation entre devs nas primeiras 2 semanas
- Dashboard "war room" sempre aberto
- Threshold de erros: > 5/min → alerta imediato

**Feature flags ainda em uso:**
- Kill switches por feature (OCR, Stripe, Notifications)
- Permite desligar sem deploy se algo der errado

**Critérios de saída do launch:**
- ✅ 30 dias sem incidente crítico
- ✅ 100+ usuários ativos (DAU)
- ✅ Conversão Free → Premium >= 5%
- ✅ NPS >= 40

---

## 6. Estratégia de feature flags (PostHog)

### 6.1 Flags por feature

```yaml
# Foundation (Onda 1)
auth_refresh_token_v2_enabled: on        # mantém ligada após Onda 1

# Motor (Onda 2)
motor_recalc_enabled: on
state_classifier_v2: on  # se tiver versão alternativa

# Refinamento (Onda 3)
refinement_progressive_enabled: on
seasonal_expenses_enabled: on
emergency_reserve_enabled: on
support_channels_visible_in_critical_modes: on

# Premium (Onda 4)
ocr_premium_enabled: on
stripe_checkout_enabled: on

# Notificações (Onda 5)
notifications_in_app_enabled: on
email_dispatch_enabled: on

# Pós-MVP (sempre off no MVP)
push_web_enabled: off
chat_with_ai_enabled: off
mobile_native_enabled: off
```

### 6.2 Plano de rollout

Toda feature passa por 4 estágios:

1. **Dev** — flag on em ambiente local + staging
2. **Internal** — flag on para `internal_user: true` (devs do Quita)
3. **Beta** — flag on para `beta_user: true` (15 testers)
4. **Public** — flag on para `everyone`

Movimento entre estágios requer:
- Estágio 1 → 2: PR aprovado + testes passando
- Estágio 2 → 3: 1 semana sem regressão em staging
- Estágio 3 → 4: critérios da Onda 6 cumpridos

### 6.3 Kill switches

Cada feature tem kill switch:
- `kill_motor_recalc` → desativa job, retorna plano cached
- `kill_ocr` → endpoint retorna 503 com mensagem "OCR temporariamente indisponível, tente manual"
- `kill_stripe` → tela de upgrade mostra "Em manutenção"
- `kill_email_dispatch` → emails ficam na queue, retomam quando flag volta

Tempo de ativação: < 60s via dashboard PostHog. **Sem deploy.**

---

## 7. Riscos identificados

| # | Risco | Prob | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Refatoração de auth quebra dev | Alta | Médio | Branch isolada + code review estrito; staging primeiro |
| R2 | Cenários canônicos expõem furos no pseudocódigo | Média | Alto | Tratar como bug + iterar; revisão direta da Fase 3 |
| R3 | OpenAI Vision muda formato | Baixa | Médio | Parser robusto + fallback manual |
| R4 | Stripe webhook signature falha local | Média | Baixo | Stripe CLI no dev; sandbox |
| R5 | Custos OCR escalam | Baixa | Alto | OcrCostReportJob + alerta em PostHog se > $50/mês |
| R6 | Tester relata tom inadequado | Média | Alto | Revisar copy + retrabalhar Fase 5; possível adiar launch |
| R7 | Tester em `survival` real fica pior | Baixa | Muito alto | Triagem prévia + canal direto + acompanhamento humano |
| R8 | Bug crítico no motor durante beta | Média | Alto | Kill switch via PostHog; rollback de migration se preciso |
| R9 | Vazamento de dado sensível | Baixa | Crítico | Audit logs + revisão de logs antes do beta; LGPD compliance |
| R10 | Performance < 3s não atendida | Média | Médio | Profiling com Sentry; cache de plano em Redis |
| R11 | LGPD-related complaint | Baixa | Alto | DPO designado + plano de resposta a incidente |
| R12 | Conta Stripe bloqueada (compliance) | Baixa | Crítico | Documentar negócio + KYC completo |
| R13 | Supabase outage | Baixa | Alto | Backup diário + plano de fallback em outra região |
| R14 | OpenAI Vision outage | Média | Baixo | Fallback automático para manual + status banner |
| R15 | Resend daily limit atingido | Baixa | Médio | Monitor em PostHog; upgrade rápido para pago |

---

## 8. Cronograma estimado

```
Semana  1 ──┐
Semana  2 ──┘ Onda 1 — Foundation

Semana  3 ──┐
Semana  4 ──┤ Onda 2 — Motor de Decisão
Semana  5 ──┘

Semana  6 ──┐
Semana  7 ──┤ Onda 3 — Telas Core + Refinamento
Semana  8 ──┘

Semana  9 ──┐
Semana 10 ──┘ Onda 4 — Premium (OCR + Stripe)

Semana 11 ──── Onda 5 — Notificações + Observability

Semana 12 ──┐
Semana 13 ──┘ Onda 6 — Beta privado fechado

Semana 14 ──┐
Semana 15 ──┤ Onda 7 — Launch público
Semana 16 ──┘
```

**Total: 16 semanas** (~4 meses).

**Buffers embutidos:**
- Cada onda tem 20% de buffer interno (week 5 = buffer da Onda 2)
- Semana 13 é buffer da Onda 6 (analisar feedback)
- Semana 16 é buffer da Onda 7 (estabilização)

**Marcos públicos:**

| Marco | Semana | Entrega |
|---|---|---|
| M1 — Foundation done | 2 | Auth refatorada, infra pronta |
| M2 — Motor done | 5 | 8 cenários canônicos passando |
| M3 — Telas core done | 8 | Free user fluxo completo |
| M4 — Premium done | 10 | OCR + Stripe operacionais |
| M5 — Beta-ready | 11 | Sentry + PostHog + Resend operacionais |
| **M6 — BETA LAUNCH** | **12** | 15 testers convidados |
| M7 — Public-ready (GO/NO-GO) | 13 | Decisão de prosseguir ou adiar |
| **M8 — PUBLIC LAUNCH** | **14** | Convites a 100 usuários |
| M9 — Public stable | 16 | Open signup |

---

## 9. Critérios GO/NO-GO

### 9.1 GO para Beta Privado (final da Onda 5)

**Mandatórios (todos):**
- ✅ Auth refatorada operacional (httpOnly + refresh stateful + audit logs)
- ✅ 12 módulos do motor passando 8 cenários canônicos
- ✅ Todas as 22 telas com wireframe ASCII implementadas
- ✅ OCR Premium fluxo completo (incluindo confirmação manual)
- ✅ Stripe Checkout + Customer Portal operacionais
- ✅ Notificações in-app + email operacionais
- ✅ Política de Privacidade + Termos de Uso publicados
- ✅ Fluxos LGPD: export + delete funcionando
- ✅ Sentry + PostHog + Resend operacionais
- ✅ Backup diário do banco configurado
- ✅ 15 testers identificados e contactados

**Recomendáveis:**
- 🟡 Cobertura de testes do motor ≥ 85%
- 🟡 Playwright cobrindo 5 fluxos críticos
- 🟡 Performance: p95 < 3s
- 🟡 Disponibilidade: > 99%

### 9.2 GO para Launch Público (final da Onda 6)

**Mandatórios (todos):**
- ✅ Critérios de saída do beta (§5 Onda 6) atendidos
- ✅ Zero bugs críticos abertos
- ✅ Zero reportes de tom inadequado
- ✅ Auditoria de segurança interna feita
- ✅ Plano de comunicação aprovado
- ✅ Suporte ao usuário definido (email de contato + tempo de resposta SLA)
- ✅ DPO designado para responder a requisições LGPD

**Sinais de PMF (recomendáveis):**
- 🟢 ≥ 1 tester converteu Free → Premium organicamente
- 🟢 NPS > 40
- 🟢 Retenção dia 30: > 70%
- 🟢 Tempo médio de sessão > 3min

**NO-GO** se:
- 🔴 Bug que cause perda de dados financeiros do usuário
- 🔴 Vulnerabilidade de segurança crítica
- 🔴 Reporte de incidente psicológico ligado ao app
- 🔴 NPS < 0 ou retenção < 40%

### 9.3 Critério de adiamento

Se NO-GO no marco M7 (semana 13):
1. Adiar launch público em 2-4 semanas
2. Reabrir beta com correções
3. Revisar Fase 5 se for problema de UX/copy
4. Revisar Fase 3 se for problema de motor

---

## 10. Plano de rollback

### 10.1 Rollback por onda

| Onda | Mecanismo de rollback |
|---|---|
| 1 | Revert do PR + redeploy versão anterior; backup do banco vazio ainda permite drop e recreate |
| 2 | Feature flag `motor_recalc_enabled: off` retorna comportamento legado; rollback de migration 11 com `prisma migrate resolve --rolled-back` |
| 3 | Feature flags por refinamento (granular); rollback de UI = revert frontend |
| 4 | Kill switches OCR + Stripe; webhook Stripe pode ficar suspenso (eventos ficam no buffer Stripe) |
| 5 | Notifications fora do air = jobs continuam enfileirando, retomam quando flag volta |
| 6 | Pausar beta: PostHog flag `beta_active: false` bloqueia logins dos testers; banco intacto |
| 7 | Se launch público der errado: PostHog flag `public_signup_enabled: false` bloqueia novos registros |

### 10.2 Backup strategy

- **Diário:** Supabase point-in-time backup (retenção 7 dias na free tier)
- **Pré-onda:** snapshot manual antes do início de cada onda
- **Pré-launch:** snapshot manual antes do beta E antes do launch público
- **Backup off-site:** export semanal para S3 ou GCS

### 10.3 Plano de incidente

```
1. Detecção (Sentry alert, PostHog drop, reporte de tester)
   ↓
2. Triage (15min para classificar: crítico/alto/médio/baixo)
   ↓
3. Mitigação imediata (kill switch via PostHog se aplicável)
   ↓
4. Comunicação (email aos afetados + banner no app)
   ↓
5. Root cause analysis (24-48h)
   ↓
6. Fix + deploy
   ↓
7. Post-mortem (1 semana após resolução)
```

---

## 11. Infraestrutura e custos

### 11.1 Providers

| Provider | Função | Free tier suficiente? |
|---|---|---|
| Railway | Backend NestJS + Redis | ❌ ($5-20/mês) |
| Supabase | PostgreSQL + Storage + Auth (não usado, mas plataforma) | 🟡 limitado |
| Vercel | Frontend Next.js | ✅ |
| Stripe | Pagamentos | ✅ (cobra %) |
| Resend | Email transacional | ✅ (100/dia) |
| PostHog | Analytics + feature flags | ✅ (1M eventos/mês) |
| Sentry | Errors | ✅ (5k events/mês) |
| OpenAI | OCR Vision | ❌ (pay per use) |
| Cloudflare | DNS + CDN | ✅ |

### 11.2 Custos mensais estimados

**Beta (15 testers, baixo uso):**

| Item | Custo |
|---|---|
| Railway (backend + Redis) | $10-20 |
| Supabase (free tier) | $0 |
| Vercel (free tier) | $0 |
| Stripe (sem volume) | $0 |
| Resend (free tier) | $0 |
| PostHog (free tier) | $0 |
| Sentry (free tier) | $0 |
| OpenAI Vision (15 OCRs/mês) | $1-2 |
| Domínio | $1 (anualizado) |
| **Total beta** | **~$12-23/mês** |

**Public — 1.000 usuários ativos:**

| Item | Custo |
|---|---|
| Railway (backend + Redis) | $30-50 |
| Supabase (Pro tier para storage + connections) | $25 |
| Vercel | $20 (Pro) |
| Stripe | 3.99% + R$ 0,39 por transação |
| Resend (não excede free) | $0-20 |
| PostHog | $0-50 |
| Sentry | $26 (Team) |
| OpenAI Vision (estimativa: 200 OCRs/mês) | $20-30 |
| **Total public** | **~$120-200/mês** |

**Cenário 10.000 usuários:**

| Item | Custo |
|---|---|
| Railway (scaling) | $100-200 |
| Supabase | $25-100 |
| Vercel | $20-50 |
| Stripe | (% do faturamento) |
| Resend | $20-50 |
| PostHog | $50-200 |
| Sentry | $26-80 |
| OpenAI Vision | $200-500 |
| **Total escala** | **~$500-1200/mês** |

**Break-even:**
- Premium R$ 9,90/mês × 100 assinantes = ~R$ 990/mês = ~$200 = cobre custos de 1.000 usuários
- Premium × 600 assinantes = cobre custos de 10.000 usuários (10% de conversão Free→Premium)

---

## 12. Próximos passos pós-Fase 6

Esta é a **última fase de especificação**. A partir daqui:

### 12.1 Imediato (semana 0)

- Aprovação interna do plano de migração
- Setup de repositórios (se forem diferentes do atual)
- Definição de responsabilidades (quem implementa o quê)
- Setup de ferramentas (Sentry, PostHog, Stripe, Resend, OpenAI)
- Compra do domínio definitivo
- Criar `BACKLOG_POS_MVP.md` consolidando todas as decisões adiadas:
  - Chat com IA (AiInsight reativada)
  - Push web com Service Worker
  - SMS para situações críticas
  - i18n com next-intl
  - Detecção automática de PII em imagens OCR
  - Autocomplete de cidade IBGE
  - OCR cleanup via SQL direto
  - Mobile native (Expo)
  - Decimal.js
  - WebSocket para notificações em tempo real

### 12.2 Durante a execução

- Revisão semanal do plano: ajustar prazos se necessário
- Documentar ADRs para decisões que surgirem
- Atualizar este documento à medida que ondas terminarem

### 12.3 Pós-launch

- Análise pós-launch (semana 16+)
- Decisão sobre próximas features (Chat com IA? Mobile?)
- Roadmap v2 baseado em feedback real

---

## Encerramento

O Quita está **completamente especificado** das fundações ao launch. As 6 fases mais o Bridge OCR somam **~11.012 linhas de especificação normativa** + **~3.500 linhas de dossiês adversariais** validando cada decisão.

O plano de migração desta Fase 6 traduz isso em **16 semanas de execução**, com critérios objetivos, kill switches, backup e plano de rollback para cada onda.

A frase que guia o produto se traduz em arquitetura:

> *"Primeiro sobreviver. Depois estabilizar. Depois negociar. Depois quitar."*

E o Quita está pronto para ser construído.

---

*Fim do documento da Fase 6.*
