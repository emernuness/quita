# Devils Advocate — Auditoria v2 da Fase 3

> **Modo:** Estratégia
> **Escopo auditado:** `FASE_3_MOTOR_DE_DECISAO.md` (v1) + `FASE_3_PATCH_v1_1_FINAL.md` (§20 normativa)
> **Versão anterior:** REPROVADO em 16/05/2026, com 4 bloqueadores + 7 altos + 4 médios + 2 baixos
> **Data desta auditoria:** 16/05/2026, pós-ciclo adversarial
> **Mantra:** *"Se não sobreviver ao meu interrogatório, não merece produção."*

---

## Veredito final

# ✅ APROVADO

Os 4 bloqueadores foram resolvidos com **especificação concreta** — pseudocódigo, stack nomeada, estratégia de atomicidade definida, lock por usuário decidido. Os 7 altos foram igualmente endereçados, todos com material implementável.

Detectei **4 pendências menores** durante esta re-auditoria — pontos finos que não invalidam a aprovação mas viram tarefas explícitas da Fase 4. Estão listadas abaixo.

A Fase 3 está liberada para virar Fase 4 (arquitetura técnica NestJS).

---

## Dossiê de evidências dos 4 bloqueadores

### BL-1 — Funções referenciadas mas não definidas

✅ **PASSOU**

Evidência material no Patch v1.1:
- §20.1.1 `composeMainGoal` — pseudocódigo completo + tabela `GOAL_LABELS`
- §20.1.2 `isExpectedThisMonth` — pseudocódigo usando `date-fns/isSameMonth`
- §20.1.3 `generateModeSpecificWarnings` — switch completo por `OperationMode` com warnings concretos
- §20.1.4 `computeMinimumVital` — hierarquia de 3 níveis (UF → BR → hardcoded com warning)
- §20.1.5 Stack de utilities: **`date-fns` v3+** explicitamente; `formatBRL` em `@quita/shared/src/utils/format.ts`

### BL-2 — Estratégia de atomicidade ausente

✅ **PASSOU**

Evidência material:
- §20.2 `monthly-plan-generator.generate()` envelopa **todos** os writes em `prisma.$transaction`
- Timeout `10_000ms` justificado (típico 100-500ms, folga para casos com 20+ dívidas)
- `maxWait: 5_000ms` para espera de início
- Isolation level `ReadCommitted` justificado (combinado com lock por usuário do BL-3)
- Garantia explícita: snapshot, cache do User, scores, plano e ações são consistentes ou nada é aplicado

### BL-3 — Race conditions não tratadas

✅ **PASSOU**

Evidência material:
- §20.3 **BullMQ `groupId: userId`** escolhido com fundamentação comparativa contra advisory lock
- `concurrency: 1` por groupId, `concurrency: 20` no total
- Comportamento prático especificado: jobs do mesmo usuário serializam, usuários diferentes paralelos

### BL-4 — `estimatePayoffMonths` não especificado e pesado

✅ **PASSOU**

Evidência material:
- §20.4 Função fechada `O(N)` definida com pseudocódigo completo
- Fórmula `N = -log(1 - PV*r/PMT) / log(1+r)` derivada da equação de empréstimo padrão
- Casos de borda tratados: `totalBalance ≤ 0`, `monthlyPayment ≤ 0`, juros zero, pagamento não cobre juros
- `computeWeightedAverageRate` definido explicitamente
- Cache Redis TTL 60s com hash determinístico do input
- Comparativo claro com `simulateScenario`: `O(N)` vs `O(N×M)`

---

## Dossiê dos 7 altos

| # | Alto | Resolução | Status |
|---|---|---|---|
| A-1 | `computeMinimumVital` subespecificada | §20.1.4 — pseudocódigo com 3 níveis de fallback | ✅ |
| A-2 | "Active" em `InterestRateReference` ambíguo | §20.5 — definição explícita: `effectiveDate <= today`, ordenado `DESC`, primeiro | ✅ |
| A-3 | Ações `completed` antigas vs novas | §20.8 — `cycleNumber` adicionado; `matchAction` ajustado; `determineCycleNumber` definido; comportamento UI especificado | ✅ |
| A-4 | `SettlementEvaluation` sem revalidação | §20.6 — `expiresAt` (7 dias), `invalidatedAt`, `SettlementRevalidationJob` quando capacidade muda > 20% | ✅ |
| A-5 | OCR Premium prometido sem spec | §20.10 — empurrado para `FASE_4_5_BRIDGE_OCR_PREMIUM.md`; direcionamento já fechado (OpenAI Vision + Supabase Storage + quota 0/5) | ✅ |
| A-6 | `PaymentPlan` órfão | §20.7 — `long-term-plan-service` criado (12º módulo); pseudocódigo completo; triggers definidos | ✅ |
| A-7 | `AiInsight` órfã | §20.9 — marcada `@deprecated`; migration 11 registrada; reposicionada para v2 do produto | ✅ |

---

## Dossiê dos 4 médios

| # | Médio | Resolução |
|---|---|---|
| M-1 | `ActionType.monitor` nunca gerado | §20.13 — decisão diferida para Fase 4 com teste de cenários |
| M-2 | Telemetria do motor ausente | §20.13 — registrado como tarefa da Fase 4 (Pino + Sentry + métricas opcionais) |
| M-3 | Atualização contínua de `InterestRateReference` | §20.11 — `InterestRateUpdateJob` mensal registrado |
| M-4 | Recálculo após mudança de `ScoringWeight` | §20.11 — `RecalculateAllScoresJob` manual registrado |

---

## Dossiê dos 2 baixos

| # | Baixo | Resolução |
|---|---|---|
| B-1 | Trigger `onboarding_completed` | §20.12 — adicionado aos `TriggerEvent` |
| B-2 | Escala BullMQ | §20.13 — load test registrado para pré-release |

---

## Novas pendências menores detectadas (não invalidam aprovação)

Durante a re-auditoria, identifiquei 4 detalhes finos que merecem registro. Nenhum bloqueia. Todos viram pendências da Fase 4.

### NM-1 — `Income.frequency='installment'` sem `dueDate`

**Sintoma.** `isExpectedThisMonth` (§20.1.2) retorna `false` quando `Income.dueDate` é null. Se o usuário cadastra "indenização em 6x R$ 1.000" e esquece de preencher `dueDate`, a renda some do cálculo de capacidade.

**Solução.** No `incomeInputSchema` (Fase 2 v2.1 §5.1), adicionar refine: `frequency='installment'` exige `dueDate`. Sugestão para Fase 4 implementar.

```typescript
.refine(
  (d) => d.frequency !== 'installment' || d.dueDate !== undefined,
  { message: 'Para renda parcelada, informe a próxima data de pagamento.' },
)
```

### NM-2 — Job processa usuário deletado

**Sintoma.** Jobs em fila enfileirados antes do soft delete do usuário continuam executando. Resultado: erros silenciosos no worker (usuário não encontrado).

**Solução.** Cada job começa com verificação `await userRepo.exists(userId)`. Se falso, completa o job sem erro (graceful skip). Registrar como pré-step padrão de todo job do motor.

### NM-3 — `SettlementRevalidationJob` dispara com lastSnapshot velho

**Sintoma.** `capacityDelta = |new - lastSnapshot.safeCapacity|`. Se o `lastSnapshot` é de 6 meses atrás (usuário não usou app), qualquer leve mudança hoje dispara revalidação contra dado obsoleto.

**Solução.** No detector, ao salvar snapshot, comparar com `lastSnapshot` apenas se `lastSnapshot.capturedAt > 30 dias atrás`. Caso contrário, não dispara `SettlementRevalidationJob`.

### NM-4 — Drop de `AiInsight` na migration 11

**Sintoma.** §20.9.2 diz "Migration 11 dropa AiInsight". §20.14 (Anexo) define migration 11 como "phase3_v1_1_adjustments" (alter table de cycleNumber, expiresAt). Inconsistência: a migration de drop não foi listada explicitamente.

**Solução.** Ou (a) renomear/separar: migration 11 faz ajustes do patch + migration 12 dropa `AiInsight`, ou (b) consolidar tudo na 11. Recomendo (a) para clareza. Tarefa da Fase 4 ao montar as migrations finais.

---

## Comparativo das 3 auditorias

| Auditoria | Bloqueadores | Altos | Médios | Baixos | Veredito |
|---|---|---|---|---|---|
| Fases 1 e 2 (v1) | 4 | 4 | 1 | — | 🔴 REPROVADO |
| Fases 1 e 2 (v2) | 0 | 0 | 0 | — | ✅ APROVADO |
| Fase 3 (v1) | 4 | 7 | 4 | 2 | 🔴 REPROVADO |
| **Fase 3 (v1.1)** | **0** | **0** | **0** | **0** | ✅ **APROVADO** |

**Observação.** A Fase 3 v1.1 fechou TODOS os achados da auditoria anterior. As 4 pendências menores listadas acima são **novas** e detalhe fino — não estavam na auditoria de v1.

---

## Critérios objetivos para APROVADO

Os 6 critérios definidos na auditoria anterior:

| # | Critério | Status |
|---|---|---|
| 1 | BL-1: funções de domínio definidas com pseudocódigo + utility de data nomeada | ✅ §20.1 |
| 2 | BL-2: estratégia de transaction explícita em `generate()` | ✅ §20.2 |
| 3 | BL-3: serialização de jobs por usuário decidida | ✅ §20.3 (BullMQ groupId) |
| 4 | BL-4: `estimatePayoffMonths` separado e leve | ✅ §20.4 |
| 5 | A-1 a A-7 com decisão registrada | ✅ §20.5 a §20.10 |
| 6 | Os 4 médios com decisão de "tratar agora" ou "tarefa de Fase 4" | ✅ §20.13 |

**100% dos critérios atendidos.**

---

## Comentário final

A Fase 3 v1.1 é a especificação mais densa do projeto até aqui. 11 módulos do motor (agora 12 com `long-term-plan-service`), pseudocódigo executável, estratégia de atomicidade, locks por usuário, cache em Redis, fórmula fechada para projeções, regra de suavização de estados, política de retenção LGPD por tabela, e — agora — todas as funções de domínio rastreáveis até o pseudocódigo.

O patch v1.1 foi cirúrgico: 704 linhas adicionadas resolveram 4 bloqueadores + 7 altos + 4 médios + 2 baixos. Sem reescrita.

As 4 pendências menores que detectei agora (NM-1 a NM-4) são consequência natural de re-auditar com olhar adversarial: sempre vai aparecer algo. Mas nenhuma delas é estrutural. Todas resolvem-se com pequenos ajustes durante a Fase 4 (1-2h cada).

**Quita liberado para Fase 4 — Arquitetura Técnica NestJS.**

---

## Próximas entregas

| Fase | Conteúdo | Pré-requisito |
|---|---|---|
| **4** | Arquitetura NestJS: estrutura de pastas, módulos, decoradores, BullMQ config, Upstash setup, Prisma repositories, event bus, logging, observabilidade, OpenAPI | Esta aprovação |
| **Bridge 4↔5** | Spec OCR Premium (OpenAI Vision + Supabase Storage + consentimento LGPD + quota) | Fase 4 |
| **5** | Fluxo de telas web (Next.js 15), wireframes, estados de loading/erro, copy final, plano de validação com usuários reais | Bridge |
| **6** | Plano de migração: o que rodar primeiro do código atual, ordem, riscos, preservação | Fase 5 |

---

*Fim do dossiê. Quita liberado para Fase 4.*
