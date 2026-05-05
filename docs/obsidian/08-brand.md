---
title: "Brand · Sistema de Design Quita"
tags: [brand, design-system, tokens, ui]
fonte: quita-brand.json (v1.0)
implementacao: apps/mobile/src/theme/tokens.ts
---

# 08 · Brand · Sistema de Design Quita

> Identidade visual e tokens de design do Quita. Fonte da verdade: `quita-brand.json` v1.0. Implementação: [apps/mobile/src/theme/tokens.ts](../../apps/mobile/src/theme/tokens.ts).

## Identidade

| Campo | Valor |
| --- | --- |
| Nome | **Quita** |
| Tagline | Aplicativo de organização financeira de dívidas |
| Versão da marca | 1.0 |
| Ano | 2025 |
| Idioma | pt-BR |

Nome do app no `app.json`: `Quita`. Bundle: `com.quita.app`.

## Paleta de Cores

### Primárias

| Token | Nome | Hex | Uso | Swatch |
| --- | --- | --- | --- | --- |
| `brandTealDark` | Teal Dark | `#0A5248` | Principal · fundo do ícone | <span style="background:#0A5248;color:#fff;padding:2px 12px;border-radius:4px">#0A5248</span> |
| `accentGreen` | Accent Green | `#3DC55C` | Ações principais · destaques | <span style="background:#3DC55C;color:#fff;padding:2px 12px;border-radius:4px">#3DC55C</span> |

### Secundárias

| Token | Nome | Hex | Uso |
| --- | --- | --- | --- |
| `brandTealMid` / `accentTealMid` | Teal Mid | `#0E6B58` | Q logo · variantes |
| `accentGreenLight` | Green Light | `#5DD67A` | Hover · destaque suave |
| `brandNavy` | Navy | `#1A2030` | Texto · fundo escuro |

### Neutros

| Token | Nome | Hex |
| --- | --- | --- |
| `white` | White | `#FFFFFF` |
| `gray100` / `background` | Gray 100 | `#F4F6F4` |
| `gray200` / `border` | Gray 200 | `#E4E8E5` |
| `gray400` / `textTertiary` | Gray 400 | `#9AA59C` |
| `gray600` / `textSecondary` | Gray 600 | `#5A6560` |

### Semânticas

| Token | Nome | Hex | Label | Background do badge | Texto do badge |
| --- | --- | --- | --- | --- | --- |
| `dangerRed` | Rust Coral | `#B85430` | Vencido | `#F9EAE5` | `#7A2D14` |
| `warningOrange` | Âmbar Dourado | `#C48E1C` | Vence em breve | `#F9F0DC` | `#7A5810` |
| `successGreen` | Verde Acento | `#2EA84A` | Quitado | `#DFF5E8` | `#115C28` |
| `infoTeal` | Teal Médio | `#0E8C74` | Dica | `#DFF2EE` | `#065848` |
| `gray400` | Pendente (neutro) | `#9AA59C` | Pendente | `#F4F6F4` | `#5A6560` |

> Paleta semântica derivada da identidade — sem vermelho, azul ou laranja genéricos.

## Tipografia

**Família única:** Plus Jakarta Sans (Google Fonts). Carregada via `@expo-google-fonts/plus-jakarta-sans` em [apps/mobile/app/_layout.tsx](../../apps/mobile/app/_layout.tsx) (linhas 1-7, 28-33).

### Pesos disponíveis

| Token (`fonts`) | Peso | PostScript |
| --- | --- | --- |
| `body` | 400 | `PlusJakartaSans_400Regular` |
| `bodyMedium` | 500 | `PlusJakartaSans_500Medium` |
| `bodySemiBold` | 600 | `PlusJakartaSans_600SemiBold` |
| `heading` / `mono` | 700 | `PlusJakartaSans_700Bold` |

### Escala (do `fontSizes` em tokens.ts)

| Estilo | px | Peso | line-height | Cor padrão | Uso |
| --- | --- | --- | --- | --- | --- |
| Display / H1 | 28 | 700 | 35 (1.25) | `#1A2030` | Título de tela, hero |
| H2 | 20 | 700 | 26 (1.3) | `#1A2030` | Seção |
| H3 | 16 | 600 | 22 (1.4) | `#1A2030` | Subtítulo |
| Body | 14 | 400 | 22 (1.6) | `#1A2030` | Texto corrido |
| Caption | 12 | 400 | 18 (1.5) | `#5A6560` | Auxiliar |
| Label / Tag | 11 | 700 | — | `#9AA59C` | UPPERCASE, letter-spacing 0.06em |
| Numeric / Destaque | 32+ | 700 | — | `#0A5248` | tabular-nums, valores monetários grandes |

> Letra `Q` define a área de proteção do logo (clear space).

## Espaçamento (`spacing`)

| Token | px |
| --- | --- |
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 24 |
| `xxl` | 32 |
| `xxxl` | 48 |

## Border-radius (`radius`)

| Token | px | Aplicação |
| --- | --- | --- |
| `input` | 4 | Inputs |
| `sm` | 8 | Botões |
| `md` | 12 | Cards |
| `card` | 14 | Cards específicos do brand (debt/metric) |
| `lg` | 16 | Modais |
| `page` | 20 | Sheets de página |
| `xl` | 24 | — |
| `pill` | 26 | Pills |
| `full` | 9999 | Avatares e círculos |

## Componentes-chave

Variantes de botão, badges e cards estão materializadas em [[06-componentes]]. Resumo:

- **Button primary** — fundo `#0A5248`, texto `#FFFFFF`, padding `10px 20px`, radius `8px`, peso 600.
- **Button secondary** — borda `1.5px #0A5248`, texto `#0A5248`.
- **Button ghost (verde)** — borda `1.5px #3DC55C`, texto `#3DC55C`. Usado para CTAs tipo "Ver dicas".
- **Button destructive** — fundo `#B85430`, texto branco.
- **Badges** — `padding 4px 10px`, `radius 20px`, dot 6px, peso 600.
- **Debt card** — fundo `#FFFFFF`, borda `0.5px #E4E8E5`, radius `14px`, padding `14px`. Cor do amount muda por status.
- **Metric card** — fundo `#F4F6F4`, valor `22px / 700`, label `11px / #9AA59C`.
- **Priority list item** — rank badge `24px` circular, name `13px / 600`.

Ver [[06-componentes]] para o código React Native que implementa cada um.

## Logos

Arquivos em `apps/mobile/assets/brand/`. Aplicação por fundo:

| Arquivo | Variante | Fundo aprovado | Hex de referência |
| --- | --- | --- | --- |
| `logo-01.png` | Fundo claro | Light | `#F4F6F4` |
| `logo-02.png` | Fundo escuro | Dark | `#1A2030` |
| `logo-03.png` | Fundo teal | Teal | `#0A5248` |
| `logo-04.png` | Monocromático | Black | `#0D0D0D` |

### Ícones

| Arquivo | Variante |
| --- | --- |
| `icon-01.png` | Teal (default) |
| `icon-02.png` | Fundo escuro |
| `icon-03.png` | Fundo claro |

Tamanhos canônicos: 72px (radius 18, default), 48px (radius 12), 32px (radius 8).

### Onde estão usados

- **Splash do app** — [apps/mobile/app/splash.tsx](../../apps/mobile/app/splash.tsx) usa `logo-04.png` sobre fundo escuro com gradient teal e fade entre 5 imagens de fundo (Unsplash, ciclo `FADE_MS=1400ms` / `HOLD_MS=4200ms`).
- **App icon (iOS / Android)** — `app.json` aponta para `icon-01.png`. Adaptive icon Android: foreground `icon-01.png` sobre `#0A5248`.
- **Splash nativo do Expo** — `logo-01.png` sobre `#F4F6F4` (`app.json > expo.splash`).
- **Telas de auth** — login/register/forgot-password usam `logo-01.png` (fundo claro).

## Voice & Tone

Quatro princípios obrigatórios:

1. **Direto** — Vai direto ao ponto. Sem enrolação. As pessoas já têm estresse financeiro suficiente.
2. **Encorajador** — Reconhece o esforço. Celebra pequenas conquistas como o pagamento de uma conta.
3. **Confiável** — Informações precisas, sem julgamento. O app é um aliado, não um cobrador.
4. **Humano** — Linguagem simples, próxima. Fala como um amigo que entende de finanças.

### Use

- "Conta quitada! Você está no caminho certo."
- "Atenção: essa fatura vence em 3 dias."

### Evite

- "Parabéns! Você liquidou sua obrigação financeira!"
- "INADIMPLÊNCIA DETECTADA. Regularize agora."

## Regras de Uso

### Faça

- Usar o logotipo nas variações aprovadas
- Respeitar a área de proteção do logo (altura da letra "Q")
- Usar cores da paleta oficial
- Manter proporções originais do ícone
- Usar Plus Jakarta Sans como fonte
- Accent green apenas em ações e destaques

### Não faça

- Distorcer ou redimensionar o logo
- Adicionar sombras ou efeitos ao logo
- Usar cores não aprovadas na paleta
- Colocar logo sobre fundos complexos
- Usar o ícone sem fundo teal
- Alterar a diagonal verde do "Q"

## Onde os tokens vivem no código

| Token | Arquivo |
| --- | --- |
| `colors`, `fonts`, `fontSizes`, `lineHeights`, `spacing`, `radius`, `badges` | [apps/mobile/src/theme/tokens.ts](../../apps/mobile/src/theme/tokens.ts) |
| Carregamento das fontes | [apps/mobile/app/_layout.tsx](../../apps/mobile/app/_layout.tsx) |
| Ícone e splash nativos | [apps/mobile/app.json](../../apps/mobile/app.json) |
| Splash visual customizado | [apps/mobile/app/splash.tsx](../../apps/mobile/app/splash.tsx) |
| Brand source-of-truth | `quita-brand.json` (fora do repo, em iCloud Drive) |

## Notas relacionadas

- [[01-arquitetura]]
- [[06-componentes]]
- [[07a-telas-onboarding]]
- [[09-shared]]
- [[13-status-projeto]]
