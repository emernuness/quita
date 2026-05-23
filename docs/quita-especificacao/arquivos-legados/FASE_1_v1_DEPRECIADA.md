# Quita — Fase 1: Especificação de Produto

> **Status:** rascunho para validação
> **Data:** 16 de maio de 2026
> **Escopo:** refatoração conceitual do Quita de "organizador financeiro" para "motor de decisão financeira"
> **Decisões já tomadas:** monetização Free vs Premium R$9,90/mês mantida; Web primeiro, mobile depois; protótipo MVP sem usuários reais ainda

---

## Sumário executivo

O Quita é hoje um organizador financeiro: cadastra renda, despesas e dívidas, calcula saldo, e recomenda pagar a menor dívida ou a mais cara. A refatoração transforma o Quita em um **motor de decisão financeira**: a cada mês, com os dados reais da pessoa, o sistema diz qual é a melhor próxima ação — pagar uma dívida específica, negociar com limite máximo de parcela, recusar um acordo, cortar um gasto, ou aguardar.

A virada conceitual é a seguinte: o Quita não pergunta mais "qual dívida você quer pagar primeiro?". Ele responde "com o dinheiro que você tem este mês, qual decisão causa o menor dano e maximiza a chance de recuperação?".

**O que muda do produto atual:**
- Coleta de dados mais profunda, porém progressiva e leve para o usuário
- Classificação automática de despesas por essencialidade e de dívidas por risco
- Detector de estado financeiro em 5 níveis (Saudável, Apertado, Déficit, Superendividamento, Insolvência)
- 5 modos de operação do app que se adaptam ao estado real
- Score de prioridade multi-fator (não apenas "menor primeiro" ou "maior juros")
- Validador de acordo: recusa acordos que comprometem o mês
- Conceitos novos: **capacidade segura** (não saldo bruto) e **mínimo vital personalizado** (não os R$ 600 da lei)

**O que se aproveita do código atual (~85% do trabalho já feito):**
Monorepo pnpm, NestJS, Prisma, Next.js 15, Expo, Tailwind v4, Zod compartilhado, módulos backend bem isolados, schema base, e ~80% das telas existentes (com mudanças cirúrgicas de copy e estrutura de dados).

**Frase-guia do produto:**
> Primeiro sobreviver. Depois estabilizar. Depois negociar. Depois quitar.

---

## 1. Visão e posicionamento

### 1.1 O Quita É

Um motor de decisão financeira para pessoas endividadas. A cada mês, com os dados reais da pessoa, ele diz: pague isto, negocie aquilo com limite máximo X, recuse essa proposta, corte este gasto, ou aguarde. A complexidade fica no back-end. A interface entrega clareza.

### 1.2 O Quita NÃO É

- Não é agregador bancário (não conecta no Open Finance, ao menos no MVP)
- Não é app de orçamento por categoria (não compete com Mobills, Organizze)
- Não é plataforma de renegociação (não compete com Serasa Limpa Nome, Acordo Certo)
- Não é educação financeira passiva (não compete com Meu Bolso em Dia)
- Não é conselheiro financeiro humano
- Não substitui Procon, Defensoria, advogado

### 1.3 Posicionamento em uma frase

> "O Quita não te ensina sobre dinheiro. Ele te diz o que fazer este mês."

### 1.4 Diferencial competitivo

A pergunta central de qualquer organizador financeiro é "quanto você deve?". A pergunta central do Quita é "qual é a melhor próxima decisão com o dinheiro que você tem agora?" — e essa pergunta exige diagnóstico, priorização por risco, simulação e validação de acordo. Não cabe em planilha.

---

## 2. Princípios fundadores (não-negociáveis)

Esses nove princípios travam toda decisão de produto, design e engenharia. Qualquer feature, copy ou regra que conflite com eles é descartada.

**1. Primeiro sobreviver, depois quitar.** Nenhuma recomendação compromete alimentação, moradia, saúde, transporte essencial, trabalho ou obrigação legal. O motor recusa planos que zeram o caixa.

**2. Decisão por consequência, não por pressão.** O app protege a pessoa do credor que mais grita. Prioridade vem do dano potencial de não pagar, não do barulho da cobrança.

**3. Acordo só é bom se cabe.** Acordo com parcela insustentável é recusado, mesmo com desconto alto. Aceitar e quebrar piora a situação.

**4. Honestidade sobre prazo.** O motor trabalha com faixas estimadas (ex: "entre 14 e 18 meses"). Nunca promete data exata. Renda, juros e vida mudam.

**5. Complexidade no back, simplicidade no front.** O usuário recebe ações claras e curtas. Toda a inteligência — score, classificação, simulação — fica oculta.

**6. Linguagem sem culpa.** Quem está endividado já se julga o suficiente. O app não amplifica vergonha.

**7. Educação contextual, nunca didática.** Explicação aparece no momento da decisão, em uma frase curta. Não há "trilhas educativas" nem cursos.

**8. Privacidade radical.** Modo discreto, biometria, soft delete, exportação LGPD. O Quita é confidente, não vitrine.

**9. Realismo sobre limites.** Quando o caso é de superendividamento ou insolvência, o app encaminha (Procon, Defensoria, consumidor.gov.br, mutirões da Febraban). Não promete o impossível.

---

## 3. Persona e contexto emocional

### 3.1 Os três perfis-alvo

**a) Recuperável organizado (~30% do público potencial)**
Sabe quanto deve, paga os mínimos, mas perdeu o controle do que fazer primeiro. Tem renda regular e alguma sobra. Precisa de método e visibilidade.

**b) Pressionado no fio (~50% do público potencial)**
Cobre o essencial e talvez os mínimos. Não sobra nada. Cobradores ligam. Toma decisões reativas. Tem vergonha mas ainda olha. Precisa de calma, ordem e proteção.

**c) Afogado (~20% do público potencial)**
Déficit estrutural. Renda não cobre essenciais + dívidas. Pode estar em superendividamento. Tem vergonha de olhar a vida financeira, evita o app. Precisa de acolhimento, plano de proteção e encaminhamento — não de plano de quitação otimista.

### 3.2 Estado mental comum aos três

Estresse crônico, vergonha, fadiga decisória, comportamento de evitação. Isso vai além de design bonito — define o produto:

- Cada tela responde uma única pergunta
- Cada decisão é binária ou tem no máximo 3 opções
- Cada número aparece com contexto
- Frases curtas, segunda pessoa, presente
- Ações ordenadas, nunca tudo de uma vez
- O app guarda o lugar quando a pessoa sai (ela vai sair várias vezes)

### 3.3 O que o produto NÃO faz com essa persona

- Não gameifica com pontos, conquistas infantis ou medalhas
- Não compara o usuário com outras pessoas
- Não usa linguagem motivacional vazia
- Não envia notificação na hora em que a pessoa não pediu
- Não mostra dashboards densos no primeiro acesso

---

## 4. Os 5 estados financeiros

Toda a inteligência do motor depende de classificar o usuário em um destes estados. O estado é **recalculado a cada mês** ou sempre que renda, despesa ou dívida muda.

### 4.1 Tabela definicional

| Estado | Critério | Plano gerado | Tom |
|---|---|---|---|
| **1. Saudável com dívida** | Renda ≥ essenciais + mínimos + 10% folga | Estratégia de quitação (avalanche / bola de neve / híbrido) | Conquista |
| **2. Apertado** | Cobre essenciais e mínimos, sobra próxima de zero | Estabilização: criar margem mensal | Foco |
| **3. Déficit mensal** | Renda < essenciais + mínimos | Plano de crise: proteger essencial, renegociar, pausar | Calma |
| **4. Superendividamento provável** | Cobre essenciais com aperto, mas dívidas tornam quitação estruturalmente inviável (prazo > 5 anos no pagamento máximo seguro) | Proteção do mínimo vital + encaminhamento (Lei 14.181/2021) | Acolhimento |
| **5. Insolvência prática** | Renda insuficiente para essenciais mesmo sem dívida | Sobrevivência: renda extra, benefícios sociais, ajuda especializada | Acolhimento sério |

### 4.2 Critérios operacionais (alimentam o detector)

```
renda_liquida_mensal = receita_fixa + média(receita_variável_últimos_3m)
total_essenciais    = soma(despesas com is_essential = true)
total_renda_protetora = soma(despesas com is_income_related = true)
total_legais        = soma(obrigações legais e judiciais)
total_minimos_dividas = soma(parcela_mínima de cada dívida)

capacidade_segura = renda_liquida_mensal
                  - total_essenciais
                  - total_renda_protetora
                  - total_legais
                  - reserva_operacional_mínima
```

A `reserva_operacional_mínima` é uma folga (sugestão: 5% da renda, com piso de R$ 100) que evita o caixa zero absoluto.

**Árvore de decisão:**

- Se `renda_liquida < total_essenciais` → **Insolvência prática**
- Se `capacidade_segura < 0` mas essenciais estão cobertos → **Déficit mensal**
- Se `capacidade_segura < total_minimos_dividas` → rodar simulação com pagamento máximo seguro; se prazo > 60 meses → **Superendividamento provável**; caso contrário → **Déficit mensal**
- Se `capacidade_segura ≥ total_minimos_dividas` e folga ≤ 10% da renda → **Apertado**
- Se `capacidade_segura ≥ total_minimos_dividas` e folga > 10% da renda → **Saudável com dívida**

### 4.3 Conceitos auxiliares

- **Mínimo vital personalizado**: cálculo do app baseado em moradia, alimentação, saúde, transporte e dependentes. Substitui (para uso de produto) o "mínimo existencial legal" de R$ 600 do Decreto 11.150/2022, que é referência jurídica e baixa demais para a vida real.
- **Capacidade segura**: quanto pode ser usado para dívidas sem comprometer o essencial.
- **Folga real**: capacidade segura menos mínimos de todas as dívidas.

---

## 5. Os 5 modos de operação do app

Cada estado financeiro ativa um modo de operação. O usuário **nunca vê** o nome do modo. Vê apenas o app respondendo à realidade dele. A transição é silenciosa.

### 5.1 Modo Quitação (estado Saudável)

- Tela inicial mostra projeção de saída em faixa e próxima dívida a focar
- Permite escolher estratégia (avalanche / bola de neve / híbrido)
- Mostra economia de juros como reforço
- Notificações de progresso semanal habilitadas

### 5.2 Modo Estabilização (estado Apertado)

- Tela inicial mostra "como criar R$ X de margem este mês"
- Lista 2-3 cortes ou renegociações mais impactantes
- Esconde projeções de longo prazo (não há base sólida ainda)
- Foca em uma vitória pequena por mês

### 5.3 Modo Crise (estado Déficit mensal)

- Tela inicial responde "o que pagar este mês para não perder o essencial"
- Sem projeções otimistas, sem prazos prometidos
- Ordem de prioridade explícita: essencial → renda → legal → juros altos
- Dívidas sem caixa entram em "monitoramento e negociação futura", não em pagamento ativo
- Mostra canais de negociação contextuais

### 5.4 Modo Proteção (estado Superendividamento)

- Tela inicial mostra mínimo vital protegido e status de cada dívida
- Lista dívidas a renegociar coletivamente
- Encaminha proativamente: Procon, Defensoria, consumidor.gov.br, mutirões Febraban, Serasa Limpa Nome
- Apresenta a Lei 14.181/2021 em linguagem simples (direitos do superendividado)
- Não recomenda novos pagamentos sem antes esgotar negociação

### 5.5 Modo Sobrevivência (estado Insolvência prática)

- Tela inicial foca em renda extra e benefícios aplicáveis
- Lista benefícios sociais com critérios (BPC, Bolsa Família, auxílios estaduais/municipais)
- Lista cortes emergenciais (sem julgamento)
- O app **não recomenda pagar dívida nenhuma** nesse estado
- Encaminhamento para ajuda especializada com forte ênfase

### 5.6 Regras de transição entre modos

- Recálculo a cada: mudança de renda, mudança de despesa, novo cadastro/pagamento de dívida, virada de mês
- A transição é silenciosa: em vez de notificar "você saiu do modo crise", o app simplesmente muda o conteúdo da home
- Em caso de **piora** (ex: Saudável → Apertado), aviso suave e respeitoso na próxima abertura
- Em caso de **melhora** (ex: Crise → Apertado), o app reconhece sem celebração exagerada

---

## 6. Jornada do usuário

### 6.1 Etapa 1 — Diagnóstico (onboarding inteligente, ~7-10 min)

Hoje o onboarding tem 4 passos (conta → renda → categorias → despesas) com perguntas rasas. Vai virar **5 passos com inferência inteligente** para não pesar.

**Passo 1 — Conta** (mantém o atual)
Nome, email, telefone, senha. Google OAuth opcional.

**Passo 2 — Renda** (estende o atual)
- Quanto entra fixo por mês (salário, aposentadoria, etc.)
- Em qual dia (para alertas)
- Renda variável (existe? média dos últimos 3 meses)
- Ajuda recebida (existe? eventual ou recorrente?)
- Quantos dependentes na casa? (entra no cálculo de mínimo vital)
- Mora em qual cidade? (entra no cálculo de mínimo vital com referência regional)

**Passo 3 — Vida essencial** (NOVO — separado de "despesas gerais")
Aqui o app pergunta de forma direta o que protege a vida:
- Aluguel ou financiamento de casa (valor, vencimento)
- Conta de luz, água, gás
- Alimentação (com sugestão pelo nº de pessoas)
- Transporte para o trabalho (modal e custo)
- Dependentes com remédio recorrente, escola, creche
- **Pergunta-chave:** "Algum desses itens depende de você manter para conseguir trabalhar?" → define `is_income_related`

**Passo 4 — Dívidas** (refatora o atual)
Lista guiada por **categorias de risco** (não por tipo bancário):
- Atrasos em essenciais (luz, água, aluguel)
- Cartão de crédito / cheque especial
- Financiamento de veículo (+ pergunta: usa para trabalho?)
- Empréstimo pessoal / consignado
- Acordos antigos / negativados
- Pensão, multa, dívida judicial
- Família, amigos, informais
- Outros

Para cada dívida, em 3 mini-telas curtas:
1. **Identificação** (credor, valor total, parcela mínima, vencimento)
2. **Risco** (tem garantia? juros conhecidos? está negativado? há proposta de acordo?)
3. **Impacto pessoal** (escala 1-3: "Esta dívida me tira o sono?")

**Passo 5 — Preocupação e estilo** (NOVO — comportamental)
Duas perguntas que alimentam o seletor de estratégia:
- "O que mais te preocupa hoje?" (opções: pressão de cobrança / risco de corte / desorganização / vergonha de olhar / não saber por onde começar)
- "Você prefere ver dívidas pequenas sumirem rápido ou economizar mais ao final?" (define preferência bola de neve vs avalanche)

### 6.2 Etapa 2 — Espelho

Primeira tela após finalizar o onboarding. Uma tela única, calma, com 3 números e uma frase:
- **Saldo do mês**: quanto sobra ou falta
- **Total devido**: somatório das dívidas
- **Estado** em linguagem humana: "Você está pressionado, mas tem margem para virar o jogo."

Botão único: "Ver o plano deste mês".

### 6.3 Etapa 3 — Plano do mês (a tela mais importante do app)

Lista de 3 a 6 ações, em ordem de impacto, com verbo claro:
- **Pague** R$ 180 na conta de luz (vence dia 18) — risco de corte
- **Negocie** o cartão Banco X — não aceite parcela acima de R$ 90
- **Corte** o app de streaming Y — economia de R$ 39/mês
- **Aguarde** a dívida antiga loja Z — sem caixa este mês, sem risco imediato
- **Pague** o mínimo do cartão Banco W (R$ 65) para não negativar mais

Cada ação tem:
- Título curto (verbo + objeto + valor)
- Razão em uma linha
- Botão "marcar como feito"
- Botão "ver detalhes" (que explica o motivo)

### 6.4 Etapa 4 — Execução (durante o mês)

- Usuário marca o que fez
- App registra pagamentos (com upload opcional de comprovante)
- Pagamento pode ser desfeito em 24h (já implementado)
- Notificações enviadas **só do que importa**: vencimentos críticos, alertas de risco
- Quando uma dívida é quitada, o app reconhece sobriamente (sem confete): "Cartão Banco X — quitado. Risco financeiro removido."

### 6.5 Etapa 5 — Revisão mensal (virada de mês)

- Motor recalcula estado, capacidade segura, score de cada dívida
- Mostra o que mudou desde o mês anterior
- Gera novo plano do mês
- Se houve **mudança de modo**, aviso curto e respeitoso

### 6.6 Etapa 6 — Saída ou estabilidade

- **Saída da dívida**: todas as dívidas quitadas. Tela final reconhece o tempo, o esforço e a economia em juros. Convida para "Modo manutenção" (monitoramento, alerta se entrar dívida nova).
- **Estabilidade sem quitação total**: usuário em estado Saudável de forma sustentada por 6+ meses, mas com dívidas. App mantém o ciclo mensal, reduz frequência de notificações.

---

## 7. Os 8 módulos internos do motor

A engenharia não vê "telas", vê módulos. Toda a inteligência do Quita se organiza em 8 serviços. Esses nomes viram pastas em `apps/api/src/modules/` na Fase 4.

### 7.1 financial-profile-service
Mantém renda, despesas, dívidas, datas, dependentes, cidade. Fonte única de verdade do "estado financeiro bruto" do usuário. CRUDs (boa parte já existe).

### 7.2 expense-classification-service
Recebe uma despesa e atribui: `is_essential`, `is_income_related`, `is_legal_obligation`, `can_reduce`, `can_cancel`, `consequence_if_unpaid`. Combina regras determinísticas (categoria) com perguntas no onboarding.

### 7.3 debt-classification-service
Recebe uma dívida e atribui: `affects_survival`, `affects_income`, `has_legal_risk`, `interest_class` (alto/médio/baixo), `has_settlement_available`, `settlement_is_sustainable`. Combina o cadastro do usuário com tabelas de referência (taxa média de mercado por tipo de dívida).

### 7.4 financial-state-detector
Recebe perfil + despesas classificadas + dívidas classificadas. Calcula capacidade segura. Classifica em um dos 5 estados. Saída: `{ state, capacity, mode }`.

### 7.5 priority-engine
Recebe a lista de dívidas classificadas e calcula o score de cada uma:

```
score = risco_moradia * 30
      + risco_renda * 25
      + risco_legal * 25
      + risco_servico_essencial * 20
      + juros_mensal_normalizado * 15
      + dias_atraso_normalizado * 10
      + desconto_disponivel_sustentavel * 10
      + valor_pequeno_quitavel * 8
      - parcela_insustentavel * 30
      - acordo_sem_folga * 20
```

Saída: lista ordenada por score, com motivo de cada posição.

### 7.6 strategy-selector
Decide entre: avalanche, bola de neve, híbrido, crise. Regra:
- **Crise** se estado em {Déficit, Superendividamento, Insolvência}
- **Avalanche** se perfil disciplinado + caixa estável + objetivo "economizar"
- **Bola de neve** se perfil precisa de motivação + várias dívidas pequenas + risco de abandono
- **Híbrido** se há dívidas de risco crítico + dívidas caras + dívidas pequenas (padrão na maioria dos casos reais)

### 7.7 simulator
Gera 3 cenários:
- **Conservador**: usa apenas capacidade segura atual
- **Otimizado**: inclui cortes de gasto confirmados
- **Acelerado**: inclui renda extra ou aporte eventual

Saída: faixa de prazo (`14 a 18 meses`), não data exata.

### 7.8 settlement-validator
Recebe uma proposta de acordo (valor à vista, ou parcelas) e valida:
- A parcela cabe na capacidade segura? Se não, recusa
- O desconto vs valor original justifica? Se < 15% e parcela longa, alerta
- Deixa o caixa do mês negativo em algum mês? Se sim, recusa

Saída: `{ recommendation: "accept" | "negotiate_lower" | "reject", max_safe_installment, reasoning }`.

### 7.9 monthly-plan-generator (orquestrador)
Recebe saída de todos os módulos acima e monta o JSON do plano do mês com a lista de ações ordenadas. É o que a tela "Plano do mês" consome.

### 7.10 Exemplo de payload de saída do motor

```json
{
  "financial_state": "deficit_mensal",
  "mode": "crisis",
  "safe_debt_payment_capacity": 250,
  "main_goal_next_30_days": "proteger contas essenciais e evitar novas dívidas caras",
  "recommended_actions": [
    {
      "type": "pay",
      "target": "conta de energia",
      "amount": 180,
      "reason": "risco de corte de serviço essencial"
    },
    {
      "type": "negotiate",
      "target": "cartão banco X",
      "max_affordable_installment": 90,
      "reason": "dívida cara, mas acordo atual não cabe no orçamento"
    },
    {
      "type": "pause",
      "target": "dívida antiga loja Y",
      "reason": "sem risco imediato e sem acordo sustentável disponível"
    }
  ],
  "warnings": [
    "Não aceitar acordos acima de R$ 90 neste mês.",
    "Evitar usar cheque especial para pagar parcelas."
  ],
  "next_review_date": "2026-06-16"
}
```

---

## 8. Telas do MVP refatorado

Comparando com as **25 telas atuais** do protótipo `prototipo.pen`:

| # | Tela | Status | Mudança principal |
|---|---|---|---|
| 01-04 | Splash, login, cadastro, recuperação | Mantém | Sem alteração |
| 05 | Renda no onboarding | **Muda** | Adicionar dependentes, cidade, dia de pagamento, renda variável |
| 06 | Categorias de dívida | **Muda** | Reordenar por risco, não por tipo bancário |
| 07 | Detalhe da dívida (onboarding) | **Muda** | Quebrar em 3 mini-telas: identificação / risco / impacto |
| 08 | Despesas fixas | **Muda** | Virar passo "Vida essencial" com perguntas de risco |
| — | **Preocupação e estilo** | **Nova** | Passo 5 do onboarding (comportamental) |
| 09 | Dashboard / Home | **Muda muito** | Vira "Plano do mês" — tela mais importante do app |
| 10 | Lista de dívidas | Mantém | Adicionar selo de status (risco) e ordem por score |
| 11 | Resumo financeiro | **Muda** | Adicionar capacidade segura e folga real |
| 12, 12b | Histórico e gráficos | Mantém | Disponíveis no Premium |
| 13 | Plano de pagamento (timeline) | **Muda** | Vira "Plano completo" (visão de longo prazo), distinto de "Plano do mês" |
| 14 | Perfil | Mantém | Sem alteração |
| 15 | Detalhe da dívida (pós-onboarding) | **Muda** | Mostrar score, motivos, ação recomendada, validador de acordo |
| 16, 16b | Pagamento e comprovante | Mantém | Sem alteração |
| 17 | Nova receita | Mantém | Sem alteração |
| 18 | Nova despesa | **Muda** | Adicionar perguntas de classificação (essencial? trabalho? legal?) |
| 19 | Notificações | Mantém | Sem alteração |
| 20 | Segurança / biometria | Mantém | Sem alteração |
| 21 | Modo discreto | Mantém | Sem alteração |
| 22, 22b | Exportar dados (LGPD) | Mantém | Sem alteração |
| 23 | Situação crítica | **Muda** | Vira "Modo Crise" com plano de proteção, não só aviso |
| 25 | Modo Azul / Jornada | **Muda** | Adaptar conforme se foi quitação total ou estabilidade |
| — | **Modo Proteção** | **Nova** | Tela para superendividamento (encaminhamentos) |
| — | **Modo Sobrevivência** | **Nova** | Tela para insolvência (renda extra + benefícios) |
| — | **Validador de acordo** | **Nova** | Usuário cola proposta de acordo e o app valida |

### 8.1 Telas Premium (R$9,90/mês)

A monetização atual fica mantida. Pertencem ao Premium:
- Alertas de vencimento personalizados
- Validador de acordo (ilimitado; Free libera 1 por mês)
- Histórico de 12+ meses
- Gráficos avançados
- Chat com IA para esclarecimento contextual
- Sugestões de cortes detalhadas
- Exportação ilimitada

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

### 9.2 Tom por modo

- **Modo Quitação**: confiante, sóbrio, focado em progresso — "Mais perto."
- **Modo Estabilização**: prático, focado em vitórias pequenas — "Um passo por vez."
- **Modo Crise**: calmo, claro, sem urgência teatral — "Vamos por partes."
- **Modo Proteção**: acolhedor, factual, sem otimismo forçado — "Existem caminhos."
- **Modo Sobrevivência**: respeitoso, prioridade absoluta nas pessoas — "Primeiro você."

### 9.3 Frases-guia recorrentes

- Da home: "Esse é o plano para os próximos 30 dias."
- Do validador: "Esse acordo cabe / não cabe no seu mês."
- Do detector: "Você está [estado] — [explicação em 1 frase]."
- Da revisão: "Algumas coisas mudaram desde o mês passado. Atualizamos o plano."

### 9.4 Notificações

- Máximo 2-3 push por semana no Free; configurável no Premium
- Nunca fora da janela 9h-21h
- Nunca usar gatilho de medo
- Sempre fechar com uma ação clara

---

## 10. Fora do escopo desta refatoração

Para travar o que **não** entra:

- Open Finance / agregação bancária automática
- OCR de comprovantes
- Marketplace de propostas de acordo
- Cartão Quita ou produto financeiro próprio
- Indicação de empréstimo (consignado, fintech)
- Score de crédito ou consulta a bureau
- Chat assíncrono com humano (mentor real)
- Comunidade / fórum / comparação social
- Investimentos
- Versão para PJ

Tudo isso pode entrar em roadmap futuro, mas não conta para esta refatoração.

---

## 11. O que aproveitar do código atual

Análise do estado atual: monorepo NestJS 11 + Next.js 15 + Expo + Prisma 6 + Supabase, 12 tabelas, ~120 campos, 11 enums, ~45 endpoints, 25 telas mapeadas, módulos `auth`, `onboarding`, `financial`, `debts`, `dashboard`, `profile`.

### 11.1 Aproveitar como está (~60% do código)

- Monorepo, pnpm, biome, TypeScript strict
- Stack completa (NestJS, Next.js, Expo, Prisma, Supabase)
- `@quita/shared` (schemas Zod compartilhados)
- Módulos: `auth`, `profile`, `dashboard` (parte do contrato), `financial` (CRUDs básicos)
- Tabelas: `User`, `Payment`, `NotificationPreference`, `DataExport`, `UserJourneyStats`
- Telas: 01-04 (auth), 16/16b (pagamento), 17 (nova receita), 19-22 (configurações), 14 (perfil)
- Decisões: token em `localStorage` (com TODO de migrar para httpOnly cookie), modo discreto via `<Money>`, CORS habilitado

### 11.2 Estender (~25% do código)

**`User`** — adicionar:
- `dependents_count`
- `city`, `state`
- `behavior_profile` (jsonb: preferência avalanche/neve, principal preocupação, nível de motivação)

**`Income`** — adicionar:
- `payment_day` (dia do mês)
- `is_confirmed_recurring` (boolean)
- `confidence_level` (alto/médio/baixo, p/ renda variável)

**`Expense`** — adicionar:
- `is_essential` (boolean)
- `is_income_related` (boolean)
- `is_legal_obligation` (boolean)
- `can_reduce` (boolean)
- `can_cancel` (boolean)
- `consequence_if_unpaid` (enum: serviço cortado, perda de bem, processo, multa, nenhuma)

**`Debt`** — adicionar:
- `affects_survival` (boolean)
- `affects_income` (boolean)
- `has_legal_risk` (boolean)
- `has_collateral` (boolean) + `collateral_type` (enum)
- `is_negotiable` (boolean)
- `interest_rate_monthly` (decimal)
- `interest_rate_annual` (decimal)
- `interest_class` (alto/médio/baixo)
- `settlement_cash_amount` (decimal)
- `settlement_installments` (int)
- `settlement_installment_amount` (decimal)
- `settlement_deadline` (date)
- `stress_level` (1-3, declarado pelo usuário)
- `priority_score` (decimal, calculado)
- `priority_reason` (string, calculado)

**`PaymentPlan`** — repensar para suportar o motor:
- Substituir `is_critical` (boolean) por `financial_state` (enum dos 5 estados)
- Adicionar `mode` (enum dos 5 modos)
- Adicionar `safe_capacity` (decimal)
- Adicionar `monthly_actions` (jsonb com o payload da seção 7.10)

**Onboarding** — estender de 4 para 5 passos (módulo `apps/api/src/modules/onboarding/`).

**Telas listadas como "muda"** na seção 8 (apps/web/src/app/onboarding/* e app/*).

### 11.3 Refatorar (~10% do código)

- Módulo `dashboard`: renomear para `monthly-plan` e mudar contrato de resposta para o JSON da seção 7.10
- Módulo do plano atual: dividir em `priority-engine`, `strategy-selector`, `simulator`, `settlement-validator`, `monthly-plan-generator`, todos novos
- Tela 09 (Home web e mobile): reescrever a partir da spec do "Plano do mês"
- Tela 13 (Timeline): reescrever em torno da nova lógica de simulador
- Tela 23 (Situação crítica): vira tela do Modo Crise completo

### 11.4 Descartar (~5% do código)

- Lógica antiga de seleção de estratégia (só `smallest_first` vs `highest_interest`)
- Quaisquer cálculos de "saldo = receita - despesa" sem distinção de essencialidade

### 11.5 Novas tabelas a criar

- `debt_risk_attributes` — mapa de atributos de risco padrão por categoria de dívida (não muda por usuário)
- `regional_minimum_vital` — tabela de mínimo vital de referência por estado/região (alimentada na seed)
- `interest_rate_reference` — tabela de juros médios de mercado por tipo de dívida (atualizada periodicamente)

---

## 12. Próximos passos

Com a Fase 1 aprovada, próximas entregas, em ordem:

**Fase 2 — Modelagem de domínio e schema de banco** (próxima)
Diff do `schema.prisma`: campos novos, enums novos, tabelas novas, migrations. Definição de cada campo com tipo, default, regras de validação Zod no `@quita/shared`.

**Fase 3 — Motor de decisão**
Especificação funcional de cada um dos 8 módulos: contratos TypeScript de input/output, regras de classificação, tabelas de referência, pseudocódigo detalhado para `financial-state-detector` e `priority-engine`.

**Fase 4 — Arquitetura técnica**
Onde cada módulo se encaixa no NestJS, jobs assíncronos (BullMQ), cache, eventos de recálculo, estratégia de testes.

**Fase 5 — Fluxo de telas e onboarding inteligente (web first)**
Wireframes em texto + estrutura de cada nova tela no `apps/web`. Como pedir as informações pesadas de forma leve. Estados de loading e erro.

**Fase 6 — Plano de migração**
Ordem de migração, riscos, como preservar dados de testers existentes. Plano específico para o repositório atual.

### Decisões pendentes para destravar a Fase 2

1. **Confirmar a Fase 1** ou ajustar pontos antes de avançar
2. **Tabela de mínimo vital por cidade/região**: fonte do IBGE (regiões) ou DIEESE (cesta básica regional)?
3. **Juros médios de referência**: usar série temporal pública do Banco Central? Atualização mensal automática via job?
4. **Validador de acordo**: como o usuário "cola" a proposta? Foto + OCR (Premium)? Formulário simples? Ambos?
5. **Encaminhamento responsável**: criar lista inicial de canais (Procon de cada estado, Defensorias) ou começar com texto genérico e link para consumidor.gov.br?

---

*Fim do documento da Fase 1.*
