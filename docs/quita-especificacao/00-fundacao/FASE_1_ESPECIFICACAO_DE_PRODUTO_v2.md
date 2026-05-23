# Quita — Fase 1 v2: Especificação de Produto

> **Status:** versão 2 — pós ciclo adversarial
> **Data:** 16 de maio de 2026
> **Mudanças vs v1:** 7 updates incrementais + nova §13 (Conformidade legal)
> **Decisões já tomadas:** monetização Free vs Premium R$9,90/mês mantida; Web primeiro, mobile depois; protótipo MVP sem usuários reais ainda

---

## Sumário executivo

O Quita é hoje um organizador financeiro: cadastra renda, despesas e dívidas, calcula saldo, e recomenda pagar a menor dívida ou a mais cara. A refatoração transforma o Quita em um **motor de decisão financeira**: a cada mês, com os dados reais da pessoa, o sistema diz qual é a melhor próxima ação — pagar uma dívida específica, negociar com limite máximo de parcela, recusar um acordo, cortar um gasto, ou aguardar.

A virada conceitual é a seguinte: o Quita não pergunta mais "qual dívida você quer pagar primeiro?". Ele responde "com o dinheiro que você tem este mês, qual decisão causa o menor dano e maximiza a chance de recuperação?".

**O que muda do produto atual:**
- Coleta de dados profunda, porém **fracionada** (Onboarding Crítico em 3-5 min + Refinamento Progressivo)
- Classificação automática de despesas por essencialidade e de dívidas por risco
- Detector de estado financeiro em 5 níveis (Saudável, Apertado, Déficit, Superendividamento, Insolvência) **com regra de suavização para evitar whiplash**
- 5 modos de operação do app que se adaptam ao estado real
- Score de prioridade multi-fator com **pesos configuráveis** (não hardcoded)
- Validador de acordo: recusa acordos que comprometem o mês
- Conceitos novos: **capacidade segura** (não saldo bruto), **mínimo vital personalizado** (não os R$ 600 da lei), **provisão sazonal** (IPTU, IPVA, escola) e **reserva de emergência**
- Tratamento explícito de renda variável/autônoma com `guaranteedAmount`
- Trilha de Goals/Objetivos pessoais para alimentar a motivação

**O que se aproveita do código atual (~80% do trabalho já feito):**
Monorepo pnpm, NestJS, Prisma, Next.js 15, Expo, Tailwind v4, Zod compartilhado, módulos backend bem isolados, schema base, e ~80% das telas existentes (com mudanças cirúrgicas).

**Frase-guia do produto:**
> Primeiro sobreviver. Depois estabilizar. Depois negociar. Depois quitar.

---

## 1. Visão e posicionamento

### 1.1 O Quita É

Um motor de decisão financeira para pessoas endividadas. A cada mês, com os dados reais da pessoa, ele diz: pague isto, negocie aquilo com limite máximo X, recuse essa proposta, corte este gasto, ou aguarde. A complexidade fica no back-end. A interface entrega clareza.

### 1.2 O Quita NÃO É

- Não é agregador bancário (não conecta no Open Finance no MVP)
- Não é app de orçamento por categoria
- Não é plataforma de renegociação
- Não é educação financeira passiva
- Não é conselheiro financeiro humano
- Não substitui Procon, Defensoria, advogado, contador ou planejador financeiro profissional

### 1.3 Posicionamento em uma frase

> "O Quita não te ensina sobre dinheiro. Ele te diz o que fazer este mês."

### 1.4 Diferencial competitivo

A pergunta central de qualquer organizador financeiro é "quanto você deve?". A pergunta central do Quita é "qual é a melhor próxima decisão com o dinheiro que você tem agora?" — e essa pergunta exige diagnóstico, priorização por risco, simulação e validação de acordo. Não cabe em planilha.

---

## 2. Princípios fundadores (não-negociáveis)

**1. Primeiro sobreviver, depois quitar.** Nenhuma recomendação compromete alimentação, moradia, saúde, transporte essencial, trabalho ou obrigação legal. O motor recusa planos que zeram o caixa.

**2. Decisão por consequência, não por pressão.** O app protege a pessoa do credor que mais grita. Prioridade vem do dano potencial de não pagar, não do barulho da cobrança.

**3. Acordo só é bom se cabe.** Acordo com parcela insustentável é recusado, mesmo com desconto alto.

**4. Honestidade sobre prazo.** O motor trabalha com faixas estimadas. Nunca promete data exata.

**5. Complexidade no back, simplicidade no front.** O usuário recebe ações claras e curtas. Toda a inteligência fica oculta.

**6. Linguagem sem culpa.** Quem está endividado já se julga o suficiente. O app não amplifica vergonha.

**7. Educação contextual, nunca didática.** Explicação aparece no momento da decisão, em uma frase curta.

**8. Privacidade radical.** Modo discreto, biometria, soft delete, exportação LGPD. O Quita é confidente, não vitrine.

**9. Realismo sobre limites.** Quando o caso é de superendividamento ou insolvência, o app encaminha. Não promete o impossível.

**10. Recomendação como informação, não conselho profissional.** *(NOVO v2)* O app deixa explícito em UI e Termos de Uso que recomendações são geradas automaticamente com base nos dados fornecidos pelo usuário, e não constituem aconselhamento financeiro profissional. Esse princípio ancora o tratamento legal (ver §13).

---

## 3. Persona e contexto emocional

### 3.1 Os três perfis-alvo

**a) Recuperável organizado (~30% do público potencial)**
Sabe quanto deve, paga os mínimos, mas perdeu o controle do que fazer primeiro. Tem renda regular e alguma sobra. Precisa de método e visibilidade.

**b) Pressionado no fio (~50% do público potencial)**
Cobre o essencial e talvez os mínimos. Não sobra nada. Cobradores ligam. Toma decisões reativas. Tem vergonha mas ainda olha. Precisa de calma, ordem e proteção.

**b1) Sub-caso: informal/autônomo (~40% do "Pressionado no fio").** *(NOVO v2)*
Renda variável e instável (motoristas de app, vendedores autônomos, freelancers, profissionais sazonais). Mês bom alterna com mês ruim. Pode estar tecnicamente "Saudável" em janeiro e em "Crise" em fevereiro. Esse perfil exige tratamento diferenciado:
- Modelagem de renda com `guaranteedAmount` (piso) e `upperBoundAmount` (teto)
- Suavização de transição de estado (não migrar de Saudável a Crise em 1 mês — exigir 2 meses consecutivos)
- Onboarding pergunta explicitamente "Sua renda é estável?" antes de pedir valor

**c) Afogado (~20% do público potencial)**
Déficit estrutural. Renda não cobre essenciais + dívidas. Pode estar em superendividamento. Tem vergonha de olhar a vida financeira, evita o app. Precisa de acolhimento, plano de proteção e encaminhamento.

### 3.2 Estado mental comum aos três

Estresse crônico, vergonha, fadiga decisória, comportamento de evitação. Isso vai além de design bonito — define o produto:

- Cada tela responde uma única pergunta
- Cada decisão é binária ou tem no máximo 3 opções
- Cada número aparece com contexto
- Frases curtas, segunda pessoa, presente
- Ações ordenadas, nunca tudo de uma vez
- O app guarda o lugar quando a pessoa sai (ela vai sair várias vezes)
- **Onboarding fracionado**, mostra valor antes de pedir tudo *(NOVO v2)*

### 3.3 O que o produto NÃO faz com essa persona

- Não gameifica com pontos, conquistas infantis ou medalhas
- Não compara o usuário com outras pessoas
- Não usa linguagem motivacional vazia
- Não envia notificação na hora em que a pessoa não pediu
- Não mostra dashboards densos no primeiro acesso

---

## 4. Os 5 estados financeiros

Toda a inteligência do motor depende de classificar o usuário em um destes estados. O estado é **recalculado a cada mês** ou sempre que renda, despesa ou dívida muda. A nomenclatura interna está em inglês (decidida no ciclo adversarial); o usuário vê textos em PT-BR via i18n.

### 4.1 Tabela definicional

| Estado (interno EN) | Display PT-BR | Critério | Plano gerado | Tom |
|---|---|---|---|---|
| **1.** `healthy_with_debt` | Saudável com dívida | Renda ≥ essenciais + provisão + mínimos + 10% folga | Estratégia de quitação | Conquista |
| **2.** `tight_budget` | Apertado | Cobre essenciais e mínimos, sobra próxima de zero | Estabilização: criar margem | Foco |
| **3.** `monthly_deficit` | Déficit mensal | Renda < essenciais + mínimos | Plano de crise: proteger, renegociar, pausar | Calma |
| **4.** `overindebtedness` | Superendividamento provável | Cobre essenciais com aperto, mas dívidas tornam quitação inviável (prazo > 5 anos no pagamento máximo seguro) | Proteção do mínimo vital + encaminhamento | Acolhimento |
| **5.** `practical_insolvency` | Insolvência prática | Renda insuficiente para essenciais mesmo sem dívida | Sobrevivência: renda extra, benefícios sociais | Acolhimento sério |

### 4.2 Critérios operacionais (alimentam o detector)

**Fórmula da capacidade segura *(atualizada na v2)*:**

```
renda_liquida_mensal       = receita_fixa + média(receita_variável_últimos_3m)
                             OU guaranteedAmount (se IncomeStability=variable, cenário conservador)

total_essenciais           = soma(Expense.amount com is_essential=true, frequency=monthly)
total_provisao_sazonal     = soma(Expense.monthlyProvision)           ← novo v2
total_renda_protetora      = soma(Expense com is_income_related=true)
total_legais               = soma(Expense com is_legal_obligation=true)
total_minimos_dividas      = soma(Debt.monthlyAmount)
reserva_operacional_minima = max(5% da renda, R$ 100)
aporte_reserva_emergencia  = EmergencyReserve.monthlyTarget (se ativo)  ← novo v2

capacidade_segura = renda_liquida_mensal
                  - total_essenciais
                  - total_provisao_sazonal
                  - total_renda_protetora
                  - total_legais
                  - reserva_operacional_minima
                  - aporte_reserva_emergencia
```

**Conceitos:**

- **Provisão sazonal:** para despesas anuais (IPVA, IPTU) ou semestrais (escola, seguro), o app reserva 1/12 ou 1/6 todo mês. Isso "amortiza" o impacto desses gastos.
- **Reserva de emergência:** uma vez no Modo Quitação, o app pode propor um aporte mensal pequeno para construir reserva. Opcional, mas recomendado.

**Árvore de decisão:**

- Se `renda_liquida < total_essenciais` → `practical_insolvency`
- Se `capacidade_segura < 0` mas essenciais cobertos → `monthly_deficit`
- Se `capacidade_segura < total_minimos_dividas` → simular com pagamento máximo seguro; prazo > 60 meses → `overindebtedness`; senão → `monthly_deficit`
- Se `capacidade_segura ≥ total_minimos_dividas` e folga ≤ 10% → `tight_budget`
- Se `capacidade_segura ≥ total_minimos_dividas` e folga > 10% → `healthy_with_debt`

**Regra de suavização *(NOVA v2)*:**

Mudança de estado para **PIOR** (Saudável → Apertado → Crise) exige **2 meses consecutivos** abaixo do limiar. Isso evita whiplash de modo, especialmente para perfil informal/autônomo onde a renda oscila naturalmente.

Mudança de estado para **MELHOR** é imediata — não há razão para reter boa notícia. A pessoa que saiu do vermelho merece ver isso já.

### 4.3 Conceitos auxiliares

- **Mínimo vital personalizado:** cálculo do app baseado em moradia, alimentação, saúde, transporte e dependentes. Substitui o "mínimo existencial legal" de R$ 600 do Decreto 11.150/2022 para uso de produto.
- **Capacidade segura:** quanto pode ser usado para dívidas sem comprometer o essencial.
- **Folga real:** capacidade segura menos mínimos de todas as dívidas.
- **Provisão sazonal:** reserva mensal para gastos não-mensais conhecidos. *(NOVO v2)*
- **Reserva de emergência:** caixa separado para imprevistos. *(NOVO v2)*

---

## 5. Os 5 modos de operação do app

Cada estado financeiro ativa um modo. O usuário **nunca vê** o nome do modo — vê o app respondendo à realidade. A nomenclatura interna está em inglês.

### 5.1 Modo `payoff` (Quitação) — estado `healthy_with_debt`

- Tela inicial mostra projeção de saída em faixa e próxima dívida a focar
- Permite escolher estratégia (avalanche / bola de neve / híbrido)
- Mostra economia de juros como reforço
- Pode propor aporte mensal à reserva de emergência *(NOVO v2)*

### 5.2 Modo `stabilization` (Estabilização) — estado `tight_budget`

- Tela inicial mostra "como criar R$ X de margem este mês"
- Lista 2-3 cortes ou renegociações mais impactantes
- Esconde projeções de longo prazo
- Foca em uma vitória pequena por mês

### 5.3 Modo `crisis_mode` (Crise) — estado `monthly_deficit`

- Tela inicial responde "o que pagar este mês para não perder o essencial"
- Sem projeções otimistas
- Ordem de prioridade: essencial → renda → legal → juros altos
- Dívidas sem caixa entram em "monitoramento e negociação futura"
- Mostra canais de negociação contextuais

### 5.4 Modo `protection` (Proteção) — estado `overindebtedness`

- Tela inicial mostra mínimo vital protegido + status de cada dívida
- Lista dívidas a renegociar coletivamente
- Encaminha proativamente: Procon, Defensoria, consumidor.gov.br, mutirões Febraban
- Apresenta a Lei 14.181/2021 em linguagem simples

### 5.5 Modo `survival` (Sobrevivência) — estado `practical_insolvency`

- Tela inicial foca em renda extra e benefícios aplicáveis (BPC, Bolsa Família, auxílios)
- Lista cortes emergenciais (sem julgamento)
- **O app NÃO recomenda pagar dívida nenhuma nesse estado** — validado tecnicamente no motor (ver §7.6)
- Encaminhamento para ajuda especializada com forte ênfase

### 5.6 Regras de transição entre modos

- Recálculo em: mudança de renda, mudança de despesa, novo cadastro/pagamento de dívida, `nextReviewDate` atingida *(NOVO v2)*
- Transição silenciosa quando há melhora
- Em caso de **piora**, aviso suave e respeitoso na próxima abertura — **não silencioso**, porque a pessoa precisa saber que algo mudou para não cavar mais fundo *(NOVO v2)*

---

## 6. Jornada do usuário

### 6.1 Etapa 1 — Diagnóstico (Onboarding Fracionado) *(REESCRITO v2)*

A v1 propunha 5 passos contínuos de 7-10 min. Devils-advocate apontou: público real tem 15-25 min de onboarding com 6+ dívidas, e taxa de abandono fica alta. A v2 fraciona:

#### 6.1.1 Onboarding Crítico (3-5 min, obrigatório)

Coleta o mínimo viável para gerar diagnóstico básico. Após esse passo, **o app já gera o primeiro "Plano do mês"** com margem de erro maior, explicitamente comunicada.

1. **Conta** (1 min) — Nome, e-mail, senha. Google OAuth opcional.
2. **Renda principal** (1 min) — Quanto + dia de pagamento + estável/variável (1 toque). Se variável, perguntar `guaranteedAmount`.
3. **Maior preocupação** (30s) — Escolha rápida: pressão de cobrança / risco de corte / desorganização / vergonha / não sei por onde começar.
4. **Top 3 dívidas** (2 min) — Só credor, valor total, parcela mínima. Sem campos de risco. Categoria genérica permitida.
5. **Cidade + dependentes** (30s) — Para calcular mínimo vital regional.

Ao final, `User.diagnosisLevel = 'minimal'`. O app gera o plano com aviso visual: "Recomendação inicial. Refine seu diagnóstico para mais precisão."

#### 6.1.2 Refinamento Progressivo (opcional, qualquer momento)

Cards na home dizem: "Melhore seu diagnóstico — adicione X e a recomendação fica mais precisa." Cada melhoria leva a `User.diagnosisLevel = 'basic'` ou `'detailed'`.

**Refinamentos disponíveis:**

| Refinamento | Tempo | Eleva a nível |
|---|---|---|
| Vida essencial completa (8 categorias com pergunta de risco em cada) | 5 min | `basic` |
| Classificação de risco de cada dívida (3 mini-telas por dívida) | 1-2 min por dívida | `basic` |
| Preferência (snowball / avalanche / híbrido) e nível de motivação | 30s | `detailed` |
| Goals/Objetivos pessoais (por que quitar?) | 1 min | `detailed` |
| Provisão sazonal (IPVA, IPTU, escola, seguro) | 2-3 min | `detailed` |

Cada melhoria gera reconhecimento sóbrio: "Recomendação refinada. Agora baseada em dados confirmados."

#### 6.1.3 KPIs do onboarding

| KPI | Meta |
|---|---|
| Taxa de conclusão do Onboarding Crítico | > 80% |
| Tempo médio do Onboarding Crítico | < 5 min |
| Taxa de Refinamento Progressivo em 30 dias | > 50% |
| Tempo até 1ª ação completada | < 24h |

### 6.2 Etapa 2 — Espelho

Primeira tela após finalizar o Onboarding Crítico. Uma tela única, calma, com 3 números e uma frase:
- **Saldo do mês**: quanto sobra ou falta
- **Total devido**: somatório das dívidas
- **Estado** em linguagem humana: "Você está pressionado, mas tem margem para virar o jogo."

Botão único: "Ver o plano deste mês".

### 6.3 Etapa 3 — Plano do mês (a tela mais importante do app)

Lista de 3 a 6 ações, em ordem de impacto. Cada ação:
- Título curto (verbo + objeto + valor)
- Razão em uma linha
- **Ícone discreto de "estimado" se a recomendação é baseada em dados de baixa confiança** *(NOVO v2)*
- Botão "marcar como feito"
- Botão "ver detalhes"

### 6.4 Etapa 4 — Execução

- Usuário marca o que fez
- App registra pagamentos (com comprovante opcional)
- Pagamento desfeito em 24h (já implementado)
- Notificações enviadas só do que importa
- Quando dívida é quitada, reconhecimento sóbrio (sem confete)

### 6.5 Etapa 5 — Revisão mensal *(EXPANDIDA v2)*

**Trigger híbrido:**

| Tipo | Quando dispara |
|---|---|
| **Evento** | CRUD em Income, Expense, Debt, Payment, BehaviorProfile |
| **Evento** | Avaliação de acordo concluída |
| **Scheduled** | Diariamente 02:00 UTC, para usuários com `nextReviewDate <= hoje` |
| **Scheduled** | Semanal — re-verificar dívidas com dados estimados há mais de 90 dias |

**`nextReviewDate` calculada por usuário:**
- Se há `Income.paymentDay` da renda fixa principal → `dia (paymentDay - 1)` do próximo mês (revisar **antes** do dinheiro entrar)
- Caso contrário → dia 1 do próximo mês

**Degradação silenciosa:** se o job falha 4x consecutivas, o plano anterior permanece válido, o erro vai pro Sentry, e o usuário não nota a falha. Plano antigo é melhor que plano errado.

### 6.6 Etapa 6 — Saída ou estabilidade

- **Saída da dívida:** reconhecimento sóbrio, faixa de economia em juros, convite para "Modo manutenção" + foco em construir reserva e atingir Goals
- **Estabilidade sem quitação total:** mantém ciclo mensal, reduz notificações

---

## 7. Os módulos internos do motor

A engenharia não vê "telas", vê módulos. **A v2 acrescenta dois módulos** (`goal-tracker-service` e `seasonal-expense-service`) e refina os existentes.

### 7.1 financial-profile-service

Mantém renda, despesas (com `frequency`), dívidas, datas, dependentes, cidade. CRUDs.

### 7.2 expense-classification-service

Recebe uma despesa e atribui: `isEssential`, `isIncomeRelated`, `isLegalObligation`, `canReduce`, `canCancel`, `consequenceIfUnpaid`, `dataConfidence`.

### 7.3 debt-classification-service

Atribui: `affectsSurvival`, `affectsIncome`, `hasLegalRisk`, `interestClass`, `dataConfidence`, `interestRateSource`. Aplica fallback automático: se `interestRateMonthly` é null, consulta `InterestRateReference` por categoria.

### 7.4 financial-state-detector

Calcula capacidade segura (com provisão sazonal e reserva de emergência), classifica em um dos 5 estados, **aplica regra de suavização (piora exige 2 meses consecutivos)**. Saída: `{ state, mode, capacity }`.

### 7.5 priority-engine *(REVISADO v2)*

Calcula `priorityScore` de cada dívida. **Os pesos vivem na tabela `ScoringWeight`, não hardcoded.** Permite ajuste sem deploy.

```
score = sum(factor_value × weight × sign) para cada fator na ScoringWeight ativa
```

**Fatores (com pesos iniciais alinhados ao seed):**

| factor_key | weight | isPositive |
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

A normalização de `dias_atraso` (não meses) é: `min(daysOverdue / 90, 1)`.

### 7.6 strategy-selector *(REVISADO v2)*

Decide entre: `snowball`, `avalanche`, `hybrid`, `crisis`. **Regra dura:**

```typescript
const OPERATION_MODE_RULES: Record<OperationMode, ActionType[]> = {
  payoff:        ['pay', 'negotiate', 'cut', 'review', 'monitor'],
  stabilization: ['pay', 'negotiate', 'cut', 'review', 'monitor'],
  crisis_mode:   ['pay', 'negotiate', 'pause', 'cut', 'wait', 'refuse', 'review'],
  protection:    ['negotiate', 'pause', 'wait', 'refuse', 'review', 'monitor'],
  survival:      ['pause', 'wait', 'review', 'monitor'],
};
```

**Modo `survival` jamais gera ações `pay` ou `negotiate`** — validado no service layer com teste unitário travando.

### 7.7 simulator

Gera 3 cenários: conservador, otimizado, acelerado. Saída em faixa.

### 7.8 settlement-validator

Recebe proposta, retorna `{ recommendation, max_safe_installment, reasoning }`. Toda avaliação gravada em `SettlementEvaluation` para auditoria.

### 7.9 monthly-plan-generator (orquestrador)

Recebe saída de todos os módulos e monta o JSON do plano do mês.

### 7.10 goal-tracker-service *(NOVO v2)*

Gerencia objetivos pessoais (`UserGoal`). Não influencia o score de prioridade, mas alimenta a comunicação:
- Banner sutil na home: "Você está mais perto de [seu objetivo principal]"
- Modo `payoff` ajusta a projeção: "Saída da dívida = quando você pode focar em [objetivo]"

### 7.11 seasonal-expense-service *(NOVO v2)*

Calcula provisão mensal a partir de despesas com `frequency != monthly`. Para `annual`, divide por 12. Para `irregular`, usa histórico ou estimativa do usuário.

### 7.12 Exemplo de payload de saída

```json
{
  "financialState": "monthly_deficit",
  "mode": "crisis_mode",
  "safeCapacity": 250,
  "minimumVital": 1850,
  "mainGoal": "proteger contas essenciais e evitar novas dívidas caras",
  "recommendedActions": [
    {
      "type": "pay",
      "target": "conta de energia",
      "amount": 180,
      "reason": "risco de corte de serviço essencial",
      "dataConfidence": "high"
    },
    {
      "type": "negotiate",
      "target": "cartão banco X",
      "maxAffordableInstallment": 90,
      "reason": "dívida cara, acordo atual não cabe no orçamento",
      "dataConfidence": "medium"
    },
    {
      "type": "pause",
      "target": "dívida antiga loja Y",
      "reason": "sem risco imediato e sem acordo sustentável",
      "dataConfidence": "low"
    }
  ],
  "warnings": [
    "Não aceitar acordos acima de R$ 90 neste mês.",
    "Evitar usar cheque especial para pagar parcelas."
  ],
  "nextReviewDate": "2026-06-04"
}
```

---

## 8. Telas do MVP refatorado

Mapa contra as 25 telas atuais (mantém-se da v1, com adições da v2):

| # | Tela | Status | Mudança |
|---|---|---|---|
| 01-04 | Splash, login, cadastro, recuperação | Mantém | Sem alteração |
| 05 | Renda no onboarding | **Muda** | Adicionar dependentes, cidade, dia de pagamento, estabilidade (estável/variável), `guaranteedAmount` |
| 06 | Categorias de dívida | **Muda** | Reordenar por risco |
| 07 | Detalhe da dívida (onboarding) | **Muda** | Quebrar em 3 mini-telas: identificação / risco / impacto |
| 08 | Despesas fixas | **Muda** | Virar passo "Vida essencial" com perguntas de risco; aceitar `frequency` |
| — | **Preocupação e estilo** | **Nova** | Passo 5 do onboarding (comportamental) |
| — | **Goals/Objetivos pessoais** | **Nova** | Refinamento progressivo (opcional) *(NOVO v2)* |
| — | **Provisão sazonal** | **Nova** | Refinamento progressivo: IPVA, IPTU, escola, seguro *(NOVO v2)* |
| 09 | Dashboard / Home | **Muda muito** | Vira "Plano do mês"; banner de Goal *(v2)* |
| 10 | Lista de dívidas | Mantém | Ordem por `priorityScore` |
| 11 | Resumo financeiro | **Muda** | Adicionar capacidade segura, folga real, **provisão sazonal e reserva de emergência** *(v2)* |
| 12, 12b | Histórico e gráficos | Mantém | Premium |
| 13 | Plano de pagamento (timeline) | **Muda** | "Plano completo" longo prazo |
| 14 | Perfil | Mantém | + edição de Goals *(v2)* |
| 15 | Detalhe da dívida | **Muda** | Mostrar score, motivos, validador de acordo, **ícone de confiabilidade** *(v2)* |
| 16, 16b | Pagamento e comprovante | Mantém | Sem alteração |
| 17 | Nova receita | **Muda** | Adicionar estabilidade e `guaranteedAmount` *(v2)* |
| 18 | Nova despesa | **Muda** | Adicionar classificação + `frequency` *(v2)* |
| 19 | Notificações | Mantém | Sem alteração |
| 20 | Segurança / biometria | Mantém | Sem alteração |
| 21 | Modo discreto | Mantém | Sem alteração |
| 22, 22b | Exportar dados (LGPD) | Mantém | Sem alteração |
| — | **Termos de Uso (versionado)** | **Nova** | Aceitação rastreada via `ConsentLog` *(NOVO v2)* |
| 23 | Situação crítica | **Muda** | Vira "Modo Crise" completo |
| 25 | Modo Azul / Jornada | **Muda** | Adaptar conforme quitação ou estabilidade |
| — | **Modo Proteção** | **Nova** | Tela para superendividamento (encaminhamentos) |
| — | **Modo Sobrevivência** | **Nova** | Tela para insolvência |
| — | **Validador de acordo** | **Nova** | Usuário cola proposta e o app valida |

### 8.1 Telas Premium (R$9,90/mês)

- Alertas de vencimento personalizados
- Validador de acordo ilimitado (Free: 1/mês)
- Histórico de 12+ meses
- Gráficos avançados
- Chat com IA para esclarecimento contextual
- Sugestões de cortes detalhadas
- Exportação ilimitada
- OCR de comprovante de proposta de acordo *(reintroduzido — ver §10)*

---

## 9. Princípios de comunicação

### 9.1 Vocabulário

| Evitar | Preferir |
|---|---|
| "Você não consegue pagar" | "Hoje sua renda não cobre todas as obrigações" |
| "Pague esta dívida agora" | "Esta dívida tem prioridade porque…" |
| "Inadimplente" | "Em atraso" |
| "Devedor" | (usar nome ou "você") |
| "Quitar" *em contexto pesado* | "Sair desta dívida" |
| "Fracasso" | "Mês difícil" |
| "Você precisa…" | "A recomendação para este mês é…" |
| "Aconselhamos" *(NOVO v2)* | "A recomendação automatizada para este caso é…" |

### 9.2 Tom por modo

- **`payoff`:** confiante, sóbrio — "Mais perto."
- **`stabilization`:** prático, vitórias pequenas — "Um passo por vez."
- **`crisis_mode`:** calmo, claro — "Vamos por partes."
- **`protection`:** acolhedor, factual — "Existem caminhos."
- **`survival`:** respeitoso, prioridade nas pessoas — "Primeiro você."

### 9.3 Frases-guia

- Home: "Esse é o plano para os próximos 30 dias."
- Validador: "Esse acordo cabe / não cabe no seu mês."
- Detector: "Você está [estado] — [explicação em 1 frase]."
- Revisão: "Algumas coisas mudaram desde o mês passado. Atualizamos o plano."
- **Confiabilidade *(NOVO v2)*:** "Recomendação baseada em dados estimados. Atualize seus dados para maior precisão."

### 9.4 Notificações

- Máximo 2-3 push por semana no Free
- Janela 9h-21h
- Nunca gatilho de medo
- Sempre fechar com ação clara

---

## 10. Fora do escopo desta refatoração

- Open Finance / agregação bancária automática
- ~~OCR de comprovantes~~ *(reabilitado como Premium — ver §8.1)*
- Marketplace de propostas de acordo
- Cartão Quita ou produto financeiro próprio
- Indicação de empréstimo (consignado, fintech)
- Score de crédito
- Chat assíncrono com humano
- Comunidade / fórum / comparação social
- Investimentos
- Versão para PJ

### 10.1 Riscos aceitos *(NOVA v2)*

| Risco | Decisão |
|---|---|
| Conversão Free → Premium pode ser baixa (2-3% em vez de 5%) entre endividados | Aceito. Plano B documentado (B2B, white-label, Quita Família). |
| Custo unitário não validado em escala | Aceito. Monitorar com KPIs após lançamento. |
| Suporte humano pode ser demandado em Modo Sobrevivência | Aceito no MVP. Encaminhamento via SupportChannel. Canal de suporte humano em v2 do produto. |

---

## 11. O que aproveitar do código atual

(Sem mudanças vs v1 — vai virar Fase 2 detalhada.)

### 11.1 Aproveitar como está (~60%)
Monorepo, stack, módulos auth/profile/financial, telas de configuração e perfil.

### 11.2 Estender (~30%)
Tabelas `User`, `Income`, `Expense`, `Debt`, `PaymentPlan` ganham campos. Onboarding fracionado.

### 11.3 Refatorar (~8%)
Módulo `dashboard` → `monthly-plan` com novo contrato. `priorityOrder` substituído por `priorityScore`.

### 11.4 Descartar (~2%)
Lógica antiga de seleção de estratégia (só `smallest_first` vs `highest_interest`). Cálculos sem distinção de essencialidade.

### 11.5 Novas tabelas (12 ao todo) *(EXPANDIDO v2)*
- `BehaviorProfile` — perfil comportamental
- `MonthlyActionPlan` — plano do mês
- `RecommendedAction` — ações do plano
- `SettlementEvaluation` — auditoria do validador
- `FinancialStateSnapshot` — histórico de estados
- `RegionalMinimumVital` — referência regional
- `InterestRateReference` — juros médios de mercado
- `SupportChannel` — canais de encaminhamento
- `EmergencyReserve` — reserva de emergência *(NOVO v2)*
- `UserGoal` — objetivos pessoais *(NOVO v2)*
- `ConsentLog` — auditoria de aceite de termos *(NOVO v2)*
- `ScoringWeight` — pesos configuráveis do priority-engine *(NOVO v2)*

---

## 12. Próximos passos

**Fase 3 — Motor de Decisão (próxima)**
Contratos TypeScript, pseudocódigo de cada módulo, regras de classificação, casos de borda, testes.

**Fase 4 — Arquitetura técnica**
Onde cada módulo se encaixa no NestJS, BullMQ + Upstash, eventos, cache.

**Fase 5 — Fluxo de telas (web first)**
Wireframes, fluxos, estados.

**Fase 6 — Plano de migração**
Ordem, riscos, preservação.

---

## 13. Conformidade legal e governança *(NOVA v2)*

Esta seção atende ao bloqueador #4 do ciclo adversarial (risco de aconselhamento financeiro automatizado para hipervulneráveis). Antes de **qualquer release público**, os itens abaixo precisam estar em produção.

### 13.1 LGPD

**Base legal aplicável** (LGPD art. 7º, art. 11º, art. 38):
- Tratamento por **execução de contrato** (aceite de Termos) e **consentimento específico** para finalidades secundárias
- Dados financeiros = dados sensíveis pelo contexto (saúde financeira do titular)
- Exige **RIPD** (Relatório de Impacto à Proteção de Dados) — art. 38

**Responsabilidades:**

| Papel | Responsável | Quando |
|---|---|---|
| Controlador | Quita (CNPJ) | Sempre |
| DPO (Encarregado) | Figura interna até 1.000 usuários ativos; DPOaaS depois | Antes do release |
| RIPD | Advogado especializado | Antes do release |
| Termos de Uso v1.0 + Política de Privacidade v1.0 | Advogado fintech | Antes do release |
| Versionamento de consentimento | `ConsentLog` (tabela criada na Fase 2) | Implementação na Fase 2 |

**Direitos do titular implementados:**
- Confirmação de existência (LGPD art. 18, I)
- Acesso aos dados (II) — via `DataExport` (já existe)
- Correção (III) — via edição no app
- Anonimização/bloqueio/eliminação (IV) — soft delete já implementado
- Portabilidade (V) — via `DataExport`
- Eliminação dos dados tratados com consentimento (VI)
- Revogação do consentimento (IX) — via configurações
- Informações sobre uso compartilhado (VII) — Política de Privacidade

### 13.2 Termos de Uso — cláusulas críticas

Texto a entrar na minuta:

> **Natureza do serviço.** O Quita é uma ferramenta tecnológica que auxilia o usuário a organizar e tomar decisões sobre sua vida financeira pessoal, com base nos dados que o próprio usuário informa. As recomendações exibidas no aplicativo são geradas automaticamente por algoritmos a partir desses dados e **não constituem aconselhamento financeiro profissional**, contábil, jurídico ou de investimentos.
>
> **Limitação de responsabilidade.** A decisão final sobre qualquer pagamento, negociação ou recusa de acordo é exclusiva do usuário. O Quita não responde por prejuízos decorrentes da adoção das recomendações automatizadas, especialmente quando baseadas em dados informados inadequadamente, desatualizados ou incompletos.
>
> **Não substituição.** O Quita não substitui o processo judicial ou extrajudicial de tratamento do superendividamento previsto na Lei 14.181/2021, nem o aconselhamento profissional de advogado, contador ou planejador financeiro certificado.

### 13.3 Lei do Superendividamento (Lei 14.181/2021)

O Quita **não é** processo formal. É ferramenta de apoio que:
- Pode **encaminhar** o usuário para canais formais (Procon, Defensoria, mutirões)
- Pode **informar** sobre direitos (mínimo existencial, repactuação)
- **Não pode** intermediar, simular ou substituir o processo formal
- **Não pode** garantir resultados de renegociação

### 13.4 Auditoria

Toda recomendação importante fica rastreável:
- `SettlementEvaluation` — auditoria de validações de acordo
- `FinancialStateSnapshot` — histórico de estados detectados
- `ConsentLog` — auditoria de aceites de termo
- `MonthlyActionPlan` versionado — qualquer recomendação pode ser provada no momento em que foi feita

### 13.5 Cronograma de compliance

| Item | Quando | Responsável |
|---|---|---|
| Designar DPO interno provisório | Imediatamente | @deborah-product |
| Contratar advogado fintech para revisão | Antes da Fase 4 | @deborah-product |
| RIPD produzido | Antes da Fase 6 | Advogado |
| Termos de Uso v1.0 + Política de Privacidade v1.0 | Antes da Fase 6 | Advogado |
| Implementar `ConsentLog` no código | Fase 4 | @claude-arquiteto |
| Release público | Apenas após todos os itens acima | — |

---

*Fim do documento da Fase 1 v2.*
