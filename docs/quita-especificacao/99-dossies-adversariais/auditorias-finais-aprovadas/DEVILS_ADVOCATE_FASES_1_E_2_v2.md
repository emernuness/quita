# Devils Advocate — Auditoria v2 das Fases 1 e 2

> **Modo:** Estratégia
> **Escopo auditado:** `FASE_1_ESPECIFICACAO_DE_PRODUTO_v2.md` + `FASE_2_MODELAGEM_DE_DOMINIO_v2.md`
> **Versão anterior:** Veredito REPROVADO em 16/05/2026, com 9 falhas estruturais e 10 perguntas no interrogatório
> **Data desta auditoria:** 16/05/2026, pós-ciclo adversarial
> **Mantra:** *"Se não sobreviver ao meu interrogatório, não merece produção."*

---

## Veredito final

# ✅ APROVADO

Não é "aprovado com ressalvas". É aprovado com **dossiê de evidências completo** abaixo.

Os 4 bloqueadores apontados foram **efetivamente resolvidos** com decisão concreta e materialização no schema. Os 5 ALTOs foram tratados. O naming foi padronizado. A conformidade legal tem cronograma claro. Os pontos cegos viraram riscos aceitos documentados.

Detectei 4 pendências menores que **não invalidam a aprovação** mas viram **tarefas obrigatórias da Fase 3** (não da Fase 2 — não exigem retrabalho de schema).

---

## Dossiê de evidências

### Critério 1: BLOQUEADOR-1 resolvido (sazonais/provisão)

✅ **PASSOU**

Evidência material:
- `Expense.frequency` (enum `ExpenseFrequency` com `monthly`, `bimonthly`, `quarterly`, `semiannual`, `annual`, `irregular`) — Fase 2 §2.3
- `Expense.monthlyProvision` (Decimal) — Fase 2 §2.3
- `Expense.nextOccurrence` (Date) — Fase 2 §2.3
- `EmergencyReserve` tabela completa — Fase 2 §3.9
- Fórmula da `capacidade_segura` atualizada com `total_provisao_sazonal` e `aporte_reserva_emergencia` — Fase 1 §4.2
- Conceitos explicados na §4.3 da Fase 1
- Refinamento Progressivo no onboarding cobre cadastro de sazonais — Fase 1 §6.1.2

### Critério 2: BLOQUEADOR-2 resolvido (renda instável)

✅ **PASSOU**

Evidência material:
- `Income.guaranteedAmount` (Decimal opcional) — Fase 2 §2.2
- `Income.upperBoundAmount` (Decimal opcional) — Fase 2 §2.2
- `Income.stabilityType` (enum `IncomeStability` com `stable`, `variable`, `seasonal`) — Fase 2 §2.2
- `User.overallIncomeStability` (cache agregado) — Fase 2 §2.1
- **Regra de suavização** explicitada — Fase 1 §4.2: "Mudança para PIOR exige 2 meses consecutivos abaixo do limiar. Mudança para MELHOR é imediata."
- Perfil informal/autônomo nomeado como sub-caso explícito da persona — Fase 1 §3.1.b1
- Validação Zod com refine — Fase 2 §5.1

### Critério 3: BLOQUEADOR-3 resolvido (ciclo financeiro e jobs)

✅ **PASSOU**

Evidência material:
- Trigger híbrido (evento + scheduled) documentado — Fase 1 §6.5
- 4 tipos de trigger especificados em tabela — Fase 1 §6.5
- Stack escolhida: BullMQ + Upstash Redis (rationale na resposta do ciclo)
- `User.nextReviewDate` (campo persistente) — Fase 2 §2.1
- Cálculo de `nextReviewDate` por usuário documentado: `paymentDay - 1` ou dia 1
- Política de degradação silenciosa: retry 5min/30min/2h/8h → dead-letter queue → plano antigo permanece — Fase 1 §6.5
- Expiração de planos antigos (12 meses, soft delete LGPD) — Resposta P3

### Critério 4: BLOQUEADOR-4 resolvido (LGPD + risco legal)

✅ **PASSOU**

Evidência material:
- Nova seção §13 "Conformidade legal e governança" na Fase 1
- `ConsentLog` tabela completa com `ipAddress`, `userAgent`, versão — Fase 2 §3.11
- `User.acceptedTermsAt` + `User.acceptedTermsVersion` — Fase 2 §2.1
- Cláusulas críticas dos Termos de Uso redigidas — Fase 1 §13.2
- Posicionamento explícito sobre Lei 14.181/2021 — Fase 1 §13.3
- Princípio fundador #10 acrescentado: "Recomendação como informação, não conselho profissional" — Fase 1 §2
- Cronograma de compliance — Fase 1 §13.5
- Mecanismos de auditoria mapeados (`SettlementEvaluation`, `FinancialStateSnapshot`, `ConsentLog`, `MonthlyActionPlan` versionado) — Fase 1 §13.4

### Critério 5: ALTO-5 a 8 com decisão registrada

✅ **PASSOU**

| Item | Decisão registrada |
|---|---|
| **ALTO-5 (onboarding)** | Reescrita §6.1 com Onboarding Crítico 3-5 min + Refinamento Progressivo; KPIs concretos (>80% conclusão, <5min, >50% refinamento em 30d) — Fase 1 §6.1.3 |
| **ALTO-6 (Goals)** | `UserGoal` tabela criada — Fase 2 §3.10; `goal-tracker-service` adicionado — Fase 1 §7.10 |
| **ALTO-7 (inconsistências)** | Todas as 5 reconciliadas — ver Critério 6 abaixo |
| **ALTO-8 (confiabilidade)** | `dataConfidence` em Debt, Expense e RecommendedAction; `RateSource` enum; ícone visual "estimado"; job semanal `DataFreshnessReviewJob` |

### Critério 6: 5 inconsistências Fase 1↔Fase 2 reconciliadas

✅ **PASSOU**

| # | Conflito original | Resolução |
|---|---|---|
| 1 | `pay` em `survival` | `OPERATION_MODE_RULES` no service + teste unitário — Fase 1 §7.6 |
| 2 | `dias_atraso` vs `meses_atraso` | Padronizado em `daysOverdue` (Int) substituindo `overdueMonths` — Fase 2 §2.5 |
| 3 | Enum `PlanStrategy` com 7 valores | Limpo para 4: `snowball`, `avalanche`, `hybrid`, `crisis` — Fase 2 §2.6 |
| 4 | `priorityOrder` vs `priorityScore` | `priorityOrder` **removido** — Fase 2 §2.5 |
| 5 | Pesos hardcoded vs configuráveis | Tabela `ScoringWeight` criada com seed de 10 fatores — Fase 2 §3.12 |

### Critério 7: Naming padronizado

✅ **PASSOU**

Evidência:
- `FinancialState` em inglês: `healthy_with_debt`, `tight_budget`, `monthly_deficit`, `overindebtedness`, `practical_insolvency` — Fase 2 §4.1
- `OperationMode` em inglês: `payoff`, `stabilization`, `crisis_mode`, `protection`, `survival` — Fase 2 §4.1
- Princípio de modelagem #6 adicionado: "Naming em inglês. Tradução para PT-BR fica na camada de UI via i18n" — Fase 2 §1
- Tabelas Fase 1 atualizadas com display PT-BR + nome interno EN lado a lado

### Critério 8: Plano de validação com usuário real

⚠️ **PARCIAL — vai para Fase 3**

Não foi explicitado como o produto será validado com pessoas endividadas reais antes do release amplo. A v2 marca isso como "risco aceito" implícito ao apontar que público endividado é difícil de testar — mas não há plano.

**Decisão:** isto não bloqueia o schema (Fase 2). Bloqueia a Fase 5/6 (telas e migração). Registrar como tarefa explícita da **Fase 3 ou 5**: plano de beta privado com 10-20 pessoas endividadas reais (recrutadas via Procon parceiro, sindicatos, ONGs de educação financeira).

Não revoga a aprovação porque o schema não muda em função disso.

### Critério 9: Pontos cegos com decisão de "tratar agora" ou "risco aceito"

✅ **PASSOU**

- Nova seção §10.1 "Riscos aceitos" na Fase 1 com 3 itens explicitamente documentados:
  1. Conversão Free → Premium pode ser baixa (Plano B documentado)
  2. Custo unitário não validado em escala (monitorar com KPIs)
  3. Suporte humano em Modo Sobrevivência via encaminhamento no MVP, canal humano em v2

---

## Pendências menores detectadas (não bloqueiam APROVADO)

Quatro pendências apareceram durante a re-auditoria. **Nenhuma é estrutural** — todas viram tarefas da Fase 3.

### Pendência 1: Política de retenção de dados (LGPD art. 16)

LGPD exige minimização e descarte após cumprimento da finalidade. Os documentos definem:
- `MonthlyActionPlan` retido 12 meses (Free vê só ativo, Premium 12 meses)
- `FinancialStateSnapshot` retido indefinidamente como histórico

**Faltou:** política explícita por tabela. `ConsentLog`, `SettlementEvaluation`, `RecommendedAction` (após `expired`/`dismissed`), `Payment`, etc.

**Tarefa para Fase 3:** definir matriz "tabela → tempo de retenção → trigger de arquivamento/eliminação".

### Pendência 2: Regra de suavização precisa de regra fina

Fase 1 §4.2 diz "2 meses consecutivos abaixo do limiar". Mas:
- Se em janeiro o motor rodou e detectou Apertado, e em fevereiro a pessoa não atualizou dados, o `FinancialStateSnapshot` de fevereiro tem o quê?
- "Consecutivos" se mede por mês civil ou por execução do detector?
- Se a pessoa muda dados drasticamente em 15 do mês, "conta" como "mês inteiro"?

**Tarefa para Fase 3:** especificar exatamente o algoritmo da regra de suavização com casos de borda explícitos (snapshot vazio, mudança no meio do mês, primeira vez).

### Pendência 3: `diagnosisLevel='minimal'` distorce a capacidade segura

Quando o usuário só fez Onboarding Crítico:
- Despesas não foram classificadas → `is_essential = false` para todas
- Resultado: `total_essenciais = 0` na fórmula → `capacidade_segura` infla artificialmente

Isso pode gerar recomendação irrealista ("você pode pagar R$ 800 na dívida X") quando o real é zero.

**Tarefa para Fase 3:** quando `diagnosisLevel='minimal'`, aplicar **fallback agressivo**: tratar TODAS as despesas como essenciais por padrão, ou aplicar percentual conservador (ex: assumir 70% da renda como essencial). Comunicar à UI o nível de incerteza.

### Pendência 4: Unicidade de `MonthlyActionPlan` por mês

Schema tem `@@unique([userId, referenceMonth])`. Mas o motor pode recalcular várias vezes no mesmo mês (eventos disparam recálculo).

**Pergunta:** o recálculo dentro do mês sobrescreve o plano (update in-place) ou cria um novo (que viola o unique)?

**Decisão necessária:** define-se **update in-place** (atualiza o plano existente, mantém `id`, atualiza `actions`). Plano anterior **não** vira histórico — apenas o último estado por mês importa. Histórico fica em `FinancialStateSnapshot`.

**Tarefa para Fase 3:** documentar esse comportamento em `monthly-plan-generator` service.

---

## Comparativo v1 → v2

| Métrica | v1 | v2 |
|---|---|---|
| Bloqueadores em aberto | 4 | 0 |
| ALTOs em aberto | 4 | 0 |
| MÉDIOs em aberto | 1 | 0 |
| Pontos cegos não tratados | 5 | 0 (todos viraram riscos aceitos ou tarefa) |
| Pendências para Fase 3 | n/a | 4 (todas operacionais, nenhuma estrutural) |
| Veredito | 🔴 REPROVADO | ✅ **APROVADO** |

---

## Recomendações de processo para próximas fases

1. **Antes da Fase 3:** Deborah designa DPO interno provisório (mesmo sem advogado contratado ainda) e adiciona endpoint placeholder para `ConsentLog` na próxima sprint de schema.
2. **Durante a Fase 3:** as 4 pendências acima viram bullets explícitos na especificação dos módulos (`financial-state-detector` precisa documentar regra de suavização; `monthly-plan-generator` precisa documentar update in-place; etc.).
3. **Antes da Fase 4:** contratar advogado fintech (BLOQUEADOR-4 está resolvido no documento, mas a execução do cronograma ainda precisa acontecer — não é tarefa do Quita-arquiteto, é do Quita-product).
4. **Antes da Fase 5:** plano de beta privado com público real.
5. **Antes do release público:** todos os itens do §13.5 da Fase 1 cumpridos.

---

## Sobre o tom desta auditoria

O devils-advocate da v1 foi duro. Encontrou 9 furos, alguns críticos. A v2 endereçou cada um com decisão concreta materializada no schema — não com retórica. Isso é o que diferencia engenharia séria de wishful thinking.

A aprovação é honesta. Não é cortesia, não é cansaço. Os 4 bloqueadores que eu mesmo levantei viraram tabelas, campos, enums e seções com cronograma. O ciclo adversarial funcionou.

Seguimos para a **Fase 3 — Motor de Decisão** com chão firme.

---

## Próximas entregas

| Fase | Conteúdo | Pré-requisito |
|---|---|---|
| **3** | Motor de Decisão: contratos TypeScript, pseudocódigo dos módulos, regras de classificação, testes; + as 4 pendências menores resolvidas | Esta aprovação |
| **4** | Arquitetura técnica: NestJS, BullMQ, Upstash, cache, eventos | Fase 3 |
| **5** | Fluxo de telas (web first), wireframes, estados | Fase 4 |
| **6** | Plano de migração do código atual | Fase 5 |

*Fim do dossiê. Quita liberado para Fase 3.*
