# Devils Advocate — Auditoria v2 da Fase 6

> **Modo:** Estratégia
> **Escopo auditado:** `FASE_6_PLANO_DE_MIGRACAO.md` (v1, 1.037 linhas) + `FASE_6_PATCH_v1_1_FINAL.md` (§13-§16 normativa)
> **Versão anterior:** REPROVADO em 17/05/2026, com 4 bloqueadores + 7 altos + 6 médios
> **Data desta auditoria:** 17/05/2026, pós-ciclo adversarial
> **Decisões aplicadas:** BL-1 (executor = agente IA + supervisor humano); BL-2/BL-3/BL-4/A-2/A-5 (declarados como pré-requisitos externos fora do escopo)
> **Mantra:** *"Se não sobreviver ao meu interrogatório, não merece produção."*

---

## Veredito final

# ✅ APROVADO

O patch v1.1 reorganizou o documento com duas decisões estruturais corretas:

1. **Declarar executor real (agentes IA + supervisor humano)** — não fingir que é "team de devs". §13.1 define papéis, fluxo de PR, limites e mitigações. §13.2 substitui "16 semanas de calendário" por **grafo de dependências lógicas** com estimativa dependente do gargalo real (tempo de review do supervisor).

2. **Declarar pré-requisitos externos** — Política de Privacidade, Termos de Uso, DPO, suporte, comunicação, CNPJ são responsabilidades de Emerson e estão **fora do escopo técnico**. §13.7 lista 9 EXT-N com critério de quando bloqueiam cada onda. Não pretende resolver, mas exige presença antes do GO.

O pré-mortem (§13.4) cobriu 7 cenários de falha com mitigações específicas — incluindo **modos de falha próprios do modelo IA** (PRs acumulados, conflito entre agentes, bug semântico passando no review).

Detectei **5 pendências menores** durante esta re-auditoria. Padrão consistente das auditorias finais. Nenhuma invalida a aprovação; todas viram detalhes de configuração operacional na Onda 1.

A Fase 6 está liberada e — com ela — **TODA a especificação do Quita está concluída e aprovada**.

---

## Dossiê de evidências dos 4 bloqueadores

### BL-1 — Tamanho do time não definido

✅ **PASSOU**

Evidência material em §13.0, §13.1, §13.2, §13.3:
- Decisão fundamental declarada: **agentes IA + supervisor humano**
- Papéis definidos: Implementador, Supervisor, Validador, Auditor adversarial
- Fluxo de PR documentado passo-a-passo
- 7 limites do executor IA com mitigações concretas
- Cronograma vira grafo de dependências, não calendário
- Estimativa em faixa, dependente de disponibilidade do supervisor

### BL-2 / BL-3 / BL-4 — Política de Privacidade, Suporte, Comunicação

✅ **PASSOU**

Evidência material em §13.7:
- Declarados como pré-requisitos externos (EXT-1, EXT-2, EXT-5, EXT-6, EXT-7)
- Quando bloqueiam: explícito por onda
- Responsabilidade: Emerson (humano)
- Não exigem detalhamento técnico no plano de migração

Esta é uma **escolha de escopo válida**: o documento técnico não precisa resolver problemas de negócio para ser executável.

---

## Dossiê dos 7 altos

| # | Alto | Resolução | Status |
|---|---|---|---|
| A-1 | Pré-mortem ausente | §13.4 — 7 cenários estruturados com mitigações pré-existentes e novas | ✅ |
| A-2 | CNPJ Stripe BR | §13.7 — EXT-3, EXT-4 declarados como pré-requisitos externos | ✅ |
| A-3 | Log redaction (pino + Sentry) | §13.5 — código TypeScript completo de configuração, adicionado à Onda 1 | ✅ |
| A-4 | Testes de isolamento multi-usuário | §13.5 — 6º fluxo Playwright com código exemplo, adicionado à Onda 3 | ✅ |
| A-5 | DPO designado | §13.7 — EXT-5 declarado como pré-requisito externo | ✅ |
| A-6 | Forgot/reset password sem onda | §13.5 — endpoints, schema `PasswordResetToken`, Migration 20, telas implementadas na Onda 1 | ✅ |
| A-7 | Onda 2 otimista | §13.2 — cronograma vira grafo de dependências; estimativa em faixa dependente do gargalo | ✅ |

---

## Dossiê dos 6 médios

| # | Médio | Resolução |
|---|---|---|
| M-1 | Backup retention | §13.6 — 7 dias point-in-time + 12 meses S3/GCS + 5 anos Glacier |
| M-2 | Pricing change | §13.6 — env var + endpoint `/config/pricing` com cache 1h |
| M-3 | Cobertura de testes | §13.6 — tabela com 6 contextos e alvos específicos |
| M-4 | Tracker de bugs | §13.6 — GitHub Issues com labels estruturadas |
| M-5 | PostHog session masking | §13.6 — código completo de configuração com `maskAllInputs` + redact de network |
| M-6 | Decimal.js workaround | §13.6 — `toEqualMoney` matcher customizado no Vitest |

---

## Novas pendências menores detectadas

### NM-1 — Comportamento da cota de 5 PRs abertos

**Sintoma.** §13.3 diz "máximo 5 PRs abertos simultaneamente; se cota atingida: agentes esperam ou trabalham em refatorações sem PR". Mas:

- **Quem espera, quais agentes?** Todos os agentes pausam ou só aquele que ia abrir o 6º PR?
- **Refatoração sem PR — quando vira PR?** Se cota libera enquanto refatoração está em andamento, abre PR no meio?
- **Como detectar cota atingida?** GitHub API? Manual no início de cada tarefa?

**Solução proposta.**

```yaml
# Política operacional
- Cota = 5 PRs com label `awaiting-review`
- Agente verifica cota via GitHub API antes de criar PR
- Se cota atingida:
  - Trabalha em outras tasks já atribuídas (não bloqueia)
  - Se não há outras tasks: aguarda 30min e revalida
- Liberação: quando supervisor faz merge ou fecha PR, cota libera 1 slot
- Em emergência (hotfix): supervisor pode marcar PR com label `bypass-quota`
```

**Custo de correção.** ~15min para documentar.

---

### NM-2 — ADR templates pré-aprovados não listados

**Sintoma.** §13.1 menciona "ADR templates pré-aprovados; qualquer decisão arquitetural nova bloqueia PR e exige aprovação humana explícita". Mas **quais ADRs já estão aprovados**?

Sem essa lista, agentes podem:
- Reinventar decisão já tomada (e.g., usar Yup em vez de Zod)
- Não detectar que estão fazendo decisão arquitetural nova

**Solução proposta.**

Criar `docs/adr/` no início da Onda 1 com ADRs já decididos consolidados das fases:

```
docs/adr/
├── 0001-monorepo-pnpm.md
├── 0002-nestjs-express-adapter.md
├── 0003-prisma-as-orm.md
├── 0004-zod-validation-shared.md
├── 0005-jwt-httponly-cookie-refresh-stateful.md
├── 0006-bullmq-two-queues.md
├── 0007-supabase-postgres-storage.md
├── 0008-stripe-checkout-customer-portal.md
├── 0009-resend-for-email.md
├── 0010-posthog-analytics-feature-flags.md
├── 0011-tailwind-v4-tokens-css-vars.md
├── 0012-tanstack-query-server-state.md
├── 0013-zustand-client-state.md
├── 0014-rhf-zod-forms.md
├── 0015-shadcn-base-components.md
├── 0016-monolingual-pt-br-mvp.md
├── 0017-vitest-playwright-tests.md
└── 0018-agents-ia-supervisor-humano.md
```

Cada ADR documenta: contexto, decisão, alternativas consideradas, consequências.

Agente IA antes de fazer escolha técnica consulta ADRs existentes. Se decisão é novidade, abre **ADR-PR separado** (sem código), aprovação humana, **só depois** implementa.

**Custo de correção.** ~30min para spec + ~2h durante a Onda 1 para criar os 18 ADRs.

---

### NM-3 — Rate limiting de password reset: storage não especificado

**Sintoma.** §13.5 (A-6) diz "rate limit: 3 tentativas/hora por email". Mas:

- **Storage do counter:** Redis (já estará disponível para BullMQ)? Memória (perde em restart)? PostgreSQL (lento)?
- **TTL do counter:** 1 hora rolling window? Janela fixa de 1h?
- **Bypass:** admin pode resetar contador se usuário legítimo está bloqueado?

**Solução proposta.**

```typescript
// Usar Redis (já disponível) com sliding window
async checkRateLimit(email: string): Promise<boolean> {
  const key = `rate-limit:password-reset:${email.toLowerCase()}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1h

  await this.redis.zremrangebyscore(key, 0, now - windowMs);
  const count = await this.redis.zcard(key);

  if (count >= 3) return false;

  await this.redis.zadd(key, now, `${now}-${Math.random()}`);
  await this.redis.expire(key, 60 * 60);
  return true;
}
```

Bypass administrativo via `DELETE` do Redis key (manual ou endpoint admin-only).

**Custo de correção.** ~20min para spec + ~30min de implementação na Onda 1.

---

### NM-4 — Plano de ausência prolongada do supervisor

**Sintoma.** §13.2 estima cronograma baseado em "horas/dia de review do supervisor". Mas o que acontece se Emerson ficar **2-3 semanas indisponível** (viagem, doença, urgência pessoal)?

- PRs acumulam, cota de 5 trava
- Agentes ficam ociosos
- Sem checkpoint humano, agentes podem entrar em loop não detectado
- Bugs em staging podem virar lockdown se ninguém aprovar hotfix

**Solução proposta.**

Adicionar a §13.3 cláusula de **ausência do supervisor**:

```
Política de ausência:
- Ausência ≤ 3 dias: agentes pausam novos PRs; trabalho continua em
  refatorações local (sem branch push)
- Ausência 3-7 dias: pause hard (agentes não fazem nada novo); risco
  aceitável de 1 semana de atraso
- Ausência > 7 dias: supervisor designa um substituto para review (outro
  humano de confiança); ou aceita parada total

Sinalização:
- Supervisor marca em PostHog `supervisor_available: false` ao começar
  ausência
- Agentes verificam flag antes de criar novo PR
```

**Custo de correção.** ~15min para documentar.

---

### NM-5 — Setup inicial de GitHub Labels não está em nenhuma onda

**Sintoma.** §13.6 (M-4) lista 12 labels (bug, feature, tech-debt, etc.) + labels de onda + labels de agente. Mas **quem cria as labels no repo**?

Se agente IA tenta abrir PR com label inexistente, GitHub rejeita.

**Solução proposta.**

Adicionar à Onda 1 como entregável de infra:

```bash
# scripts/setup-github-labels.sh
gh label create "bug" --color "d73a4a" --description "Algo não funciona"
gh label create "feature" --color "0e8a16" --description "Nova feature"
gh label create "tech-debt" --color "fbca04" --description "Débito técnico"
gh label create "documentation" --color "0075ca"
gh label create "security" --color "ee0701"
gh label create "priority/p0" --color "b60205"
gh label create "priority/p1" --color "d93f0b"
gh label create "priority/p2" --color "fbca04"
gh label create "priority/p3" --color "0e8a16"
gh label create "wave/1" --color "1d76db" --description "Onda 1 — Foundation"
# ... etc para wave/2 a wave/7
gh label create "agent/backend" --color "5319e7"
gh label create "agent/frontend" --color "5319e7"
gh label create "agent/tests" --color "5319e7"
gh label create "agent/infra" --color "5319e7"
gh label create "awaiting-review" --color "fbca04"
gh label create "audit-finding" --color "d93f0b"
gh label create "bypass-quota" --color "b60205"
```

Roda uma vez. Documentado em `CONTRIBUTING.md`.

**Custo de correção.** ~10min.

---

## Comparativo das 12 auditorias

| Auditoria | Bloq | Altos | Médios | Veredito |
|---|---|---|---|---|
| Fases 1 e 2 v1 | 4 | 4 | 1 | 🔴 |
| Fases 1 e 2 v2 | 0 | 0 | 0 | ✅ |
| Fase 3 v1 | 4 | 7 | 4 | 🔴 |
| Fase 3 v1.1 | 0 | 0 | 0 (4 NM) | ✅ |
| Fase 4 v1 | 4 | 7 | 4 | 🔴 |
| Fase 4 v1.1 | 0 | 0 | 0 (6 NM) | ✅ |
| Bridge OCR v1 | 2 | 7 | 3 | 🔴 |
| Bridge OCR v1.1 | 0 | 0 | 0 (5 NM) | ✅ |
| Fase 5 v1 | 4 | 6 | 5 | 🔴 |
| Fase 5 v1.1 | 0 | 0 | 0 (5 NM) | ✅ |
| Fase 6 v1 | 4 | 7 | 6 | 🔴 |
| **Fase 6 v1.1** | **0** | **0** | **0 (5 NM)** | ✅ **APROVADO** |

---

## Critérios objetivos para APROVADO

| # | Critério | Status |
|---|---|---|
| 1 | BL-1: executor definido (agentes IA + supervisor) | ✅ §13.0, §13.1 |
| 2 | BL-2, BL-3, BL-4: tratados como pré-requisitos externos | ✅ §13.7 |
| 3 | 7 altos endereçados (5 técnicos + 2 externos) | ✅ §13.5, §13.7 |
| 4 | 6 médios com decisão técnica | ✅ §13.6 |
| 5 | Pré-mortem estruturado | ✅ §13.4 — 7 cenários |
| 6 | Modelo de checkpoint para executor IA | ✅ §13.3 |

**100% dos critérios atendidos.**

---

## Tarefas para Onda 1 (consolidado das 5 NMs)

| Origem | Tarefa | Esforço |
|---|---|---|
| NM-1 | Documentar política operacional de cota de PRs | 15min |
| NM-2 | Criar 18 ADRs consolidados das Fases 1-6 | ~2h |
| NM-3 | Rate limiter em Redis para password reset | 30min impl |
| NM-4 | Cláusula de ausência do supervisor | 15min doc |
| NM-5 | Script `setup-github-labels.sh` | 10min |
| **Total** | — | **~3h** |

Padrão consistente das fases anteriores (1-3h de NMs em cada).

---

## Estado final do projeto

### Especificação técnica completa

| Documento | Linhas | Status |
|---|---|---|
| Fase 1 v2 (Produto) | 687 | ✅ |
| Fase 2 v2 + patch v2.1 (Modelagem) | 1.236 | ✅ |
| Fase 3 + patch v1.1 (Motor) | 2.557 | ✅ |
| Fase 4 + patch v1.1 (Arquitetura) | 2.593 | ✅ |
| Bridge OCR + patch v1.1 | 1.224 | ✅ |
| Fase 5 + patch v1.1 (Telas) | 2.715 | ✅ |
| Fase 6 + patch v1.1 (Migração) | 1.564 | ✅ |
| **Total especificação** | **~12.576 linhas** | ✅ |
| 12 dossiês adversariais | ~4.000 linhas | — |

**Inventário consolidado do produto final:**

- **5 estados financeiros** + **5 modos de operação** + **10 princípios fundadores**
- **~29 tabelas** no schema (incluindo `password_reset_tokens` da Fase 6)
- **20 migrations** sequenciais
- **12 módulos** do motor de decisão com pseudocódigo executável
- **8 cenários canônicos** de teste cobrindo todos os estados/modos
- **18 módulos NestJS** (12 motor + 6 auxiliares)
- **14 jobs BullMQ** em 2 queues
- **30 telas** mapeadas com wireframes ASCII
- **OCR Premium** LGPD-compliant
- **Stripe Checkout + Customer Portal**
- **Notificações in-app + email Resend**
- **Conformidade LGPD completa** (Lei 13.709/2018)
- **Lei 14.181/2021** (Superendividamento) integrada ao motor
- **Tom sóbrio** + Modo Sobrevivência respeitando dignidade
- **Canais de apoio gratuitos** integrados
- **Plano de beta privado** com 15 testers
- **Plano de migração** em 7 ondas com modelo de execução por agentes IA
- **Pré-mortem** com 7 cenários cobertos
- **9 pré-requisitos externos** declarados como responsabilidade do supervisor

---

## Comentário final

O Quita está **completamente especificado**. Nenhuma fase tem bloqueador aberto. Todas passaram pelo ciclo adversarial completo: rascunho → REPROVADO → patch v1.1 → APROVADO. 12 dossiês adversariais validaram cada decisão.

O modelo de execução por **agentes IA + supervisor humano** é uma decisão estrutural elegante: aproveita a velocidade da IA para implementação enquanto preserva o **gate humano** para decisões arquiteturais e validação de qualidade. Os limites do executor IA (contexto, debugging, decisões arquiteturais) estão **documentados com mitigações**, não escondidos.

A frase guia do produto se traduz em arquitetura, em código e em processo:

> *"Primeiro sobreviver. Depois estabilizar. Depois negociar. Depois quitar."*

O Quita está pronto para deixar a especificação e começar a existir.

---

*Fim do dossiê. Quita 100% especificado. Liberado para implementação.*
