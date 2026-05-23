# Ciclo Adversarial — Respostas + Ajustes Propostos

> **Resposta ao:** `DEVILS_ADVOCATE_FASES_1_E_2.md`
> **Data:** 16 de maio de 2026
> **Status:** Pendente confirmação de @deborah-product, @deborah-legal, @deborah-business

---

## Sumário executivo

10 perguntas respondidas. Das 9 falhas estruturais apontadas pelo devils-advocate, **todas têm proposta concreta** de resolução. O custo total estimado para a Fase 2: **+5 tabelas, +12 campos, +3 enums** em relação ao schema atual. Nenhuma reescrita — só extensão.

**Distribuição das respostas:**
- 4 perguntas decididas por @claude-arquiteto (P3, P7, P8, P9) — decisões técnicas tomadas
- 5 perguntas com proposta + recomendação pendentes de @deborah-product (P1, P2, P5, P6) — falta sua palavra
- 1 pergunta crítica de @deborah-legal (P4) — exige decisão de negócio + advogado
- 1 pergunta de @deborah-business (P10) — análise sugerida, ação pendente

**Impacto consolidado:**
- Fase 1: 6 seções precisam de update incremental (não reescrita)
- Fase 2: 5 novas tabelas + 12 campos + 3 enums + 1 substituição de naming
- Migration: 2 migrations extras (de 7 vai para 9)

---

## P1 (BLOQUEADOR-1) — Gastos sazonais e provisão

### Análise das 3 opções

| Opção | Pros | Cons | Custo |
|---|---|---|---|
| (a) Tabela `ProvisionedExpense` separada | Domínio claro, query específica | +1 tabela, fragmenta lógica de despesa | Médio |
| (b) Estender `Expense` com periodicidades novas | Reaproveita estrutura, menos tabelas | Query "despesa do mês" fica condicional | Baixo |
| (c) Ignorar no MVP | Não atrasa Fase 2 | Motor erra todo janeiro, fevereiro, IPVA, IPTU | Alto (custo de retrabalho) |

### Recomendação: **híbrido B + tabela auxiliar**

**Estender `Expense` com:**

| Campo | Tipo | Default | Justificativa |
|---|---|---|---|
| `frequency` | `ExpenseFrequency` | `monthly` | Granularidade: `monthly`, `bimonthly`, `quarterly`, `semiannual`, `annual`, `irregular` |
| `monthlyProvision` | `Decimal? @db.Decimal(12,2)` | `null` | Valor a provisionar mensalmente (calculado: `amount / 12` para `annual`, etc.) |
| `nextOccurrence` | `DateTime? @db.Date` | `null` | Próxima data esperada (para `annual`/`irregular`) |
| `provisionStartedAt` | `DateTime? @db.Date` | `null` | Quando começou a juntar dinheiro pra essa despesa |

**Criar tabela nova `EmergencyReserve` (1:1 com User):**

```prisma
model EmergencyReserve {
  id              String      @id @default(uuid())
  userId          String      @unique @map("user_id")
  currentAmount   Decimal     @default(0) @map("current_amount") @db.Decimal(12, 2)
  targetAmount    Decimal?    @map("target_amount") @db.Decimal(12, 2)
  monthlyTarget   Decimal?    @map("monthly_target") @db.Decimal(12, 2)
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("emergency_reserves")
}
```

**Novo enum:**

```prisma
enum ExpenseFrequency {
  monthly       // mensal (default)
  bimonthly     // a cada 2 meses
  quarterly     // trimestral
  semiannual    // semestral
  annual        // anual (IPTU, IPVA)
  irregular     // sem padrão (manutenção, dentista)
}
```

**Mudança na fórmula da capacidade segura (Fase 1 §4.2):**

```
total_provisao_sazonal = soma(Expense.monthlyProvision)

capacidade_segura = renda_liquida_mensal
                  - total_essenciais_recorrentes
                  - total_provisao_sazonal          ← novo
                  - total_renda_protetora
                  - total_legais
                  - reserva_operacional_mínima
                  - aporte_reserva_emergencia       ← novo (se ativo)
```

**Status:** ⚠️ Aguardando confirmação de @deborah-product.

---

## P2 (BLOQUEADOR-2) — Renda informal/instável

### Recomendação: **(a) + (c) combinados**

Campos novos em `Income` e `User` + regra de suavização no detector.

**Estender `Income` com:**

| Campo | Tipo | Default | Origem |
|---|---|---|---|
| `guaranteedAmount` | `Decimal? @db.Decimal(12,2)` | `null` | Piso confiável que a pessoa sabe que vai entrar |
| `upperBoundAmount` | `Decimal? @db.Decimal(12,2)` | `null` | Teto realista esperado |
| `stabilityType` | `IncomeStability` | `stable` | Tipo de estabilidade |

**Estender `User` com:**

| Campo | Tipo | Default | Justificativa |
|---|---|---|---|
| `overallIncomeStability` | `IncomeStability?` | `null` | Estabilidade agregada — derivada das rendas, mas cacheada |

**Novo enum:**

```prisma
enum IncomeStability {
  stable        // CLT, aposentadoria — entra todo mês confiável
  variable      // freelancer, autônomo — oscila
  seasonal      // vendedor sazonal, professor por contrato
}
```

**Regra de suavização no `financial-state-detector`:**

- **Mudança para PIOR estado** (Saudável → Apertado → Crise) exige **2 meses consecutivos** abaixo do limiar
- **Mudança para MELHOR estado** é imediata (não tem por que esperar pra dar boa notícia)
- Para `IncomeStability = variable`: usar `guaranteedAmount` no cálculo conservador; média 3 meses no cálculo otimista
- Para `IncomeStability = stable`: lógica atual

**Status:** ⚠️ Aguardando confirmação de @deborah-product.

---

## P3 (BLOQUEADOR-3) — Ciclo financeiro e jobs

### Decisão @claude-arquiteto

**a) Trigger híbrido: evento + scheduled**

| Tipo | Quando dispara | Job |
|---|---|---|
| **Evento** | CRUD em `Income`, `Expense`, `Debt`, `Payment`, `BehaviorProfile` | `RecalculateFinancialStateJob` |
| **Evento** | Avaliação de acordo concluída | `RecalculateMonthlyPlanJob` |
| **Scheduled** | Diariamente 02:00 UTC para usuários com `nextReviewDate <= hoje` | `MonthlyPlanRolloverJob` |
| **Scheduled** | Semanal — verificar dívidas com dados estimados há mais de 90 dias | `DataFreshnessReviewJob` |

**b) Ferramenta: BullMQ + Redis (Upstash)**

| Escolha | Por quê | Alternativa rejeitada |
|---|---|---|
| **BullMQ** | Integração nativa com NestJS via `@nestjs/bull`; dashboard de fila; retry com backoff; dead-letter queue | `pg_cron` (menos visibilidade); Vercel Cron (dependência de plataforma) |
| **Upstash Redis** | Serverless, pay-per-use, compatível com Vercel/qualquer host; sem servidor pra manter | Redis dedicado (custo fixo desnecessário no MVP) |

**c) Modelo de "mês de referência":**

- `MonthlyActionPlan.referenceMonth` = mês civil (sempre o 1º dia do mês)
- `User.nextReviewDate` = calculado por usuário:
  - Se há `Income.paymentDay` com renda fixa principal → `dia (paymentDay - 1)` do próximo mês (revisar antes do dinheiro entrar)
  - Caso contrário → dia 1 do próximo mês
- Permite ajustar a "agenda mental" de cada usuário sem fragmentar relatórios (sempre por mês civil)

**d) Degradação:**

| Cenário | Comportamento |
|---|---|
| Job falha 1ª vez | Retry em 5 min |
| Falha 2ª | Retry em 30 min |
| Falha 3ª | Retry em 2h |
| Falha 4ª | Manda para dead-letter queue, log no Sentry, **plano anterior permanece válido** |
| Usuário não abre app por 60 dias | Job ainda roda, plano fica disponível para quando voltar; notificação suave após 30 dias |

**e) Expiração de planos antigos:**

- `MonthlyActionPlan.isActive = false` quando um novo plano daquele mês é gerado (ou no rollover)
- Free: visualiza apenas o plano ativo + último mês
- Premium: visualiza histórico de 12 meses
- Soft delete após 12 meses (LGPD — minimização)

**Status:** ✅ Decidido. Vai impactar Fase 4 (arquitetura técnica) e adicionar campo `User.nextReviewDate` na Fase 2.

---

## P4 (BLOQUEADOR-4) — Risco legal

### @deborah-legal — proposta para sua decisão

Não sou advogado. Mas o caminho mínimo viável que funciona em fintechs brasileiras semelhantes:

**Fase imediata (antes de qualquer release público):**

| Ação | Custo estimado | Responsável |
|---|---|---|
| Contratar advogado fintech para revisão LGPD/CDC | R$ 3-8k inicial | Você |
| Produzir RIPD (Relatório de Impacto à Proteção de Dados) | Incluso na revisão | Advogado |
| Designar DPO (pode ser figura interna até 1.000 usuários) | R$ 0 inicial; R$ 2-5k/mês quando escalar | Você ou terceiro |
| Termos de Uso + Política de Privacidade (modelo fintech adaptado) | R$ 1-3k | Advogado |
| Cláusula de isenção visível no app: "Recomendações geradas automaticamente com base nos dados fornecidos pelo usuário — não constituem aconselhamento financeiro profissional" | R$ 0 (cópia) | Produto |

**Implicações no produto e no schema:**

- `User` precisa de `acceptedTermsAt`, `acceptedTermsVersion` (LGPD exige rastrear consentimento por versão)
- Tabela nova `ConsentLog` para auditoria:

```prisma
model ConsentLog {
  id              String      @id @default(uuid())
  userId          String      @map("user_id")
  consentType     ConsentType @map("consent_type")
  version         String      @db.VarChar(20)
  acceptedAt      DateTime    @default(now()) @map("accepted_at")
  ipAddress       String?     @map("ip_address") @db.VarChar(45)
  userAgent       String?     @map("user_agent") @db.VarChar(500)

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, consentType])
  @@map("consent_logs")
}

enum ConsentType {
  terms_of_use
  privacy_policy
  data_processing
  marketing_communications
}
```

**Sobre a Lei do Superendividamento (14.181/2021):**

O Quita **não é processo formal** de tratamento de superendividamento. É ferramenta de apoio. Termos devem ser explícitos:

> "O Quita auxilia você a entender sua situação financeira e a tomar decisões informadas. Não substitui o processo judicial ou extrajudicial de tratamento do superendividamento previsto na Lei 14.181/2021, nem aconselhamento profissional de advogado, contador ou planejador financeiro."

**Status:** ⚠️ DECISÃO CRÍTICA — precisa de @deborah-legal. Se a resposta for "depois", o produto **não pode ser lançado** publicamente. Pode continuar em desenvolvimento, mas com bandeira vermelha no roadmap.

---

## P5 (ALTO-5) — Onboarding longo

### Recomendação @deborah-product: **Onboarding fracionado + Diagnóstico Mínimo Viável (DMV)**

Reestruturação do passo a passo:

**Onboarding Crítico (3-5 min) — obrigatório:**

1. Conta (1 min)
2. Renda principal: quanto + dia de pagamento + estável/variável (1 min)
3. **Maior preocupação** (escolha rápida): pressão de cobrança / risco de corte / desorganização (30s)
4. **Top 3 dívidas** sem campos de risco — só credor, valor, parcela (2 min)

Aqui o app **JÁ GERA o diagnóstico básico**:
- Detecta estado financeiro com dados limitados (margem de erro maior — explicitamente comunicada)
- Mostra o primeiro "Plano do mês" com 2-3 ações
- Marca `User.diagnosisLevel = 'minimal'`

**Refinamento Progressivo (opcional, qualquer hora):**

Cards na home: "Melhore seu diagnóstico — adicione X e a recomendação fica mais precisa"
- "Conte sobre suas despesas essenciais" → 5 min
- "Classifique o risco de cada dívida" → 1-2 min por dívida
- "Sua preferência: dívida pequena primeiro ou economia máxima?" → 30s

Cada melhoria gera reconhecimento sóbrio: "Recomendação refinada. Agora baseada em dados confirmados."

**Impacto no schema (Fase 2):**

| Campo | Tipo | Justificativa |
|---|---|---|
| `User.diagnosisLevel` | `DiagnosisLevel` | `minimal`, `basic`, `detailed` |
| `User.onboardingCompletedSteps` | `Json` (string[]) | Lista de passos completados |

**Novo enum:**

```prisma
enum DiagnosisLevel {
  minimal      // só onboarding crítico
  basic        // + despesas e classificação de risco
  detailed     // + comportamental + goals + perfil completo
}
```

**KPIs a instrumentar (Premium pago no Plausible/PostHog):**

- Taxa de conclusão do Onboarding Crítico: meta > 80%
- Tempo médio do Onboarding Crítico: meta < 5 min
- Taxa de Refinamento Progressivo em 30 dias: meta > 50%
- Tempo até 1ª ação completada: meta < 24h

**Status:** ⚠️ Aguardando confirmação de @deborah-product. Se OK, ajusto a Fase 1 §6.1 para refletir essa estrutura.

---

## P6 (ALTO-6) — Goals/Objetivos pessoais

### Recomendação @deborah-product: **Adicionar agora**

**Tabela nova `UserGoal`:**

```prisma
model UserGoal {
  id              String      @id @default(uuid())
  userId          String      @map("user_id")
  goalType        GoalType    @map("goal_type")
  description     String      @db.VarChar(500)
  targetAmount    Decimal?    @map("target_amount") @db.Decimal(12, 2)
  targetDate      DateTime?   @map("target_date") @db.Date
  priorityOrder   Int         @default(100) @map("priority_order") @db.SmallInt
  isActive        Boolean     @default(true) @map("is_active")
  achievedAt      DateTime?   @map("achieved_at")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isActive])
  @@map("user_goals")
}

enum GoalType {
  debt_freedom    // sair das dívidas
  house           // casa própria
  education       // estudo (próprio ou família)
  family          // família, casamento, filhos
  travel          // viagem
  peace           // tranquilidade emocional
  security        // reserva, segurança
  retirement      // aposentadoria
  other
}
```

**Onde aparece no produto:**

- **Onboarding (passo 5 — opcional):** "Por que você quer organizar sua vida financeira?" → multiselect das opções + texto livre
- **Home:** banner sutil no topo: "Você está mais perto de [seu objetivo principal]"
- **Modo Quitação:** projeção mostra "saída da dívida = quando você pode focar em [objetivo]"

**Custo:** ~1 dia de schema + 2 telas. Benefício: muda o tom de comunicação fundamentalmente.

**Status:** ⚠️ Aguardando confirmação de @deborah-product.

---

## P7 (ALTO-7) — Inconsistências Fase 1 ↔ Fase 2

### Decisões @claude-arquiteto

**Inconsistência 1: `actionType=pay` em `OperationMode.sobrevivencia`**

**Decisão:** validação no **service layer**, não no banco.

- `MonthlyPlanGeneratorService` valida antes de persistir: combinações inválidas levantam `InvalidPlanCompositionError`
- Adicionar tabela de regras `OperationModeRules` (constante no código, não no banco):

```typescript
const OPERATION_MODE_RULES: Record<OperationMode, ActionType[]> = {
  payoff: ['pay', 'negotiate', 'cut', 'review', 'monitor'],
  stabilization: ['pay', 'negotiate', 'cut', 'review', 'monitor'],
  crisis_mode: ['pay', 'negotiate', 'pause', 'cut', 'wait', 'refuse', 'review'],
  protection: ['negotiate', 'pause', 'wait', 'refuse', 'review', 'monitor'],
  survival: ['pause', 'wait', 'review', 'monitor'],
  // survival explicitamente exclui 'pay' e 'negotiate'
};
```

- Testes unitários travam isso.

---

**Inconsistência 2: `dias_atraso` vs `meses_atraso`**

**Decisão:** padronizar em **dias**.

- Mudar Fase 2: substituir `Debt.overdueMonths` por `Debt.daysOverdue` (`Int`)
- UI pode calcular `Math.floor(daysOverdue / 30)` se quiser exibir em meses
- A fórmula do `priority-engine` (Fase 1 §7.5) usa `dias_atraso_normalizado = min(daysOverdue / 90, 1)` — escala 0-1

---

**Inconsistência 3: enum `PlanStrategy` com 7 valores**

**Decisão:** limpar agora.

Remover do enum (com migration `DROP VALUE`):
- `smallest_first`
- `highest_interest`
- `custom`

Manter:
- `snowball`
- `avalanche`
- `hybrid`
- `crisis`

Como não há usuários reais, a operação é segura. Antes de rodar a migration:
- Update em todos os registros (se houver): `smallest_first` → `snowball`, `highest_interest` → `avalanche`, `custom` → `hybrid`

---

**Inconsistência 4: `Debt.priorityOrder` vs `Debt.priorityScore`**

**Decisão:** remover `priorityOrder` agora.

- `priorityScore` (Decimal) é a única fonte
- UI ordena por `ORDER BY priority_score DESC`
- Adicionar índice já planejado: `CREATE INDEX idx_debts_priority ON debts(user_id, priority_score DESC)`

---

**Inconsistência 5: Pesos do score — hardcoded ou configurável?**

**Decisão:** tabela `ScoringWeight`.

```prisma
model ScoringWeight {
  id              String      @id @default(uuid())
  factorKey       String      @unique @map("factor_key") @db.VarChar(50)
  weight          Decimal     @db.Decimal(6, 2)
  isPositive      Boolean     @default(true) @map("is_positive")
  effectiveDate   DateTime    @map("effective_date") @db.Date
  description     String?     @db.VarChar(255)
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  @@map("scoring_weights")
}
```

**Seed inicial alinhado com Fase 1 §7.5:**

| factorKey | weight | isPositive |
|---|---|---|
| `risco_moradia` | 30 | true |
| `risco_renda` | 25 | true |
| `risco_legal` | 25 | true |
| `risco_servico_essencial` | 20 | true |
| `juros_mensal_normalizado` | 15 | true |
| `dias_atraso_normalizado` | 10 | true |
| `desconto_disponivel_sustentavel` | 10 | true |
| `valor_pequeno_quitavel` | 8 | true |
| `parcela_insustentavel` | 30 | false |
| `acordo_sem_folga` | 20 | false |

Permite ajustar pesos no futuro **sem deploy** (apenas seed).

**Status:** ✅ 5 decisões tomadas.

---

## P8 (ALTO-8) — Confiabilidade de dados

### Decisões @claude-arquiteto

**a) Generalizar `dataConfidence`:**

| Tabela | Campo | Tipo |
|---|---|---|
| `Debt` | `dataConfidence` | `ConfidenceLevel` (já existe) — `high`, `medium`, `low` |
| `Expense` | `dataConfidence` | `ConfidenceLevel` |
| `Debt` | `interestRateSource` | `RateSource` (novo enum) — `user_provided`, `market_reference`, `unknown` |
| `Debt` | `lastVerifiedAt` | `DateTime?` |

**Novo enum:**

```prisma
enum RateSource {
  user_provided      // usuário declarou a taxa
  market_reference   // estimada via InterestRateReference
  unknown
}
```

**b) Fallback automático na `debt-classification-service`:**

```
se Debt.interestRateMonthly é null:
  rate = lookup(InterestRateReference, debt.categorySlug)
  Debt.interestRateMonthly = rate.median
  Debt.interestRateSource = 'market_reference'
  Debt.dataConfidence = 'low'
```

**c) UX para recomendação baseada em estimativa:**

- Ícone discreto de "i" ao lado de cada `RecommendedAction` cujo `targetDebt` tenha `dataConfidence != 'high'`
- Tooltip: "Recomendação baseada em dados estimados. [Atualize seus dados] para maior precisão."
- Link leva para a tela de detalhe da dívida com os campos a preencher destacados

**d) Re-verificação periódica via `DataFreshnessReviewJob`:**

- Job semanal identifica dívidas com `dataConfidence = 'low'` OU `lastVerifiedAt < 90 dias atrás`
- Gera no máximo **1 `RecommendedAction` do tipo `review`** por mês por usuário
- Texto: "Confira o valor atual do [credor]. Faz 4 meses desde a última atualização."

**Status:** ✅ Decidido.

---

## P9 (MÉDIO-9) — Naming inconsistente

### Decisão @claude-arquiteto: tudo em inglês

**Diff completo dos enums em PT-BR → EN:**

```prisma
// ANTES
enum FinancialState {
  saudavel_com_divida
  apertado
  deficit_mensal
  superendividamento
  insolvencia_pratica
}

// DEPOIS
enum FinancialState {
  healthy_with_debt
  tight_budget
  monthly_deficit
  overindebtedness
  practical_insolvency
}

// ANTES
enum OperationMode {
  quitacao
  estabilizacao
  crise
  protecao
  sobrevivencia
}

// DEPOIS
enum OperationMode {
  payoff
  stabilization
  crisis_mode
  protection
  survival
}
```

UI continua em PT-BR via camada de tradução (i18n via arquivo `pt-BR.json` no front).

**Status:** ✅ Decidido. ⚠️ Aguardando confirmação de @deborah-product (puramente de gosto).

---

## P10 (resto) — Unit economics Premium

### Análise para @deborah-business

**Conta da padaria — custos por mês:**

| Item | Custo | Quando |
|---|---|---|
| Supabase Free | R$ 0 | Até 500MB DB, 2GB transfer, 50k req — ~500 usuários ativos |
| Supabase Pro | ~R$ 130 (US$ 25) | Acima desse limite |
| Vercel Hobby → Pro | ~R$ 105 (US$ 20) | Acima de ~10k req/dia |
| Upstash Redis | ~R$ 50 inicial; pay-per-use | BullMQ |
| Sentry | R$ 0 (free tier) → ~R$ 130/mês | Monitoramento |
| OpenAI Vision (OCR Premium) | R$ 0,10-0,30 por OCR | Por uso |
| BCB API | R$ 0 | Gratuita |
| Notificações push (Firebase) | R$ 0 | Gratuita |
| **Custos legais (LGPD)** | R$ 5-10k inicial + R$ 2k/mês retainer | Necessário antes do release público |

**Simulação por escala:**

| Usuários ativos | Premium @ 5% | Receita/mês | Custos/mês | Margem |
|---|---|---|---|---|
| 1.000 | 50 | R$ 495 | ~R$ 350 | R$ 145 |
| 5.000 | 250 | R$ 2.475 | ~R$ 800 | R$ 1.675 |
| 10.000 | 500 | R$ 4.950 | ~R$ 1.500 | R$ 3.450 |
| 25.000 | 1.250 | R$ 12.375 | ~R$ 4.500 | R$ 7.875 |
| 100.000 | 5.000 | R$ 49.500 | ~R$ 15.000 | R$ 34.500 |

**Pontos críticos:**

- **5% de conversão Free → Premium é otimista para público endividado.** Realista: 2-3%. Se 2%, divida a receita acima pela metade.
- Com **2% conversão**, ponto de equilíbrio (margem positiva > custos de operação humana) começa em ~25.000 usuários ativos.
- **LTV (Lifetime Value)** é limitado: quem sai da dívida tende a cancelar. Modelo precisa de **alta aquisição** ou **expansão de público** (não só endividados).

**Plano B se conversão < 5%:**

| Estratégia | Pros | Cons |
|---|---|---|
| Quita Família (R$ 19,90, perfis múltiplos) | Aumenta ticket sem aumentar custo proporcional | Complexidade de produto |
| B2B (RH oferece como benefício) | Ticket alto, aquisição barata | Ciclo de vendas longo |
| Parceria com instituições de educação financeira (white-label) | Margem boa, baixa concorrência | Diluição da marca |
| **NÃO RECOMENDADO:** monetização via crédito/empréstimo | Receita imediata | Mata o diferencial (princípio fundador 1) |

**Status:** ⚠️ Aguardando @deborah-business. Sugestão: marcar como **risco aceito documentado** se a resposta for "vamos validar pós-lançamento". Não bloqueia Fase 3.

---

## Resumo dos ajustes a aplicar na Fase 2

### Novos campos (12)

| Tabela | Campo | Tipo | Origem |
|---|---|---|---|
| `Expense` | `frequency` | `ExpenseFrequency` | P1 |
| `Expense` | `monthlyProvision` | `Decimal?` | P1 |
| `Expense` | `nextOccurrence` | `Date?` | P1 |
| `Expense` | `provisionStartedAt` | `Date?` | P1 |
| `Expense` | `dataConfidence` | `ConfidenceLevel` | P8 |
| `Income` | `guaranteedAmount` | `Decimal?` | P2 |
| `Income` | `upperBoundAmount` | `Decimal?` | P2 |
| `Income` | `stabilityType` | `IncomeStability` | P2 |
| `User` | `overallIncomeStability` | `IncomeStability?` | P2 |
| `User` | `diagnosisLevel` | `DiagnosisLevel` | P5 |
| `User` | `onboardingCompletedSteps` | `Json` | P5 |
| `User` | `nextReviewDate` | `Date?` | P3 |
| `User` | `acceptedTermsAt` | `DateTime?` | P4 |
| `User` | `acceptedTermsVersion` | `String?` | P4 |
| `Debt` | `interestRateSource` | `RateSource` | P8 |
| `Debt` | `lastVerifiedAt` | `DateTime?` | P8 |
| `Debt` | `daysOverdue` (substitui `overdueMonths`) | `Int` | P7 |

### Novas tabelas (5)

1. `EmergencyReserve` (P1)
2. `UserGoal` (P6)
3. `ConsentLog` (P4)
4. `ScoringWeight` (P7)
5. *(`ProvisionedExpense` foi descartada em favor de estender `Expense`)*

### Novos enums (5)

1. `ExpenseFrequency` (P1)
2. `IncomeStability` (P2)
3. `DiagnosisLevel` (P5)
4. `GoalType` (P6)
5. `RateSource` (P8)
6. `ConsentType` (P4)

### Mudanças em enums existentes

- `FinancialState` — todos os valores PT-BR → EN (P9)
- `OperationMode` — todos os valores PT-BR → EN (P9)
- `PlanStrategy` — remover legados (`smallest_first`, `highest_interest`, `custom`) (P7)

### Migrations a adicionar (2)

- `2026XX_add_seasonal_expense_emergency_reserve` — campos da `Expense` + tabela `EmergencyReserve` (P1)
- `2026XX_add_user_goals_consent_logs` — tabelas `UserGoal`, `ConsentLog`, `ScoringWeight` + seed dos pesos (P4, P6, P7)

Total revisado: **9 migrations** (era 7).

---

## Resumo dos ajustes a aplicar na Fase 1

Não é reescrita — são **6 updates incrementais** em seções específicas:

| Seção | Ajuste |
|---|---|
| §3 (Persona) | Adicionar "perfil informal/autônomo" como sub-caso do "Pressionado no fio" |
| §4.2 (Fórmula da capacidade segura) | Adicionar `total_provisao_sazonal` e `aporte_reserva_emergencia` |
| §4.2 (Detector) | Adicionar regra de suavização: piora exige 2 meses consecutivos |
| §6.1 (Onboarding) | Reestruturar como Crítico (3-5 min) + Refinamento Progressivo |
| §6.5 (Revisão mensal) | Especificar trigger híbrido (evento + scheduled) e `nextReviewDate` |
| §7.5 (Score) | Apontar que pesos vivem em tabela `ScoringWeight` |
| §10 (Fora do escopo) | Remover "OCR de comprovantes" — pode entrar no Premium se P4 liberar |
| **Nova §13 (Conformidade legal)** | RIPD, DPO, Termos de Uso, Lei 14.181/2021 |

---

## O que ainda preciso de você

5 confirmações pendentes:

| # | Pergunta | Quem decide | O que escolher |
|---|---|---|---|
| 1 | P1 — modelagem de gastos sazonais como proposto? | @deborah-product | OK / ajustar |
| 2 | P2 — campos de renda estável/variável + regra de suavização? | @deborah-product | OK / ajustar |
| 3 | P4 — quando contratar advogado fintech? | @deborah-legal | Prazo concreto |
| 4 | P5 — Onboarding Crítico (3-5 min) + Refinamento Progressivo? | @deborah-product | OK / ajustar |
| 5 | P6 — `UserGoal` agora ou em v2? | @deborah-product | Agora / v2 |
| 6 | P10 — risco aceito sobre Premium R$9,90? | @deborah-business | Aceito / aprofundar |

Se você aprovar tudo, eu:

1. **Atualizo a Fase 2** com os 12 campos + 5 tabelas + 6 enums novos + diff dos enums em inglês
2. **Atualizo a Fase 1** com os 7 updates incrementais
3. **Submeto novamente ao devils-advocate**
4. Se passar, **APROVADO** e seguimos para a Fase 3

Estimativa: ~2-3h de retrabalho dos documentos.

---

*Fim do ciclo adversarial. Aguardando confirmações.*
