# Revisão Técnica — Ondas 0 a 7

**Branch:** `refactor/onda-1-foundation`
**Data:** 2026-05-22
**Revisor:** Análise estática automatizada (feature-dev:code-reviewer)
**Worktree:** `/Users/emerson/Desktop/workspace/quita/.claude/worktrees/refactor-onda-0/`

---

## Sumário Executivo

A refatoração entrega uma base sólida: o motor puro é determinístico (sem `Date.now()` interno, `now` injetado via `MotorContext`), a cadeia auth segue as ADRs (httpOnly cookies, HMAC-SHA256 separado do JWT, bcrypt 12, audit log LGPD), o schema Prisma está coerente com 26 tabelas e os scaffolds das Ondas 4–5 falham com mensagem clara em vez de silenciar. Os dois riscos críticos são: a **race condition no `rotate()` do RefreshTokenService** (dois requests simultâneos com o mesmo refresh token podem ambos obter novos tokens sem detecção de reuso) e o **JWT_SECRET com fallback hardcoded** que silencia erros de configuração em produção. No motor, a **ordem invertida de juros/pagamentos no simulator** infla projeções de prazo, o `isInsolvent()` não trata renda=0, e o orquestrador NestJS não persiste o plano calculado — o motor calcula mas não salva.

---

## Achados por Severidade

### CRITICAL

#### C-01 — Race condition no `rotate()` do RefreshTokenService
- **Arquivo:** `apps/api/src/modules/auth/refresh-token.service.ts` linhas 69–96
- **Confiança:** 90
- **Descrição:** Fluxo de rotação não está em transação. Entre `findUnique` (lê `revokedAt = null`) e `update` que revoga o antigo, dois requests simultâneos podem ambos passar pela verificação `revokedAt !== null` com resultado `false`. Ambos emitem tokens distintos. Nenhum dispara `reuseDetectedFor`.
- **Impacto:** Em rede instável com retry no cliente, um refresh token pode produzir duas sessões paralelas sem disparar o mecanismo de segurança definido na ADR-0002.
- **Fix:** Trocar findUnique + update por `updateMany` condicional atômico.

#### C-02 — JWT_SECRET com fallback hardcoded silencia misconfiguration em produção
- **Arquivos:** `apps/api/src/modules/auth/auth.module.ts` linha 16; `apps/api/src/modules/auth/jwt.strategy.ts` linha 30
- **Confiança:** 95
- **Descrição:** `process.env.JWT_SECRET || "dev-secret-change-in-production"`. Se `JWT_SECRET` não for injetada em produção, API sobe com segredo público e previsível. Qualquer pessoa pode forjar JWTs.
- **Fix:** Lançar erro no bootstrap se variável ausente, igual ao `RefreshTokenService.hmacSecret`.

### HIGH

#### H-01 — minimumVitalRegional hardcoded como R$ 1320 para todos os usuários
- **Arquivo:** `apps/api/src/modules/motor/motor-orchestrator.service.ts` linha 164
- **Impacto:** Tabela `RegionalMinimumVital` existe mas não é consultada. Classificação de insolvência usa salário mínimo federal de 2024 para todos.

#### H-02 — Simulator aplica juros ANTES dos pagamentos
- **Arquivo:** `packages/motor/src/simulator.ts` linhas 77–100
- **Impacto:** Projeções de prazo e juros sistematicamente pessimistas. Diferença de 10–20% no `estimatedMonths` para dívidas de rotativo.

#### H-03 — incomeNetMonthly ignora frequency (one_time, installment, irregular)
- **Arquivo:** `apps/api/src/modules/motor/motor-orchestrator.service.ts` linha 73
- **Impacto:** Renda `one_time` somada todos os meses inflaciona safeCapacity e classifica errado.

#### H-04 — `isInsolvent()` retorna false quando incomeNetMonthly = 0
- **Arquivo:** `packages/motor/src/state-classifier.ts` linhas 62–64
- **Impacto:** Usuário sem renda cai em `monthly_deficit` ao invés de `practical_insolvency`. Motor gera ações `pay`/`negotiate` para quem não tem dinheiro nenhum.

#### H-05 — Throttle "auth" definido mas não aplicado nos endpoints
- **Arquivos:** `apps/api/src/app.module.ts` linhas 44–47; `apps/api/src/modules/auth/auth.controller.ts`
- **Impacto:** Login aceita 60 req/min em vez de 10 — sextuplica superfície de brute-force.

### MEDIUM

#### M-01 — Motor orquestrador não persiste em MonthlyActionPlan
- Calcula plano mas não faz upsert. Dashboard retornará vazio.

#### M-02 — ScoringWeight não é consultado — DEFAULT_WEIGHTS hardcoded
- Promessa de "pesos vivos configuráveis" não operacional.

#### M-03 — `ExpenseCategory.bills` ausente no motor — TypeError potencial
- Schema tem `bills` legacy; motor não. Lookup retorna undefined → crash.

#### M-04 — AuthAuditLog.email persiste após exclusão do User (LGPD)
- `onDelete: SetNull` nula userId mas mantém email. LGPD art. 18, IV exige eliminação.

#### M-05 — ResendEmailService retorna sucesso silencioso quando key configurado mas stub
- Difere do padrão Stripe/OCR que lançam ServiceUnavailableException.

#### M-06 — /auth/refresh retorna HTTP 200 com user:null quando cookie ausente
- Interceptor Axios só redireciona em 401, não em user:null.

#### M-07 — Dead code `void preDebtCapacity` em state-classifier
- Indica que segunda condição (simulação 60 meses) da spec §7.4 não foi implementada.

### LOW

#### L-01 — `monthsBetween` com arredondamento redundante (`total - 1 + 1` = `total`)
- `packages/motor/src/seasonal-expense.ts` linha 71. Subestima ligeiramente provisão em casos de borda.

#### L-02 — CI não executa migração Prisma
- `.github/workflows/ci.yml` só faz `db:generate`. PostgreSQL CI vazio.

---

## Débitos Técnicos Catalogados

| # | Débito | Arquivo Principal | Effort | Prioridade |
|---|---|---|---|---|
| DT-01 | Race condition rotate() — atomic updateMany | refresh-token.service.ts | S | Crítico |
| DT-02 | JWT_SECRET sem fallback hardcoded | auth.module.ts, jwt.strategy.ts | S | Crítico |
| DT-03 | Throttle específico nos endpoints auth | auth.controller.ts | S | Alto |
| DT-04 | Consultar RegionalMinimumVital no orquestrador + seed | motor-orchestrator.service.ts | M | Alto |
| DT-05 | Persistir MonthlyActionPlan + RecommendedAction | motor-orchestrator.service.ts | M | Alto |
| DT-06 | Ordem juros/pagamento no simulator | simulator.ts | S | Alto |
| DT-07 | isInsolvent tratar renda=0 como insolvência | state-classifier.ts | S | Médio |
| DT-08 | incomeNetMonthly respeitar frequency | motor-orchestrator.service.ts | M | Médio |
| DT-09 | Consultar ScoringWeight do banco | motor-orchestrator.service.ts | S | Médio |
| DT-10 | Adicionar bills a ExpenseCategory do motor | expense-classifier.ts | S | Médio |
| DT-11 | AuthAuditLog: nular email após hard delete | job futuro | M | Médio |
| DT-12 | ResendEmailService lançar exception quando stub | resend-email.service.ts | S | Médio |
| DT-13 | Remover dead code void preDebtCapacity | state-classifier.ts | S | Baixo |
| DT-14 | Corrigir monthsBetween | seasonal-expense.ts | S | Baixo |
| DT-15 | Adicionar prisma migrate deploy no CI | .github/workflows/ci.yml | S | Baixo |
| DT-16 | Upsert in-place RecommendedAction (spec §14.4) | novo service | L | Futuro |
| DT-17 | applySmoothingRule como função pura | packages/motor/ | M | Futuro |
| DT-18 | 8 cenários canônicos spec §18.4 | testes integração | L | Futuro |
| DT-19 | Testes integração motor-orchestrator | tests/integration/ | L | Futuro |
| DT-20 | Condição 60 meses no isOverindebted | state-classifier.ts | M | Futuro |

---

## Sugestões de Follow-up

**Bloco 1 — Segurança (antes de qualquer beta):** DT-01, DT-02, DT-03 (effort total ~2–4h).
**Bloco 2 — Corretude funcional do motor:** DT-04, DT-05, DT-06, DT-07, DT-08, DT-09, DT-10.
**Bloco 3 — LGPD e observabilidade:** DT-11, DT-12, DT-15.
**Bloco 4 — Refinamento:** DT-13, DT-14, DT-16 até DT-20.

---

## Conformidade com a Spec (Fase 3)

| Item | Status | Nota |
|---|---|---|
| §7.4 decideState top-down | Parcial | Só critério 70% renda; simulação 60 meses ausente |
| §7.5 applySmoothingRule | **Ausente** | Não implementada |
| §7.6 computeNetMonthlyIncome por frequency | **Ausente** | Soma bruta |
| §8.3 ScoringWeight do banco | **Ausente** | Hardcoded |
| §9.3 survival nunca pay/negotiate | **Conforme** | OK |
| §10 Simulator 3 cenários | Parcial | Ordem invertida |
| §14.4 Upsert MonthlyActionPlan | **Ausente** | Não persiste |
| §15 Jobs BullMQ | Scaffold | Processors não implementados |
| §16 Retenção LGPD | Parcial | Email não nulado |
| §17.1 Renda zero → insolvency | **Não conforme** | Bug isInsolvent |
| §18.4 8 cenários canônicos | **Ausentes** | Nenhum implementado |

---

*Relatório gerado em 2026-05-22.*
