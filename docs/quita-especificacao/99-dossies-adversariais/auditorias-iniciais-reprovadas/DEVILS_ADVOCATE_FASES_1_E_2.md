# Devils Advocate — Auditoria Adversarial das Fases 1 e 2 do Quita

> **Modo:** Estratégia (planos sem código a typechecar)
> **Escopo auditado:** `FASE_1_ESPECIFICACAO_DE_PRODUTO.md` + `FASE_2_MODELAGEM_DE_DOMINIO.md`
> **Data:** 16 de maio de 2026
> **Mantra:** *"Se não sobreviver ao meu interrogatório, não merece produção."*

---

## Veredito provisório

# 🔴 REPROVADO

Não estamos prontos para a Fase 3.

Não é "aprovado com ressalvas". Ressalva = problema. Encontrei **9 falhas estruturais** (não cosméticas) que, se ignoradas, viram dor cara na Fase 4 ou pior, comprometem o produto em produção. Quatro delas são **bloqueadoras**: produto inteiro pode ficar inválido se não resolvidas antes do schema fechar.

Após o ciclo adversarial (você responder o interrogatório com evidência, não com "depois a gente vê"), eu reavalio. Se as respostas fecharem os gaps, vira **APROVADO** e seguimos para a Fase 3.

---

## Fase 1 — Radiografia

### Falhas estruturais encontradas (9)

#### 🔴 BLOQUEADOR-1 — Gastos sazonais e provisão não estão modelados

**O furo.** A fórmula da `capacidade_segura` (Fase 1 §4.2) assume gastos mensais constantes. IPTU, IPVA, material escolar de fevereiro, presente de natal, manutenção do carro, problema dentário — gastos sazonais ou inesperados existem para QUALQUER pessoa, e particularmente para o público endividado funcionam como gatilhos de recaída.

A pessoa fica 11 meses no Modo Quitação. Em janeiro chega IPTU + IPVA + material escolar. Capacidade segura vai a zero. Pessoa cai para Modo Crise. Quita parece estar errando — mas é o modelo que ignorou a realidade.

**Por que importa.** O `MonthlyActionPlan` é o coração do produto. Se ele oscila absurdamente em janeiro/fevereiro porque o modelo não previu, perdemos a confiança do usuário no momento mais frágil dele.

**O que falta.**
- Modelo de **provisão mensal** (reservar X reais por mês para gastos sazonais conhecidos).
- Despesas com periodicidade `annual` ou `irregular` (não só `recurring` / `one_time`).
- Conceito de **reserva de emergência** (mesmo que pequena) que o motor leva em conta.

**Custo de resolver agora vs. depois.** Agora: ~20% de aumento no escopo do schema (1 tabela `ProvisionedExpense`, alguns campos em `Expense`). Depois: refazer toda a lógica do `financial-state-detector` e do `monthly-plan-generator` quando o app já estiver rodando.

---

#### 🔴 BLOQUEADOR-2 — Renda informal/instável quebra o motor

**O furo.** A Fase 1 §6 (passo 2 do onboarding) trata renda variável como "média dos últimos 3 meses". 40% dos brasileiros são informais. Para um motorista de app, vendedor autônomo ou freelancer, a média dos últimos 3 meses NÃO é uma estimativa confiável da renda do próximo mês — pode oscilar em 300% para mais ou para menos.

**Consequência prática.** Motorista de app cadastra renda média R$ 2.500. Vem um mês com R$ 1.100 (pneu furou, ficou doente). Motor recalcula: Apertado → Crise. Plano muda. Mês seguinte vem R$ 3.200 (alta temporada). Crise → Saudável. App vira ioiô.

**Whiplash de modo de operação é o pior cenário** — viola o princípio "Calma" do Modo Crise e o princípio "Honestidade sobre prazo" da Fase 1 §2.

**O que falta.**
- Distinção entre **renda esperada** (compromisso firme) e **renda histórica** (média ponderada).
- **Renda mínima garantida** (o piso que a pessoa SABE que vai entrar) vs **renda variável superior**.
- Lógica de **suavização de transição** entre modos (não migrar de Saudável a Crise em 1 mês — exigir 2-3 meses consecutivos de piora).
- Onboarding precisa perguntar: "Sua renda é estável?" antes de pedir o valor.

**Risco se ignorado.** Produto inútil para informais (50%+ do mercado-alvo real do Quita).

---

#### 🔴 BLOQUEADOR-3 — Quem dispara a virada de mês não está definido

**O furo.** A Fase 1 §6.5 diz "Todo mês o motor recalcula". A Fase 2 cria `MonthlyActionPlan` com `referenceMonth`. Nenhum dos dois documentos especifica **quem** dispara isso.

Hipóteses possíveis (todas com problemas):

1. **Recalcula quando o usuário abre o app.** Problema: usuário em Modo Crise pode parar de abrir por vergonha. Plano fica congelado. Notificações continuam baseadas em dados velhos.

2. **Job cron no servidor todo dia 1º às 00:00.** Problema: pico de carga (todos os usuários ao mesmo tempo), e ignora que o "mês financeiro" de cada um pode começar em dias diferentes (quem recebe dia 5, quem recebe quinzenal, quem é autônomo sem dia fixo).

3. **Job por usuário, atrelado ao dia de pagamento.** Mais sofisticado, mas exige modelo de `payment_day` por renda + scheduler robusto. Não está mencionado.

**O que falta.**
- Definir o **modelo de ciclo financeiro** (mês civil? mês desde dia de pagamento?).
- Definir **gatilhos de recálculo** (evento-driven + scheduled).
- Definir **comportamento de degradação** (e se o job falha? se o usuário não abre por 60 dias?).
- Especificar **expiração** de `MonthlyActionPlan` antigos.

**Sem essa definição, a Fase 3 não pode escrever o motor.** O motor é uma função do tempo.

---

#### 🔴 BLOQUEADOR-4 — Risco legal de aconselhamento financeiro

**O furo.** O `settlement-validator` (Fase 1 §7.8) emite uma `recommendation: "accept" | "negotiate_lower" | "reject"`. A `RecommendedAction` (Fase 2 §3.3) tem `actionType: pay | negotiate | refuse`.

Isso é **aconselhamento financeiro automatizado**. No Brasil:

- **CVM**: aconselhamento sobre investimentos exige registro. Dívida não é investimento, então fica fora — mas a linha é fina (acordo com desconto pode ser interpretado como produto financeiro).
- **CFP (Certified Financial Planner)**: não regulamentado oficialmente no Brasil para empresas, mas é boa prática.
- **Procon e CDC**: se a recomendação do app der prejuízo concreto ao consumidor, o app pode ser responsabilizado.
- **LGPD + Decreto do Superendividamento (Lei 14.181/2021)**: tratamento de dados financeiros de hipervulneráveis exige base legal explícita, finalidade específica, e a coleta de dados sensíveis pode exigir DPIA (Relatório de Impacto à Proteção de Dados).
- **Lei do Superendividamento art. 54-A a 54-G**: define direitos e procedimentos. Um app que **interfere** nesse processo (recomendando aceitar/recusar acordos) precisa estar alinhado.

**O que falta nos dois documentos:**
- Nenhuma menção a **Termos de Uso** com cláusulas de isenção apropriadas.
- Nenhuma menção a **RIPD** (Relatório de Impacto à Proteção de Dados — LGPD art. 38).
- Nenhuma menção a **DPO** designado.
- Nenhuma menção a **linguagem de produto** distinguindo "sugestão automatizada" de "aconselhamento personalizado".
- Nenhuma menção a **trilha de auditoria** das recomendações (já tem `SettlementEvaluation`, OK — mas falta `RecommendedActionLog`).

**Risco se ignorado.** Uma ação coletiva, ou uma matéria do Fantástico ("App diz para não pagar dívida e cliente perde casa"), enterra o produto.

---

#### 🟠 ALTO-5 — Onboarding longo demais, taxa de abandono ignorada

**O furo.** Fase 1 §6.1 estima "7-10 min" para onboarding em 5 passos. Conta de padaria do conteúdo real:

| Passo | Estimativa otimista | Estimativa realista |
|---|---|---|
| 1. Conta | 1 min | 1-2 min |
| 2. Renda | 2 min | 3-5 min (variável, dependentes, cidade, dia) |
| 3. Vida essencial | 2 min | 5-8 min (8 categorias com pergunta de risco em cada) |
| 4. Dívidas | 1 min por dívida | 3-5 min **por dívida** (3 mini-telas) |
| 5. Preocupação | 1 min | 1-2 min |

Pessoa com 6 dívidas (público real do Quita): **20-35 minutos**. Em sessão única, em estado emocional difícil, em celular. Conversion rate de onboarding longo em fintech: 30-50%. Quita está mirando público que JÁ TEM tendência a evitar.

**O que falta.**
- Estratégia explícita de **onboarding fracionado** (salvar e voltar depois).
- Estratégia de **onboarding mínimo viável** (dados mínimos para gerar Modo + plano básico; refinamento opcional).
- KPI definido para abandono.
- Sequência de **mini-vitórias** durante o onboarding (mostrar valor antes de pedir tudo).

**Premissa morta.** "Modo Crise rápido sem dados completos" não foi pensado. Pessoa em crise precisa de uma resposta em 2 minutos, não em 25.

---

#### 🟠 ALTO-6 — Goals/Objetivos pessoais ausentes do modelo

**O furo.** Pesquisa comportamental (referenciada nos próprios documentos do projeto sobre Kellogg/NBER) mostra que **motivação intrínseca** (objetivo pessoal) é o fator mais forte de persistência em sair da dívida. O Quita não modela isso.

Não tem `Goal`, `Aspiration`, `WhyQuit`. Pessoa quita para quê? Casar? Comprar casa? Pagar faculdade do filho? Dormir tranquilo? O motor trata todos como "pessoas que querem ficar sem dívida" — abstração fraca.

**Impacto.** Modo Estabilização e Modo Quitação dependem de motivação. Sem o "porquê", o tom da comunicação é genérico e a engajamento cai.

**O que falta.** Tabela `UserGoal` (1:N com User), com tipo, descrição, valor opcional, prazo opcional, prioridade. Telas de "qual a sua razão?" no onboarding (opcional) e revisão mensal.

---

#### 🟠 ALTO-7 — Inconsistências entre Fase 1 e Fase 2

Encontrei **5 inconsistências factuais** entre os dois documentos:

| # | Fase 1 diz | Fase 2 implementa | Conflito |
|---|---|---|---|
| 1 | "Modo Sobrevivência não recomenda pagar dívida nenhuma" | `ActionType.pay` existe sem restrição por modo | Como o motor garante que não gera `pay` em `sobrevivencia`? Validação aplicacional? Constraint no banco? |
| 2 | Fórmula do score usa `dias_atraso_normalizado` | Schema tem `overdueMonths` (não dias) | Dias ≠ meses. Decida e padronize. |
| 3 | "Estratégia: avalanche / bola de neve / híbrido / crise" | Enum `PlanStrategy` mantém legados `smallest_first, highest_interest, custom` ADICIONA `snowball, avalanche, hybrid, crisis` | 7 valores no enum, dois sets semânticos. Fonte da verdade dúbia. Query sobre estratégia vira pesadelo. |
| 4 | Fase 1 §11.2 cita `priorityOrder` será "derivado de `priorityScore`" e "deprecado em fase futura" | Fase 2 mantém ambos no schema sem flag | Débito técnico nascendo já com aprovação. |
| 5 | Fase 1 §7.5 lista pesos do score (30+25+25+20+15+10+10+8-30-20) | Fase 2 não define tabela de pesos configurável | Pesos hardcoded ou tabela `ScoringWeight`? Não decidido. |

**Resolva antes do schema fechar.** Cada inconsistência vira bug ou migration cara.

---

#### 🟠 ALTO-8 — Confiabilidade dos dados auto-declarados não tratada

**O furo.** O motor toma decisões com base em campos que o usuário declara: `interestRateMonthly`, `totalAmount`, `hasCollateral`, `affectsSurvival`, `stressLevel`. Em uma população endividada:

- Quase ninguém sabe a taxa de juros real do cartão (varia entre 200% a 600% a.a.; usuário comum chuta).
- Valor total da dívida está defasado (juros + multa + encargos não são visíveis na faturas correntes).
- Auto-classificação de "afeta sobrevivência" é subjetiva (carro = afeta? "Eu uso para trabalhar"; mas também "uso para passear").
- `stressLevel` é puramente emocional e oscila com o humor do dia.

**O motor confia cegamente?** Pondera? Avisa o usuário "esta recomendação é baseada em dados estimados, confira"? Nenhuma seção dos documentos trata disso.

**O que falta.**
- Campo `confidence` por dívida e por despesa (já existe para income, generalizar).
- Estratégia de **fallback para referência** quando dado pessoal está vazio ou suspeito (já parcialmente coberto por `InterestRateReference`).
- Telas que **mostram explicitamente** quando uma recomendação é baseada em estimativa vs em dado conhecido.
- Mecanismo de **re-verificação** periódica (perguntar a cada 3 meses se o valor da dívida ainda é aquele).

---

#### 🟡 MÉDIO-9 — Naming inconsistente vira débito técnico permanente

**O furo.** O schema mistura padrões:

- Enums em **PT-BR snake_case**: `saudavel_com_divida`, `quitacao`, `protecao`, `sobrevivencia`, `apertado`, `deficit_mensal`.
- Enums em **EN snake_case**: `high`, `medium`, `low`, `accept`, `reject`, `pending`, `service_cut`.
- Campos em **EN camelCase**: `isEssential`, `affectsSurvival`, `monthlyAmount`.
- DB columns em **EN snake_case** (via `@map`): OK.

Por que isso importa? Quando o time crescer, alguém vai escrever `FinancialState.saudavel_com_dívida` (com acento — fail), ou `FinancialState.healthyWithDebt` (errado, é `saudavel_com_divida` no schema). Bugs por consistência.

**Recomendação.** Padronize agora, **antes** das migrations rodarem:
- **Opção A**: Tudo em EN (`healthy_with_debt`, `tight_budget`, `monthly_deficit`, `overindebtedness`, `practical_insolvency`). Mais coerente com o resto.
- **Opção B**: Tudo em PT-BR sem mistura. Pior para colaboração internacional ou bibliotecas geradas.

Eu voto A. Mas a decisão é sua.

---

### Pontos cegos importantes (5)

Coisas que não são "falhas" mas que **não foram pensadas** e vão aparecer caro:

1. **Suporte humano em Modo Sobrevivência.** App sozinho não resolve insolvência. Quem responde quando a pessoa pede ajuda? Email? Chat? WhatsApp? Não previsto, mas inevitável.

2. **Custo unitário vs Premium R$9,90.** Quem consome BCB API, processa OCR (se Premium), usa Supabase storage e infra Vercel, em escala de 1.000 / 10.000 / 100.000 usuários — quanto custa? Conta da padaria mostra que R$9,90 cobre, mas margem é estreita. Sem unit economics validado, plano de monetização é torcida.

3. **Versionamento de plano.** Plano muda dia 15 (usuário cadastrou nova dívida). Não tem como ver o plano antigo. Auditoria, suporte, "por que isso mudou?" → impossível responder.

4. **Tela "Plano do mês" para casos com 12+ dívidas.** Como cortar para 3-6 ações sem perder o contexto do resto? Se eu pago uma dívida "escondida" porque me cobraram, isso quebra o plano? App detecta?

5. **Comunicação de queda de modo.** A Fase 1 diz "transição silenciosa". Mas se a pessoa SOBE para Crise, ela precisa saber que algo mudou — senão continua agindo como se estivesse Apertada e cava mais fundo. A "silenciosidade" é arriscada quando o estado piora.

---

## Fase 5 — Interrogatório Endereçado

10 perguntas. Cada uma exige resposta com evidência, não com "depois a gente vê". Marque cada uma como **ACEITO** (com link/evidência) ou **NÃO ACEITO** (precisa retrabalho). Não dá pra avançar para Fase 3 com pergunta aberta.

---

**P1 @deborah-product**
Qual a sua decisão sobre **gastos sazonais e provisão** (BLOQUEADOR-1)? Modelar `ProvisionedExpense` na Fase 2 (significa retrabalho de schema antes da migration rodar)? Ou tratar como `Expense` com periodicidade nova (`annual`, `irregular`)? Ou ignorar no MVP e aceitar conscientemente o risco de oscilação em janeiro/fevereiro?

*Sem essa resposta, schema da Fase 2 não pode fechar.*

---

**P2 @deborah-product**
Qual o **tratamento de renda instável** (BLOQUEADOR-2)? Três opções concretas:
- a) `Income.guaranteedAmount` + `Income.variableUpperBound` (campos novos)
- b) Tag `incomeStability` no `User` (estável / instável / sazonal) que muda a lógica do detector
- c) Aceitar oscilação de modo e mitigar com regra de "exige 2 meses consecutivos para mudar de estado"

Qual?

---

**P3 @claude-arquiteto**
Qual o **modelo de ciclo financeiro** (BLOQUEADOR-3)? Preciso de decisão sobre:
- a) Trigger de recálculo (evento, scheduled, ambos?)
- b) Ferramenta (BullMQ + Redis? cron do PostgreSQL via `pg_cron`? Vercel Cron? Supabase Edge Functions com schedule?)
- c) Comportamento de degradação (e se job falha? notificar SRE? Tem SRE?)
- d) Expiração de `MonthlyActionPlan` antigos

Sem isso, Fase 3 escreve motor sem saber **quando** ele roda.

---

**P4 @deborah-legal**
Sobre **risco legal** (BLOQUEADOR-4):
- a) Tem advogado contratado para LGPD e CDC? Se sim, ele revisou esse plano?
- b) Tem DPO designado? (LGPD art. 41)
- c) Vai existir **RIPD** (Relatório de Impacto à Proteção de Dados)? Quem produz?
- d) Texto de **Termos de Uso** e **Política de Privacidade** está em produção? Quem revisa?

Se a resposta for "depois", isso é REPROVADO permanente.

---

**P5 @deborah-product**
Sobre **onboarding longo** (ALTO-5):
- a) Aceita estimativa realista de 15-25 min para público endividado com várias dívidas?
- b) Tem KPI definido para taxa de abandono no onboarding? Qual a meta?
- c) Vai existir "modo mínimo viável" (Quita gera plano com 30% dos dados e refina depois)?
- d) Onboarding **fracionado** está no escopo do MVP refatorado?

---

**P6 @deborah-product**
Sobre **Goals/Objetivos pessoais** (ALTO-6): adicionar tabela `UserGoal` agora ou empurrar para v2? Risco de empurrar: comunicação do app fica genérica, sem o "porquê" pessoal. Custo de adicionar: ~1 dia de schema + 1 tela no onboarding (opcional).

---

**P7 @claude-arquiteto**
Sobre **inconsistências Fase 1 ↔ Fase 2** (ALTO-7), preciso de decisão em CADA uma das 5:

1. Como impedir `actionType=pay` em `OperationMode.sobrevivencia`? Validação no service? CHECK constraint no banco?
2. `dias_atraso` ou `meses_atraso` na fórmula? Mudar Fase 1 ou Fase 2.
3. Limpar enum `PlanStrategy` (manter só os 4 novos), ou marcar legados como `@deprecated`?
4. Decidir sobre `priorityOrder` agora — manter ambos com semântica dupla, ou removê-lo já?
5. Tabela `ScoringWeight` configurável ou constantes hardcoded no service?

---

**P8 @claude-arquiteto**
Sobre **confiabilidade de dados** (ALTO-8): aceita generalizar `confidence` para `Expense` e `Debt`, ou prefere tratar apenas onde for crítico? E como o app **comunica visualmente** quando uma recomendação é baseada em estimativa? Tem decisão de UX?

---

**P9 @deborah-product + @claude-arquiteto**
Sobre **naming inconsistente** (MÉDIO-9): vamos padronizar para inglês? Se sim, eu refaço o trecho dos enums em PT-BR (`saudavel_com_divida` → `healthy_with_debt` etc.) na Fase 2. **Decisão agora** — depois vira migration cara.

---

**P10 @deborah-business**
Unit economics validado para Premium R$9,90?
- a) Custo médio por usuário ativo (infra + APIs externas + storage + OCR se aplicável)?
- b) Conversão esperada Free → Premium? Em qual base?
- c) Plano B se conversão for < 5% (público endividado historicamente paga pouco)?

Se isso for "depois", anota como **risco aceito** e segue. Se não anota nem responde, REPROVADO.

---

## Fase 6 — Ciclo Adversarial

**Estado atual:** aguardando respostas do interrogatório.

**Regra do ciclo:** resposta vaga (`"depois a gente vê"`, `"depende"`, `"já consideramos"` sem evidência) é **automaticamente rejeitada** e o ciclo continua.

**Convergência:** quando todas as 10 perguntas tiverem resposta marcada **ACEITO** com evidência concreta (decisão tomada + onde foi documentada + quem é responsável), o veredito é reavaliado.

**Escalação:** se 3+ ciclos não convergirem em uma pergunta, escala para revisão externa.

---

## Fase 7 — Veredito

# 🔴 REPROVADO até o ciclo adversarial fechar.

### O que precisa para virar APROVADO

Critérios objetivos (não me convença com retórica — me convença com **decisão tomada e documentada**):

| # | Critério | Status |
|---|---|---|
| 1 | BLOQUEADOR-1 resolvido (modelagem de sazonais/provisão) | ❌ |
| 2 | BLOQUEADOR-2 resolvido (tratamento de renda instável) | ❌ |
| 3 | BLOQUEADOR-3 resolvido (ciclo financeiro e jobs definidos) | ❌ |
| 4 | BLOQUEADOR-4 resolvido (RIPD + DPO + Termos de Uso planejados) | ❌ |
| 5 | ALTO-5 a 8 com decisão registrada (não precisa estar implementado — basta decidido) | ❌ |
| 6 | 5 inconsistências Fase 1↔Fase 2 reconciliadas | ❌ |
| 7 | Naming padronizado (decisão tomada) | ❌ |
| 8 | Plano de validação com usuário real (mesmo que poucos) antes de Fase 4 | ❌ |
| 9 | Pontos cegos com decisão de "tratar agora" ou "risco aceito documentado" | ❌ |

**Atalho recusado:** "vou pensar nisso na Fase 3" não conta. Bloqueadores 1, 2 e 3 afetam o **schema** — se Fase 3 começar sem essas decisões, o schema fechado vai ficar errado e precisará de migration de retrabalho.

---

## Comentário final (não cobre veredito, mas peça honesta)

Os dois documentos estão **acima da média** em estrutura, princípios e ambição. Você não cometeu erros de iniciante (não fez "app que mostra saldo e dá dica genérica"); fez uma arquitetura conceitual robusta. O motor de 8 módulos, os 5 estados financeiros, o conceito de capacidade segura — tudo isso é sólido.

O que está acontecendo aqui é o que sempre acontece com bom design conceitual: ele revela os **furos da realidade** quando você tenta puxar para implementação. Os 9 furos que apontei são consequência de o documento ser BOM o suficiente para a gente conseguir bater nele.

Resolva os 4 bloqueadores nos próximos dias. Os 5 demais podem ir em paralelo. Aí avançamos para a Fase 3 com chão firme.

*Fim do dossiê. Aguardando ciclo adversarial.*
