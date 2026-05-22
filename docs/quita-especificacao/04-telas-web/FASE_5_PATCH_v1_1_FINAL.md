# Fase 5 v1.1 — Patch Final (§15)

> **Anexar ao final do documento:** `FASE_5_TELAS_WEB.md`, antes da seção 14 ("Próximos passos")
> **Versão:** v1.1
> **Data:** 17 de maio de 2026
> **Origem:** ciclo adversarial completo
> **Confirmações @product aplicadas:** C1 (Stripe), C2 (in-app + Resend), C3 (Migrations 17+18), C4 (Customer Portal)

---

## 15. Patch v1.1 — Refinamentos pós-ciclo adversarial

Resolução completa dos 4 bloqueadores + 6 altos + 5 médios. Esta seção é normativa.

---

### 15.1 Wireframes adicionais (BL-1, A-5, A-6)

8 wireframes críticos completos: login, registro, detalhe de dívida (D2), registrar pagamento (D4), plano de longo prazo (F1), exportar meus dados (G5), refinamento de renda (C2), refinamento de despesas (C3).

Mais 2 críticos resolvidos em A-5 e A-6: **excluir conta** e **plano Free/Premium**.

6 esqueletos sem wireframe ASCII detalhado (forgot password, reset password, lista de dívidas, configurações index, refinamentos C4-C7) que seguem padrões já estabelecidos:
- Forms simples → padrão login/registro
- Listas → padrão lista de dívidas com cards
- Configurações index → lista de links com ícones
- Refinamentos C4-C7 → padrão de refinamento de despesas

**Inventário oficial:**

| Status | Total | Telas |
|---|---|---|
| ✅ Wireframe ASCII completo | 22 | A1, A3.1, A3.4, A4, B1 (+ B1.a, B1.b), D2, D3, D4, E1.1, E1.2, E1.3, E1.4, E2, C1, C2, C3, F1, G2, G3, G4, G5, G6, H2, login, register |
| 🟡 Esqueleto (segue padrão) | 8 | forgot password, reset password, D1, configurações index, refinamentos C4-C7, /despesas-sazonais |

#### 15.1.1 Login

```
┌─────────────────────────────────────┐
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
└─────────────────────────────────────┘
```

#### 15.1.2 Registro

```
┌─────────────────────────────────────┐
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
└─────────────────────────────────────┘
```

#### 15.1.3 Detalhe de Dívida (D2)

```
┌─────────────────────────────────────┐
│ ← Banco X — Cartão de crédito       │
├─────────────────────────────────────┤
│ Valor restante: R$ 2.180,00         │
│ de R$ 3.500 originais               │
│ ─────────────────────────────       │
│ Detalhes                            │
│ Parcela mensal     R$ 280           │
│ Juros mensais      8,5% (estimado)  │
│ Próximo vencimento 10/06            │
│ Parcelas em atraso 0                │
│ [Editar]                            │
│ ─────────────────────────────       │
│ Importância no seu plano            │
│ Score: 8,2 (alta prioridade)        │
│ Por quê?                            │
│ • Juros altos (8,5% ao mês)         │
│ • Valor pequeno — pode quitar rápido│
│ ─────────────────────────────       │
│ [Registrar pagamento]               │
│ [Avaliar acordo recebido]           │
│ [Marcar como quitada]               │
│ ─────────────────────────────       │
│ Histórico                           │
│ 10/05  Pagamento R$ 280       [↩]  │
│ 10/04  Pagamento R$ 280            │
│ Ver tudo                            │
└─────────────────────────────────────┘
```

#### 15.1.4 Registrar Pagamento (D4)

```
┌─────────────────────────────────────┐
│ ← Registrar pagamento               │
│   Banco X — Cartão                  │
├─────────────────────────────────────┤
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
└─────────────────────────────────────┘
```

#### 15.1.5 Plano de Longo Prazo (F1)

```
┌─────────────────────────────────────┐
│ ← Plano de longo prazo              │
├─────────────────────────────────────┤
│ No ritmo atual, sua última dívida   │
│ quita em ~18 meses.                 │
│ ─────────────────────────────       │
│ Ordem sugerida de quitação          │
│ 1. Banco X            Mês 4         │
│ 2. Magazine Y         Mês 9         │
│ 3. Loja Z             Mês 14        │
│ 4. Crédito Pessoal    Mês 18        │
│ ─────────────────────────────       │
│ Cenários                            │
│ Conservador  R$ 480/mês → 18 meses  │
│ Otimizado    R$ 560/mês → 15 meses  │
│ Acelerado    R$ 760/mês → 12 meses  │
│ ─────────────────────────────       │
│ Como calculamos? [+]                │
│ Atualizado em 15/05/2026 [Regerar]  │
└─────────────────────────────────────┘
```

#### 15.1.6 Exportar Meus Dados (G5)

```
┌─────────────────────────────────────┐
│ ← Exportar meus dados               │
├─────────────────────────────────────┤
│ Você pode receber uma cópia de      │
│ todos os dados que mantemos.        │
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
│ ─────────────────────────────       │
│ Exportações anteriores              │
│ 15/04/2026  [Baixar]                │
│ ─────────────────────────────       │
│ [Gerar nova exportação]             │
│ ⓘ Levamos até 24h para preparar.  │
└─────────────────────────────────────┘
```

#### 15.1.7 Refinamento de Renda (C2)

```
┌─────────────────────────────────────┐
│ ← Refinar minha renda               │
├─────────────────────────────────────┤
│ Suas rendas atuais:                 │
│ ╔═══════════════════════════════╗  │
│ ║ Salário CLT                   ║  │
│ ║ R$ 3.500 — mensal, dia 5      ║  │
│ ║ [Editar] [Remover]            ║  │
│ ╚═══════════════════════════════╝  │
│ ─────────────────────────────       │
│ + Adicionar outra renda             │
│ Exemplos: bicos, aluguel, pensão,   │
│ BPC, indenização, comissões.        │
│ ─────────────────────────────       │
│ Sobre renda variável                │
│ Se oscila muito, melhor informar:   │
│ • Piso garantido                    │
│ • Teto                              │
│ A gente usa o piso pra calcular     │
│ seu plano.                          │
└─────────────────────────────────────┘
```

#### 15.1.8 Refinamento de Despesas (C3)

```
┌─────────────────────────────────────┐
│ ← Classificar despesas              │
├─────────────────────────────────────┤
│ 12 de 18 despesas classificadas     │
│ ████████████████░░░░░░░ 67%        │
│ ─────────────────────────────       │
│ ╔═══════════════════════════════╗  │
│ ║ Netflix — R$ 39,90/mês        ║  │
│ ║ □ Essencial?                  ║  │
│ ║ ☑ Posso cancelar              ║  │
│ ║ □ Posso reduzir               ║  │
│ ║ Se atrasar:                   ║  │
│ ║ [Corte de serviço      ▼]    ║  │
│ ║ [Salvar]                      ║  │
│ ╚═══════════════════════════════╝  │
│ Próxima: Conta de luz (5/18)        │
│ [Pular esta]                        │
└─────────────────────────────────────┘
```

#### 15.1.9 Excluir Conta (G6 — wireframe completo)

```
┌─────────────────────────────────────┐
│ ← Excluir minha conta               │
├─────────────────────────────────────┤
│ ⚠ Esta ação é irreversível.        │
│                                     │
│ Ao excluir sua conta:               │
│ • Todos os seus dados serão         │
│   apagados em até 30 dias           │
│ • Histórico de avaliações de        │
│   acordo (5 anos por exigência      │
│   legal) será anonimizado           │
│ • Você perderá acesso imediato      │
│                                     │
│ Antes de excluir, considere:        │
│ → [Exportar meus dados]             │
│ → [Cancelar Premium]                │
│ ─────────────────────────────       │
│ Para confirmar, digite seu email:   │
│ [_______________________]           │
│                                     │
│ Motivo (opcional)                   │
│ [textarea                         ] │
│                                     │
│ [Cancelar]   [Excluir conta]        │
│              ↑ habilita após:       │
│                email correto +      │
│                countdown de 5s      │
└─────────────────────────────────────┘
```

Backend: marca `User.deletedAt`. Job de retention apaga em 30 dias. Email de confirmação enviado.

#### 15.1.10 Plano Free/Premium (G4 — wireframe completo)

**Free:**

```
┌─────────────────────────────────────┐
│ ← Plano                             │
├─────────────────────────────────────┤
│ Seu plano atual: Free               │
│ ═════════════════════════════       │
│ ┌─────────────────────────────┐    │
│ │ Free (atual)                │    │
│ │ R$ 0/mês                    │    │
│ │ ✓ Espelho mensal            │    │
│ │ ✓ Plano de ação             │    │
│ │ ✓ Cadastro ilimitado        │    │
│ │ ✓ 1 avaliação acordo/mês    │    │
│ │ ✓ Plano de longo prazo      │    │
│ │ ✓ Exportação de dados       │    │
│ └─────────────────────────────┘    │
│ ┌─────────────────────────────┐    │
│ │ Premium                     │    │
│ │ R$ 9,90/mês                 │    │
│ │ Tudo do Free, mais:         │    │
│ │ ✓ 5 OCRs/mês                │    │
│ │ ✓ Avaliações ilimitadas     │    │
│ │ ✓ Suporte prioritário       │    │
│ │ [Assinar Premium]           │    │
│ └─────────────────────────────┘    │
│ Cancele quando quiser. Sem fideli-  │
│ dade. Cobrança via PIX ou cartão.   │
└─────────────────────────────────────┘
```

**Premium ativo:**

```
┌─────────────────────────────────────┐
│ ← Plano                             │
├─────────────────────────────────────┤
│ Seu plano: Premium                  │
│ Próxima cobrança: 17/06/2026        │
│ R$ 9,90 — cartão final 4242         │
│ Uso este mês:                       │
│ • OCRs: 2 de 5                      │
│ • Avaliações de acordo: 8           │
│ [Gerenciar assinatura]              │ ← abre Stripe Customer Portal
└─────────────────────────────────────┘
```

---

### 15.2 Pagamento Premium via Stripe Checkout (BL-2)

**Decisão:** Stripe Checkout + Customer Portal (decisão C1 + C4).

#### Schema novo

```prisma
model Subscription {
  id                   String   @id @default(uuid()) @db.Uuid
  userId               String   @unique @map("user_id") @db.Uuid
  stripeCustomerId     String   @unique @map("stripe_customer_id") @db.VarChar(255)
  stripeSubscriptionId String?  @unique @map("stripe_subscription_id") @db.VarChar(255)
  status               String   @db.VarChar(50)
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

#### Endpoints novos

```
POST /api/v1/subscription/checkout    → cria Stripe Checkout Session
POST /api/v1/subscription/portal      → abre Customer Portal (C4)
POST /api/v1/webhooks/stripe          → recebe webhooks (signature obrigatória)
DELETE /api/v1/subscription/cancel    → cancela (também via Portal)
```

#### Webhook events processados

| Event | Ação |
|---|---|
| `checkout.session.completed` | Cria `Subscription`, define `User.planType = 'premium'` |
| `customer.subscription.updated` | Atualiza `status`, `currentPeriodEnd`, `cancelAtPeriodEnd` |
| `customer.subscription.deleted` | Marca `canceledAt`, define `User.planType = 'free'` |
| `invoice.payment_failed` | Cria notificação in-app + email; mantém Premium até `currentPeriodEnd` |

#### Verificação de webhook signature

```typescript
@Post('webhooks/stripe')
@Public() // sem JWT — autenticação via signature
@HttpCode(200)
async handleStripeWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Headers('stripe-signature') signature: string,
) {
  const event = this.stripe.webhooks.constructEvent(
    req.rawBody!,
    signature,
    this.config.get('STRIPE_WEBHOOK_SECRET'),
  );

  await this.subscriptionService.handleStripeEvent(event);
  return { received: true };
}
```

**Crítico:** rawBody preservado (NestJS por padrão parseia JSON; precisa de `bodyParser.raw()` na rota).

#### Env vars novas

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PREMIUM=price_...  # produto criado no dashboard Stripe
STRIPE_PORTAL_RETURN_URL=https://quita.com.br/configuracoes/plano
STRIPE_CHECKOUT_SUCCESS_URL=https://quita.com.br/configuracoes/plano?success=true
STRIPE_CHECKOUT_CANCEL_URL=https://quita.com.br/configuracoes/plano?canceled=true
```

#### Fluxo da UI

```
[Tela /configuracoes/plano]
       │
       │ clica "Assinar Premium"
       ▼
[POST /subscription/checkout]
       │ retorna { url: 'checkout.stripe.com/...' }
       ▼
[Redirect para checkout.stripe.com]
       │ usuário paga (PIX ou cartão)
       ▼
[Stripe redireciona para success_url]
[Webhook chega em paralelo: checkout.session.completed]
       │ User.planType = 'premium', Subscription criada
       ▼
[Frontend revalida useCurrentUser]
[Banner: "Bem-vindo ao Premium"]
```

Para cancelamento: "Gerenciar assinatura" → `POST /subscription/portal` → Stripe Customer Portal (UI Stripe).

---

### 15.3 Notificações: in-app + email (BL-3) — C2

#### Estratégia

| Tipo | Trigger | In-app | Email (Resend) |
|---|---|---|---|
| `plan_updated` | Motor termina recálculo | ✅ | ❌ |
| `payment_reminder` | Cron diário: 3 dias antes do `dueDate` | ✅ | ✅ |
| `settlement_expiring` | Cron diário: 2 dias antes do `expiresAt` | ✅ | ✅ |
| `settlement_revalidation_needed` | Job de revalidação detecta mudança | ✅ | ❌ |
| `data_export_ready` | Após geração do export | ✅ | ✅ |
| `subscription_payment_failed` | Webhook Stripe | ✅ | ✅ |
| `consent_request` | Mudança material de versão de consentimento | ✅ | ❌ |
| `welcome_premium` | Webhook Stripe `subscription.created` | ✅ | ✅ |

**Não no MVP:** push web (Service Worker), SMS.

#### Schema novo

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

#### Resend (email transacional)

```typescript
// modules/notification/services/email.service.ts
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private config: ConfigService) {
    this.resend = new Resend(config.get('RESEND_API_KEY'));
  }

  async sendPaymentReminder(user: User, debt: Debt, dueDate: Date) {
    await this.resend.emails.send({
      from: 'Quita <ola@quita.com.br>',
      to: user.email,
      subject: `${debt.creditor} — pagamento em 3 dias`,
      react: PaymentReminderTemplate({ user, debt, dueDate }),
    });
  }
}
```

Templates em React Email (JSX). Free tier 100/dia (3000/mês) cobre MVP.

#### Endpoint para listar e marcar como lida

```
GET    /api/v1/notifications              → lista paginada
PATCH  /api/v1/notifications/:id/read    → marca como lida
DELETE /api/v1/notifications/:id          → arquiva (não delete real)
PATCH  /api/v1/notifications/read-all    → marca todas como lidas
```

#### Componente UI: centro de notificações

```
Topbar:  Quita      🔔 (3)  Maria ▼

Clica no sino → popover/sheet:

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

Polling a cada 60s (TanStack Query) ou tempo real via WebSocket (pós-MVP).

#### Env vars novas

```bash
RESEND_API_KEY=re_...
EMAIL_FROM=ola@quita.com.br
```

---

### 15.4 Navegação principal (BL-4)

#### Mobile (375-768px)

```
┌─────────────────────────┐
│ Quita      🔔  Maria ▼ │ ← topbar 56px
├─────────────────────────┤
│                         │
│ [conteúdo da tela]      │
│                         │
├─────────────────────────┤
│  🏠   💳   📊   ⚙       │ ← bottom nav 64px
│ Home Dív. Plano Conf.   │
└─────────────────────────┘
```

#### Desktop (≥1024px)

```
┌──────────────────────────────────────────────┐
│ Quita                            🔔  Maria ▼ │
├──────────┬───────────────────────────────────┤
│ 🏠 Home  │                                   │
│ 💳 Dív.  │                                   │
│ 📊 Plano │     [conteúdo da tela]            │
│ 🛡 Apoio │                                   │
│ ⚙ Conf  │                                   │
└──────────┴───────────────────────────────────┘
```

#### Tablet (768-1023px)

Sidebar colapsável (drawer). Bottom nav some.

#### Itens

| Item | Rota | Ícone | Sempre visível |
|---|---|---|---|
| Home | `/` | `Home` | Sim |
| Dívidas | `/dividas` | `CreditCard` | Sim |
| Plano | `/plano-longo-prazo` | `TrendingUp` | Sim |
| Apoio | `/apoio` | `LifeBuoy` | **Só em modos críticos** |
| Configurações | `/configuracoes` | `Settings` | Sim |

"Apoio" condicional: `financialState ∈ {monthly_deficit, overindebtedness, practical_insolvency}`.

---

### 15.5 i18n monolingual PT-BR (A-2)

MVP: strings hardcoded em PT-BR diretamente nos componentes.

Pós-MVP (registrado em `BACKLOG_POS_MVP.md`):
- Migrar para `next-intl`
- Extrair strings para `messages/pt-BR.json`
- Não há breaking changes esperados
- Custo de migração: ~2 dias

---

### 15.6 Toast de mudança de estado (A-3)

```typescript
// hooks/use-state-change-notifier.ts
export function useStateChangeNotifier() {
  const previousState = useRef<FinancialState | null>(null);
  const { data: plan } = useMonthlyPlan();
  const router = useRouter();

  useEffect(() => {
    if (!plan) return;
    if (previousState.current && previousState.current !== plan.financialState) {
      const isWorse = STATE_RANK[plan.financialState] > STATE_RANK[previousState.current];
      toast.info(
        isWorse ? 'Seu estado financeiro mudou. Vale revisar seu plano.' : 'Seu plano foi atualizado.',
        {
          duration: 8000,
          action: { label: 'Ver', onClick: () => router.push('/') },
        },
      );
    }
    previousState.current = plan.financialState;
  }, [plan?.financialState, router]);
}
```

Toast informativo, **não bloqueante**. Hook invocado uma vez no `(app)/layout.tsx`.

---

### 15.7 Despesas sazonais na UI (A-4)

#### Componente `<UpcomingSeasonalsList />` na home

```
┌─────────────────────────────────────┐
│ Vem aí                              │
│ • IPVA — R$ 1.800 em 60 dias        │
│   Provisão mensal: R$ 300           │
│ • IPTU — R$ 1.200 em 90 dias        │
│   Provisão mensal: R$ 100           │
│ Já está reservado: R$ 400/mês        │
│ Ver todas                           │
└─────────────────────────────────────┘
```

#### Tela `/despesas-sazonais` (esqueleto)

Lista completa de despesas com frequência ≠ `monthly`. CRUD básico.

#### Endpoint

```
GET /api/v1/expenses/seasonal/upcoming?monthsAhead=3
```

Backend: `seasonal-expense-service.listUpcomingProvisions` (Fase 3 §13).

---

### 15.8 PWA mínimo (M-1)

```typescript
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

Instalável no Android e iOS Safari. **Pós-MVP:** Service Worker com cache de dados.

---

### 15.9 Exemplo RHF + Zod (M-2)

```typescript
// components/onboarding/income-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { incomeInputSchema, type IncomeInput } from '@quita/shared';

export function IncomeForm({ onSubmit }: { onSubmit: (data: IncomeInput) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<IncomeInput>({
    resolver: zodResolver(incomeInputSchema),
    defaultValues: { frequency: 'recurring' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome da renda</Label>
        <Input id="name" {...register('name')} placeholder="Salário CLT..." />
        {errors.name && (
          <p className="text-sm text-destructive mt-1" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="amount">Valor mensal</Label>
        <MoneyInput id="amount" {...register('amount', { valueAsNumber: true })} />
        {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Salvando...' : 'Continuar'}
      </Button>
    </form>
  );
}
```

---

### 15.10 `<CapacityBreakdown />` como Drawer (M-3)

```typescript
// components/common/capacity-breakdown-trigger.tsx
'use client';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function CapacityBreakdownTrigger({ breakdown }) {
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
          <div className="border-t pt-3 font-semibold flex justify-between">
            <span>Capacidade segura</span>
            <span>{formatBRL(breakdown.safeCapacity)}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

### 15.11 Input UF no MVP (M-4)

```typescript
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

Lista hardcoded de 27 estados. Autocomplete de cidade IBGE registrado pós-MVP.

---

### 15.12 Convenção de scroll em modais (M-5)

Padrão para todos os modais longos:

```typescript
<DialogContent className="max-h-[90vh] overflow-y-auto">
  ...
</DialogContent>
```

Documentado no `CONTRIBUTING.md`.

---

### 15.13 Migrations consolidadas (C3)

| # | Migration | Origem | Conteúdo |
|---|---|---|---|
| 17 | `add_subscription_table` | BL-2 (Stripe) | Tabela `subscriptions` |
| 18 | `add_notification_table` | BL-3 (in-app) | Tabela `notifications` |

**Total acumulado: 18 migrations.**

```sql
-- 17. 20260618_add_subscription_table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  canceled_at TIMESTAMP
);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 18. 20260618_add_notification_table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_id_read_at_created_at ON notifications(user_id, read_at, created_at);
```

---

### 15.14 Stripe Customer Portal (C4)

```typescript
// modules/subscription/subscription.controller.ts
@Post('subscription/portal')
@UseGuards(JwtAuthGuard)
async createPortalSession(@CurrentUser() user): Promise<{ url: string }> {
  const subscription = await this.subscriptionRepo.findByUserId(user.id);
  if (!subscription) throw new BadRequestException('no_active_subscription');

  const session = await this.stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: this.config.get('STRIPE_PORTAL_RETURN_URL'),
  });

  return { url: session.url };
}
```

Frontend: botão "Gerenciar assinatura" no `/configuracoes/plano` → redirect para `session.url`. Customer Portal cuida de cancelamento, atualização de cartão, faturas, etc. **Custo: zero.**

---

### 15.15 Env vars adicionadas

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PREMIUM=price_...
STRIPE_PORTAL_RETURN_URL=https://quita.com.br/configuracoes/plano
STRIPE_CHECKOUT_SUCCESS_URL=https://quita.com.br/configuracoes/plano?success=true
STRIPE_CHECKOUT_CANCEL_URL=https://quita.com.br/configuracoes/plano?canceled=true

# Resend (email transacional)
RESEND_API_KEY=re_...
EMAIL_FROM=ola@quita.com.br
```

Validação Zod no `envSchema` da Fase 4 §16.2.

---

### 15.16 Atualizações à tabela de jobs (Fase 4)

Adicionar:

| Job | Queue | Disparo |
|---|---|---|
| `PaymentReminderJob` | `motor-scheduled` | Cron diário 09:00 UTC — busca pagamentos com `dueDate = hoje + 3` |
| `SettlementExpiringReminderJob` | `motor-scheduled` | Cron diário 09:30 UTC — busca evaluations com `expiresAt = hoje + 2` |
| `EmailDispatchJob` | `motor-scheduled` | Disparado por outros jobs — envia email via Resend |

---

### 15.17 Resumo do impacto do patch v1.1

| Categoria | Total |
|---|---|
| Wireframes ASCII (total) | 22 completos + 8 esqueletos = 30 telas mapeadas |
| Schemas novos | 2 (`Subscription`, `Notification`) |
| Migrations novas | 2 (17, 18) — total acumulado **18** |
| Endpoints novos | 8 (4 Stripe + 4 Notification) |
| Componentes novos | 4 (`<NotificationCenter />`, `<UpcomingSeasonalsList />`, `<CapacityBreakdownTrigger />`, `<NavigationLayout />`) |
| Jobs novos | 3 (`PaymentReminderJob`, `SettlementExpiringReminderJob`, `EmailDispatchJob`) |
| Env vars novas | 9 (7 Stripe + 2 Resend) |
| Bloqueadores resolvidos | 4 de 4 |
| Altos resolvidos | 6 de 6 |
| Médios resolvidos | 5 de 5 |
| Confirmações @product aplicadas | C1, C2, C3, C4 |
| 11 NMs anteriores resolvidas | ✅ (já no documento original) |

---

*Fim do Patch v1.1.*
