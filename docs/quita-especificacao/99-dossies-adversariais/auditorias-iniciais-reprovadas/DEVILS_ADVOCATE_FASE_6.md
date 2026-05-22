# Devils Advocate — Auditoria da Fase 6

> **Modo:** Estratégia
> **Escopo auditado:** `FASE_6_PLANO_DE_MIGRACAO.md` (1.037 linhas, 12 seções)
> **Data:** 17 de maio de 2026
> **Mantra:** *"Se não sobreviver ao meu interrogatório, não merece produção."*

---

## Veredito provisório

# 🔴 REPROVADO

A Fase 6 acerta o que importa mais: **inventário real do código atual** (não invenção), **estratégia clean migration** (correta para o estado sem usuários), **7 ondas com critérios de saída**, **kill switches por feature**, **3 cenários de custo**, **15 riscos tabulados**. Preservou decisões válidas do código existente (modo discreto, `resolveAuthRedirect`, design tokens) e marcou as que precisam refatorar (auth em localStorage, CORS aberto).

Mas tem **4 bloqueadores reais** que tornam o plano não-executável sem decisões adicionais:

1. **Não diz quem executa** — 16 semanas é otimista para 1 dev, conservador para 3. Sem isso, cronograma é chute.
2. **Política de Privacidade e Termos de Uso** mandatórios sem owner — quem escreve, quando, custo, advogado?
3. **Plano de suporte ao usuário** ausente — quem responde dúvidas dos testers? SLA? Canal?
4. **Plano de comunicação de launch** mencionado sem conteúdo — como anunciar? Para quem? O que dizer?

Mais 7 altos + 6 médios — incluindo configuração tributária Stripe BR (CNPJ?), log redaction LGPD, DPO designado, testes de isolamento multi-usuário.

Custo estimado de correção: **~4h** de patch v1.1.

---

## Resumo dos achados

| Severidade | Total |
|---|---|
| 🔴 Bloqueadores | **4** |
| 🟠 Altos | **7** |
| 🟡 Médios | **6** |

---

## Fase 1 — Radiografia

### 🔴 Bloqueadores (4)

---

#### BL-1 — Tamanho do time de execução não definido

**Sintoma.** A Fase 6 cita "16 semanas" para 7 ondas, mas **nunca menciona quantas pessoas executam**. §10.3 fala em "on-call rotation entre devs" mas não diz quantos devs. §1.1 menciona "team de 3 pessoas" indiretamente em uma linha hipotética. Sem isso:

- **Onda 2** (3 semanas para implementar 12 módulos do motor + 8 cenários canônicos como testes Vitest + jobs BullMQ) é otimista demais para dev solo. Para 2-3 devs é possível.
- **Onda 3** (3 semanas para 22 wireframes implementados + 8 esqueletos + LGPD endpoints + refinamento progressivo 7 fluxos) é apertado mesmo para 2-3 devs.
- **Onda 6** (15 testers × sessão de onboarding 30min = 7.5h + dia 7 check-in 15 × 15min = 3.75h + entrevistas dia 14 15 × 45min = 11.25h + análise = ~24h de "people work" em 2 semanas) requer dedicação significativa de 1 pessoa.

**Decisão necessária.** Quem executa? Quantos? Tempo dedicado por pessoa (full-time vs part-time)?

**Sugestão:**
- Dev solo full-time → cronograma vira ~24-30 semanas
- Dev solo part-time (20h/semana) → ~48-60 semanas
- 2 devs full-time → 16 semanas viável
- 3 devs (1 frontend + 1 backend + 1 generalista) → 12-14 semanas

**Custo de correção.** ~15min para Emerson decidir; patch ajusta cronograma.

---

#### BL-2 — Política de Privacidade e Termos de Uso sem owner

**Sintoma.** §9.1 (GO para beta) lista como mandatório:
- ✅ Política de Privacidade publicada
- ✅ Termos de Uso publicados

Mas em momento algum o plano define:
- **Quem escreve?** Advogado externo? Template adaptado? IA com revisão jurídica?
- **Quando?** Em qual onda? Antes do Onda 6 (beta) é o latest, mas pode levar semanas se for advogado.
- **Quanto custa?** Advogado especializado em LGPD: R$ 2.000-8.000. Template + revisão: R$ 500-1.500. Sozinho: R$ 0 mas com risco jurídico.
- **Versão draft já existe no Quita atual?** Não está claro.

**Impacto.** Sem isso, ConsentLog não pode ser preenchido com versão real. Beta não pode rodar. Launch público não rola.

**Decisão necessária.**

| Opção | Custo | Tempo | Risco |
|---|---|---|---|
| Advogado especializado LGPD | R$ 3-8k | 2-4 semanas | Mínimo |
| Template (e.g., Iubenda, TermsFeed) + revisão jurídica | R$ 500-2k | 1-2 semanas | Baixo |
| Template apenas | R$ 100-500 | 2-3 dias | Médio (risco jurídico) |
| Escrever sozinho com base em referências | R$ 0 | 1 semana | Alto |

**Sugestão.** Template profissional (Iubenda) + revisão por advogado pontual. Disparar **na Onda 1** para chegar pronto na Onda 5/6.

**Custo de correção.** ~15min para decisão + adicionar ao plano.

---

#### BL-3 — Plano de suporte ao usuário ausente

**Sintoma.** §11.2 menciona "Suporte ao usuário definido (email de contato + tempo de resposta SLA)" como critério de GO público. Mas **o plano nunca define o suporte**:

- Canal: email? Chat in-app? Intercom? WhatsApp Business?
- SLA: 24h? 48h? Apenas business hours?
- Quem responde? Emerson? Time?
- Triage: como classificar urgência?
- Escalação: bug crítico vai pra onde?
- **Beta também precisa de suporte** — testers vão ter dúvidas, problemas, sugestões. Onde mandar?

§5 Onda 6 menciona "Canal de feedback direto (Slack ou WhatsApp privado)" sem decisão final.

**Impacto direto.** Tester com problema durante beta sem canal claro = experiência ruim = NPS baixo = launch adiado.

**Decisão necessária.**

**Sugestão para o MVP:**
- **Beta (Onda 6):** WhatsApp Business individual com Emerson + Slack interno entre devs
- **Launch público (Onda 7):** email `suporte@quita.com.br` + formulário no app + SLA primeira resposta em 48h business days
- **Bugs críticos:** canal direto via PostHog session recording + Sentry

**Custo de correção.** ~30min para spec.

---

#### BL-4 — Plano de comunicação de launch ausente

**Sintoma.** §5 Onda 7 menciona "Plano de comunicação (anúncio interno → primeiros usuários convidados → ampliação gradual)" mas **não contém o plano**:

- Quem é o "público interno"? Como se anuncia?
- "100 usuários convidados" — convida de **onde**? Lista de email? Rede pessoal? Anúncio em comunidade?
- O que se diz no anúncio? Tagline final do app definida?
- Página de landing existe? Há LP separada de marketing?
- Mídia paga ou só orgânico?
- Comunidades-alvo (Facebook, Reddit BR de finanças pessoais, fóruns de superendividados)?

**Impacto.** §11.2 (custos) assume break-even em ~100 Premium. Sem plano de aquisição, conversão é zero — independente de quão bom é o produto.

**Decisão necessária.**

**Sugestão de plano mínimo:**
- Pré-launch: LP simples (uma página) em `quita.com.br` com formulário de waitlist
- Captura waitlist durante toda a Onda 1-6 (passivo)
- Convite via email para 100 primeiros da waitlist
- Comunidades-alvo: r/financaspessoais (Reddit BR), grupos de Facebook de superendividados, indicação direta
- Sem mídia paga no MVP

**Custo de correção.** ~30min para spec.

---

### 🟠 Altos (7)

---

#### A-1 — Pré-mortem ausente

**Sintoma.** §7 tem 15 riscos tabulados com probabilidade × impacto × mitigação. Isso é bom, mas **pré-mortem é diferente**: "imagine que o launch FRACASSOU completamente. Por quê?".

Pré-mortem força a equipe a pensar em modos de falha sistêmicos, não risks isolados.

**Solução proposta.** Adicionar §7.1 com pré-mortem estruturado:

> **Cenário:** Estamos em outubro de 2026. O Quita lançou há 3 meses e está sendo descontinuado. Por quê?

Top 5 razões candidatas:
1. **Tom adequado mas produto irrelevante** — usuários endividados não usam app de organização, usam Procon/Defensoria diretamente
2. **PMF parcial mas churn altíssimo** — usuário descobre o estado e vai embora (uma visita só)
3. **Custos de OCR ultrapassaram receita** — abuso de quota Premium drenou margem
4. **Incidente LGPD inicial** — vazamento de dado financeiro causou penalidade e perda de confiança
5. **Bug no motor causou recomendação catastrófica** (sugeriu pagar dívida quando deveria sobrevivência) — caso documentado viraliza

**Mitigações pré-existentes ou novas para cada um:**
- Para (1): beta privado valida. Se nenhum tester volta, é sinal claro
- Para (2): instrumentar voltas espontâneas (Fase 5 §11.3) já está
- Para (3): cap de uso Premium implementado (5 OCRs/mês)
- Para (4): backup + auditoria + DPO designado
- Para (5): testes Vitest cobrindo 8 cenários canônicos + monitoramento de distribuição de estados detectados

**Custo de correção.** ~30min.

---

#### A-2 — Configuração tributária Stripe Brasil

**Sintoma.** §11.1 lista Stripe como provider de pagamento mas **não menciona CNPJ**. Stripe Brasil requer:
- CNPJ ativo
- Conta bancária empresarial brasileira (PJ)
- Endereço fiscal
- Categorização da empresa (MEI? LTDA? SaaS?)
- Configuração de notas fiscais (geralmente integração com plataformas como Nota Fiscal Eletrônica)

Sem isso, Stripe não habilita Live mode. Apenas sandbox.

**Solução proposta.** Adicionar à §12.1 (Imediato — semana 0):
- Definir entidade jurídica (CNPJ MEI? LTDA?)
- Abertura de conta PJ se necessário
- Setup de emissão de NFe ou contratação de serviço (Conta Azul, Migo, Tinybird, etc.)
- Configuração da Stripe Live mode + revisão de compliance

**Tempo estimado:** 2-4 semanas se ainda não existir CNPJ. Pode bloquear Onda 4 (Stripe) se não começar cedo.

**Custo de correção.** ~20min para spec + decisão de quem cuida disso.

---

#### A-3 — Log redaction policy (Sentry + pino) ausente

**Sintoma.** §2.6 menciona "Logs estruturados com pino" e "Sentry para erros". Mas sem **política de redaction**:

- pino loga input/output de endpoints — pode capturar senha, CPF, valor de dívidas, etc.
- Sentry captura stack traces — pode incluir variáveis com PII
- LGPD art. 46 exige que medidas técnicas previnam acesso não autorizado a dados pessoais — logs incluem dados pessoais

**Solução proposta.**

```typescript
// pino redact config
const logger = pino({
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'req.body.cardNumber',
      'req.body.cvv',
      'res.body.refreshToken',
      'res.body.accessToken',
    ],
    censor: '[REDACTED]',
  },
});

// Sentry beforeSend hook
Sentry.init({
  beforeSend(event) {
    if (event.request?.cookies) delete event.request.cookies;
    if (event.request?.headers?.authorization) {
      event.request.headers.authorization = '[REDACTED]';
    }
    return event;
  },
});
```

Adicionar à Onda 1 como entregável.

**Custo de correção.** ~20min para spec.

---

#### A-4 — Testes de isolamento multi-usuário no Playwright

**Sintoma.** §5 Onda 3 lista 5 fluxos Playwright. Nenhum testa **isolamento entre usuários** (usuário A não vê dados de usuário B).

Em apps financeiros, este é o pior bug imaginável. Bug de query sem filtro `WHERE userId = ?` pode vazar dados de todos.

**Solução proposta.** Adicionar 6º fluxo:
6. **Isolamento de dados:** criar usuário A (cadastrar dívida X), criar usuário B (login), tentar acessar dívida X via URL direta → deve falhar com 403.

Aplicável a:
- `/dividas/[debtId]`
- `/dividas/[debtId]/pagar`
- `/avaliar-acordo/[evaluationId]`
- Endpoints de exportação
- Endpoints de cancelamento Premium

**Custo de correção.** ~15min para adicionar ao plano.

---

#### A-5 — DPO designado + canal LGPD

**Sintoma.** §9.2 menciona "DPO designado para responder a requisições LGPD". Mas:
- **Quem é o DPO?** Emerson? Outra pessoa? Empresa terceirizada (DPO as a Service)?
- **Custo?** DPOaaS varia R$ 500-3.000/mês
- **Canal de contato?** Email `dpo@quita.com.br`? Form no site?
- **SLA de resposta?** LGPD exige resposta em até 15 dias para titular

**Solução proposta.**

Para MVP: Emerson assume papel de DPO (válido se for o controlador). Criar `encarregado@quita.com.br` (termo legal preferível a "dpo"). SLA documentado em 15 dias úteis. Listar no rodapé do site + Política de Privacidade.

Pós-MVP: contratar DPO terceirizado se volume crescer.

**Custo de correção.** ~15min.

---

#### A-6 — "Esqueci minha senha" sem onda definida

**Sintoma.** §1.7 menciona que `/forgot-password` no código atual tem "banner Em desenvolvimento — backend ainda não tem endpoints". Mas a Fase 6 **não atribui** a implementação a nenhuma onda específica.

A funcionalidade é crítica para usuários reais (10-20% esquecem a senha eventualmente). Beta sem isso = tester preso fora do app.

**Solução proposta.** Adicionar explicitamente à Onda 1 (auth refatorada):

```
Onda 1 entregas backend adicionais:
- POST /api/v1/auth/forgot-password (envia email com token de reset)
- POST /api/v1/auth/reset-password (verifica token, atualiza senha)
- Email template de reset via Resend
- Tabela `password_reset_tokens` (ou usar `RefreshToken` com `tokenType: 'reset'`)
- Rate limiting forte: 3 tentativas/hora por email
```

**Custo de correção.** ~20min para spec.

---

#### A-7 — Onda 2 com 12 módulos em 3 semanas pode ser otimista

**Sintoma.** Onda 2 entrega:
- 12 módulos do motor
- 4 jobs BullMQ
- 1 listener `OnboardingCompletedListener`
- 3+ endpoints novos
- 8 cenários canônicos como testes Vitest
- Cobertura ≥ 85%

Em 3 semanas. Mesmo com pseudocódigo completo da Fase 3, tradução para código + testes + integração é estimadamente:
- 1-2 dias por módulo × 12 = ~20-30 dias (= 4-6 semanas para 1 dev full-time)
- Para 2 devs paralelo: ~3 semanas (apertado mas factível)
- Para 3 devs: 2 semanas

**Conclusão:** depende crucialmente de BL-1 (tamanho do time). Se for 1 dev solo, **Onda 2 vira 5-6 semanas** e cascateia atraso.

**Solução proposta.**

Reservar buffer dependendo do time. Adicionar nota:

> **Aviso de prazo.** Onda 2 assume team de 2-3 devs full-time. Para dev solo, multiplicar por 1.8x (cronograma total fica em ~24-26 semanas em vez de 16).

**Custo de correção.** ~10min depois de BL-1 resolvido.

---

### 🟡 Médios (6)

---

#### M-1 — Backup off-site retention não definida

§10.2 diz "Backup off-site: export semanal para S3 ou GCS" sem **quanto tempo guardar**. LGPD não exige período específico, mas a prática manda 12 meses. Definir.

---

#### M-2 — Mecanismo de pricing change

R$ 9,90/mês está hardcoded em vários lugares (telas, copy). Se for descoberto que o preço certo é R$ 14,90 ou R$ 7,90, como mudar?

**Sugestão:** centralizar em env var `PREMIUM_MONTHLY_PRICE_BRL`. Stripe price ID em outra var. Componentes de UI lêem de API endpoint `/config/pricing`. Refactor pequeno antes do launch.

---

#### M-3 — Cobertura de testes além do motor

§2.4 alvo 85% para o motor. E o resto? Sugestão:
- Backend (módulos não-motor): 70%
- Frontend (componentes críticos): 60%
- E2E (Playwright): 5-7 fluxos críticos cobertos

Adicionar tabela de alvos.

---

#### M-4 — Tracker de bugs e issues não definido

GitHub Issues? Linear? Notion? Jira? Cada tem custo e fluxo diferente. Para MVP, GitHub Issues é grátis e integra com PRs. Decidir.

---

#### M-5 — PostHog session recording masking

§1.1 menciona PostHog. Session recording captura tudo na tela. Para LGPD, **mascarar campos sensíveis** é obrigatório:

```typescript
posthog.init('YOUR_API_KEY', {
  session_recording: {
    maskAllInputs: true,
    maskTextSelector: '[data-sensitive], .money-value',
  },
});
```

Componente `<Money>` ganha `data-sensitive`. Inputs de valores monetários idem.

---

#### M-6 — Decimal.js bug — plano de mitigação

§12 lista decimal.js em backlog pós-MVP. Mas se durante o beta aparecer bug de precisão (R$ 280,00 + R$ 180,00 = R$ 460,000001), pode causar problemas em assertions.

**Sugestão:** Vitest configurar matchers com tolerância (`expect(x).toBeCloseTo(y, 2)` para 2 casas decimais). Documentar como temp workaround até decimal.js entrar.

---

## Fase 5 — Interrogatório

13 perguntas. **3 são decisões @business/@product que dependem de Emerson**; **10 técnicas eu (@claude-arquiteto) decido**.

---

**P1 @business** (BL-1)
**Quantos devs vão executar este plano?**
- 1 dev solo full-time
- 1 dev solo part-time (~20h/semana)
- 2 devs full-time
- 3 devs full-time
- Outro

Resposta determina se 16 semanas é viável ou se cronograma vira ~24-30 semanas.

---

**P2 @business + @legal** (BL-2)
**Como tratar Política de Privacidade e Termos de Uso?**
- Advogado especializado LGPD (R$ 3-8k, 2-4 semanas)
- Template profissional (Iubenda) + revisão pontual (R$ 500-2k, 1-2 semanas)
- Template apenas (R$ 100-500, alto risco jurídico)
- Já tenho draft pronto

Recomendação técnica: **Template Iubenda + revisão pontual**. Disparar na semana 0.

---

**P3 @claude-arquiteto + @business** (BL-3)
**Plano de suporte ao usuário no MVP:**
- Beta (Onda 6): WhatsApp Business individual + Slack interno
- Launch público: `suporte@quita.com.br` + form in-app + SLA 48h business days

Confirma?

---

**P4 @business** (BL-4)
**Plano de comunicação mínimo:**
- LP simples em `quita.com.br` com waitlist (captura passiva durante Ondas 1-6)
- Convite por email para 100 primeiros da waitlist na Onda 7
- Divulgação em comunidades-alvo (r/financaspessoais, grupos Facebook superendividados)
- Sem mídia paga no MVP

Confirma ou tem outra estratégia?

---

**P5 @claude-arquiteto** (A-1)
Adiciono §7.1 com **pré-mortem estruturado** (5 cenários candidatos de falha + mitigação)?

---

**P6 @business** (A-2)
**CNPJ para Stripe Brasil:**
- Já tenho CNPJ ativo (MEI ou LTDA)
- Preciso abrir CNPJ
- Vou operar via PF inicialmente (limitações Stripe)

Resposta determina se Onda 4 precisa de buffer adicional.

---

**P7 @claude-arquiteto** (A-3, A-4, A-6, A-7)
Adiciono ao patch:
- A-3: política de redact (pino + Sentry)
- A-4: 6º fluxo Playwright (isolamento de dados)
- A-6: forgot/reset password na Onda 1
- A-7: aviso de prazo dependente de team size

Confirma?

---

**P8 @business + @legal** (A-5)
**DPO:** Emerson assume papel inicial; canal `encarregado@quita.com.br`; SLA 15 dias úteis. OK?

---

**P9 @claude-arquiteto** (M-1)
Backup off-site retention: **12 meses**. Confirma?

---

**P10 @claude-arquiteto** (M-2)
Centralizar preço Premium em env var + endpoint `/config/pricing`. Confirma?

---

**P11 @claude-arquiteto** (M-3)
Alvos de cobertura:
- Motor: 85%
- Backend não-motor: 70%
- Frontend componentes críticos: 60%
- E2E Playwright: 6 fluxos críticos

Confirma?

---

**P12 @claude-arquiteto** (M-4)
**Tracker de bugs:** GitHub Issues integrado a PRs (grátis, suficiente para MVP). Confirma?

---

**P13 @claude-arquiteto** (M-5, M-6)
- M-5: PostHog session_recording com `maskAllInputs: true` + `data-sensitive` em componentes monetários
- M-6: Vitest com `toBeCloseTo(2)` até decimal.js entrar

Confirma?

---

## Fase 7 — Critérios para APROVADO

| # | Critério | Status |
|---|---|---|
| 1 | BL-1: tamanho do time definido | ❌ |
| 2 | BL-2: ownership de PoP/ToU definido | ❌ |
| 3 | BL-3: plano de suporte ao usuário definido | ❌ |
| 4 | BL-4: plano de comunicação definido | ❌ |
| 5 | 7 altos endereçados em patch | ❌ |
| 6 | 6 médios com decisão | ❌ |

---

## Comparativo das 11 auditorias

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
| **Fase 6 v1** | **4** | **7** | **6** | 🔴 |

Padrão **idêntico** aos das fases anteriores: 4 bloqueadores no primeiro pass. O plano de migração não escapou.

---

## Comentário final

A Fase 6 acertou onde devia: leu o código atual em vez de inventar, preservou o que existia de bom, marcou o que estava errado (auth em localStorage, CORS aberto, ausência de testes), traçou ondas com critérios objetivos, embutiu kill switches, calculou custos em 3 cenários. Esses são acertos genuínos.

Mas escorregou em **decisões fora do código**: quem executa, quem cuida do jurídico, como suportar usuários, como anunciar. Essas decisões são **menos técnicas** mas **mais bloqueantes** — sem elas, o cronograma é fantasia.

Os 4 bloqueadores são decisões que **só @business pode tomar** (3 deles) ou @business + @legal (PoP/ToU). @claude-arquiteto resolve os altos técnicos (A-3, A-4, A-6, A-7) e todos os médios.

Custo de correção: **~4h** para patch v1.1.

Depois disso, o Quita está pronto para **começar a ser construído**.

*Fim do dossiê. Aguardando ciclo adversarial.*
