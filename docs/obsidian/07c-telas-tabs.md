---
title: 07c - Telas Tabs (Início e Plano)
tags: [mobile, telas, tabs]
created: 2026-05-04
---

# 07c - Telas das Tabs (Início e Plano)

Tabs principais do app autenticado. Layout do tab bar em `apps/mobile/app/(tabs)/_layout.tsx`.

## Layout das Tabs

- **Caminho:** `apps/mobile/app/(tabs)/_layout.tsx`
- **Componente:** `TabLayout` usa `<Tabs>` do Expo Router com `tabBar={(props) => <CustomTabBar {...props} />}`.
- **Tabs registradas:**
  - `index` → "Início" (icon Feather `home`)
  - `finances` → "Finanças" (icon `bar-chart-2`)
  - `plan` → "Plano" (icon `map`)
  - `profile` → "Perfil" (icon `user`)
- **CustomTabBar:** Pressables custom com Feather icons; cor ativa `colors.brandTealDark`, inativa `colors.textTertiary`. Padding-bottom 28 no iOS, `spacing.md` no Android. `accessibilityRole="button"` e `accessibilityState.selected` quando focada.
- `headerShown: false` em todas as telas. Cada aba expande seu próprio Stack interno em `finances/_layout.tsx` e `profile/_layout.tsx`.

## Tela Início (Hoje / Home)

- **Caminho:** `apps/mobile/app/(tabs)/index.tsx`
- **Rota:** `/(tabs)` ou `/(tabs)/index`
- **O que o usuário vê:**
  - Loader (`ActivityIndicator`) enquanto `useDashboard` está carregando.
  - Header com saudação `"Oi, {firstName}!"` (deriva do `user.name` em [[05-stores]]) + subtítulo "Vamos quitar mais uma?". Botão de sino à direita que abre `/(tabs)/profile/notifications`.
  - **Card principal — Total de dívidas**: usa `formatBRL(data.totalDebt)` ([[09-shared]]). Subtexto "X contas em atraso · Y no total".
  - **Saldo do mês**: dois cards lado a lado — "Entra" (verde) e "Sai em fixas" (vermelho), formatados com `formatBRLCompact`.
  - **Card destaque — Sobra pra dívidas**: card brand teal com `surplusForDebts` em compact.
  - **Próxima ação recomendada**: card teal mostrando primeira dívida não-paga (`data.debts[0]`) com creditor, valor restante, categoria e botão **Ver detalhes** que vai para `/(tabs)/debts/${id}` (rota cast como `any`).
  - **Progresso**: barra preenchida pela `progressPercent` do dashboard + texto "X de Y dívidas quitadas".
- **O que pode fazer:** sino → notifications, "Ver detalhes" → detalhe da dívida.
- **Estado:** sem `useState` próprio — apenas hooks `useDashboard()` (query) e `useAuthStore` (zustand).
- **Chamadas de API:** `useDashboard()` → `GET /dashboard` ou similar (ver [[04c-api-financial]] / hooks `useDashboard`).
- **Componentes:** não importa nada de `src/components` aqui — uso direto de Pressable + tokens.

## Tela Plano

- **Caminho:** `apps/mobile/app/(tabs)/plan.tsx`
- **Rota:** `/(tabs)/plan`
- **O que o usuário vê:**
  - Título "Meu plano" + subtítulo "Gerado com base nos seus dados."
  - **Hero card** brand teal com duas colunas: "Livre das dívidas em **8 meses**" e "Economia em juros **R$ 1.230**". Pílula de estratégia "Estratégia: Começar pelo menor".
  - **Linha do tempo**: 4 itens (`TIMELINE` constante): Abril 2025 (current), Mai–Jun 2025, Jul–Out 2025, Nov 2025–Fev 2026. Cada item tem dot (current = teal grande / completed = verde / outros = border) e linha vertical conectando.
  - **AI Explanation Card**: "Como o plano foi montado" com texto explicativo.
- **O que pode fazer:** atualmente apenas leitura — sem interações nem botões funcionais.
- **Estado local:** nenhum (`TIMELINE` é constante hard-coded).
- **Chamadas de API:** **nenhuma ainda** — toda a tela é mock estático.
- **Componentes:** apenas tokens locais, sem imports de `src/components`.

## Notas relacionadas

- [[07-telas-overview]]
- [[07a-telas-auth]]
- [[07b-telas-onboarding]]
- [[07d-telas-financas]]
- [[07e-telas-profile]]
- [[07f-telas-modais]]
- [[04c-api-financial]]
- [[05-stores]]
- [[09-shared]]
