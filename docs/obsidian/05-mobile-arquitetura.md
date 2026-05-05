---
title: Mobile - Arquitetura
tags: [mobile, expo, react-native, arquitetura]
created: 2026-05-04
---

# Mobile - Arquitetura

Documentacao da arquitetura do app mobile Quita (`apps/mobile/`). Para o mapa de rotas veja [[05a-roteamento]], stores em [[05b-stores]], services em [[05c-services]], providers e hooks em [[05d-providers-hooks]] e o inventario de UI em [[06-componentes]].

## Stack

Definida em `apps/mobile/package.json`.

| Camada | Tecnologia | Versao |
|---|---|---|
| Plataforma | Expo SDK | `~54.0.34` |
| Runtime | React Native | `~0.81.5` |
| UI | React | `^19.1.0` |
| Roteamento | `expo-router` | `~6.0.23` (file-based) |
| Server state | `@tanstack/react-query` | `^5.90.21` |
| Client state | `zustand` | `^5.0.11` |
| HTTP | `axios` | `^1.13.6` |
| Storage seguro | `expo-secure-store` | `~15.0.8` |
| Tipografia | `@expo-google-fonts/plus-jakarta-sans` + `expo-font` | `^0.4.2` / `~14.0.11` |
| Visual | `expo-linear-gradient` | `~15.0.8` |
| Validacao | `zod` | `^3.25.76` |
| Splash nativo | `expo-splash-screen` | `~31.0.13` |
| Icones | `@expo/vector-icons` (Feather) | `^15.1.1` |
| Date picker | `@react-native-community/datetimepicker` | `8.4.4` |
| Safe area | `react-native-safe-area-context` | `~5.6.2` |
| Tipos compartilhados | `@quita/shared` (workspace) | — |

Entry-point declarado em `package.json#main`: `expo-router/entry`.

## Estrutura de pastas

```
apps/mobile/
  app/                 # rotas (file-based, expo-router) — ver [[05a-roteamento]]
    _layout.tsx        # root layout (fonts, splash, providers)
    index.tsx          # roteador inicial (auth/onboarding/tabs)
    splash.tsx         # tela de boas-vindas com fundo animado
    (auth)/
    (onboarding)/
    (tabs)/
    (modals)/
  src/
    components/        # UI reutilizavel — ver [[06-componentes]]
    hooks/             # hooks React Query — ver [[05d-providers-hooks]]
    providers/         # QueryProvider — ver [[05d-providers-hooks]]
    services/          # axios client — ver [[05c-services]]
    stores/            # Zustand stores — ver [[05b-stores]]
    theme/tokens.ts    # tokens de marca (cores, fontes, spacing) — ver [[08-brand]]
    utils/             # masks (BR), validacao Zod
  assets/
    brand/             # logo-01..04, icon-01..03, icone.png/svg, logo.svg
    icon.png
    adaptive-icon.png
  babel.config.js      # preset expo
  metro.config.js      # watchFolders monorepo + nodeModulesPaths
  tsconfig.json        # estende ../../tooling/typescript/react-native.json
  app.json
  package.json
```

## Path aliases (`tsconfig.json`)

```json
"paths": {
  "@quita/shared": ["../../packages/shared/src"],
  "@/*": ["./src/*"]
}
```

- `@/*` resolve para `apps/mobile/src/*` (ex.: `@/theme/tokens`, usado em `app/index.tsx` e `app/splash.tsx`).
- `@quita/shared` aponta direto para o source do pacote workspace.

## Metro / monorepo

`apps/mobile/metro.config.js` ajusta o resolver para o monorepo:

- `config.watchFolders = [monorepoRoot]` (raiz `quita/`).
- `config.resolver.nodeModulesPaths` inclui `apps/mobile/node_modules` e a raiz.

Sem isso o Metro nao acharia simbolos de `@quita/shared`.

## Babel

`babel.config.js` usa apenas `babel-preset-expo`. Sem plugin de alias custom — os aliases sao resolvidos via `tsconfig.json` + Metro padrao do Expo SDK 54.

## Sequencia de boot (`app/_layout.tsx`)

1. **Trava o splash nativo** antes de qualquer render: `SplashScreen.preventAutoHideAsync().catch(() => {})` no top-level do modulo.
2. **Carrega fontes Plus Jakarta Sans** via `useFonts` (400, 500, 600, 700). Enquanto `fontsLoaded === false`, retorna `null` — nada e renderizado.
3. Quando `fontsLoaded` vira `true`, um `useEffect` chama `SplashScreen.hideAsync()`.
4. **Renderiza a arvore**:
   - `<QueryProvider>` (ver [[05d-providers-hooks]]) envolve tudo.
   - `<AuthInit />` componente vazio que dispara `useAuthStore(s => s.loadToken)` em um `useEffect` (ver [[05b-stores]]).
   - `<StatusBar style="dark" />`.
   - `<Stack screenOptions={{ headerShown: false }}>` registrando os grupos `splash`, `(auth)`, `(onboarding)`, `(tabs)` e `(modals)` (este ultimo com `presentation: "modal"`).

Logo em seguida, `app/index.tsx` decide o destino inicial olhando `useAuthStore()`:

- `isLoading` => `ActivityIndicator` centralizado.
- `!isAuthenticated` => `Redirect` para `/splash`.
- `user?.onboardingCompleted === false`:
  - `onboardingStep >= 3` => `/(onboarding)/expenses`
  - `onboardingStep >= 1` => `/(onboarding)/categories`
  - caso contrario => `/(onboarding)/income`
- Onboarding completo => `/(tabs)`.

## Convencoes

- Componentes funcionais, sem class components.
- Estilizacao via `StyleSheet.create` consumindo `colors`, `fonts`, `radius`, `spacing` de `src/theme/tokens.ts` (ver [[08-brand]]).
- TypeScript strict herdado de `tooling/typescript/react-native.json`.
- Erros HTTP traduzidos para PT-BR no interceptor de `services/api.ts` (ver [[05c-services]]).
