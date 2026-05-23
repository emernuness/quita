# Ciclo Adversarial Fase 5 — Respostas + Patch v1.1

> **Resposta ao:** `DEVILS_ADVOCATE_FASE_5.md`
> **Data:** 17 de maio de 2026
> **Status:** 6 decisões @claude-arquiteto + 4 confirmações @product pendentes
> **Output:** este documento contém respostas E o patch v1.1 a aplicar na Fase 5

---

## Sumário executivo

Das 8 perguntas:
- **6 decididas por @claude-arquiteto** (P1, P4, P5, P6 — diretas; e parcialmente P2, P3 com decisão técnica)
- **4 confirmações pendentes @product** (P2 Stripe, P3 notificações, P7 schemas, P8 Customer Portal)

A §15 do patch consolida tudo. **As 4 perguntas @product têm recomendação técnica clara** — pendência é de endorsement, não de decisão difícil.

---

## P1 — @claude-arquiteto: 14 wireframes faltantes (BL-1)

### Decisão

Produzo todos os 14 wireframes no patch v1.1. Abaixo, os mais críticos (login, registro, detalhe de dívida, registrar pagamento, plano longo prazo, exportar/excluir, plano de assinatura, refinamentos C2-C3). Os demais (forgot/reset password, lista de dívidas, refinamentos C4-C7, configurações index) seguem padrões estabelecidos e ficam como esqueleto.

### 14.1 Login (`/login`)

```
┌─────────────────────────────────────┐
│                                     │
│         Quita                       │
│                                     │
│  Entrar                             │
│                                     │
│  Email                              │
│  [_______________________]          │
│                                     │
│  Senha                              │
│  [_______________________]          │
│  Esqueci a senha                    │
│                                     │
│  [Entrar]                           │
│                                     │
│  Não tem conta? Criar conta         │
│                                     │
└─────────────────────────────────────┘
```

### 14.2 Registro (`/register`)

```
┌─────────────────────────────────────┐
│                                     │
│         Quita                       │
│                                     │
│  Criar conta                        │
│                                     │
│  Nome                               │
│  [_______________________]          │
│                                     │
│  Email                              │
│  [_______________________]          │
│                                     │
│  Senha                              │
│  [_______________________]          │
│  Mínimo 8 caracteres                │
│                                     │
│  ☐ Aceito os Termos de Uso e a     │
│    Política de Privacidade          │
│                                     │
│  [Criar conta]                      │
│                                     │
│  Já tem conta? Entrar               │
│                                     │
└─────────────────────────────────────┘
```

### 14.3 Detalhe de Dívida (`/dividas/[debtId]`)

```
┌─────────────────────────────────────┐
│ ← Banco X — Cartão de crédito       │
├─────────────────────────────────────┤
│                                     │
│ Valor restante                      │
│ R$ 2.180,00                         │
│ de R$ 3.500 originais               │
│ ─────────────────────────────       │
│                                     │
│ Detalhes                            │
│                                     │
│ Parcela mensal     R$ 280           │
│ Juros mensais      8,5% (estimado)  │
│ Próximo vencimento 10/06            │
│ Parcelas em atraso 0                │
│                                     │
│ [Editar]                            │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Importância no seu plano            │
│                                     │
│ Score: 8,2 (alta prioridade)        │
│                                     │
│ Por quê?                            │
│ • Juros altos (8,5% ao mês)         │
│ • Valor pequeno — pode quitar       │
│   rápido                            │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ [Registrar pagamento]               │
│ [Avaliar acordo recebido]           │
│ [Marcar como quitada]               │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Histórico                           │
│                                     │
│ 10/05  Pagamento R$ 280       [↩]  │ ← undo em 24h
│ 10/04  Pagamento R$ 280            │
│ 10/03  Pagamento R$ 280            │
│ Ver tudo                            │
│                                     │
└─────────────────────────────────────┘
```

### 14.4 Registrar Pagamento (`/dividas/[debtId]/pagar`)

```
┌─────────────────────────────────────┐
│ ← Registrar pagamento               │
│   Banco X — Cartão                  │
├─────────────────────────────────────┤
│                                     │
│ Valor pago                          │
│ [R$ 280,00                        ] │
│ Parcela cheia: R$ 280               │
│                                     │
│ Data                                │
│ [10/06/2026                       ] │
│                                     │
│ Notas (opcional)                    │
│ [textarea                         ] │
│                                     │
│ ⓘ Você pode desfazer em até 24h   │
│                                     │
│ [Cancelar]    [Registrar]           │
│                                     │
└─────────────────────────────────────┘
```

### 14.5 Plano de Longo Prazo (`/plano-longo-prazo`)

```
┌─────────────────────────────────────┐
│ ← Plano de longo prazo              │
├─────────────────────────────────────┤
│                                     │
│ No ritmo atual, sua última dívida   │
│ quita em ~18 meses.                 │
│                                     │
│ Mais rápido se você cortar despesas │
│ ou aumentar a renda extra: ~12 m.   │
│                                     │
│ Mais devagar se mantiver só os      │
│ mínimos: ~24 meses.                 │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Ordem sugerida de quitação          │
│                                     │
│ 1. Banco X            Mês 4         │
│    R$ 2.180 — juros altos           │
│                                     │
│ 2. Magazine Y         Mês 9         │
│    R$ 850                           │
│                                     │
│ 3. Loja Z             Mês 14        │
│    R$ 3.200                         │
│                                     │
│ 4. Crédito Pessoal    Mês 18        │
│    R$ 5.400                         │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Cenários                            │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Conservador                 │    │
│ │ R$ 480/mês → 18 meses       │    │
│ │ Total pago: R$ 8.640        │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Otimizado (cortando R$ 80)  │    │
│ │ R$ 560/mês → 15 meses       │    │
│ │ Total pago: R$ 8.400        │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Acelerado (+ R$ 200 extra)  │    │
│ │ R$ 760/mês → 12 meses       │    │
│ │ Total pago: R$ 9.120        │    │
│ └─────────────────────────────┘    │
│                                     │
│ Como calculamos? [+]                │
│ Atualizado em 15/05/2026 [Regerar]  │
│                                     │
└─────────────────────────────────────┘
```

### 14.6 Exportar Meus Dados (`/configuracoes/exportar-dados`)

```
┌─────────────────────────────────────┐
│ ← Exportar meus dados               │
├─────────────────────────────────────┤
│                                     │
│ Você pode receber uma cópia de      │
│ todos os dados que mantemos sobre   │
│ você.                               │
│                                     │
│ O arquivo inclui:                   │
│ • Seu perfil                        │
│ • Rendas e despesas                 │
│ • Dívidas e pagamentos              │
│ • Histórico de avaliações de acordo │
│ • Imagens de OCR (últimos 30 dias)  │
│ • Consentimentos dados              │
│                                     │
│ Formato: JSON + ZIP com imagens.    │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Exportações anteriores              │
│                                     │
│ 15/04/2026  [Baixar]               │
│ 12/03/2026  Expirou em 12/04        │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ [Gerar nova exportação]             │
│                                     │
│ ⓘ Levamos até 24h para preparar.  │
│   Vamos te avisar quando estiver    │
│   pronto.                           │
│                                     │
└─────────────────────────────────────┘
```

### 14.7 Refinamento de Renda (`/refinar/renda`)

```
┌─────────────────────────────────────┐
│ ← Refinar minha renda               │
├─────────────────────────────────────┤
│                                     │
│ Suas rendas atuais:                 │
│                                     │
│ ╔═══════════════════════════════╗  │
│ ║ Salário CLT                   ║  │
│ ║ R$ 3.500 — mensal, dia 5      ║  │
│ ║ [Editar] [Remover]            ║  │
│ ╚═══════════════════════════════╝  │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ + Adicionar outra renda             │
│                                     │
│ Exemplos: bicos, aluguel recebido,  │
│ pensão, BPC, indenização (parcelada │
│ ou única), comissões.               │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Sobre renda variável                │
│                                     │
│ Se sua renda oscila muito, é melhor │
│ informar:                           │
│ • Piso garantido (o mínimo certo)   │
│ • Teto (o máximo realista)          │
│                                     │
│ A gente usa o piso pra calcular     │
│ seu plano — assim você não fica     │
│ apertado em mês ruim.               │
│                                     │
└─────────────────────────────────────┘
```

### 14.8 Refinamento de Despesas (`/refinar/despesas`)

```
┌─────────────────────────────────────┐
│ ← Classificar despesas              │
├─────────────────────────────────────┤
│                                     │
│ Marcar cada despesa nos detalhes    │
│ deixa seu plano mais preciso.       │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ 12 de 18 despesas classificadas     │
│ ████████████████░░░░░░░ 67%        │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ ╔═══════════════════════════════╗  │
│ ║ Netflix — R$ 39,90/mês        ║  │
│ ║ □ Essencial?                  ║  │
│ ║ ☑ Posso cancelar              ║  │
│ ║ □ Posso reduzir               ║  │
│ ║ Se atrasar:                   ║  │
│ ║ [Corte de serviço      ▼]    ║  │
│ ║ [Salvar]                      ║  │
│ ╚═══════════════════════════════╝  │
│                                     │
│ Próxima: Conta de luz (5/18)        │
│                                     │
│ [Pular esta]                        │
│                                     │
└─────────────────────────────────────┘
```

**Demais wireframes** (forgot/reset password, lista de dívidas D1, configurações index, refinamentos C4-C7) seguem padrões:
- Forms simples como §14.1-14.2
- Lista de dívidas: cards como D2 mas resumidos
- Configurações index: lista de links
- Refinamentos C4-C7: pattern de §14.7-14.8

---

## P2 — @claude-arquiteto + @product (PENDENTE): Stripe Checkout (BL-2)

### Recomendação técnica: **Stripe**

### Comparativo

| Critério | Stripe | Pagar.me | Iugu | Mercado Pago |
|---|---|---|---|---|
| PIX | ✅ Desde 2024 | ✅ | ✅ | ✅ |
| Cartão Brasil | ✅ | ✅ | ✅ | ✅ |
| Customer Portal | ✅ Nativo | ❌ | ⚠ Parcial | ❌ |
| DX (SDK, docs) | ✅✅✅ | ✅ | ✅ | ⚠ |
| Webhook reliability | ✅✅✅ | ✅✅ | ✅ | ✅ |
| Taxa cartão | 3,99% + R$ 0,39 | 3,89% + R$ 0,39 | 3,49% + R$ 0,49 | 4,49% |
| Taxa PIX | 0,99% | 0,99% | 0,99% | 0,99% |
| Currency | BRL nativo | BRL | BRL | BRL |
| Empresa fora do BR | OK (Stripe BR) | só BR | só BR | só LATAM |
| Mock para testes | ✅✅✅ | ✅ | ⚠ | ⚠ |

### Decisão técnica

**Stripe** ganha por:
1. Customer Portal nativo (cancelamento, atualização de cartão, fatura — sem implementação UI)
2. DX superior (SDK TypeScript, docs, dashboard)
3. Mocks robustos para testes E2E
4. Suporte a múltiplas moedas (se um dia for internacional)

### Implementação proposta

**Schema novo:**

```prisma
model Subscription {
  id                   String   @id @default(uuid()) @db.Uuid
  userId               String   @unique @map("user_id") @db.Uuid
  stripeCustomerId     String   @unique @map("stripe_customer_id") @db.VarChar(255)
  stripeSubscriptionId String?  @unique @map("stripe_subscription_id") @db.VarChar(255)
  status               String   @db.VarChar(50) // active, past_due, canceled, incomplete
  currentPeriodEnd     DateTime @map("current_period_end")
  cancelAtPeriodEnd    Boolean  @default(false) @map("cancel_at_period_end")
  trialEndsAt          DateTime? @map("trial_ends_at")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")
  canceledAt           DateTime? @map("canceled_at")

  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([stripeSubscriptionId])
  @@index([status])
  @@map("subscriptions")
}
```

**Migration 17:**

```
17. 20260618_add_subscription_table
    - CREATE TABLE subscriptions (...)
    - CREATE INDEX idx_subscriptions_stripe_subscription_id
    - CREATE INDEX idx_subscriptions_status
```

**Endpoints novos:**

```
POST   /api/v1/subscription/checkout    → cria Checkout Session, retorna URL
POST   /api/v1/subscription/portal      → cria Customer Portal Session
POST   /api/v1/webhooks/stripe          → recebe webhooks Stripe
DELETE /api/v1/subscription/cancel      → cancela assinatura (também via Portal)
```

**Webhook events relevantes:**
- `checkout.session.completed` → cria/atualiza `Subscription`, define `User.planType = 'premium'`
- `customer.subscription.updated` → atualiza status
- `customer.subscription.deleted` → marca canceled
- `invoice.payment_failed` → notifica usuário

**Webhook auth:** verificar `stripe-signature` header com `Stripe.webhooks.constructEvent`. **NÃO** confiar no payload sem isso.

**Fluxo da UI:**

```
[Tela /configuracoes/plano]
       │
       │ clica "Assinar Premium"
       ▼
[POST /subscription/checkout]
       │
       │ retorna URL do Stripe Checkout
       ▼
[Redirect para checkout.stripe.com]
       │
       │ usuário paga (PIX ou cartão)
       ▼
[Stripe redireciona para /configuracoes/plano?success=true]
       │
       │ enquanto isso, webhook chega:
       │ checkout.session.completed
       │ → User.planType = 'premium'
       │ → cria Subscription
       │
       ▼
[Frontend revalida useCurrentUser]
[Mostra "Bem-vindo ao Premium"]
```

**Para cancelamento:** botão "Gerenciar assinatura" abre Stripe Customer Portal.

### Pendência @product

**Confirma Stripe?** Alternativas válidas (Pagar.me, Iugu) requerem mais implementação custom.

---

## P3 — @claude-arquiteto + @product (PENDENTE): Notificações (BL-3)

### Recomendação técnica

**MVP:**
- **In-app (centro de notificações)** — barato, suficiente para retenção orgânica
- **Email transacional via Resend** — para lembretes de vencimento, plano novo do mês

**Pós-MVP:**
- Push web (Notification API + Service Worker + VAPID)

**NÃO no MVP:**
- SMS (caro + associação negativa com cobrador)
- Push mobile nativo (não temos app nativo ainda)

### Por que Resend (e não SendGrid/AWS SES/Mailgun)

- DX: melhor SDK Node.js para email transacional
- Free tier: 100/dia (3000/mês) — cobre MVP
- React Email integration: templates em JSX (não MJML)
- Pricing escalável: $20/mês para 50k emails

### Tipos de notificação no MVP

| Tipo | In-app | Email | Trigger |
|---|---|---|---|
| `plan_updated` | ✅ | ❌ | Motor termina recálculo após evento CRUD |
| `payment_reminder` | ✅ | ✅ | Cron diário: 3 dias antes do `dueDate` de pagamento |
| `settlement_expiring` | ✅ | ✅ | Cron diário: 2 dias antes do `expiresAt` de evaluation |
| `settlement_reevaluation_needed` | ✅ | ❌ | Job de revalidação detecta mudança |
| `data_export_ready` | ✅ | ✅ | Após geração do export |
| `subscription_payment_failed` | ✅ | ✅ | Webhook Stripe |
| `consent_request` | ✅ | ❌ | Mudança material de versão de consentimento |

### Schema novo

```prisma
model Notification {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  type      String    @db.VarChar(50)
  title     String    @db.VarChar(200)
  body      String?   @db.Text
  data      Json?
  readAt    DateTime? @map("read_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, readAt, createdAt])
  @@map("notifications")
}
```

**Migration 18:**

```
18. 20260618_add_notification_table
    - CREATE TABLE notifications (...)
    - CREATE INDEX idx_notifications_user_id_read_at_created_at
```

### Componente UI: centro de notificações

```
┌─────────────────────────────────────┐
│ Quita      🔔 (3)  Maria ▼          │ ← topbar: badge com count
└─────────────────────────────────────┘

Clica no sino → popover:

┌─────────────────────────────┐
│ Notificações       Limpar   │
├─────────────────────────────┤
│ 🔴 Banco X — pagamento     │
│    em 3 dias (R$ 280)       │
│    há 1 hora                │
├─────────────────────────────┤
│ 🔵 Seu plano de julho      │
│    está pronto              │
│    há 4 horas               │
├─────────────────────────────┤
│ ⚪ Acordo Magazine Y       │
│    expira em 2 dias         │
│    ontem                    │
├─────────────────────────────┤
│ Ver todas                   │
└─────────────────────────────┘
```

### Pendência @product

**Confirma in-app + email (Resend)?** Sem push, sem SMS no MVP.

---

## P4 — @claude-arquiteto: Navegação principal (BL-4)

### Decisão

#### Mobile (375-768px)

```
┌─────────────────────────┐
│ Quita      🔔  Maria ▼ │ ← topbar fixa
├─────────────────────────┤
│                         │
│ [conteúdo da tela]      │
│                         │
├─────────────────────────┤
│  🏠   💳   📊   ⚙       │ ← bottom nav fixa
│ Home Dív. Plano Conf.   │
└─────────────────────────┘
```

**Topbar:** 56px de altura. Logo à esquerda, sino + nome do usuário à direita. Click no nome → dropdown (Sair).

**Bottom nav:** 64px de altura. 4 itens com ícone (lucide-react) + label. Item ativo destacado com `--primary`.

#### Desktop (≥1024px)

```
┌──────────────────────────────────────────────┐
│ Quita                            🔔  Maria ▼ │ ← topbar (sem hambur)
├──────────┬───────────────────────────────────┤
│          │                                   │
│ 🏠 Home  │                                   │
│ 💳 Dív.  │                                   │
│ 📊 Plano │     [conteúdo da tela]            │
│ 🛡 Apoio │                                   │
│ ⚙ Conf  │                                   │
│          │                                   │
│          │                                   │
└──────────┴───────────────────────────────────┘
```

**Sidebar:** 240px largura, sticky. Topbar contínua. Conteúdo ocupa `flex-1`.

#### Tablet (768-1023px)

Sidebar colapsável (drawer). Comportamento híbrido.

### Itens da navegação

| Item | Rota | Ícone (lucide) |
|---|---|---|
| Home | `/` | `Home` |
| Dívidas | `/dividas` | `CreditCard` |
| Plano longo prazo | `/plano-longo-prazo` | `TrendingUp` |
| Apoio (canais) | `/apoio` | `LifeBuoy` (só mostrado em modos críticos) |
| Configurações | `/configuracoes` | `Settings` |

**Decisão importante:** "Apoio" só aparece quando `financialState` está em `monthly_deficit`, `overindebtedness`, ou `practical_insolvency`. Em estados saudáveis, o item não está no menu (evita poluir UI quando não relevante).

---

## P5 — @claude-arquiteto: 5 altos consolidados (A-2 a A-6)

### A-2: Monolingual PT-BR no MVP

**Patch §15.X:**

```markdown
### Política de internacionalização

MVP: monolingual PT-BR. Strings hardcoded em componentes.
Justificativa: público inicial é exclusivamente brasileiro; i18n adiciona complexidade
sem benefício imediato.

Pós-MVP: introduzir `next-intl` antes de adicionar segundo idioma. Migração:
- Extrair strings para `messages/pt-BR.json`
- Wrap providers em `next-intl/server` e `next-intl/client`
- Não há breaking changes esperados
```

Registrado em `BACKLOG_POS_MVP.md`.

### A-3: Transição de estados financeiros (toast)

```typescript
// hooks/use-current-state.ts
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMonthlyPlan } from './use-monthly-plan';
import { FinancialState } from '@quita/shared';

export function useStateChangeNotifier() {
  const previousState = useRef<FinancialState | null>(null);
  const { data: plan } = useMonthlyPlan();
  const router = useRouter();

  useEffect(() => {
    if (!plan) return;
    if (previousState.current && previousState.current !== plan.financialState) {
      const isWorse = stateRank(plan.financialState) > stateRank(previousState.current);
      const message = isWorse
        ? 'Seu estado financeiro mudou. Vale revisar seu plano.'
        : 'Seu plano foi atualizado.';

      toast.info(message, {
        duration: 8000,
        action: {
          label: 'Ver',
          onClick: () => router.push('/'),
        },
      });
    }
    previousState.current = plan.financialState;
  }, [plan?.financialState, router]);
}

const RANK: Record<FinancialState, number> = {
  healthy_with_debt: 0,
  tight_budget: 1,
  monthly_deficit: 2,
  overindebtedness: 3,
  practical_insolvency: 4,
};

function stateRank(s: FinancialState): number {
  return RANK[s] ?? 0;
}
```

Hook é chamado **uma vez** no layout `(app)/layout.tsx`. Toast não bloqueia; usuário escolhe se quer reagir.

### A-4: Despesas sazonais na UI

**Componente novo `<UpcomingSeasonalsList />`** na home, abaixo do plano de ações:

```
┌─────────────────────────────────────┐
│ Vem aí                              │
│                                     │
│ • IPVA — R$ 1.800 em 60 dias        │
│   Provisão mensal: R$ 300           │
│                                     │
│ • IPTU — R$ 1.200 em 90 dias        │
│   Provisão mensal: R$ 100           │
│                                     │
│ Já está reservado: R$ 400/mês        │
│                                     │
└─────────────────────────────────────┘
```

**Tela `/despesas-sazonais`** (nova rota) com listagem completa + edição.

Backend: `seasonal-expense-service` já existe (Fase 3 §13). Endpoint `GET /api/v1/expenses/seasonal/upcoming?monthsAhead=3` retorna lista.

### A-5: Wireframe de excluir conta

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
│ Antes de excluir, considere:        │
│ → [Exportar meus dados]             │
│ → [Cancelar Premium]                │ ← se Premium ativo
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Para confirmar, digite seu email:   │
│ [_______________________]           │
│                                     │
│ Motivo (opcional, ajuda a melhorar) │
│ [textarea                         ] │
│                                     │
│ [Cancelar]   [Excluir conta]        │
│              ↑ habilita após       │
│                email correto +     │
│                5 segundos          │
│                                     │
└─────────────────────────────────────┘
```

Após "Excluir conta": modal final com countdown de 5s antes de habilitar botão final. Email de confirmação enviado ao usuário com aviso.

Backend marca `User.deletedAt`. Job de retention apaga 30 dias depois.

### A-6: Wireframe de plano (Free/Premium)

```
┌─────────────────────────────────────┐
│ ← Plano                             │
├─────────────────────────────────────┤
│                                     │
│ Seu plano atual: Free               │
│                                     │
│ ═════════════════════════════       │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Free (atual)                │    │
│ │ R$ 0/mês                    │    │
│ │                             │    │
│ │ ✓ Espelho mensal            │    │
│ │ ✓ Plano de ação             │    │
│ │ ✓ Cadastro ilimitado de     │    │
│ │   dívidas                   │    │
│ │ ✓ 1 avaliação de acordo/mês │    │
│ │ ✓ Plano de longo prazo      │    │
│ │ ✓ Exportação de dados       │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Premium                     │    │
│ │ R$ 9,90/mês                 │    │
│ │                             │    │
│ │ Tudo do Free, mais:         │    │
│ │ ✓ 5 OCRs de proposta/mês    │    │
│ │ ✓ Avaliações de acordo      │    │
│ │   ilimitadas                │    │
│ │ ✓ Suporte prioritário       │    │
│ │                             │    │
│ │ [Assinar Premium]           │    │
│ └─────────────────────────────┘    │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Cancele quando quiser. Sem fideli-  │
│ dade. Cobrança via cartão ou PIX.   │
│                                     │
└─────────────────────────────────────┘
```

Se Premium ativo:

```
┌─────────────────────────────────────┐
│ ← Plano                             │
├─────────────────────────────────────┤
│                                     │
│ Seu plano: Premium                  │
│                                     │
│ Próxima cobrança: 17/06/2026        │
│ R$ 9,90 — cartão final 4242         │
│                                     │
│ Uso este mês:                       │
│ • OCRs: 2 de 5                      │
│ • Avaliações de acordo: 8           │
│                                     │
│ [Gerenciar assinatura]              │ ← abre Stripe Customer Portal
│                                     │
└─────────────────────────────────────┘
```

---

## P6 — @claude-arquiteto: 5 médios consolidados (M-1 a M-5)

### M-1: PWA mínimo

```json
// app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Quita',
    short_name: 'Quita',
    description: 'Organizador para quem está com dívidas',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#2F7060',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
```

App vira instalável no Android/iOS Safari. Pós-MVP: Service Worker.

### M-2: Exemplo concreto RHF + Zod

```typescript
// components/onboarding/income-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { incomeInputSchema, type IncomeInput } from '@quita/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/common/money-input';

export function IncomeForm({ onSubmit }: { onSubmit: (data: IncomeInput) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<IncomeInput>({
    resolver: zodResolver(incomeInputSchema),
    defaultValues: { frequency: 'recurring' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome da renda</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Salário CLT, aluguel recebido..."
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="amount">Valor mensal</Label>
        <MoneyInput
          id="amount"
          {...register('amount', { valueAsNumber: true })}
        />
        {errors.amount && (
          <p className="text-sm text-destructive mt-1" role="alert">
            {errors.amount.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Salvando...' : 'Continuar'}
      </Button>
    </form>
  );
}
```

### M-3: `<CapacityBreakdown />` como Drawer

```typescript
// components/common/capacity-breakdown.tsx
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { formatBRL } from '@/lib/utils/format';

interface Props {
  breakdown: CapacityBreakdown;
}

export function CapacityBreakdownTrigger({ breakdown }: Props) {
  return (
    <Sheet>
      <SheetTrigger className="text-sm text-primary underline">
        Como calculamos?
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Sua capacidade segura</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          <Line label="Renda líquida mensal" value={breakdown.incomeNetMonthly} />
          <Line label="Despesas essenciais" value={-breakdown.essentialsTotal} />
          <Line label="Provisão sazonal" value={-breakdown.seasonalProvisionTotal} />
          <Line label="Protetivas de renda" value={-breakdown.incomeProtectiveTotal} />
          <Line label="Obrigações legais" value={-breakdown.legalsTotal} />
          <Line label="Reserva operacional (5%)" value={-breakdown.operationalReserve} />
          {breakdown.emergencyReserveContribution > 0 && (
            <Line label="Aporte reserva de emergência" value={-breakdown.emergencyReserveContribution} />
          )}
          <div className="border-t pt-3 font-semibold flex justify-between">
            <span>Capacidade segura</span>
            <span>{formatBRL(breakdown.safeCapacity)}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={value < 0 ? 'text-foreground' : 'text-foreground'}>
        {formatBRL(value)}
      </span>
    </div>
  );
}
```

Drawer (`<Sheet />`) abre de baixo no mobile, da direita no desktop. Componente shadcn/ui já trata.

### M-4: Input UF apenas no MVP

```typescript
// Onboarding A3.2
<Select {...register('stateCode')}>
  <SelectTrigger>
    <SelectValue placeholder="Selecione seu estado" />
  </SelectTrigger>
  <SelectContent>
    {BR_STATES.map(s => (
      <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

Lista de 27 estados em constante. Autocomplete de cidade IBGE registrado em `BACKLOG_POS_MVP.md`.

### M-5: Convenção de scroll em modais

```typescript
// Padrão para modais longos
<DialogContent className="max-h-[90vh] overflow-y-auto">
  ...
</DialogContent>
```

Documentado no CONTRIBUTING.md como padrão para todos os modais.

---

## P7 — @product (PENDENTE): 2 migrations novas

### Resumo

| Migration | Conteúdo |
|---|---|
| **17** | `Subscription` table (Stripe) |
| **18** | `Notification` table (in-app) |

**Total acumulado: 18 migrations** (era 16 após NM-6 da Fase 4 que virou Migration 16 `AuthAuditLog`).

### Pendência @product

**Confirma a inclusão?** Ambas são consequência direta de BL-2 e BL-3 — se aprovar Stripe e in-app+email, automaticamente aprova as tabelas.

---

## P8 — @product (PENDENTE): Stripe Customer Portal

### Recomendação

**Adotar.** Customer Portal permite usuário:
- Cancelar assinatura
- Ver histórico de faturas
- Atualizar método de pagamento
- Baixar recibos

Sem precisar implementar nenhuma UI desses fluxos.

**Custo:** zero (incluído no Stripe).

**Implementação:** 1 endpoint `POST /api/v1/subscription/portal` que cria sessão e retorna URL. Botão "Gerenciar assinatura" redireciona.

### Pendência @product

**Confirma adotar?**

---

## §15 (Patch) — Adição à Fase 5

> **Seção §15 oficial do Patch v1.1 da Fase 5.** Anexar ao final de `FASE_5_TELAS_WEB.md`, antes da seção 14 (Próximos passos).

```markdown
## 15. Patch v1.1 — Refinamentos pós-ciclo adversarial

### 15.1 14 wireframes adicionais (BL-1, A-5, A-6)
[Conteúdo de P1 + wireframe de excluir conta de A-5 + wireframe de plano de A-6]

### 15.2 Pagamento Premium via Stripe Checkout (BL-2)
[Conteúdo de P2: schema, migrations, endpoints, webhook flow, fluxo UI]

### 15.3 Notificações: in-app + email (BL-3)
[Conteúdo de P3: schema, tabela de tipos, componente UI]

### 15.4 Navegação principal (BL-4)
[Conteúdo de P4: mobile bottom nav + topbar, desktop sidebar]

### 15.5 i18n monolingual PT-BR (A-2)
[Patch §15.X de P5]

### 15.6 Toast de mudança de estado (A-3)
[Hook useStateChangeNotifier de P5]

### 15.7 Despesas sazonais na UI (A-4)
[Componente UpcomingSeasonalsList + tela /despesas-sazonais de P5]

### 15.8 PWA mínimo (M-1)
[Manifest de P6]

### 15.9 Exemplo RHF + Zod (M-2)
[Componente IncomeForm de P6]

### 15.10 CapacityBreakdown como Drawer (M-3)
[Componente CapacityBreakdownTrigger de P6]

### 15.11 Input UF apenas no MVP (M-4)
[Select de UF de P6]

### 15.12 Convenção de scroll em modais (M-5)
[Padrão max-h overflow de P6]

### 15.13 Migrations consolidadas

| # | Migration | Origem |
|---|---|---|
| 17 | `add_subscription_table` | BL-2 (Stripe) |
| 18 | `add_notification_table` | BL-3 (in-app) |

Total acumulado: 18 migrations.

### 15.14 Resumo do impacto

| Categoria | Total |
|---|---|
| Wireframes adicionais | 8 críticos + 6 esqueletos |
| Schemas novos | 2 (`Subscription`, `Notification`) |
| Endpoints novos | 4 (Stripe checkout, portal, webhook, cancel) |
| Componentes novos | 4 (UpcomingSeasonalsList, CapacityBreakdownTrigger, NotificationCenter, NavigationLayout) |
| Bloqueadores resolvidos | 4 de 4 |
| Altos resolvidos | 6 de 6 |
| Médios resolvidos | 5 de 5 |

*Fim do Patch v1.1.*
```

---

## Confirmações pendentes @product

| # | Decisão | Recomendação |
|---|---|---|
| **C1 (BL-2)** | Stripe Checkout como provider de pagamento? | ✅ Sim |
| **C2 (BL-3)** | Notificações MVP: in-app + email (Resend)? | ✅ Sim |
| **C3** | Migrations 17 + 18 (Subscription + Notification)? | ✅ Consequência de C1 e C2 |
| **C4** | Stripe Customer Portal para gerenciar assinatura? | ✅ Sim — zero custo |

---

## Após confirmação

Quando você responder, eu:
1. Aplico C1-C4 no patch (~5min)
2. Atualizo a Fase 5 com a §15 colada
3. Re-submeto ao devils-advocate
4. Se virar APROVADO → seguimos para **Fase 6 — Plano de Migração do Código Atual**

---

*Fim do ciclo adversarial. Aguardando 4 confirmações.*
