---
title: Mobile - Stores (Zustand)
tags: [mobile, zustand, state, auth]
created: 2026-05-04
---

# Mobile - Stores (Zustand)

Stores de estado client-side em `apps/mobile/src/stores/`. Stack: [[05-mobile-arquitetura]].

Hoje existe apenas uma store, `useAuthStore`. O servidor-state (debts, financial, dashboard, profile) vive em hooks React Query — ver [[05d-providers-hooks]].

## `useAuthStore` — `src/stores/auth.ts`

Store unica de autenticacao + perfil "leve". Persiste o token em `expo-secure-store`.

### Tipos

```ts
type AuthUser = Pick<
  User,
  | "id" | "name" | "email" | "phone"
  | "avatarInitials" | "onboardingCompleted"
  | "onboardingStep" | "planType" | "discreteMode"
>;
```

`User` vem de `@quita/shared` — ver [[03-banco-de-dados]].

### Shape do estado

| Campo | Tipo | Inicial | Significado |
|---|---|---|---|
| `user` | `AuthUser \| null` | `null` | usuario autenticado (subset do `User` da API) |
| `token` | `string \| null` | `null` | JWT em memoria (espelho do SecureStore) |
| `isAuthenticated` | `boolean` | `false` | flag derivada (setada no login/register/loadToken) |
| `isLoading` | `boolean` | `true` | comeca `true` para o gate em `app/index.tsx` mostrar `ActivityIndicator` ate `loadToken` resolver |

### Actions

| Action | Endpoint / efeito | Comportamento |
|---|---|---|
| `login(email, password)` | `POST /auth/login` | Salva `accessToken` no SecureStore. Em sucesso: seta `user`, `token`, `isAuthenticated: true`, `isLoading: false`. Em erro: apenas `isLoading: false` e re-throw. |
| `register(name, email, phone, password)` | `POST /auth/register` | Identico ao login mas no endpoint de registro. |
| `logout()` | `SecureStore.deleteItemAsync("accessToken")` | Limpa store: `user`, `token` => `null`, `isAuthenticated: false`. |
| `loadToken()` | `GET /auth/me` (se tiver token) | Le `accessToken` do SecureStore; se existir, busca `/auth/me` e hidrata `user`. Em qualquer erro, deleta a chave e zera o estado. Sempre seta `isLoading: false` no fim. |
| `setUser(user)` | — | Atualiza apenas o objeto `user`. Usado pelos hooks de onboarding (`useSaveIncome`, `useSaveCategories`, `useSaveDebts`, `useSaveExpenses`, `useCompleteOnboarding`) e profile (`useUpdateProfile`, `useToggleDiscreteMode`) para refletir mudancas server-side sem refetch do `/auth/me`. |

### Boot lifecycle

`AuthInit` em `app/_layout.tsx` chama `loadToken()` no `useEffect` de mount. Ate isso resolver, o gate `app/index.tsx` exibe `ActivityIndicator` por causa de `isLoading: true` inicial.

### Integracao com axios

O interceptor de resposta em `src/services/api.ts` (ver [[05c-services]]) faz logout automatico em `401` para qualquer endpoint que **nao** seja `/auth/login` ou `/auth/register`. Ele importa a store via `require("../stores/auth")` (lazy require para evitar dependencia circular) e dispara `useAuthStore.getState().logout()`.

## SecureStore — chaves usadas no app

| Chave | Onde | Uso |
|---|---|---|
| `accessToken` | `stores/auth.ts`, `services/api.ts` | JWT bearer; lido pelo interceptor de request a cada chamada e por `loadToken` no boot. Apagado em `logout` e quando o response interceptor recebe `401` fora dos endpoints de auth. |
| `rememberedEmail` | telas `(auth)/login` / `(auth)/register` | Email memorizado para preencher o login. (Ver [[07-telas-auth]].) |
| `rememberMe` | telas `(auth)/login` | Flag "lembrar de mim" persistida. (Ver [[07-telas-auth]].) |

## Outras stores

Nenhuma. Estado de telas (forms de onboarding/modais) e mantido localmente em `useState` ou propagado via React Query cache. Listagens (`debts`, `incomes`, `expenses`, `dashboard`, `notificationPrefs`, `profile`, `debtCategories`, `financialSummary`) sao todas server-state em hooks (ver [[05d-providers-hooks]]).
