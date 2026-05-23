# Quita — Especificação Completa

> **Status:** ✅ 100% especificado e aprovado em ciclo adversarial
> **Data de fechamento:** 17 de maio de 2026
> **Próximo passo:** implementação por agentes IA com supervisão humana (ver `05-migracao/FASE_6_PLANO_DE_MIGRACAO.md` + patch v1.1)

---

## O que é o Quita

> *"Primeiro sobreviver. Depois estabilizar. Depois negociar. Depois quitar."*

Quita é um **motor de decisão financeira** para pessoas endividadas. Não é app de controle de gastos, não é gerador de gráficos, não é fintech ostentativa. É uma ferramenta que responde à pergunta:

> **"Com o dinheiro que tenho agora, qual é a melhor decisão neste mês?"**

Princípios fundadores:
- Não recomendar pagamento que comprometa moradia, alimentação, saúde, transporte essencial, trabalho ou obrigação legal
- Conformidade com **Lei 14.181/2021** (Superendividamento) e LGPD (Lei 13.709/2018)
- Tom sóbrio, sem celebração, sem ostentação, respeitando dignidade do usuário endividado
- Modo Sobrevivência tratado como o que é — não pressionar para pagar dívidas
- Refinamento progressivo: começa simples, ganha precisão com o uso

---

## Inventário rápido

| Métrica | Valor |
|---|---|
| **Documentos normativos** | 7 fases + 1 bridge = 8 documentos principais com patches |
| **Linhas de especificação** | ~12.576 |
| **Linhas de dossiês adversariais** | ~4.000 |
| **Auditorias adversariais** | 12 (6 iniciais reprovadas + 6 finais aprovadas) |
| **Tabelas no schema** | ~29 |
| **Migrations sequenciais** | 20 |
| **Módulos NestJS** | 18 (12 motor + 6 auxiliares) |
| **Jobs BullMQ** | 14 em 2 queues |
| **Telas mapeadas** | 30 (22 wireframes ASCII completos + 8 esqueletos) |
| **Cenários canônicos de teste** | 8 (cobrindo todos os 5 estados e 5 modos) |
| **Estados financeiros × Modos de operação** | 5 × 5 |

---

## Como navegar

### Ordem de leitura recomendada (primeira leitura)

1. **`00-fundacao/FASE_1_ESPECIFICACAO_DE_PRODUTO_v2.md`** — comece aqui. Define visão, princípios, 5 estados financeiros, 5 modos de operação, refinamento progressivo, Lei 14.181/2021.

2. **`00-fundacao/FASE_2_MODELAGEM_DE_DOMINIO_v2.md`** + **`FASE_2_v2_1_PATCH.md`** — schema do banco (~29 tabelas), todas as entidades e relacionamentos.

3. **`01-motor/FASE_3_MOTOR_DE_DECISAO.md`** + **`FASE_3_PATCH_v1_1_FINAL.md`** — o coração técnico. 12 módulos com pseudocódigo executável, fórmulas de capacidade segura, priority score, 8 cenários canônicos de teste.

4. **`02-arquitetura/FASE_4_ARQUITETURA_TECNICA.md`** + **`FASE_4_PATCH_v1_1_FINAL.md`** — 18 módulos NestJS, 14 jobs BullMQ, autenticação (httpOnly + refresh stateful + HMAC + AuthAuditLog), LGPD, observability.

5. **`03-bridge-ocr/BRIDGE_OCR_PREMIUM.md`** + **`BRIDGE_OCR_PATCH_v1_1_FINAL.md`** — feature Premium de OCR de propostas de acordo. OpenAI Vision + Supabase Storage + consentimento LGPD + quota.

6. **`04-telas-web/FASE_5_TELAS_WEB.md`** + **`FASE_5_PATCH_v1_1_FINAL.md`** — 30 telas com wireframes ASCII, sistema de design sóbrio, copy final em PT-BR, plano de beta privado, Stripe Checkout, notificações (in-app + Resend).

7. **`05-migracao/FASE_6_PLANO_DE_MIGRACAO.md`** + **`FASE_6_PATCH_v1_1_FINAL.md`** — plano de execução em 7 ondas, modelo de agentes IA + supervisor humano, feature flags, riscos, GO/NO-GO, pré-mortem.

### Para entender as decisões (segunda leitura)

`99-dossies-adversariais/` contém:
- **`auditorias-finais-aprovadas/`** — leitura recomendada. Cada dossiê v2 lista os critérios atendidos, evidências e pendências menores residuais.
- **`auditorias-iniciais-reprovadas/`** — leitura opcional. Mostra os bloqueadores que existiam no rascunho v1 de cada fase e que foram resolvidos no patch v1.1.
- **`ciclos-adversariais/`** — respostas detalhadas com decisões @claude-arquiteto e @product que fecharam cada ciclo.

### Para começar a implementação

Vá direto para **`05-migracao/FASE_6_PATCH_v1_1_FINAL.md` §13** — define o modelo de execução por agentes IA + supervisor humano, papéis, fluxo de PR, cota máxima de 5 PRs, ADRs templates, pré-mortem com 7 cenários de falha.

---

## Estrutura de pastas

```
quita-especificacao/
├── README.md                                # Este arquivo
│
├── 00-fundacao/                             # O que o produto é e como funciona
│   ├── FASE_1_ESPECIFICACAO_DE_PRODUTO_v2.md
│   ├── FASE_2_MODELAGEM_DE_DOMINIO_v2.md
│   └── FASE_2_v2_1_PATCH.md
│
├── 01-motor/                                # O coração técnico
│   ├── FASE_3_MOTOR_DE_DECISAO.md
│   └── FASE_3_PATCH_v1_1_FINAL.md
│
├── 02-arquitetura/                          # Como é construído (backend)
│   ├── FASE_4_ARQUITETURA_TECNICA.md
│   └── FASE_4_PATCH_v1_1_FINAL.md
│
├── 03-bridge-ocr/                           # Feature Premium de OCR
│   ├── BRIDGE_OCR_PREMIUM.md
│   └── BRIDGE_OCR_PATCH_v1_1_FINAL.md
│
├── 04-telas-web/                            # Interface (frontend)
│   ├── FASE_5_TELAS_WEB.md
│   └── FASE_5_PATCH_v1_1_FINAL.md
│
├── 05-migracao/                             # Como construir
│   ├── FASE_6_PLANO_DE_MIGRACAO.md
│   └── FASE_6_PATCH_v1_1_FINAL.md
│
├── 99-dossies-adversariais/                 # Histórico do ciclo de validação
│   ├── auditorias-finais-aprovadas/         # 6 dossiês v2 (estado atual)
│   ├── auditorias-iniciais-reprovadas/      # 6 dossiês v1 (histórico)
│   └── ciclos-adversariais/                 # 5 docs de decisões intermediárias
│
└── arquivos-legados/                        # Versões substituídas (referência)
    ├── FASE_1_v1_DEPRECIADA.md
    └── FASE_2_v1_DEPRECIADA.md
```

---

## Resumo de cada fase

### 📘 Fase 1 — Especificação de Produto (687 linhas)

Define **o que** o Quita é e **por que** existe.

Conteúdo: visão e missão, 10 princípios fundadores, 5 estados financeiros (`healthy_with_debt` → `practical_insolvency`), 5 modos de operação (`payoff` → `survival`), refinamento progressivo de dados em 7 dimensões, Lei 14.181/2021 (Superendividamento) integrada, antimanifesto ("não promete milagre, não vende empréstimo, não envia cobrança").

### 📗 Fase 2 — Modelagem de Domínio (1.236 linhas)

Define **o schema do banco**.

Conteúdo: ~24 tabelas Prisma com ~282 campos, 11 enums, 10 migrations base, relacionamentos, índices compostos, partial indexes para performance, política LGPD por tabela.

Tabelas-chave: `User`, `Income`, `Expense`, `Debt`, `Payment`, `MonthlyPlan`, `RecommendedAction`, `SettlementEvaluation`, `BehaviorProfile`, `UserGoal`, `SupportChannel`, `RegionalMinimumVital`, `ConsentLog`.

### 📕 Fase 3 — Motor de Decisão (2.557 linhas)

Define **como o produto decide**.

Conteúdo: 12 módulos com pseudocódigo TypeScript completo:

1. `capacity-calculator` — renda líquida → capacidade segura
2. `state-classifier` — 5 estados financeiros
3. `mode-selector` — 5 modos de operação
4. `priority-scorer` — 10 fatores ponderados → score 0-10
5. `action-generator` — gera RecommendedActions
6. `settlement-validator` — avalia propostas de acordo
7. `long-term-projector` — 3 cenários (conservador, otimizado, acelerado)
8. `seasonal-expense-service` — IPVA, IPTU, anuidades
9. `emergency-reserve-service` — aporte sugerido
10. `behavior-profile-service` — avalanche/snowball/hybrid
11. `goal-tracker` — UserGoals
12. `motor-orchestrator` — composição

Mais: **8 cenários canônicos** de teste (Maria, João, Roberto, Ana, Carlos, etc.) cobrindo todos os 5 × 5 = 25 combinações principais.

### 📙 Fase 4 — Arquitetura Técnica (2.593 linhas)

Define **como construir o backend**.

Conteúdo: estrutura de pastas NestJS, 18 módulos (12 motor + 6 auxiliares), Express adapter, 2 queues BullMQ (`motor-recalc` com groupId + `motor-scheduled` sem grupo), 9 jobs originais, refresh token stateful com **HMAC-SHA256**, `bcrypt rounds=12`, autenticação por httpOnly cookie, `/api/v1/` prefix, helmet, throttler per-user, `AuthAuditLog`, política LGPD operacional, observability (pino + Sentry).

### 📒 Bridge — OCR Premium (1.224 linhas)

Define **a feature exclusiva do Premium**.

Conteúdo: OCR de propostas de acordo via OpenAI Vision + Supabase Storage (bucket privado), consentimento LGPD específico (`ocr_data_processing`), quota mensal (0 Free / 5 Premium), endpoint dedicado de confirmação manual quando confidence < 0.7, auto-delete em 30 dias, signed URLs TTL parametrizável (15min UI / 7d data export), inclusão de imagens em Data Export (LGPD art. 18 V — portabilidade), rejeição de HEIC com mensagem específica para iPhones.

### 📓 Fase 5 — Telas Web (2.715 linhas)

Define **a interface do usuário**.

Conteúdo: stack Next.js 15 App Router + Tailwind v4 + shadcn/ui + Zustand + TanStack Query + RHF+Zod + date-fns + sonner + PostHog, 22 wireframes ASCII completos + 8 esqueletos = **30 telas mapeadas**, sistema de design sóbrio (paleta verde-musgo `#2F7060`, sem ostentação fintech), copy final em PT-BR rotulando os 5 estados e 5 modos, plano de beta privado com 15 testers, Stripe Checkout + Customer Portal, notificações in-app + email Resend, PWA mínimo, navegação mobile (bottom nav) / desktop (sidebar), acessibilidade WCAG 2.1 AA, modo discreto preservado.

### 📔 Fase 6 — Plano de Migração e Rollout (1.564 linhas)

Define **como implementar**.

Conteúdo: inventário real do código atual (12 tabelas, 8 jobs, token em localStorage, CORS aberto, sem testes), migração clean (sem usuários reais permite drop + recreate), 20 migrations sequenciais, 7 ondas com critérios de saída, **modelo de execução por agentes IA + supervisor humano**, cota máxima de 5 PRs simultâneos, feature flags PostHog, 15 riscos tabulados, pré-mortem com 7 cenários de falha, plano de rollback por onda, 3 cenários de custo (beta ~$23/mês, public ~$200/mês, escala 10k usuários ~$1.200/mês), 9 pré-requisitos externos declarados (Política de Privacidade, CNPJ, DPO, etc — responsabilidade do supervisor).

---

## Marcos do ciclo adversarial

Cada fase grande passou pelo mesmo padrão:

1. Documento monolítico (rascunho v1)
2. Submissão ao agente devils-advocate → **REPROVADO** (tipicamente 4 bloqueadores + 7 altos + 4-6 médios)
3. Respostas no ciclo adversarial (decisões técnicas + recomendações @product)
4. Patch v1.1 normativo
5. Re-submissão ao devils-advocate → **APROVADO** (tipicamente 5 pendências menores residuais)

| Fase | v1 | v1.1 |
|---|---|---|
| Fases 1+2 (combinadas) | 🔴 4 BL + 4 ALTO + 1 MED | ✅ |
| Fase 3 | 🔴 4 BL + 7 ALTO + 4 MED | ✅ (4 NM residuais) |
| Fase 4 | 🔴 4 BL + 7 ALTO + 4 MED | ✅ (6 NM residuais) |
| Bridge OCR | 🔴 2 BL + 7 ALTO + 3 MED | ✅ (5 NM residuais) |
| Fase 5 | 🔴 4 BL + 6 ALTO + 5 MED | ✅ (5 NM residuais) |
| Fase 6 | 🔴 4 BL + 7 ALTO + 6 MED | ✅ (5 NM residuais) |

**100% das fases passaram por validação adversarial completa.**

---

## Decisões-chave acumuladas

### Stack (final)

| Camada | Tecnologia |
|---|---|
| Monorepo | pnpm + `apps/api` + `apps/web` + `@quita/shared` |
| Backend | NestJS 11 + Prisma 6 + Zod 3 + BullMQ |
| Frontend | Next.js 15 App Router + React 19 + Tailwind v4 + shadcn/ui |
| Estado client | Zustand (auth) + TanStack Query (server state) + React Hook Form |
| Banco | PostgreSQL via Supabase |
| Storage | Supabase Storage (bucket privado para OCR) |
| Cache + Queue | Redis (Railway) + BullMQ |
| Autenticação | httpOnly cookie + JWT (15min) + refresh stateful (HMAC-SHA256, 30d) + AuthAuditLog |
| Pagamento | Stripe Checkout + Customer Portal |
| Email | Resend |
| OCR | OpenAI Vision (`gpt-4o-mini`) |
| Analytics | PostHog (analytics + feature flags + session recording mascarado) |
| Errors | Sentry |
| Testes | Vitest (unit) + Playwright (E2E) |
| Deploy | Railway (backend) + Vercel (frontend) |

### Decisões reversíveis empurradas para pós-MVP

- Chat com IA (AiInsight reativada)
- Push web com Service Worker
- SMS para situações críticas (descartado por associação com cobrador)
- i18n com `next-intl`
- Detecção automática de PII em imagens OCR
- Autocomplete de cidade IBGE (MVP usa apenas UF)
- OCR cleanup via SQL direto (MVP usa List API)
- Mobile native (Expo)
- Decimal.js (MVP usa Number com `toEqualMoney` matcher de tolerância)
- WebSocket para notificações em tempo real (MVP usa polling 60s)

---

## O que NÃO está nesta especificação

Pré-requisitos externos (responsabilidade do supervisor humano):

1. Política de Privacidade publicada
2. Termos de Uso publicados
3. CNPJ para Stripe Brasil
4. Conta bancária PJ se necessário
5. DPO designado + canal LGPD
6. Plano de suporte ao usuário (canal, SLA)
7. Plano de comunicação de launch (LP, aquisição)
8. Domínio comprado e configurado
9. Contas criadas em providers (Stripe, Resend, OpenAI, Supabase, Railway, Vercel, Sentry, PostHog)

Detalhes em `05-migracao/FASE_6_PATCH_v1_1_FINAL.md` §13.7.

---

## Como começar a implementar

1. **Leia primeiro:** `05-migracao/FASE_6_PATCH_v1_1_FINAL.md` §13 (modelo de execução com agentes IA)
2. **Resolva pré-requisitos externos (paralelo):** itens 1-9 da lista acima
3. **Setup inicial:**
   - Criar repositório GitHub
   - Criar 18 ADRs consolidados em `docs/adr/` (lista em §13.5 do patch da Fase 6)
   - Rodar `scripts/setup-github-labels.sh` (NM-5 do dossiê v2 da Fase 6)
   - Criar projetos em Sentry, PostHog
   - Configurar Railway + Supabase + Vercel
4. **Onda 1 (Foundation):** auth refatorada + infra + schema base + testes setup
5. **Seguir ondas sequenciais** conforme `05-migracao/FASE_6_PLANO_DE_MIGRACAO.md` §5

Cada PR aberto por agente IA passa por:
1. CI automático (lint, typecheck, tests)
2. Auditor adversarial (agente devils-advocate)
3. Review humano (supervisor)
4. Merge

Cota máxima: **5 PRs abertos simultaneamente**.

---

## Frase guia

> *"Primeiro sobreviver. Depois estabilizar. Depois negociar. Depois quitar."*

Esta frase está presente em todas as fases. Define a hierarquia de decisões do motor, o tom da copy, a ordem das ações recomendadas, o que aparece em cada estado, o que NÃO aparece em Modo Sobrevivência (botão de pagar).

O Quita está pronto para sair do papel.

---

*Fim do README. Pronto para implementação.*
