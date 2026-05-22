# Devils Advocate — Auditoria da Fase 5

> **Modo:** Estratégia
> **Escopo auditado:** `FASE_5_TELAS_WEB.md` (1.789 linhas, 14 seções)
> **Data:** 17 de maio de 2026
> **Mantra:** *"Se não sobreviver ao meu interrogatório, não merece produção."*

---

## Veredito provisório

# 🔴 REPROVADO

A Fase 5 cobre bem **princípios de UX, stack, sistema de design, tom de voz, OCR, plano de beta privado, e resolve TODAS as 11 NMs pendentes**. Mas tem **4 bloqueadores de cobertura** + 6 altos + 5 médios.

O padrão de furo aqui é diferente das anteriores: não é falha de pseudocódigo, é **cobertura incompleta**. Várias telas críticas para o fluxo do usuário foram mencionadas no inventário mas **não têm wireframe**. O fluxo de **upgrade Premium (checkout/pagamento)** está totalmente ausente. Estratégia de **notificações** não foi decidida.

Custo estimado de correção: **~5h** para o patch v1.1.

---

## Resumo dos achados

| Severidade | Total |
|---|---|
| 🔴 Bloqueadores | **4** |
| 🟠 Altos | **6** |
| 🟡 Médios | **5** |

---

## Fase 1 — Radiografia

### 🔴 Bloqueadores (4)

---

#### BL-1 — Wireframes de telas críticas ausentes

O §3 (estrutura de pastas) lista ~30 rotas. O §6 desenha wireframes para apenas **13-14**. Telas críticas faltantes:

| Tela | Rota | Por que crítica |
|---|---|---|
| Login | `/login` | Toda sessão começa aqui — primeira impressão |
| Registro | `/register` | Captura de novo usuário |
| Esqueci a senha | `/forgot-password` | Recuperação — UX sensível |
| Reset de senha | `/reset-password` | Fluxo de segurança |
| Detalhe da dívida | `/dividas/[debtId]` | Tela com priority score, ações, histórico — central do produto |
| Registrar pagamento | `/dividas/[debtId]/pagar` | Ação mais frequente no app |
| Histórico de pagamentos | parte do detalhe | Confiança/auditoria pro usuário |
| Lista de dívidas | `/dividas` | Navegação principal |
| Plano de longo prazo | `/plano-longo-prazo` | Tela 13 da Fase 1, vendida como diferencial |
| Configurações index | `/configuracoes` | Hub de navegação |
| Exportar meus dados | `/configuracoes/exportar-dados` | LGPD — fluxo obrigatório |
| Excluir minha conta | `/configuracoes/excluir-conta` | LGPD — fluxo crítico de confirmação |
| Plano (Free/Premium) | `/configuracoes/plano` | Upgrade Premium — receita do produto |
| Refinamentos C2-C7 | `/refinar/[tipo]` | Núcleo do refinamento progressivo |

**Decisão.** Cobertura parcial é aceitável em uma primeira passada **se houver inventário declarado de "patch posterior"**. Não tem. Implementador chega à Fase 5 e adivinha.

**Custo de correção.** ~2h: wireframes ASCII para as 14 telas listadas (15-30 linhas cada).

---

#### BL-2 — Fluxo de pagamento Premium ausente

§6.10 (E1.4) mostra modal "Premium only" com botão **"Conhecer Premium"**. Clica → vai para `/configuracoes/plano`. Mas:

- Como é a tela `/configuracoes/plano`?
- Onde fica o botão de upgrade?
- **Como o usuário paga?** Stripe? Pagar.me? PIX? Boleto? Cartão de crédito?
- Webhook de confirmação de pagamento atualiza `User.planType` quando?
- O que acontece se o pagamento falha?
- Renovação automática? Trial period? Cancelamento?

Nada disso está especificado. **A receita do MVP depende desse fluxo.**

**Decisão necessária.**

Sugestão técnica: **Stripe Checkout + webhook**.
- Stripe Checkout é página hospedada (PCI-compliant out of the box)
- Webhook `/api/v1/webhooks/stripe` atualiza `User.planType` quando `checkout.session.completed`
- Customer Portal do Stripe para cancelamento (sem precisar implementar)
- Suporta PIX no Brasil + cartão

Schema novo:
```prisma
model Subscription {
  id                 String   @id @default(uuid()) @db.Uuid
  userId             String   @unique @map("user_id") @db.Uuid
  stripeCustomerId   String   @unique @map("stripe_customer_id")
  stripeSubscriptionId String? @unique @map("stripe_subscription_id")
  status             String   // active, past_due, canceled
  currentPeriodEnd   DateTime @map("current_period_end")
  cancelAtPeriodEnd  Boolean  @default(false) @map("cancel_at_period_end")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Migration 17** + endpoint webhook + módulo `subscription` no NestJS.

**Custo de correção.** ~1.5h para spec (sem implementação): provider escolhido, schema, fluxo de upgrade/cancel, webhook, tela `/configuracoes/plano`.

---

#### BL-3 — Estratégia de notificações ausente

A tabela `NotificationPreference` existe no schema (Fase 2). Há um listener `OnboardingCompletedListener` que enfileira jobs. Mas:

- **Como o usuário recebe notificação?**
  - Push web (Notification API + Service Worker)?
  - Email transacional (SendGrid/Resend/AWS SES)?
  - In-app (centro de notificações na navbar)?
  - SMS? (improvável mas vale dizer não)
- Quem dispara cada tipo?
  - Lembrete de pagamento (3 dias antes do vencimento) — quem?
  - "Acordo expirou" — quem?
  - "Plano do mês atualizado" — quem?
- O backend mencionado nas fases anteriores NÃO TEM provider de notificação.

**Lacuna real.** Sem isso, o usuário precisa abrir o app espontaneamente. Hipótese de retenção do beta (3 voltas em 30 dias) fica comprometida.

**Decisão necessária para MVP:**

Sugestão técnica conservadora:
- **In-app** (centro de notificações na navbar) — barato, suficiente para começar
- **Email transacional** via Resend (free tier 100/dia) — para lembretes de vencimento e plano novo do mês

**Push web:** registrar como pós-MVP. Requer Service Worker, VAPID keys, permissão do usuário.

**SMS:** **NÃO** no MVP. Caro + perigoso (usuário endividado recebe SMS = associação com cobrador).

**Schema.** Adicionar `Notification` table:

```prisma
model Notification {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  type      String   @db.VarChar(50) // payment_reminder, plan_updated, settlement_expiring, etc
  title     String   @db.VarChar(200)
  body      String?  @db.Text
  data      Json?
  readAt    DateTime? @map("read_at")
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, readAt, createdAt])
}
```

**Migration 18.**

**Custo de correção.** ~1h spec.

---

#### BL-4 — Header / navegação principal não desenhada

§3 menciona `(app)/layout.tsx` como "nav lateral + topbar". Mas não há wireframe de **como é essa navegação**:

- Mobile: drawer? bottom nav? hamburger menu?
- Desktop: sidebar fixa? topbar?
- Quais itens estão no menu?
- Como acessa configurações?
- Como acessa centro de notificações?
- Como acessa "modo crise" ou "canais de apoio"?

**Impacto.** Toda navegação do app depende disso. Implementador adivinha = inconsistência.

**Sugestão estruturada:**

Mobile (375-768px):
```
┌─────────────────────────┐
│ Quita      🔔  Maria ▼ │ ← topbar fixa (logo + notif + menu user)
├─────────────────────────┤
│                         │
│ [conteúdo da tela]      │
│                         │
├─────────────────────────┤
│  🏠   💳   🎯   ⚙       │ ← bottom nav fixa
│ Home Dívidas Plano Conf │
└─────────────────────────┘
```

Desktop (≥1024px):
```
┌──────────────────────────────────────────────┐
│ Quita                            🔔  Maria ▼ │
├──────────┬───────────────────────────────────┤
│          │                                   │
│ 🏠 Home  │                                   │
│ 💳 Dív.  │     [conteúdo da tela]            │
│ 🎯 Plano │                                   │
│ 📊 Long. │                                   │
│ ⚙ Conf  │                                   │
│          │                                   │
└──────────┴───────────────────────────────────┘
```

**Custo de correção.** ~30min: wireframe + lista de itens.

---

### 🟠 Altos (6)

---

#### A-1 — Inventário completo de telas vs lista escolhida

§6 desenha 14 telas. §3 lista 30+ rotas. Falta documento dizendo:
- Quais telas têm wireframe pronto
- Quais telas o implementador segue padrão (sem wireframe específico)
- Quais telas precisam de design extra antes da implementação

**Solução.** Adicionar tabela no §6 antes dos wireframes:

| Status | Total | Telas |
|---|---|---|
| ✅ Wireframe completo | 14 | A1, A3.1, A3.4, A4, B1, B1.a, B1.b, D3, E1.1, E1.2, E1.3, E1.4, E2, C1, G3, G2, H2 |
| 🟡 Padrão (segue componentes documentados) | 8 | login, register, reset password, lista dívidas, perfil, plano (premium), exportar |
| 🔴 Precisa de wireframe | 6 | A1 completo, register, pagar dívida, detalhe dívida, longo prazo, excluir conta |

---

#### A-2 — i18n strategy ausente

§4.2 fala em "PT-BR" mas não define se o app é **bilíngue ou monolingual**. Implicações:

- Se monolingual PT-BR: strings hardcoded em PT-BR (mais simples; OK pra MVP)
- Se bilíngue: precisa de `next-intl`, arquivos `.json` por idioma, etc.

Para o MVP, **monolingual PT-BR é a escolha óbvia**. Mas precisa declarar.

**Patch:**

```markdown
### Política de internacionalização

MVP: monolingual PT-BR. Strings hardcoded em componentes.

Pós-MVP: introduzir `next-intl` ANTES de adicionar segundo idioma.
Tarefa em `BACKLOG_POS_MVP.md`.
```

---

#### A-3 — Transição entre estados financeiros (UX)

O motor pode mudar `financialState` (e portanto `operationMode`) entre interações do usuário. Cenário:

1. Usuário abre home, estado é `tight_budget`
2. Em outra aba, adiciona despesa grande
3. Motor recalcula no background
4. Usuário volta à home original — estado mudou para `monthly_deficit`

**Como a UI gerencia essa transição?**

- Atualiza silenciosamente?
- Mostra notificação "Seu estado mudou — recarregar"?
- Força reload?

**Solução proposta.**

```typescript
// hooks/use-current-state.ts
export function useCurrentState() {
  const previousState = useRef<FinancialState | null>(null);
  const { data: plan } = useMonthlyPlan();

  useEffect(() => {
    if (!plan) return;
    if (previousState.current && previousState.current !== plan.financialState) {
      // Mostrar toast informativo, NÃO bloqueante
      toast.info('Seu estado financeiro foi atualizado.', {
        action: { label: 'Ver detalhes', onClick: () => router.push('/') },
      });
    }
    previousState.current = plan.financialState;
  }, [plan?.financialState]);

  return plan?.financialState;
}
```

Toast informa **sem interromper**. Usuário não é forçado a recarregar.

---

#### A-4 — Despesas sazonais na UI

Fase 3 introduziu `seasonal-expense-service` (IPVA, IPTU). `monthlyProvision` aparece no breakdown da capacidade segura. Mas a Fase 5 **não mostra** essas despesas na UI:

- Onde o usuário vê suas despesas sazonais?
- Como o app avisa "IPVA chega em 60 dias"?
- A provisão mensal aparece destacada na home?

**Lacuna.** Cenário canônico Roberto (Fase 3 §18.4) testa especificamente isso — mas UI não acompanha.

**Solução.** Adicionar:
- Componente `<UpcomingSeasonalsList />` na home (banner discreto): "Vem aí: IPVA R$ 1.800 em 60 dias"
- Tela `/despesas-sazonais` com lista completa + edição
- Ação `review` gerada pelo motor para sazonais próximas (próximos 30 dias)

---

#### A-5 — Confirmação de exclusão de conta (G6)

Fluxo crítico LGPD. Não desenhado. Risco de implementador fazer "clicou → conta apagada" sem confirmação forte.

**Solução proposta.**

```
┌─────────────────────────────────────┐
│ ← Excluir minha conta               │
├─────────────────────────────────────┤
│                                     │
│ ⚠ Esta ação é irreversível.        │
│                                     │
│ Ao excluir sua conta:               │
│                                     │
│ • Todos os seus dados serão         │
│   apagados em até 30 dias           │
│ • Seu histórico de avaliações de    │
│   acordo (5 anos por exigência      │
│   legal) será anonimizado           │
│ • Você perderá acesso imediato      │
│                                     │
│ Antes de excluir, você pode:        │
│ → [Exportar meus dados]             │
│ → [Cancelar Premium]                │ ← se Premium ativo
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Para confirmar, digite seu email:   │
│ [_______________________]           │
│                                     │
│ Motivo (opcional):                  │
│ [textarea]                          │
│                                     │
│ [Cancelar]   [Excluir conta]        │
│              ↑ vermelho/danger      │
│                                     │
└─────────────────────────────────────┘
```

Após clicar "Excluir conta": modal final com countdown de 5s antes de habilitar o botão final. Email de confirmação enviado.

---

#### A-6 — Tela `/configuracoes/plano` (Free/Premium upgrade)

§6.10 (E1.4) tem modal mas a tela cheia de upgrade não foi desenhada. Tem que existir antes de qualquer implementação de Premium.

**Wireframe sugerido:**

```
┌─────────────────────────────────────┐
│ ← Plano                             │
├─────────────────────────────────────┤
│                                     │
│ Seu plano atual: Free               │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Free (atual)                        │
│ R$ 0/mês                            │
│ ✓ Espelho mensal                    │
│ ✓ Plano de ação                     │
│ ✓ Cadastro ilimitado de dívidas     │
│ ✓ 1 avaliação de acordo/mês         │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Premium                             │
│ R$ 9,90/mês                         │
│ Tudo do Free, mais:                 │
│ ✓ 5 OCRs de proposta/mês            │
│ ✓ Avaliações de acordo ilimitadas   │
│ ✓ Suporte prioritário               │
│                                     │
│ [Assinar Premium]                   │
│                                     │
│ Cancele quando quiser.              │
│ Sem fidelidade.                     │
│                                     │
└─────────────────────────────────────┘
```

Após "Assinar Premium": redireciona para Stripe Checkout. Retorno bem-sucedido → tela de boas-vindas Premium.

---

### 🟡 Médios (5)

---

#### M-1 — PWA strategy

Quita pode rodar como PWA (Progressive Web App) — instalável no mobile, offline parcial. Não mencionado.

Para MVP: **PWA mínimo** — manifest.json + ícones. Sem offline complexo. Pós-MVP: Service Worker com cache.

---

#### M-2 — Validação client-side: exemplo concreto

§2 menciona React Hook Form + Zod. Falta um exemplo de como a integração funciona:

```typescript
// components/onboarding/income-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { incomeInputSchema } from '@quita/shared';

export function IncomeForm() {
  const form = useForm({
    resolver: zodResolver(incomeInputSchema),
    defaultValues: { amount: 0, frequency: 'recurring' },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('amount', { valueAsNumber: true })} />
      {errors.amount && <p className="text-danger">{errors.amount.message}</p>}
    </form>
  );
}
```

Adicionar como template ao patch.

---

#### M-3 — `<CapacityBreakdown />` formato

Mencionado em vários lugares mas não detalhado. Modal? Drawer? Inline expansível?

Sugestão: **Drawer (Sheet)** que abre da direita em desktop, de baixo em mobile. Mostra tabela com:
- Renda líquida mensal
- (-) Essenciais
- (-) Provisão sazonal
- (-) Despesas protetivas de renda
- (-) Despesas legais
- (-) Reserva operacional 5%
- (-) Aporte para reserva de emergência
- = Capacidade segura

---

#### M-4 — Onboarding cidade — autocomplete?

Onboarding A3.2 pede "Cidade + dependentes". Como é o input da cidade?

- Texto livre? (problemático — variações de grafia)
- Autocomplete com lista IBGE?
- Apenas UF (estado)?

Para `RegionalMinimumVital` (Fase 3 §7), o motor só usa `stateCode`. Cidade exata talvez não importe para o MVP.

**Decisão sugerida.** Apenas UF (estado) no MVP. Lista de 27 estados. Simples. Pós-MVP: autocomplete de cidade IBGE para refinar regionType (capital/metro/interior).

---

#### M-5 — Modal scrolling em mobile

Modais longos (consentimento OCR §6.7) em telas pequenas precisam de scroll dentro do modal. Não foi tratado.

Solução padrão shadcn/ui: `max-h-[90vh] overflow-y-auto`. Vale registrar como convenção.

---

## Fase 5 — Interrogatório

8 perguntas. 6 técnicas @claude-arquiteto; 2 @product (decisões de negócio).

---

**P1 @claude-arquiteto** (BL-1, A-1)
Vou gerar wireframes ASCII para as 14 telas faltantes no patch v1.1? São ~15-30 linhas cada. Confirma?

---

**P2 @product + @claude-arquiteto** (BL-2)
**Stripe Checkout** para pagamento Premium? Suporta PIX + cartão no Brasil, PCI-compliant out of the box. Alternativas: Pagar.me, Iugu, Mercado Pago. Recomendação técnica: Stripe pela maturidade + DX. Confirma?

---

**P3 @product + @claude-arquiteto** (BL-3)
Estratégia de notificação no MVP: **in-app + email transacional (Resend)**, sem push web nem SMS. Push web fica pós-MVP. Confirma?

---

**P4 @claude-arquiteto** (BL-4)
Navegação: mobile com **bottom nav** (4 itens: Home, Dívidas, Plano longo prazo, Configurações) + topbar (logo + notif + user menu); desktop com sidebar fixa. Confirma?

---

**P5 @claude-arquiteto** (A-2, A-3, A-4, A-5, A-6)
Consolido os 5 altos no patch:
- A-2: monolingual PT-BR no MVP (tarefa pós-MVP para i18n)
- A-3: toast informativo de mudança de estado (sem reload forçado)
- A-4: componente `<UpcomingSeasonalsList />` + tela `/despesas-sazonais`
- A-5: wireframe completo de `/configuracoes/excluir-conta`
- A-6: wireframe completo de `/configuracoes/plano`

Confirma?

---

**P6 @claude-arquiteto** (M-1 a M-5)
Os 5 médios viram itens menores no patch ou backlog:
- M-1: PWA mínimo (manifest + ícones) no MVP; Service Worker pós-MVP
- M-2: exemplo de form com RHF + Zod no patch
- M-3: `<CapacityBreakdown />` como Drawer
- M-4: input UF apenas no MVP (autocomplete cidade pós-MVP)
- M-5: convenção de scroll em modais (`max-h-[90vh] overflow-y-auto`)

Confirma?

---

**P7 @product** (consulta — schemas novos)

O patch vai adicionar **2 tabelas + 2 migrations**:
- `Subscription` (Stripe) — Migration 17
- `Notification` (in-app) — Migration 18

Total acumulado: **18 migrations** (era 16 após NM-6).

OK?

---

**P8 @product** (consulta — Stripe Customer Portal)

Stripe Customer Portal permite usuário gerenciar assinatura (cancelar, ver fatura) sem você implementar UI. Adotar?

---

## Fase 7 — Critérios para APROVADO

| # | Critério | Status |
|---|---|---|
| 1 | BL-1: wireframes das 14 telas faltantes | ❌ |
| 2 | BL-2: fluxo de pagamento Premium especificado (provider, schema, fluxo) | ❌ |
| 3 | BL-3: estratégia de notificação MVP definida | ❌ |
| 4 | BL-4: navegação principal desenhada | ❌ |
| 5 | 6 altos endereçados em patch v1.1 | ❌ |
| 6 | 5 médios com decisão de tratamento | ❌ |

---

## Comparativo das 8 auditorias

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
| **Fase 5 v1** | **4** | **6** | **5** | 🔴 |

Padrão consistente: documento monolítico → ~4 bloqueadores → patch v1.1 → APROVADO.

---

## Comentário final

A Fase 5 fez **dois movimentos certos** que merecem nota:

1. **Resolveu as 11 NMs pendentes** das fases anteriores. Não empurrou para depois — endereçou no documento.
2. **Estabeleceu tom de voz e identidade visual sóbria** que diferencia o Quita de fintechs ostentativas. Decisão de marca, não só de UX.

Mas escorregou em **cobertura**. Cobriu as telas mais sensíveis (Espelho, OCR, modo sobrevivência, refinamento) e deixou de fora telas estruturais que toda implementação precisa (login, registro, navegação, upgrade Premium, pagamento). E **pulou estratégia de notificação completamente** — sem isso, hipótese de retenção do beta cai.

Os 4 bloqueadores são **lacunas de spec**, não erros conceituais. Patch v1.1 resolve em ~5h:
- 2h: 14 wireframes
- 1.5h: spec do Stripe Checkout + tela de plano + schema Subscription
- 1h: estratégia de notificação + schema Notification
- 30min: navegação

Depois disso, Quita está pronto para a Fase 6 — plano de migração do código atual.

*Fim do dossiê. Aguardando ciclo adversarial.*
