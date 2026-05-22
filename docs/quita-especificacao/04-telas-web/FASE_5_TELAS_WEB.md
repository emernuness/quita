# Quita — Fase 5: Telas Web (Next.js 15)

> **Status:** rascunho para validação
> **Data:** 17 de maio de 2026
> **Insumo:** Fases 1, 2, 3, 4 + Bridge OCR aprovadas
> **Escopo:** estrutura, fluxos, wireframes, copy final, plano de beta privado
> **Não cobre:** mobile React Native (depois); plano de migração do código atual (Fase 6)
> **Resolve:** NM-1 a NM-6 da Fase 4 + NM-1 a NM-5 do Bridge OCR (11 pendências)

---

## Sumário executivo

A Fase 5 traduz o motor e a arquitetura em **superfície de uso**. Define como o Espelho aparece na home, como o usuário cadastra dívida sem se sentir interrogado, como o OCR Premium acontece de forma humana, e como o Modo Sobrevivência se diferencia visualmente para não soar como mais uma cobrança.

**Stack:** Next.js 15 (App Router) + React 19 + Tailwind v4 + shadcn/ui + TanStack Query + Zustand + React Hook Form + Zod compartilhado.

**Princípio central:** o Quita comunica fatos, não emoções fabricadas. Tom é direto, sóbrio, respeitoso, em PT-BR coloquial mas profissional.

**Conteúdo:** 30+ telas mapeadas, wireframes ASCII, copy final, estados de loading/erro/empty, plano de beta privado com 10-20 pessoas reais endividadas, integração completa com backend (Fase 4), resolução de todas as 11 NMs pendentes.

---

## 1. Princípios de UX

**1.1 Sóbrio, sem ostentação financeira.**
Nenhum gráfico de "rentabilidade", nenhuma medalha, nenhuma curva crescente. O usuário do Quita está endividado — não precisa de visual de fintech que celebra investimento.

**1.2 Tom de voz coloquial profissional.**
Frases curtas, primeira pessoa só quando necessário, sem exclamações, sem "parabéns por dar esse passo!". Trata o usuário como adulto que sabe o que está fazendo.

**1.3 Verbo da ação primeiro.**
"Pagar parcela de R$ 180" (não "Você precisa pagar"). "Negociar com Banco X" (não "Considere negociar"). Botões diretos.

**1.4 Refinamento progressivo, nunca interrogatório.**
Pede 1 informação por vez, sempre justificando o porquê. Permite pular tudo. Mostra resultado antes de pedir mais.

**1.5 Estados são telas, não banners.**
Modo Sobrevivência não é "um aviso no topo da home" — é uma home diferente, com menu reduzido, sem botão de "pagar". Estado financeiro muda toda a interface.

**1.6 Loading curto, vazio explicativo.**
Tela vazia explica o que vai aparecer ali e como chegar lá. Loading nunca passa de 3s sem feedback de progresso.

**1.7 Erro é caminho, não bloqueio.**
"Não consegui ler essa imagem. Que tal digitar manualmente?" + botão grande pra digitar. Sempre uma saída.

**1.8 Acessibilidade desde o dia 1.**
WCAG 2.1 AA: contraste mínimo 4.5:1, navegação por teclado, labels ARIA, foco visível, tamanho mínimo de fonte 14px.

**1.9 Mobile-first mesmo na versão web.**
Layout primário para 375px-414px (iPhone padrão). Desktop é progressivamente melhorado, não o contrário.

**1.10 Confiança através de transparência.**
Todo cálculo do motor é explicável. Banner "como calculamos?" abre modal mostrando breakdown. Nada de "fórmula secreta".

---

## 2. Stack frontend

| Pacote | Versão | Razão |
|---|---|---|
| `next` | ^15.x | App Router, Server Components, streaming |
| `react` | ^19.x | match Next 15 |
| `tailwindcss` | ^4.x | já decidido |
| `@radix-ui/react-*` | latest | primitives de shadcn/ui |
| `class-variance-authority` | ^0.7.x | variantes de componente |
| `tailwind-merge` | ^2.x | combinação inteligente de classes |
| `zustand` | ^4.x | estado global leve (auth, plano atual) |
| `@tanstack/react-query` | ^5.x | data fetching, cache, optimistic updates |
| `react-hook-form` | ^7.x | formulários |
| `@hookform/resolvers` | ^3.x | integração com Zod |
| `zod` | ^3.x | de `@quita/shared` — mesmas schemas do backend |
| `date-fns` | ^3.x | já adotado no backend |
| `lucide-react` | latest | ícones |
| `sonner` | ^1.x | toasts |
| `posthog-js` | ^1.x | analytics + feature flags (beta) |

### 2.1 Por que estes específicos

- **App Router** sobre Pages Router: Server Components reduzem JS no cliente, melhor para Core Web Vitals
- **Zustand** sobre Redux/Jotai: API mínima, sem boilerplate, suficiente para o escopo (auth, plano, notificações em tempo real)
- **TanStack Query** sobre SWR: mais maduro, melhor handling de erros, suporte a optimistic updates nativo
- **PostHog** sobre Plausible/Mixpanel: combina analytics + feature flags + session recording (útil pro beta privado), tem free tier generoso

---

## 3. Estrutura de pastas (`apps/web`)

```
apps/web/
  src/
    app/                            # Next App Router
      (auth)/
        login/page.tsx
        register/page.tsx
        forgot-password/page.tsx
        reset-password/page.tsx
        layout.tsx                  # layout simples (sem nav)

      (onboarding)/
        bem-vindo/page.tsx
        renda/page.tsx
        cidade/page.tsx
        despesas/page.tsx
        dividas/page.tsx
        espelho/page.tsx
        layout.tsx                  # stepper visual

      (app)/                        # área autenticada
        layout.tsx                  # nav lateral + topbar
        page.tsx                    # home (B1)
        plano-do-mes/page.tsx       # B2
        plano-longo-prazo/page.tsx  # F1

        dividas/
          page.tsx                  # D1 — lista
          nova/page.tsx             # D3 — cadastrar
          [debtId]/page.tsx         # D2 — detalhe
          [debtId]/editar/page.tsx  # D3 — editar
          [debtId]/pagar/page.tsx   # D4 — registrar pagamento

        avaliar-acordo/
          page.tsx                  # E1 — iniciar
          ocr/page.tsx              # E1.1-E1.4 — fluxo OCR
          [evaluationId]/page.tsx   # E2 — resultado
          historico/page.tsx        # E3

        refinar/
          page.tsx                  # C1 — convite
          renda/page.tsx            # C2
          despesas/page.tsx         # C3
          dividas/page.tsx          # C4
          comportamento/page.tsx    # C5
          objetivos/page.tsx        # C6
          reserva/page.tsx          # C7

        configuracoes/
          page.tsx                  # G — index
          perfil/page.tsx           # G1
          privacidade/page.tsx      # G2
          seguranca/page.tsx        # G3
          plano/page.tsx            # G4
          exportar-dados/page.tsx   # G5
          excluir-conta/page.tsx    # G6

      modo-crise/page.tsx           # H1 — pode ser inline na home
      apoio/page.tsx                # H2 — canais de suporte

      not-found.tsx                 # I1
      error.tsx                     # I2
      offline/page.tsx              # I3

      layout.tsx                    # root
      globals.css

    components/
      ui/                           # primitives (shadcn/ui base)
        button.tsx
        input.tsx
        dialog.tsx
        # ... etc

      common/
        money-input.tsx             # input formatado em BRL
        debt-card.tsx
        action-card.tsx
        capacity-breakdown.tsx
        state-badge.tsx
        mode-banner.tsx

      onboarding/
        stepper.tsx
        critical-question.tsx

      ocr/
        camera-modal.tsx
        consent-modal.tsx
        manual-confirmation-modal.tsx
        quota-banner.tsx

      crisis/
        support-channels-list.tsx
        survival-warning.tsx

    lib/
      api/
        client.ts                   # axios/fetch wrapper
        auth.ts
        debts.ts
        plans.ts
        settlements.ts
        ocr.ts
        consent.ts
        # ... etc

      hooks/
        use-current-user.ts
        use-monthly-plan.ts
        use-debts.ts
        use-ocr-quota.ts
        # ... etc

      stores/
        auth.store.ts
        notifications.store.ts

      utils/
        format.ts                   # formatBRL, formatDate, etc.
        validation.ts               # re-export de @quita/shared
        constants.ts

    styles/
      tokens.css                    # design tokens (cores, espaçamento)
      typography.css

    middleware.ts                   # auth guard, redirect to login

  public/
    icons/
    images/

  next.config.ts
  tailwind.config.ts
  tsconfig.json
  package.json
```

---

## 4. Sistema de design

### 4.1 Paleta de cores

Sóbria, sem associações com fintech ostentativa. Inspiração: ferramentas de saúde mental (Calm, Headspace), não bancos digitais.

```css
/* tokens.css */
:root {
  /* Neutros — base */
  --background: 0 0% 100%;            /* branco puro */
  --foreground: 220 12% 16%;          /* cinza-azulado escuro #232A38 */
  --muted: 220 10% 96%;               /* cinza claríssimo */
  --muted-foreground: 220 8% 46%;     /* cinza médio */
  --border: 220 12% 90%;
  --input: 220 12% 90%;

  /* Primária — verde sóbrio (não bandeira, não wallet) */
  --primary: 158 40% 32%;             /* #2F7060 — verde-musgo */
  --primary-foreground: 0 0% 100%;

  /* Secundária — azul-petróleo */
  --secondary: 210 35% 32%;           /* #355A7F */
  --secondary-foreground: 0 0% 100%;

  /* Atenção — laranja queimado, NÃO vermelho-alarme */
  --warning: 28 60% 50%;              /* #CC7A29 */
  --warning-foreground: 0 0% 100%;

  /* Crítico — usado APENAS em Modo Crise/Sobrevivência */
  --danger: 4 65% 45%;                /* #C03A2D */
  --danger-foreground: 0 0% 100%;

  /* Estados financeiros — cores por estado */
  --state-healthy: 158 40% 32%;       /* verde-musgo */
  --state-tight: 38 70% 45%;          /* amarelo-mostarda */
  --state-deficit: 28 60% 50%;        /* laranja queimado */
  --state-overindebted: 4 50% 42%;    /* vermelho-tijolo */
  --state-insolvency: 220 8% 35%;     /* cinza escuro */
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: 220 14% 10%;
    --foreground: 220 12% 92%;
    /* ... etc */
  }
}
```

**Por que não usar vermelho em deficit/superendividamento?**
Vermelho ativa alarme. Quem está nesse estado JÁ está alarmado. Laranja queimado e tijolo passam seriedade sem amplificar pânico.

### 4.2 Tipografia

```css
/* typography.css */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-VariableFont_slnt,wght.ttf');
}

:root {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, 'SF Mono', Monaco, monospace;
}

/* Escala (mobile-first, base 16px) */
.text-xs   { font-size: 0.75rem;  line-height: 1rem; }      /* 12 */
.text-sm   { font-size: 0.875rem; line-height: 1.25rem; }   /* 14 */
.text-base { font-size: 1rem;     line-height: 1.5rem; }    /* 16 */
.text-lg   { font-size: 1.125rem; line-height: 1.75rem; }   /* 18 */
.text-xl   { font-size: 1.25rem;  line-height: 1.75rem; }   /* 20 */
.text-2xl  { font-size: 1.5rem;   line-height: 2rem; }      /* 24 */
.text-3xl  { font-size: 1.875rem; line-height: 2.25rem; }   /* 30 */
```

**Pesos usados:** 400 (regular), 500 (medium), 600 (semibold). Sem `bold` (700) — pesa demais em telas pequenas e passa tom "alarmante".

### 4.3 Espaçamento e tamanhos

- Base do espaçamento: 4px (Tailwind padrão)
- Altura mínima de botão tocável: **44px** (acessibilidade)
- Largura máxima de coluna de texto: 65 caracteres
- Padding lateral em mobile: 16px (`px-4`)
- Padding lateral em desktop: 24px (`px-6`)
- Container máximo: 768px (mobile-first reflete na largura final)

### 4.4 Componentes base (shadcn/ui)

Adotamos a base do shadcn/ui mas com tokens custom. Componentes que vamos usar:

`Button`, `Input`, `Label`, `Dialog`, `Drawer`, `Card`, `Badge`, `Alert`, `Toast` (sonner), `Tabs`, `Tooltip`, `Popover`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Separator`, `Skeleton`, `Avatar`.

Componentes próprios (em `components/common/`):

- **`<MoneyInput />`** — input formatado em BRL com máscara
- **`<DebtCard />`** — card de dívida com score, ações sugeridas
- **`<ActionCard />`** — card de ação recomendada
- **`<CapacityBreakdown />`** — visualização do cálculo de capacidade segura
- **`<StateBadge />`** — badge colorido do estado financeiro
- **`<ModeBanner />`** — banner com tom do modo de operação

### 4.5 Tom de voz por tipo de conteúdo

| Contexto | Tom | Exemplo |
|---|---|---|
| Botões primários | Verbo no infinitivo | "Pagar parcela", "Negociar", "Continuar" |
| Botões secundários | Ação | "Pular por agora", "Voltar", "Ver mais" |
| Empty states | Direto + caminho | "Você ainda não cadastrou dívidas. Comece aqui." |
| Erros (recuperáveis) | Reconhecimento + saída | "Não consegui ler. Vamos digitar?" |
| Modo crise/sobrevivência | Sóbrio, sem urgência fabricada | "Seu mês está apertado. Vamos focar no essencial." |
| Confirmações | Resumo + ação | "Confirma pagamento de R$ 180? Será registrado em 5 de junho." |
| Successos | Fato, sem comemoração | "Pagamento registrado." (não "🎉 Parabéns!") |

---

## 5. Fluxos prioritários

### 5.1 Onboarding Crítico (3-5min até o Espelho)

```
[Bem-vindo]
   │ "Começar"
   ▼
[Renda principal]  ─────► (1 pergunta: quanto entra por mês de fixo?)
   │ "Continuar"
   ▼
[Cidade + dependentes] ─► (UF + qtd dependentes)
   │ "Continuar"
   ▼
[Despesas essenciais] ──► (3 categorias: moradia, contas, transporte)
   │                       cada uma com 1 input
   │ "Continuar"
   ▼
[Dívidas] ──────────────► (mínimo: nome, valor total, parcela ou "não sei a parcela")
   │                       botão "Adicionar outra"
   │ "Continuar"
   ▼
[Espelho] ──────────────► PRIMEIRA VEZ que o motor roda
                          mostra estado + capacidade + 3 ações
```

**Decisões de UX:**
- Cada tela tem 1 campo principal + 1 botão primário
- "Pular" disponível em todas após a renda (renda é obrigatória)
- Stepper visual no topo (passo X de 5)
- Tempo médio alvo: 3 minutos; teto: 5 minutos antes do Espelho aparecer
- Loading do motor entre "Dívidas" e "Espelho": até 3s — se demorar mais, mostra fallback positivo ("Estamos preparando seu Espelho. Pode ir até a próxima tela.")

### 5.2 Home + Plano do Mês

A home é o lugar onde o usuário volta. Estrutura:

```
┌─────────────────────────────────────┐
│ Olá, [Nome]                   ⚙   │
├─────────────────────────────────────┤
│                                     │
│  [Estado: Apertado]                 │ ← StateBadge
│                                     │
│  Sua capacidade segura este mês     │
│  R$ 350,00                          │ ← grande, sóbrio
│                                     │
│  Como calculamos? [+]               │ ← link para CapacityBreakdown
│                                     │
├─────────────────────────────────────┤
│ Plano de junho — Modo Estabilização │
│                                     │
│ 1. Pagar parcela Banco X       [→]│ ← ActionCard
│    R$ 180 — vence dia 10            │
│                                     │
│ 2. Negociar Magazine Y         [→]│
│    Parcela atual não cabe           │
│                                     │
│ 3. Cancelar 2 streaming        [→]│
│    Economia: ~R$ 60                 │
│                                     │
│ Ver plano completo [→]              │
├─────────────────────────────────────┤
│ ⚠ 2 dívidas com dados estimados   │ ← banner sutil
│   Refinar agora? [+]                │
└─────────────────────────────────────┘
```

### 5.3 Avaliar Acordo (manual + OCR)

```
[Iniciar avaliação]
   │
   ├─ "Tirar foto da proposta" (apenas Premium)
   │     │ primeira vez → modal LGPD
   │     │ aceita → câmera/upload
   │     │ envia → backend OCR
   │     ▼
   │  [Confidence ≥ 0.7?]
   │     │ sim → resultado direto
   │     │ não → modal de confirmação manual
   │           │ usuário edita → POST confirm
   │           ▼
   │        [Resultado]
   │
   └─ "Digitar manualmente"
        │
        ▼
     [Form: valor, parcelas, prazo]
        │
        ▼
     [Resultado: accept/negotiate/reject]
        │
        ▼
     [Salvar como decisão] / [Não aceitar agora]
```

### 5.4 Refinamento Progressivo

O coração do produto. Permite o usuário "minimal" (que fez só Onboarding Crítico) evoluir para "detailed" gradualmente, **sem nunca ser forçado**.

Cada refinamento:
- Aparece como sugestão na home (banner sutil)
- Tem benefício explícito ("Refinar suas despesas vai melhorar seu plano")
- É independente (não obriga completar antes outros)
- Pode ser pausado e retomado

7 refinamentos mapeados (C1-C7), detalhados em §6.

### 5.5 Modo Crise / Sobrevivência

Quando o motor detecta `crisis_mode`, `protection` ou `survival`, a UI muda significativamente:

**Mudanças visuais:**
- Cor primária muda para `--state-deficit` ou `--state-overindebted` ou `--state-insolvency`
- Botões `pay` e `negotiate` desaparecem ou ficam desabilitados (no `survival`)
- Banner topo: "Modo Sobrevivência" / "Modo Proteção" / "Modo Crise"
- Acesso direto a SupportChannels (Procon, Defensoria, CAPS, CRAS)

**Mudanças de copy:**
- Sem "vamos quitar suas dívidas" → "vamos garantir o essencial"
- Sem "negociar com" → "renegociar coletivamente"
- Sem ações otimistas

---

## 6. Telas detalhadas

### 6.1 A1 — Bem-vindo (`/bem-vindo`)

```
┌─────────────────────────────────────┐
│                                     │
│         Quita                       │ ← logotipo simples
│                                     │
│  Um organizador para quem está      │
│  com dívidas.                       │ ← subtítulo, 1 linha
│                                     │
│  Não promete milagre.               │
│  Não vende empréstimo.              │ ← antimanifesto
│  Não envia cobrança.                │
│                                     │
│                                     │
│  [Começar]                          │ ← btn primário, full-width
│                                     │
│  Já tenho conta → Entrar            │ ← link discreto
│                                     │
└─────────────────────────────────────┘
```

**Copy:** intencionalmente sem promessas. Define o tom imediatamente.

### 6.2 A3.1 — Renda Principal (`/onboarding/renda`)

```
┌─────────────────────────────────────┐
│ ←   Passo 1 de 4                   │ ← stepper
├─────────────────────────────────────┤
│                                     │
│  Quanto entra por mês,              │
│  considerando só o que é fixo?     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ R$ 0,00                     │   │ ← MoneyInput
│  └─────────────────────────────┘   │
│                                     │
│  Conta salário, aluguel recebido,   │ ← microcópia abaixo
│  pensão, BPC. Não inclua bicos      │
│  irregulares (a gente pergunta      │
│  depois).                           │
│                                     │
│                                     │
│                                     │
│  [Continuar]                        │ ← btn primário
│                                     │
└─────────────────────────────────────┘
```

**Validação:** valor > 0. Erro: "Precisamos saber pelo menos um valor para começar. Coloque o que entra de mais certo." (não "campo obrigatório").

### 6.3 A3.4 — Dívidas mínimas (`/onboarding/dividas`)

```
┌─────────────────────────────────────┐
│ ←   Passo 4 de 4                   │
├─────────────────────────────────────┤
│                                     │
│  Quais dívidas você quer            │
│  organizar?                         │
│                                     │
│  ╔═══════════════════════════════╗ │
│  ║ Dívida 1                      ║ │
│  ║                               ║ │
│  ║ Com quem?                     ║ │
│  ║ [Banco X                   ▼]║ │ ← dropdown ou texto livre
│  ║                               ║ │
│  ║ Valor total                   ║ │
│  ║ [R$ 0,00                    ] ║ │
│  ║                               ║ │
│  ║ Parcela mensal (se tiver)     ║ │
│  ║ [R$ 0,00                    ] ║ │
│  ║ □ Não sei a parcela           ║ │
│  ╚═══════════════════════════════╝ │
│                                     │
│  + Adicionar outra dívida           │
│                                     │
│  [Pular esta etapa]                 │ ← cinza
│  [Continuar]                        │
│                                     │
└─────────────────────────────────────┘
```

**Decisão:** "Pular" é prominent porque a Fase 1 v2 diz que dívida zero é aceitável (modo `payoff` saudável sem dívidas vira `healthy_with_debt` vazio).

### 6.4 A4 — Espelho (`/onboarding/espelho`)

Primeira tela depois do Onboarding Crítico. **O momento que define se o usuário volta ou não.**

```
┌─────────────────────────────────────┐
│                                     │
│  Olá, Maria.                        │
│                                     │
│  Seu mês de junho:                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Estado: Apertado           │   │ ← StateBadge cor amarela
│  └─────────────────────────────┘   │
│                                     │
│  Você fica com R$ 350 livres por   │
│  mês depois do essencial.           │
│                                     │
│  Suas dívidas pedem R$ 480 por mês  │
│  ao todo.                           │
│                                     │
│  Falta R$ 130 para tudo caber.      │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  O que dá pra fazer:                │
│                                     │
│  • Negociar a parcela do Banco X   │
│  • Cortar 1 ou 2 despesas pequenas │
│  • Pagar primeiro a conta de luz   │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  ⓘ Esse diagnóstico ainda é       │
│    inicial. Refinando despesas      │
│    e dívidas, fica mais preciso.    │
│                                     │
│  [Ver meu plano completo]           │
│  [Refinar primeiro]                 │
│                                     │
└─────────────────────────────────────┘
```

**Decisão.** O Espelho **fala fatos**, não opinião. Não diz "você está em apuros" ou "sua situação é grave". Apresenta:
1. Estado nomeado
2. Números diretos
3. O gap
4. 3 caminhos genéricos (sem detalhe ainda)
5. Aviso de incerteza ("ainda é inicial")
6. 2 botões equivalentes em hierarquia

### 6.5 B1 — Home (`/`) detalhada

(Detalhada em §5.2 acima, layout completo)

**Estados especiais da home:**

**B1.a — Estado `healthy_with_debt` em modo `payoff`:**
```
┌─────────────────────────────────────┐
│ Olá, João                     ⚙    │
├─────────────────────────────────────┤
│ [Estado: Saudável com dívidas]      │
│                                     │
│ Capacidade segura: R$ 1.200         │
│                                     │
│ Plano de junho — Modo Quitação     │
│                                     │
│ 1. Pagar Banco X         R$ 280 [→]│
│ 2. Pagar Loja Y          R$ 120 [→]│
│ 3. Direcionar excedente:    R$ 800  │
│    para Banco X (juros maiores)     │
│                                     │
│ ⓘ No ritmo atual, sua última      │
│   dívida quita em ~14 meses.        │
│                                     │
└─────────────────────────────────────┘
```

**B1.b — Estado `practical_insolvency` em modo `survival`:**
```
┌─────────────────────────────────────┐
│ Olá, Carlos                   ⚙    │
├─────────────────────────────────────┤
│ [Modo Sobrevivência]                │ ← cor cinza-escuro
│                                     │
│ Sua renda atual não cobre os        │
│ gastos essenciais.                  │
│                                     │
│ Foco agora:                         │
│                                     │
│ 1. Garantir o essencial             │
│    Comida, moradia, luz, água       │
│                                     │
│ 2. Conhecer seus direitos           │
│    [Ver canais de apoio gratuito]   │
│                                     │
│ 3. Não aceitar novas dívidas        │
│    Nem cartão, nem cheque especial  │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ ⓘ Pagamento de dívidas não é      │
│   prioridade neste momento. Você    │
│   tem proteção legal pelo mínimo    │
│   existencial.                      │
│                                     │
│ [Ver direitos do superendividado]   │
│                                     │
└─────────────────────────────────────┘
```

**Decisão.** Em sobrevivência, **não há botão de "pagar dívida"**. A interface remove a opção visual. O motor da Fase 3 já garante que nenhuma ação `pay`/`negotiate` é gerada — a UI reforça.

### 6.6 D3 — Cadastrar Dívida (`/dividas/nova`)

Versão completa do mini-formulário do onboarding, com refinamento opcional.

```
┌─────────────────────────────────────┐
│ ← Nova dívida                       │
├─────────────────────────────────────┤
│                                     │
│ Essencial:                          │
│                                     │
│ Credor                              │
│ [Banco X                          ] │
│                                     │
│ Categoria                           │
│ [Cartão de crédito              ▼] │
│                                     │
│ Valor total devido                  │
│ [R$ 0,00                          ] │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Detalhes (opcionais — mas ajudam):  │
│                                     │
│ Parcela mensal                      │
│ [R$ 0,00                          ] │
│ □ Não tem parcela fixa              │
│                                     │
│ Juros mensais (se sabe)             │
│ [0,00 %                           ] │
│ ⓘ Se não sabe, usamos a média      │
│   do mercado para essa categoria.   │
│                                     │
│ Parcelas atrasadas                  │
│ [0                                ] │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ [Cancelar]    [Salvar]              │
│                                     │
└─────────────────────────────────────┘
```

**Decisão.** Separação visual entre **essencial** (3 campos) e **opcional** (campos que melhoram o score mas não bloqueiam o cadastro).

### 6.7 E1.1 — OCR: Modal de Consentimento

Quando o usuário Premium clica em "Tirar foto da proposta" pela primeira vez:

```
┌─────────────────────────────────────┐
│ Processamento de imagem      [X]    │
├─────────────────────────────────────┤
│                                     │
│ Antes de continuar, leia:           │
│                                     │
│ Ao tirar foto ou enviar imagem de   │
│ uma proposta de acordo, você        │
│ concorda que:                       │
│                                     │
│ 1. A imagem será enviada para a     │
│    OpenAI (provedor de IA) para     │
│    extração automática dos valores  │
│    e prazos.                        │
│                                     │
│ 2. A OpenAI não usa imagens da      │
│    nossa conta para treinar         │
│    modelos.                         │
│                                     │
│ 3. A imagem original ficará         │
│    armazenada por até 30 dias e     │
│    depois será descartada.          │
│                                     │
│ 4. Você pode revogar este           │
│    consentimento em Configurações.  │
│                                     │
│ 5. Os dados extraídos seguem nossa  │
│    Política de Privacidade.         │
│                                     │
│ 6. VOCÊ É RESPONSÁVEL pelo conteúdo │
│    da imagem. Inclua apenas a       │
│    proposta. NÃO fotografe          │
│    documentos de identidade, rostos │
│    de outras pessoas, ou cartões.   │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ □ Li e concordo                     │
│                                     │
│ [Cancelar]   [Concordar e continuar]│
│                                     │
└─────────────────────────────────────┘
```

### 6.8 E1.2 — OCR: Captura

```
┌─────────────────────────────────────┐
│ ← Tirar foto da proposta            │
├─────────────────────────────────────┤
│                                     │
│ ╔═══════════════════════════════╗  │
│ ║                               ║  │
│ ║                               ║  │
│ ║     [Preview da câmera]       ║  │ ← input file accept="image/*" capture="environment"
│ ║                               ║  │
│ ║                               ║  │
│ ╚═══════════════════════════════╝  │
│                                     │
│ ⚠ Inclua apenas a proposta.       │ ← aviso PII (Bridge §14.10)
│   Evite documentos de identidade.   │
│                                     │
│       [📷 Tirar foto]               │
│                                     │
│   Ou: enviar do dispositivo         │
│       [📁 Escolher arquivo]         │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Você usou 1 de 5 OCRs este mês      │ ← quota
│                                     │
└─────────────────────────────────────┘
```

### 6.9 E1.3 — OCR: Confirmação Manual (confidence < 0.7)

```
┌─────────────────────────────────────┐
│ ← Confirmar dados extraídos         │
├─────────────────────────────────────┤
│                                     │
│ ⓘ Tenho 65% de certeza sobre o    │
│   que extraí. Por favor confirme    │
│   ou ajuste:                        │
│                                     │
│ ╔═══════════════════════════════╗  │
│ ║  [Preview da imagem]          ║  │ ← signed URL
│ ╚═══════════════════════════════╝  │
│                                     │
│ Credor                              │
│ [Banco X                          ] │
│                                     │
│ Dívida original                     │
│ [R$ 2.400,00                      ] │
│                                     │
│ Valor à vista oferecido             │
│ [R$ 1.800,00                      ] │
│ □ Sem opção de à vista              │
│                                     │
│ Parcelado                           │
│ [10  ] vezes de [R$ 220,00      ]  │
│ □ Sem opção parcelado               │
│                                     │
│ Prazo de validade da proposta       │
│ [25/06/2026                       ] │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ [Voltar]     [Confirmar e avaliar]  │
│                                     │
└─────────────────────────────────────┘
```

### 6.10 E1.4 — Quota exceeded / Premium only

**Free tentando OCR:**
```
┌─────────────────────────────────────┐
│ ✨ Recurso Premium                   │
├─────────────────────────────────────┤
│                                     │
│ Avaliar acordo por foto é exclusivo │
│ do plano Premium.                   │
│                                     │
│ Por R$ 9,90/mês você tem:           │
│ • 5 avaliações por foto/mês         │
│ • Chat com IA (em breve)            │
│ • Avaliações de acordo ilimitadas   │
│                                     │
│ Você sempre pode digitar a proposta │
│ manualmente sem custo. ↓            │
│                                     │
│ [Digitar manualmente]               │
│ [Conhecer Premium]                  │
│                                     │
└─────────────────────────────────────┘
```

**Premium com quota estourada:**
```
┌─────────────────────────────────────┐
│ Limite atingido                     │
├─────────────────────────────────────┤
│                                     │
│ Você usou seus 5 OCRs deste mês.    │
│                                     │
│ A quota reseta no dia 1º de julho.  │
│                                     │
│ Até lá, você pode digitar a         │
│ proposta manualmente (sem limite).  │
│                                     │
│ [Digitar manualmente]               │
│ [Voltar]                            │
│                                     │
└─────────────────────────────────────┘
```

### 6.11 E2 — Resultado da Avaliação

```
┌─────────────────────────────────────┐
│ ← Resultado                         │
├─────────────────────────────────────┤
│                                     │
│ ╔═══════════════════════════════╗  │
│ ║ Recomendação: NEGOCIAR        ║  │ ← cor warning (laranja)
│ ╚═══════════════════════════════╝  │
│                                     │
│ A parcela de R$ 220 aperta seu      │
│ mês. Sua capacidade segura, depois  │
│ de garantir essenciais e outras     │
│ dívidas, é de R$ 165.               │
│                                     │
│ Tente negociar até R$ 165/mês ou    │
│ menos parcelas.                     │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Resumo da proposta:                 │
│ • Credor: Banco X                   │
│ • À vista: R$ 1.800 (não cabe)      │
│ • Parcelado: 10x R$ 220 (apertado)  │
│ • Desconto: 25%                     │
│ • Prazo: 25/06/2026                 │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ O que fazer agora:                  │
│                                     │
│ [Pedir nova proposta ao credor]     │ ← copia mensagem pronta
│ [Salvar como decisão]               │
│ [Não aceitar agora]                 │
│                                     │
└─────────────────────────────────────┘
```

### 6.12 C1 — Convite ao Refinamento (`/refinar`)

```
┌─────────────────────────────────────┐
│ ← Refinar meus dados                │
├─────────────────────────────────────┤
│                                     │
│ Quanto mais você refina, mais       │
│ preciso fica seu plano.             │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ 💼 Renda detalhada           [→]   │ ← C2
│    Adicionar bicos, sazonais        │
│    Status: incompleto               │
│                                     │
│ 🏠 Despesas classificadas     [→]   │ ← C3
│    Marcar essencial vs adiável      │
│    Status: 12 de 18 feitas          │
│                                     │
│ 💳 Mais dívidas               [✓]   │ ← C4
│    Já registradas: 5                │
│                                     │
│ 🧭 Como você lida com dinheiro [→]  │ ← C5 (BehaviorProfile)
│    Status: nunca feito              │
│                                     │
│ 🎯 Seus objetivos              [→]  │ ← C6
│    Status: nunca feito              │
│                                     │
│ 🛡 Reserva de emergência       [→]  │ ← C7
│    Status: nunca feito              │
│                                     │
└─────────────────────────────────────┘
```

**Decisão.** Cada refinamento mostra status (incompleto/parcial/completo). O usuário escolhe ordem. Nada é obrigatório.

### 6.13 G3 — Segurança (`/configuracoes/seguranca`)

Resolve **NM-4 da Fase 4** (logoutAllDevices sem endpoint UI).

```
┌─────────────────────────────────────┐
│ ← Segurança                         │
├─────────────────────────────────────┤
│                                     │
│ Sessão atual                        │
│ Chrome em Windows                   │
│ Curitiba, PR                        │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Outras sessões ativas: 2            │
│                                     │
│ • Safari em iPhone — São Paulo, SP  │
│   há 2 dias                         │
│                                     │
│ • Chrome em Mac — Curitiba, PR      │
│   há 5 horas                        │
│                                     │
│ [Sair de todos os outros]           │ ← NM-4 resolvida
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Senha                               │
│ Última alteração: há 3 meses        │
│ [Alterar senha]                     │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ [Sair desta sessão]                 │
│                                     │
└─────────────────────────────────────┘
```

### 6.14 G2 — Privacidade (`/configuracoes/privacidade`)

```
┌─────────────────────────────────────┐
│ ← Privacidade                       │
├─────────────────────────────────────┤
│                                     │
│ Seus consentimentos                 │
│                                     │
│ Processamento de dados financeiros  │
│ [✓ Ativo]                            │
│ Aceito em 15/05/2026                │
│                                     │
│ OCR de proposta                     │
│ [✓ Ativo]                            │
│ Aceito em 17/05/2026                │
│ [Revogar]                           │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ [Exportar meus dados]               │ ← LGPD
│ [Excluir minha conta]               │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ [Ver Política de Privacidade]       │
│ [Ver Termos de Uso]                 │
│                                     │
└─────────────────────────────────────┘
```

### 6.15 H2 — Canais de Apoio (`/apoio`)

```
┌─────────────────────────────────────┐
│ ← Canais de apoio                   │
├─────────────────────────────────────┤
│                                     │
│ Você não precisa passar por isso    │
│ sozinho. Esses canais são           │
│ gratuitos e existem para ajudar.    │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Para renegociar dívidas             │
│                                     │
│ • Procon do seu estado              │
│   [Ver site]                        │
│                                     │
│ • Defensoria Pública                │
│   Atendimento jurídico gratuito     │
│   [Ver contato]                     │
│                                     │
│ • desenrola.gov.br                  │
│   Plataforma federal de             │
│   renegociação                      │
│   [Acessar]                         │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Para apoio emocional                │
│                                     │
│ • CVV — Centro de Valorização       │
│   da Vida                           │
│   Ligue 188 (24h, gratuito)         │
│                                     │
│ • CAPS — Centro de Atenção          │
│   Psicossocial                      │
│   [Encontrar mais próximo]          │
│                                     │
│ ─────────────────────────────       │
│                                     │
│ Para suporte social                 │
│                                     │
│ • CRAS — Centro de Referência       │
│   da Assistência Social             │
│   [Encontrar mais próximo]          │
│                                     │
│ • Calendário Bolsa Família          │
│   [Consultar]                       │
│                                     │
└─────────────────────────────────────┘
```

**Decisão.** Lista vem da tabela `SupportChannel` (Fase 2), filtrada por UF do usuário. Mostra **todos os tipos** sempre — não só "dívidas". Reconhece que endividamento ≠ apenas problema financeiro.

---

## 7. Copy em PT-BR (textos finais)

### 7.1 Estados financeiros (rotulagem)

| Estado interno (DB) | Rótulo UI |
|---|---|
| `healthy_with_debt` | "Saudável com dívidas" |
| `tight_budget` | "Apertado" |
| `monthly_deficit` | "Em déficit" |
| `overindebtedness` | "Superendividado" |
| `practical_insolvency` | "Insolvência prática" |

### 7.2 Modos (rotulagem)

| Modo interno | Rótulo UI |
|---|---|
| `payoff` | "Modo Quitação" |
| `stabilization` | "Modo Estabilização" |
| `crisis_mode` | "Modo Crise" |
| `protection` | "Modo Proteção" |
| `survival` | "Modo Sobrevivência" |

### 7.3 Botões mais usados

| Contexto | Texto |
|---|---|
| Salvar primário | "Salvar" |
| Continuar avanço | "Continuar" |
| Cancelar | "Cancelar" |
| Voltar | "Voltar" |
| Pular | "Pular por agora" |
| Confirmar pagamento | "Registrar pagamento" |
| Iniciar negociação | "Pedir nova proposta" |
| Adicionar item | "+ Adicionar [nome]" |
| Editar | "Editar" |
| Excluir | "Excluir" (sempre + confirmação) |

### 7.4 Vocabulário PROIBIDO

Evite ao máximo:

| ❌ | ✅ |
|---|---|
| "Quitar suas dívidas em até X meses!" | "No ritmo atual, sua última dívida quita em ~X meses." |
| "Parabéns! Você pagou!" | "Pagamento registrado." |
| "Não desista!" | (silêncio — não comente esforço emocional) |
| "Vamos lá, você consegue!" | (silêncio) |
| "Faltam só X meses!" | "Restam ~X meses no ritmo atual." |
| "Sua liberdade financeira!" | "Sair das dívidas." |
| "Investir" | (não aplica — Quita não é app de investimento) |
| "Riqueza", "patrimônio", "fortuna" | (não aplica) |
| "Score" (de crédito) | (mencionar Serasa apenas se relevante e por nome) |
| "Carteira" | "Suas dívidas", "seus pagamentos" |

### 7.5 Tom dos modos críticos

**Em Modo Crise (`crisis_mode`):**
> "Seu mês está apertado. Vamos focar em garantir o essencial e fazer 1 ou 2 negociações."

**Em Modo Proteção (`protection`):**
> "Suas dívidas hoje pedem mais do que cabe. A boa notícia: a lei brasileira protege o seu mínimo existencial. Vamos renegociar coletivamente."

**Em Modo Sobrevivência (`survival`):**
> "Sua renda atual não cobre os essenciais. Pagamento de dívida não é prioridade agora. O foco é garantir comida, moradia, luz e água, e buscar suporte."

---

## 8. Estados de loading, erro, empty

### 8.1 Loading

Padrão **skeleton** para conteúdo previsível (cards, listas). **Spinner sutil** para ações curtas (botão "Salvando..."). **Mensagem progressiva** para ações > 3s:

```
[0-1s]  Skeleton estático
[1-3s]  Skeleton + texto "Carregando..."
[3-10s] Texto + descrição do que está acontecendo
[>10s]  Mensagem de "Demorando mais que o esperado..."
[>30s]  Erro com botão "Tentar novamente"
```

**Caso especial: motor recalculando.** Primeira vez (Onboarding → Espelho) pode demorar até 5s. Texto:

```
┌─────────────────────────────────────┐
│                                     │
│       ●  ●  ●                      │ ← animação sutil
│                                     │
│  Estamos preparando seu Espelho.    │
│                                     │
│  Isso é feito só uma vez.           │
│  Depois é instantâneo.              │
│                                     │
└─────────────────────────────────────┘
```

### 8.2 Erros

Template: **reconhecimento + saída**.

| Cenário | Mensagem |
|---|---|
| 500 genérico | "Algo deu errado no nosso lado. [Tentar de novo]" |
| 401 (sessão expirada) | "Sua sessão expirou. [Entrar novamente]" |
| 429 (rate limit) | "Você está fazendo muitas ações rápido. Espere alguns segundos." |
| 403 (consent revogado em OCR) | "Você revogou o consentimento de OCR. [Habilitar em Privacidade]" |
| 402 (Free tentando Premium) | (modal específico — §6.10) |
| 422 (OCR parse failed) | "Não consegui ler essa imagem. [Digitar manualmente]" |
| 503 (OpenAI indisponível) | "Serviço de OCR fora do ar. [Digitar manualmente]" |
| Sem conexão | "Sem conexão. [Tentar de novo quando voltar]" |

### 8.3 Empty states

**Sem dívidas cadastradas:**
```
Você não cadastrou dívidas ainda.

Esse é um bom lugar para estar. Mas
se você está aqui por causa de alguma,
[Cadastrar primeira dívida].
```

**Sem ações no plano (raro):**
```
Não tem nada pendente este mês.

Aproveite para revisar suas dívidas
ou refinar seus dados.
```

**Sem avaliações de acordo:**
```
Quando algum credor mandar uma
proposta, você pode validar aqui se
ela cabe no seu orçamento.

[Como funciona]
```

---

## 9. Integração com backend

### 9.1 Autenticação (cookie httpOnly + refresh stateful)

```typescript
// lib/api/client.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '/api/v1', // /api/v1 da Fase 4
  withCredentials: true, // envia cookies httpOnly automaticamente
});

// Interceptor para refresh automático em 401
let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push(() => resolve(api(original)));
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        await api.post('/auth/refresh'); // backend rotaciona refresh stateful
        refreshQueue.forEach((cb) => cb());
        refreshQueue = [];
        return api(original);
      } catch (e) {
        refreshQueue = [];
        window.location.href = '/login';
        throw e;
      } finally {
        isRefreshing = false;
      }
    }
    throw error;
  },
);
```

### 9.2 Versionamento `/api/v1/`

Toda chamada usa o prefixo `/api/v1/`. Configurado uma vez no axios baseURL.

### 9.3 Tipos compartilhados via `@quita/shared`

```typescript
// lib/api/debts.ts
import { api } from './client';
import { debtInputSchema, DebtInput, Debt } from '@quita/shared';

export const debtsApi = {
  list: () => api.get<Debt[]>('/debts').then(r => r.data),
  create: (input: DebtInput) => api.post<Debt>('/debts', debtInputSchema.parse(input)).then(r => r.data),
  update: (id: string, input: Partial<DebtInput>) =>
    api.patch<Debt>(`/debts/${id}`, input).then(r => r.data),
  remove: (id: string) => api.delete(`/debts/${id}`),
};
```

Schema Zod validada no cliente (UX rápida) E no servidor (segurança).

### 9.4 TanStack Query

```typescript
// hooks/use-monthly-plan.ts
import { useQuery } from '@tanstack/react-query';
import { planApi } from '@/lib/api/plans';

export function useMonthlyPlan() {
  return useQuery({
    queryKey: ['monthly-plan', 'active'],
    queryFn: planApi.getActive,
    staleTime: 30_000, // 30s antes de revalidar
    refetchOnWindowFocus: true, // revalida quando usuário volta à aba
  });
}
```

Mutations:

```typescript
// hooks/use-add-debt.ts
export function useAddDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: debtsApi.create,
    onSuccess: () => {
      // Backend já dispara recálculo do motor via evento
      // Invalida queries que mostram plano e dívidas
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-plan'] });
    },
  });
}
```

### 9.5 Optimistic updates onde faz sentido

Para registrar pagamento, mostrar feedback imediato:

```typescript
useMutation({
  mutationFn: paymentApi.record,
  onMutate: async (input) => {
    await queryClient.cancelQueries({ queryKey: ['debts'] });
    const previous = queryClient.getQueryData<Debt[]>(['debts']);
    queryClient.setQueryData(['debts'], (old: Debt[]) =>
      old.map(d => d.id === input.debtId
        ? { ...d, amountPaid: Number(d.amountPaid) + input.amount }
        : d
      )
    );
    return { previous };
  },
  onError: (err, input, ctx) => {
    if (ctx?.previous) queryClient.setQueryData(['debts'], ctx.previous);
    toast.error('Não foi possível registrar. Tente novamente.');
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['debts'] });
    queryClient.invalidateQueries({ queryKey: ['monthly-plan'] });
  },
});
```

---

## 10. Resoluções das 11 NMs pendentes

### 10.1 Fase 4 — NM-1: HMAC-SHA256 para refresh token (crítica)

**Backend (já indicado na auditoria):**

```typescript
// modules/auth/services/refresh-token.service.ts
import { createHmac } from 'crypto';

function hashRefreshToken(rawToken: string, secret: string): string {
  return createHmac('sha256', secret).update(rawToken).digest('hex');
}

async findActiveRefreshToken(rawToken: string): Promise<RefreshTokenWithUser | null> {
  const tokenHash = hashRefreshToken(rawToken, this.config.get('REFRESH_HASH_SECRET'));
  return await this.refreshRepo.findByTokenHash(tokenHash);
}
```

Lookup O(1) por hash. Vazamento da tabela não permite forjar token sem `REFRESH_HASH_SECRET`.

Env var nova: `REFRESH_HASH_SECRET=...` (gerado com `openssl rand -base64 48`).

### 10.2 Fase 4 — NM-2: `SELECT FOR UPDATE` no refresh

```typescript
async refresh(rawToken: string, meta: { userAgent?: string; ipAddress?: string }) {
  return this.txRunner.run(async (tx) => {
    const tokenHash = hashRefreshToken(rawToken, this.secret);

    // Lock pessimista para evitar 2 abas refrescando simultaneamente
    const record = await tx.$queryRaw<RefreshTokenWithUser[]>`
      SELECT rt.*, u.* FROM refresh_tokens rt
      JOIN users u ON u.id = rt.user_id
      WHERE rt.token_hash = ${tokenHash}
        AND rt.revoked_at IS NULL
        AND rt.expires_at > NOW()
      FOR UPDATE
    `;

    if (record.length === 0) throw new UnauthorizedException('invalid_refresh_token');

    await tx.refreshToken.update({
      where: { id: record[0].id },
      data: { revokedAt: new Date(), revokedReason: 'rotated' },
    });

    const newRefreshToken = await this.issueRefreshToken(record[0].userId, meta, tx);
    const accessToken = await this.signAccessToken(record[0]);

    return { accessToken, refreshToken: newRefreshToken };
  });
}
```

Frontend não precisa mudar — a serialização é transparente.

### 10.3 Fase 4 — NM-3: Batching no cleanup

```typescript
async deleteExpiredBefore(cutoff: Date): Promise<number> {
  let totalDeleted = 0;
  const batchSize = 10_000;

  while (true) {
    const result = await this.prisma.$executeRaw`
      DELETE FROM refresh_tokens
      WHERE id IN (
        SELECT id FROM refresh_tokens
        WHERE expires_at < ${cutoff}
        LIMIT ${batchSize}
      )
    `;
    if (result === 0) break;
    totalDeleted += result;
  }
  return totalDeleted;
}
```

### 10.4 Fase 4 — NM-4: `logoutAllDevices` endpoint UI

Endpoint backend:
```typescript
@Post('logout-all')
@UseGuards(JwtAuthGuard)
async logoutAll(@CurrentUser() user) {
  await this.authService.logoutAllDevices(user.id);
  return { ok: true };
}
```

UI: §6.13 (tela G3 — Segurança) — botão "Sair de todos os outros". Após clicar:

```typescript
async function handleLogoutAll() {
  await api.post('/auth/logout-all');
  toast.success('Sessões encerradas em todos os outros dispositivos.');
  queryClient.invalidateQueries({ queryKey: ['sessions'] });
}
```

### 10.5 Fase 4 — NM-5: JWT payload do access token

```typescript
// Backend — auth.service.ts
async signAccessToken(user: User): Promise<string> {
  return this.jwtService.signAsync(
    {
      sub: user.id,
      email: user.email,
      plan: user.planType,
      iat: Math.floor(Date.now() / 1000),
    },
    {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: '15m',
    },
  );
}
```

Frontend não consome o payload diretamente (cookie httpOnly). Mas o backend usa `req.user.plan` em guards (ex: `OcrQuotaGuard`).

### 10.6 Fase 4 — NM-6: Tabela `AuthAuditLog`

**Migration 16:**

```sql
CREATE TABLE auth_audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NULL,
  email       VARCHAR(255) NOT NULL,
  event_type  VARCHAR(50) NOT NULL, -- login_success, login_failure, logout, refresh, password_changed, logout_all
  ip_address  VARCHAR(45) NULL,
  user_agent  VARCHAR(500) NULL,
  metadata    JSONB NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_audit_logs_user_id_created_at ON auth_audit_logs(user_id, created_at);
CREATE INDEX idx_auth_audit_logs_email_event_type_created_at ON auth_audit_logs(email, event_type, created_at);
```

**Retenção:** 1 ano. Cleanup via `DataRetentionCleanupJob` (já existente).

**Uso:** detecção de brute force, suporte ao usuário ("não consigo entrar"), auditoria LGPD.

**Total acumulado de migrations: 16** (era 15).

### 10.7 Bridge OCR — NM-1: `validateInternal` + wrapper público

```typescript
// modules/settlement-validator/settlement-validator.service.ts

// Método interno (compartilhado por validate normal e confirmFromImage)
async validateInternal(
  input: SettlementValidatorInput & { ocrContext?: OcrContext },
  tx?: Prisma.TransactionClient,
): Promise<SettlementValidatorOutput> {
  // ... lógica completa do §11 da Fase 3 ...

  // Se há ocrContext, persiste no SettlementEvaluation:
  await this.settlementRepo.create({
    // ... campos normais ...
    usedOcr: !!input.ocrContext,
    ocrObjectKey: input.ocrContext?.objectKey,
    ocrExtractedData: input.ocrContext?.extractedData,
    ocrConfidence: input.ocrContext?.confidence,
  }, tx);
}

// Wrapper público (sem ocrContext)
async validate(input: SettlementValidatorInput): Promise<SettlementValidatorOutput> {
  return this.validateInternal(input);
}
```

### 10.8 Bridge OCR — NM-2: `OcrConsentGuard`

```typescript
// modules/settlement-validator/guards/ocr-consent.guard.ts
@Injectable()
export class OcrConsentGuard implements CanActivate {
  constructor(private readonly consentRepo: ConsentLogRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user.id;

    const latest = await this.consentRepo.findLatestForUser(
      userId,
      'ocr_data_processing',
    );

    if (!latest || !latest.accepted) {
      throw new ForbiddenException({ code: 'consent_required' });
    }
    return true;
  }
}
```

### 10.9 Bridge OCR — NM-3: Endpoint refresh-signed-url

```typescript
// modules/ocr/ocr.controller.ts
@Post('refresh-signed-url')
@UseGuards(JwtAuthGuard, OcrConsentGuard)
@Throttle({ default: { limit: 10, ttl: 60_000 } })
async refreshSignedUrl(
  @CurrentUser() user,
  @Body() dto: RefreshSignedUrlDto,
): Promise<{ signedUrl: string; expiresAt: string }> {
  if (!dto.ocrObjectKey.startsWith(`${user.id}/`)) {
    throw new ForbiddenException('object_not_owned');
  }
  const signedUrl = await this.ocrService.generateSignedUrl(dto.ocrObjectKey, 900);
  return {
    signedUrl,
    expiresAt: addMinutes(new Date(), 15).toISOString(),
  };
}
```

Frontend:

```typescript
// hooks/use-signed-url-refresh.ts
export function useSignedUrlRefresh(objectKey: string, initialExpiresAt: string) {
  const [url, setUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);

  useEffect(() => {
    const msUntilExpiry = new Date(expiresAt).getTime() - Date.now();
    const refreshIn = Math.max(msUntilExpiry - 2 * 60_000, 0); // 2min antes

    const timer = setTimeout(async () => {
      const res = await api.post('/ocr/refresh-signed-url', { ocrObjectKey: objectKey });
      setUrl(res.data.signedUrl);
      setExpiresAt(res.data.expiresAt);
    }, refreshIn);

    return () => clearTimeout(timer);
  }, [objectKey, expiresAt]);

  return { url, expiresAt };
}
```

### 10.10 Bridge OCR — NM-4: Retornar `expiresAt`

```typescript
// Backend — incluir em todos os responses com signed URLs:
return {
  // ... outros campos ...
  imageSignedUrl: signedUrl,
  imageSignedUrlExpiresAt: addMinutes(new Date(), 15).toISOString(),
};
```

### 10.11 Bridge OCR — NM-5: `findManyForExport`

```typescript
// modules/settlement-validator/repositories/settlement-evaluation.repository.ts
async findManyForExport(filter: {
  userId: string;
  usedOcr?: boolean;
  evaluatedAt?: { gte?: Date; lte?: Date };
}): Promise<SettlementEvaluation[]> {
  return this.prisma.settlementEvaluation.findMany({
    where: {
      userId: filter.userId,
      ...(filter.usedOcr !== undefined && { usedOcr: filter.usedOcr }),
      ...(filter.evaluatedAt && { evaluatedAt: filter.evaluatedAt }),
      invalidatedAt: null,
    },
    orderBy: { evaluatedAt: 'desc' },
  });
}
```

---

## 11. Plano de beta privado

### 11.1 Objetivo

Validar **3 hipóteses** com usuários reais antes do lançamento público:

1. **Hipótese de utilidade:** o Espelho é claro e gera insight novo (>= 70% dos usuários reportam "entendi melhor minha situação")
2. **Hipótese de retenção:** usuário volta sozinho 3x em 30 dias (sem push)
3. **Hipótese de tom:** o tom sóbrio não desanima — beta retém 70%+ até dia 30

### 11.2 Critérios de seleção dos 10-20 testers

| Critério | Quantos | Razão |
|---|---|---|
| Endividados com renda < R$ 5k | 6-10 | Persona principal |
| Endividados com renda > R$ 5k | 2-4 | Comparação |
| Em provável `practical_insolvency` | 2-3 | Validar Modo Sobrevivência (caso sensível) |
| Já usaram apps financeiros | 5-8 | Comparação com Mobills, Organizze, etc. |
| Nunca usaram apps financeiros | 3-5 | Validar onboarding "minimal" |
| Idade 25-35 | 6-8 | — |
| Idade 36-50 | 6-8 | — |
| Idade 50+ | 2-3 | Acessibilidade, simplicidade |
| Mulheres | ≥ 50% | (público feminino é maioria dos superendividados no BR) |

**Total alvo: 15 pessoas.**

### 11.3 Instrumentação

**PostHog** para:
- Funnel do Onboarding Crítico (drop-off por passo)
- Tempo até primeiro Espelho
- Cliques em "Refinar" vs "Ignorar"
- Uso de OCR (vai existir só pra subgrupo Premium liberado)
- Distribuição de estados detectados
- Session recording (apenas com consentimento explícito do tester)

**Métricas-chave:**

| Métrica | Alvo | Sinaliza |
|---|---|---|
| Tempo médio do Onboarding Crítico | < 5min | UX bom |
| Drop-off no Onboarding | < 25% | Tela boa |
| Taxa de "Refinar" em 14 dias | > 40% | Refinamento Progressivo funciona |
| Voltas espontâneas em 30 dias (sem push) | ≥ 3x/usuário | Retenção orgânica |
| NPS no dia 14 | > 30 | Tom adequado |
| Reportes de "achei desumano/julgador" | 0 | Tom calibrado |

### 11.4 Cadência de feedback

- **Dia 0:** sessão de onboarding guiado por chamada de vídeo (~30min/tester)
- **Dia 7:** check-in via WhatsApp (3 perguntas)
- **Dia 14:** NPS + entrevista individual de 45min
- **Dia 30:** entrevista final + decisão de continuar/parar uso

### 11.5 LGPD do beta

**Consentimento específico do beta** registrado em `ConsentLog`:
- `consentType: 'beta_program'`
- Texto explica: session recording, gravação das entrevistas, uso de feedback agregado em material de marketing futuro (anonimizado)

**Compensação simbólica:** 12 meses de Premium grátis ao final do beta (R$ 118 valor).

**Direito de saída:** tester pode sair a qualquer momento. Dados são apagados conforme política normal (Fase 3 §16).

### 11.6 Riscos do beta

| Risco | Mitigação |
|---|---|
| Tester em `survival` real fica pior | Triagem prévia + acompanhamento humano + canal direto |
| Bug crítico no motor causa decisão errada | Feature flag para desabilitar features problemáticas; rollback rápido |
| Vazamento de dado sensível | Schema com partial indexes; logs com `redact`; LGPD audit log |
| Feedback negativo dominante | Critério de saída pra cancelar beta e refazer Fase 5 |

---

## 12. Acessibilidade

### 12.1 WCAG 2.1 AA — checklist

| Item | Implementação |
|---|---|
| Contraste mínimo 4.5:1 (texto normal) | tokens.css garante; teste com Axe DevTools |
| Contraste mínimo 3:1 (texto grande, ícones) | idem |
| Foco visível em todos os interativos | `:focus-visible` com outline 2px |
| Navegação por teclado completa | Tab order natural; skip links em layouts complexos |
| Labels ARIA em ícones-only | `aria-label` obrigatório |
| Tamanho mínimo de fonte | 14px (corpo); 12px só em metadados |
| Tamanho mínimo de alvo tocável | 44x44px |
| Movimento reduzido | `@media (prefers-reduced-motion)` desabilita animações |
| Screen readers | Headings hierárquicos (h1 → h2 → h3); landmarks (main, nav, footer) |
| Formulários acessíveis | Label associada via `htmlFor`; mensagens de erro com `aria-describedby` |

### 12.2 Caso específico — Modo Sobrevivência

Em estado crítico, **toda a interface precisa ser ainda mais clara**:
- Fonte 1 tamanho maior (`text-lg` como base)
- Contraste 7:1 (AAA)
- Sem animações
- Texto pode ser lido em voz alta sem ambiguidade

---

## 13. Performance

### 13.1 Core Web Vitals (alvos)

| Métrica | Alvo |
|---|---|
| LCP (Largest Contentful Paint) | < 2.5s |
| INP (Interaction to Next Paint) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

### 13.2 Decisões de arquitetura para performance

- **Server Components por padrão** — só vira Client Component quando há interatividade
- **Streaming SSR** para a home (envia estrutura, hidrata depois)
- **Suspense boundaries** em volta de queries lentas
- **Imagens via `next/image`** com lazy loading default
- **Fontes locais** (sem fetch externo de Google Fonts)
- **Bundle splitting** automático do Next 15

### 13.3 Caches no cliente

- TanStack Query mantém cache em memória + persiste em `localStorage` para o que não é sensível
- Zustand auth store NÃO persiste em localStorage (cookie httpOnly cuida)
- Dados estáticos (DebtCategory, SupportChannel) com `staleTime: Infinity` + invalidação por evento

---

## 14. Próximos passos (Fase 6)

Com a Fase 5 especificada, a **Fase 6 — Plano de Migração** define:

- Ordem de aplicação das **16 migrations**
- Estratégia de feature flags (PostHog) para liberar gradualmente
- Preservação de dados dos testers do beta privado
- Riscos da migração (schema breaking, deploy zero-downtime)
- Comparação com o código atual: o que migrar primeiro, o que reescrever, o que descartar
- Cronograma estimado em semanas
- Critérios de "GO/NO-GO" para o lançamento público

---

*Fim do documento da Fase 5.*
