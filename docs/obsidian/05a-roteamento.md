---
title: Mobile - Roteamento
tags: [mobile, expo-router, rotas]
created: 2026-05-04
---

# Mobile - Roteamento

Mapa real do diretorio `apps/mobile/app/`. O roteamento e file-based via `expo-router` 6 (ver [[05-mobile-arquitetura]]). Todos os screens sao registrados em [[05-mobile-arquitetura#Sequencia de boot]] pelo `_layout.tsx` raiz.

Sobre cada tela em si, ver [[07-telas-auth]], [[07-telas-onboarding]], [[07-telas-tabs]] e [[07-telas-modals]] (a serem detalhadas).

## Arvore de rotas

```
app/
- _layout.tsx                            # raiz: providers, fontes, Stack root
- index.tsx                              # router gate (auth/onboarding/tabs)
- splash.tsx                             # tela de boas-vindas (carrossel de fundo)
- (auth)/
  - _layout.tsx
  - login.tsx                            # /(auth)/login
  - register.tsx                         # /(auth)/register
  - forgot-password.tsx                  # /(auth)/forgot-password
- (onboarding)/
  - _layout.tsx
  - income.tsx                           # passo 0 → renda
  - categories.tsx                       # passo 1 → categorias de divida
  - debt-detail.tsx                      # passo 2 → detalhes de cada divida
  - expenses.tsx                         # passo 3 → despesas
- (tabs)/
  - _layout.tsx                          # tab navigator + CustomTabBar
  - index.tsx                            # tab "Inicio"
  - plan.tsx                             # tab "Plano"
  - finances/
    - _layout.tsx                        # stack interno da tab "Financas"
    - index.tsx                          # lista de financas
    - charts.tsx                         # graficos
    - [id].tsx                           # detalhe (rota dinamica)
  - profile/
    - _layout.tsx                        # stack interno da tab "Perfil"
    - index.tsx                          # perfil principal
    - notifications.tsx
    - security.tsx
    - discrete-mode.tsx
    - export-data.tsx
    - export-requested.tsx
- (modals)/
  - _layout.tsx                          # presentation: "modal" no Stack root
  - new-debt.tsx
  - new-expense.tsx
  - new-income.tsx
  - new-item-picker.tsx
  - pay-debt.tsx
  - payment-confirmed.tsx
  - blue-mode.tsx
  - critical.tsx
  - celebration.tsx
```

## Grupos (route groups)

Os parenteses em `(auth)`, `(onboarding)`, `(tabs)` e `(modals)` sao grupos do Expo Router — agrupam rotas sem aparecer no path. As URLs reais sao, por exemplo, `/login`, `/income`, `/finances/charts`, etc., embora os redirects no codigo (`app/index.tsx`) usem o caminho qualificado `/(onboarding)/expenses` para clareza.

## Modais

O layout raiz registra:

```tsx
<Stack.Screen name="(modals)" options={{ presentation: "modal" }} />
```

Com isso, todas as rotas do grupo `(modals)/` abrem com a apresentacao nativa de modal (slide-up no iOS). Sao usadas para fluxos curtos: criar divida/renda/despesa, confirmar pagamento, telas de celebracao, modo critico/azul ("blue-mode" reflete o "modo discreto" — ver [[05b-stores]] e [[06-componentes]]).

## Stacks aninhados

- `(tabs)/finances/_layout.tsx` define um stack proprio para a aba Financas (lista, graficos, detalhe `[id]`).
- `(tabs)/profile/_layout.tsx` define o stack do Perfil (notificacoes, seguranca, modo discreto, exportacao).

## Rotas dinamicas

- `(tabs)/finances/[id].tsx` — detalhe de divida/lancamento. Consumido pelos hooks `useDebt(id)` em [[05d-providers-hooks]].
