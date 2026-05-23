# Devils Advocate — Auditoria da Fase 3

> **Modo:** Estratégia
> **Escopo auditado:** `FASE_3_MOTOR_DE_DECISAO.md` (1.853 linhas, 19 seções)
> **Data:** 16 de maio de 2026
> **Mantra:** *"Se não sobreviver ao meu interrogatório, não merece produção."*

---

## Veredito provisório

# 🔴 REPROVADO

A Fase 3 está mais próxima do APROVADO que qualquer fase anterior, mas não passou. Encontrei **4 falhas bloqueadoras de especificação** — funções referenciadas mas não definidas, ausência de estratégia de atomicidade, race conditions não tratadas — que vão virar bugs em produção se forem para a Fase 4 sem correção.

Diferente das auditorias anteriores, **os bloqueadores aqui são pontuais e cirúrgicos**. Não exigem reescrita. Exigem 4 a 6 horas de refinamento focado nos pontos listados abaixo. Após esse patch, viramos APROVADO.

---

## Resumo dos achados

| Severidade | Total | Categoria |
|---|---|---|
| 🔴 Bloqueadores | **4** | Especificação incompleta — viram bugs em runtime |
| 🟠 Altos | **7** | Lacunas relevantes — não bloqueiam, mas atrasam Fase 4 |
| 🟡 Médios | **4** | Refinamentos para roadmap |
| 🔵 Baixos | **2** | Anotações para futuro |

---

## Fase 1 — Radiografia

### 🔴 Bloqueadores (4)

---

#### BL-1 — Funções críticas referenciadas mas não definidas

A Fase 3 chama várias funções que nunca são especificadas. Isso é falha de contrato: Fase 4 não pode implementar o que não está escrito.

| Função | Onde é chamada | Onde deveria estar definida |
|---|---|---|
| `simulator.estimatePayoffMonths(debts, monthlyPayment)` | §7.4 (`decideState`) | §10 (contrato existe, mas só `simulate()` tem pseudocódigo) |
| `composeMainGoal(mode, goals)` | §14.3 (orquestrador) | Não está em lugar nenhum |
| `isExpectedThisMonth(income)` | §7.6 (fallback minimal) | Não está em lugar nenhum |
| `generateModeSpecificWarnings(mode, debts)` | §14.3 | Não está em lugar nenhum |
| `computeMinimumVital(stateCode, dependentsCount)` | §7.3 | Mencionada, mas sem pseudocódigo concreto — como decide capital/metro/interior? Como faz fallback se `RegionalMinimumVital` está com placeholder nacional? |
| `formatBRL` | §11.3 (`settlement-validator`) | Utility de UI, deveria estar em compartilhado |
| `firstDayOfCurrentMonth` | §11.3 | Utility — falta |
| `daysSince`, `daysBetween`, `addMonths`, `setDate`, `startOfMonth` | múltiplos lugares | Utilities — falta nomear pacote (date-fns? Day.js?) |

**Impacto.** Implementação fica refém de interpretação. `composeMainGoal` é especialmente crítica — ela gera a string `mainGoal` que aparece como **frase principal da home**, e o documento não diz como ela é composta por modo.

**Custo de correção.** ~2h: definir as 4 funções de domínio (composeMainGoal, isExpectedThisMonth, generateModeSpecificWarnings, computeMinimumVital com pseudocódigo) e nomear a stack de utilities de data.

---

#### BL-2 — Estratégia de atomicidade ausente

O `monthly-plan-generator.generate()` (§14.3) faz, em sequência:

1. Detector roda → cria `FinancialStateSnapshot`
2. Detector atualiza cache em `User`
3. Para cada dívida: `priorityEngine` calcula score
4. Para cada dívida: `debtRepo.updateScore()` persiste
5. Upsert do `MonthlyActionPlan`
6. Reconcile de `RecommendedAction`

**Pergunta dura:** o que acontece se o passo 4 falha no meio (5 de 10 dívidas atualizadas)?

- `FinancialStateSnapshot` já está persistido com o novo estado
- `User.lastFinancialState` já está atualizado
- Metade das dívidas tem score novo, metade tem score antigo
- `MonthlyActionPlan` não foi criado
- App mostra estado novo + ações vazias (ou erradas)

A Fase 3 fala de "idempotência" em §1.7 como princípio, mas **não menciona transactions, sagas, ou compensações**.

**Impacto.** Inconsistência silenciosa entre cache do `User` e o resto do estado. Bug difícil de detectar em prod.

**Custo de correção.** ~1h: definir que `generate()` roda dentro de uma transaction Prisma única (`prisma.$transaction`). Identificar quais writes precisam estar dentro e quais podem ficar fora. Documentar comportamento em caso de timeout da transaction.

---

#### BL-3 — Race conditions não tratadas

Cenário real: usuário cadastra uma dívida em dia 15, exatamente no momento em que o `MonthlyPlanRolloverJob` (cron diário) dispara para esse mesmo usuário (porque `nextReviewDate` é hoje).

**Dois jobs concorrentes:**
- Job A (`debt_added`): roda detector → roda generator
- Job B (`month_rollover`): roda detector → roda generator

Ambos chamam `monthlyPlanRepo.upsert(userId, referenceMonth=2026-06-01, ...)`. O `@@unique([userId, referenceMonth])` impede registros duplicados, mas:
- Qual versão do plano "ganha"? A última a fazer `commit` na transaction.
- E as ações? `reconcileActions` pode ser chamada 2x com inputs diferentes.
- `RecommendedAction.markExpired` pode ser chamado em ações que o outro job está criando.

**Impacto.** Plano final pode estar incompleto, com ações duplicadas ou em estado inconsistente.

**Custo de correção.** ~1h: definir lock por usuário (advisory lock no Postgres, ou semáforo no Redis via BullMQ). BullMQ tem `concurrency: 1` por chave — basta configurar workers com `groupKey: userId`. Documentar isso.

---

#### BL-4 — Loop circular implícito entre detector e simulator

O `financial-state-detector.detect()` (§7.3) chama `decideState()` (§7.4) que chama `simulator.estimatePayoffMonths()`. Mas:

- §10.2 (contrato do simulator) declara `estimatePayoffMonths` na interface
- §10.3 só mostra `simulateScenario()` (cenário completo, retorna `ScenarioResult`)
- Não há pseudocódigo de `estimatePayoffMonths`

Pior: `simulateScenario` rebobina toda a fórmula de pagamento mês a mês para várias dívidas — é O(N*M) onde N=dívidas e M=meses até quitar. Para um usuário com 8 dívidas, pode ser 8 × 60 = 480 iterações. **Toda vez que o detector roda** (cada evento, cada cron, cada update de despesa) isso roda.

Sem cache, sem memoização. Performance latente. Combine com BL-3 (sem locks) e fica pior.

**Impacto.** Lentidão silenciosa que só aparece em produção com N usuários. Em dev, com 2 dívidas, ninguém percebe.

**Custo de correção.** ~1h: definir `estimatePayoffMonths` com algoritmo mais leve (não precisa rebobinar — basta projeção de cabeça simples). Adicionar cache em memória (Redis) para o resultado, invalidado por mudança de dívida.

---

### 🟠 Altos (7)

---

#### A-1 — `computeMinimumVital` subespecificada

§7.3 chama `await computeMinimumVital(user.stateCode, user.dependentsCount)`. Mas:
- O schema `RegionalMinimumVital` tem `regionType` (capital, metro, interior). Como o motor decide qual?
- Hoje no seed só tem 1 linha (`stateCode='BR', regionType='metro'`).
- O que retornar se a UF do usuário não está cadastrada?
- O que retornar se `RegionalMinimumVital` está vazia?

**Falta:** pseudocódigo da função com hierarquia de fallback. Sugestão:

```
1. Buscar por (stateCode, regionType=metro) — assume metro como default sem dados de cidade
2. Se não encontra, buscar por (stateCode='BR', regionType=metro) — fallback nacional
3. Se ainda nada, retorna 1320 (constante do código) e gera warning
4. Aplicar fórmula: result = baseAmountSingle + (basePerDependent * dependentsCount)
```

---

#### A-2 — `findActiveByCategory` ambiguidade

§6.3 chama `interestRateRepo.findActiveByCategory(category.slug)`. "Active" significa o quê?

Possíveis interpretações:
- `effectiveDate <= today` mais recente
- `effectiveDate` exato do mês atual
- Última linha cadastrada

Sem definição, implementador pode escolher errado. Recomendação: definir explicitamente como "a linha com maior `effectiveDate` cujo `effectiveDate <= today`".

---

#### A-3 — Ações `completed` antigas vs novas recomendações conflitantes

§14.4 (`reconcileActions`) preserva ações `completed`. Mas:

**Cenário.** Em 1º de junho, motor recomenda `pay R$ 180 na conta de luz`. Usuário marca como `completed` em dia 5. Em dia 15, usuário cadastra novo pagamento da mesma conta de luz (porque veio outra fatura no mesmo mês). Motor recalcula:
- A ação `pay R$ 180 conta luz` antiga está `completed`
- O motor gera nova ação `pay R$ 180 conta luz` para a próxima fatura
- `matchAction` retorna `true` (mesmo actionType, mesmo targetDebt)
- Mas a antiga não está `pending` → entra no `else if (!match)` → cria nova

Tudo bem? Quase. Mas se a UI exibe **todas** as ações do plano, vai mostrar:
- ✓ Pago: conta de luz R$ 180
- ▢ Pendente: conta de luz R$ 180

Confuso. Solução: ou (a) UI esconde ações `completed` mais antigas que X dias, ou (b) `matchAction` precisa considerar `dueDate` também, ou (c) ações ganham campo `cycle` ou `occurrenceNumber`.

**Custo de correção.** Pequeno. Definir regra.

---

#### A-4 — `SettlementEvaluation` não cobre revalidação após mudança de capacidade

Usuário pede validação em 1º de junho, capacidade segura é R$ 400. Validator diz "aceite essa proposta de R$ 350/mês". Usuário leva 10 dias para confirmar. Nesse meio tempo:
- Cadastra nova despesa essencial (R$ 200/mês)
- Capacidade segura agora é R$ 200
- Aquela proposta de R$ 350/mês não cabe mais

App ainda mostra "recomendamos aceitar"? Não há mecanismo de invalidar `SettlementEvaluation`.

**Sugestão.** `SettlementEvaluation` tem `expiresAt` (ex: 7 dias após `evaluatedAt`). Após expirar, usuário precisa pedir nova validação. Ou: validator é re-rodado automaticamente quando capacidade muda > 20%.

---

#### A-5 — OCR Premium prometido mas não especificado no motor

Fase 1 v2 §8.1 reintroduziu OCR de comprovante de proposta como feature Premium. Fase 3 não menciona. Como o OCR alimenta o `settlement-validator`?

- Endpoint que recebe imagem → extrai texto → parser estruturado → input do validator?
- Qual provedor (OpenAI Vision, Google Vision, Tesseract)?
- Onde grava a imagem original? Bucket Supabase Storage?
- LGPD: dado financeiro fotografado precisa de tratamento especial?

**Pendência clara.** Não bloqueia o motor (validator funciona sem OCR), mas precisa de spec antes da Fase 5 (UI).

---

#### A-6 — `PaymentPlan` e `PlanTimelineItem` órfãos

Fase 1 v2 §8 mantém tela 13 ("Plano completo, longo prazo"). Fase 2 v2 estendeu `PaymentPlan` com `simulationConservative`, `estimatedPayoffMonthsMin`, etc. Mas Fase 3:
- Não menciona quem **escreve** em `PaymentPlan`
- Não tem módulo dedicado para o plano de longo prazo
- O `simulator` (§10) só é chamado pelo `detector` (e indiretamente)

**Lacuna.** A tela 13 fica órfã. Faltam: trigger de geração, módulo responsável, lifecycle do `PaymentPlan` vs `MonthlyActionPlan`.

Pode virar pendência da Fase 3 (refinamento) ou da Fase 4 (arquitetura) — mas precisa ser endereçada.

---

#### A-7 — `AiInsight` órfã

Tabela existe no schema (mantida intacta da v1 do código atual). Fase 2 v2 a marcou como "inalterada". Fase 3 não menciona.

- O que escreve nela? Pelo nome, deveria ser um módulo de "insights de IA" — mas o Quita não tem IA generativa no MVP.
- Posicionamento Free vs Premium? Fase 1 v2 §8.1 menciona "Chat com IA para esclarecimento contextual" como feature Premium. É isso?
- Sem responsável claro, vira código morto.

**Sugestão.** Ou (a) marcar como `@deprecated` e remover na próxima migration, ou (b) atribuir responsável e especificar uso.

---

### 🟡 Médios (4)

---

#### M-1 — `ActionType.monitor` definido mas nunca gerado

§9.3 declara `monitor` como permitido em `payoff`, `stabilization`, `protection`. §14.5 (geração de ações) nunca produz uma ação `monitor`. Tipo morto.

Ou se gera (em que circunstância?), ou se remove do enum.

---

#### M-2 — Telemetria do motor ausente

Nada na Fase 3 sobre métricas: tempo de execução por módulo, taxa de falha, distribuição de estados detectados, % de planos com warnings. Critical para entender saúde do motor em prod.

Fica para Fase 4, mas vale registrar.

---

#### M-3 — Atualização contínua de `InterestRateReference`

Schema permite múltiplas linhas por categoria com `effectiveDate`. Mas não há job que atualiza esses dados. Quem garante que os juros de referência não estão de 2024?

Sugestão: `InterestRateUpdateJob` mensal que consome a API BCB SGS. Registrar como tarefa explícita.

---

#### M-4 — Mudança de `ScoringWeight` não dispara recálculo em massa

Princípio §1: "Pesos do motor são dados, não código." Bom. Mas se ajustamos um peso, **todas as dívidas existentes têm score desatualizado** até o próximo recálculo individual.

Sugestão: job `RecalculateAllScoresJob` disparado manualmente após atualização de pesos. Ou cron diário que recalcula scores de todas as dívidas ativas.

---

### 🔵 Baixos (2)

- **B-1 — Trigger de "onboarding_completed".** §15.1 não lista esse evento. O motor é chamado pela primeira vez quando? Fica implícito no controller, mas vale registrar.
- **B-2 — Escala de workers BullMQ.** Quantos workers concorrentes? Sem números, fica para load test.

---

## Fase 5 — Interrogatório Endereçado

8 perguntas. Cada uma exige decisão concreta — não "depois a gente vê".

---

**P1 @claude-arquiteto**
Sobre BL-1 (funções referenciadas mas não definidas): topa eu produzir um **patch da Fase 3 (v1.1)** especificando as 4 funções de domínio críticas (`composeMainGoal`, `isExpectedThisMonth`, `generateModeSpecificWarnings`, `computeMinimumVital`) e nomeando a stack de utilities de data (sugiro `date-fns`)?

---

**P2 @claude-arquiteto**
Sobre BL-2 (atomicidade): aceita que `monthly-plan-generator.generate()` rode dentro de uma `prisma.$transaction` única englobando snapshot, cache de User, score de Debts, upsert de plano e reconcile de actions? Se sim, qual o timeout (sugiro 10s)?

---

**P3 @claude-arquiteto**
Sobre BL-3 (race conditions): aceita usar BullMQ `groupKey: userId` para serializar jobs por usuário (concurrency 1 por usuário, paralelo entre usuários)? Alternativa: advisory lock no Postgres. Decida.

---

**P4 @claude-arquiteto**
Sobre BL-4 (simulator pesado): aceita definir `estimatePayoffMonths` como função leve separada de `simulateScenario`? Algoritmo sugerido: aproximação fechada (não iterativa) usando juros médios da carteira.

---

**P5 @product**
Sobre A-3 (ações completed antigas vs novas): qual estratégia?
- (a) UI esconde `completed` > 30 dias
- (b) `matchAction` considera também `dueDate`
- (c) `RecommendedAction` ganha campo `cycleNumber` (occurrence dentro do mês)

---

**P6 @product**
Sobre A-5 (OCR Premium): especificar agora (Fase 3) ou empurrar para spec própria antes da Fase 5? Se especificar agora, defina provedor (OpenAI Vision parece melhor) e onde guarda a imagem (Supabase Storage com auto-delete em 30 dias?).

---

**P7 @product + @claude-arquiteto**
Sobre A-6 e A-7 (PaymentPlan/PlanTimelineItem e AiInsight órfãos): pendência conjunta. Vou propor:
- `PaymentPlan` ganha módulo responsável (`long-term-plan-service`) que roda menos frequente (1x/mês) e popula `PaymentPlan` + `PlanTimelineItem`
- `AiInsight`: ou define responsável agora (módulo `insight-generator-service` para o chat Premium), ou marca como `@deprecated`

Qual caminho?

---

**P8 @claude-arquiteto**
Sobre A-4 (revalidação de acordo): aceita adicionar `SettlementEvaluation.expiresAt` (7 dias após `evaluatedAt`)? E o detector dispara `SettlementRevalidationJob` quando capacidade muda > 20%?

---

## Fase 6 — Ciclo Adversarial

**Estado atual:** aguardando respostas do interrogatório.

Como nas auditorias anteriores: resposta vaga é rejeitada automaticamente. Decisão concreta + onde foi documentada + responsável claro.

---

## Fase 7 — Critérios para virar APROVADO

| # | Critério | Status |
|---|---|---|
| 1 | BL-1: funções de domínio definidas com pseudocódigo + utility de data nomeada | ❌ |
| 2 | BL-2: estratégia de transaction explícita em `generate()` | ❌ |
| 3 | BL-3: serialização de jobs por usuário decidida (BullMQ groupKey ou advisory lock) | ❌ |
| 4 | BL-4: `estimatePayoffMonths` separado e leve | ❌ |
| 5 | A-1 a A-7 com decisão registrada (não precisa estar implementado — basta decidido) | ❌ |
| 6 | Os 4 médios com decisão de "tratar agora" ou "tarefa de Fase 4" | ❌ |

---

## Comparativo das auditorias

| Fase | Bloqueadores | Altos | Médios | Veredito |
|---|---|---|---|---|
| Fases 1 e 2 (1ª auditoria) | 4 | 4 | 1 | 🔴 REPROVADO |
| Fases 1 e 2 v2 | 0 | 0 | 0 | ✅ APROVADO |
| Fase 3 (esta) | 4 | 7 | 4 | 🔴 REPROVADO |

**Observação.** A Fase 3 tem MENOS gravidade que as Fases 1 e 2 originais. Os bloqueadores aqui são pontuais de especificação, não conceituais. **Custo estimado de correção: ~5h de trabalho focado.** Não é refazer — é finalizar.

---

## Comentário final

A Fase 3 está mais densa, mais técnica e mais ambiciosa que as anteriores. É natural que apareçam furos finos — funções esquecidas no meio do pseudocódigo, transactions implícitas, race conditions não pensadas. O documento não está errado em conceito; está incompleto em pontos pequenos mas importantes.

Os 4 bloqueadores compartilham um padrão: **detalhes operacionais que viram bugs em produção se ficarem implícitos**. Não dá pra Fase 4 implementar `composeMainGoal` se a Fase 3 não diz o que ela retorna. Não dá pra confiar em idempotência sem dizer "tudo dentro de uma transaction". Não dá pra prometer consistência sem serializar jobs concorrentes.

Resolva os 4 bloqueadores em um patch v1.1 (não precisa reescrever os 1.853 linhas — só adicionar uma seção 20 com os detalhes faltantes). Depois disso, viramos APROVADO e seguimos para a Fase 4.

*Fim do dossiê. Aguardando ciclo adversarial.*
