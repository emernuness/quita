---
title: Mobile - Providers e Hooks
tags: [mobile, react-query, hooks, providers]
created: 2026-05-04
---

# Mobile - Providers e Hooks

Cobre `apps/mobile/src/providers/` e `apps/mobile/src/hooks/`. Stack em [[05-mobile-arquitetura]]; cliente HTTP em [[05c-services]]; store de auth em [[05b-stores]].

## Providers

### `QueryProvider` — `src/providers/QueryProvider.tsx`

Wrapper de `@tanstack/react-query` com um `QueryClient` singleton.

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s
      retry: 2,
    },
  },
});

export { queryClient };

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

Pontos:

- `staleTime` padrao = 30s (alguns hooks sobrescrevem — `useDebtCategories` usa 5 min porque categorias raramente mudam).
- `retry: 2` para queries (mutations herdam o default do React Query, que e `0`).
- `queryClient` exportado nominalmente para usos pontuais (ex.: `prefetch`, `invalidateQueries` fora de hooks).
- Posicao na arvore: e o componente mais externo, dentro de `app/_layout.tsx` (ver [[05-mobile-arquitetura#Sequencia de boot]]).

Nao ha `ReactQueryDevtools` no mobile.

## Hooks customizados

Todos os hooks encapsulam React Query (`useQuery` / `useMutation`) sobre o cliente `api` (ver [[05c-services]]). Cada mutation invalida as `queryKey` afetadas para manter consistencia.

### `useAuth` — `src/hooks/useAuth.ts`

Re-exporta a store Zustand, sem hook proprio:

```ts
export { useAuthStore } from "../stores/auth";
export type { AuthUser } from "../stores/auth";
```

Para detalhes do shape, ver [[05b-stores]].

### `useDashboard` — `src/hooks/useDashboard.ts`

| Hook | Tipo | Endpoint | queryKey | Notas |
|---|---|---|---|---|
| `useDashboard()` | `useQuery` | `GET /dashboard` | `["dashboard"]` | Retorna `DashboardData` (totais, contagens, lista de divides com `category`). `staleTime: 30s`. |

### `useDebts` — `src/hooks/useDebts.ts`

| Hook | Tipo | Endpoint | queryKey / efeitos |
|---|---|---|---|
| `useDebts()` | `useQuery` | `GET /debts` | `["debts"]` |
| `useDebt(id)` | `useQuery` | `GET /debts/:id` | `["debts", id]`; `enabled: !!id` |
| `useCreateDebt()` | `useMutation` | `POST /debts` | invalida `["debts"]`, `["dashboard"]` |
| `useUpdateDebt()` | `useMutation` | `PATCH /debts/:id` | invalida `["debts"]`, `["debts", id]`, `["dashboard"]` |
| `useDeleteDebt()` | `useMutation` | `DELETE /debts/:id` | invalida `["debts"]`, `["dashboard"]` |
| `useCreatePayment(debtId)` | `useMutation` | `POST /debts/:debtId/payments` | invalida `["debts"]`, `["debts", debtId]`, `["dashboard"]` |
| `useUndoPayment(debtId)` | `useMutation` | `DELETE /debts/:debtId/payments/:paymentId` | invalida `["debts"]`, `["debts", debtId]`, `["dashboard"]` |
| `useDebtCategories()` | `useQuery` | `GET /debts/categories` | `["debtCategories"]`; `staleTime: 5 min` |

`useDebt(id)` retorna `DebtDetail extends Debt` com `category: DebtCategory` e `payments: Payment[]` populados.

### `useFinancial` — `src/hooks/useFinancial.ts`

| Hook | Tipo | Endpoint | queryKey / efeitos |
|---|---|---|---|
| `useIncomes()` | `useQuery` | `GET /financial/incomes` | `["incomes"]` |
| `useCreateIncome()` | `useMutation` | `POST /financial/incomes` | invalida `["incomes"]`, `["financialSummary"]`, `["dashboard"]` |
| `useUpdateIncome()` | `useMutation` | `PATCH /financial/incomes/:id` | idem |
| `useDeleteIncome()` | `useMutation` | `DELETE /financial/incomes/:id` | idem |
| `useExpenses()` | `useQuery` | `GET /financial/expenses` | `["expenses"]` |
| `useCreateExpense()` | `useMutation` | `POST /financial/expenses` | invalida `["expenses"]`, `["financialSummary"]`, `["dashboard"]` |
| `useUpdateExpense()` | `useMutation` | `PATCH /financial/expenses/:id` | idem |
| `useDeleteExpense()` | `useMutation` | `DELETE /financial/expenses/:id` | idem |
| `useFinancialSummary()` | `useQuery` | `GET /financial/summary` | `["financialSummary"]`; retorna `{ totalIncome, totalExpenses, available }` |

### `useOnboarding` — `src/hooks/useOnboarding.ts`

Mutacoes do fluxo de onboarding. Cada uma faz `setUser` na auth store (ver [[05b-stores]]) com o novo `onboardingStep` retornado pela API, garantindo que o gate em `app/index.tsx` recalcule o destino.

| Hook | Endpoint | Efeito client |
|---|---|---|
| `useSaveIncome()` | `POST /onboarding/income` | `setUser({ ...user, onboardingStep })` |
| `useSaveCategories()` | `POST /onboarding/categories` | idem |
| `useSaveDebts()` | `POST /onboarding/debts` (array) | idem |
| `useSaveExpenses()` | `POST /onboarding/expenses` | idem |
| `useCompleteOnboarding()` | `POST /onboarding/complete` | `setUser({ ...user, onboardingCompleted: true })` + `invalidateQueries(["dashboard"])` |

### `useProfile` — `src/hooks/useProfile.ts`

| Hook | Tipo | Endpoint | Efeitos |
|---|---|---|---|
| `useProfile()` | `useQuery` | `GET /profile` | `["profile"]` |
| `useUpdateProfile()` | `useMutation` | `PATCH /profile` | invalida `["profile"]`; faz merge no `user` da auth store |
| `useChangePassword()` | `useMutation` | `PATCH /profile/password` | sem cache |
| `useUpdateSecurity()` | `useMutation` | `PATCH /profile/security` | invalida `["profile"]` |
| `useToggleDiscreteMode()` | `useMutation` | `PATCH /profile/discrete-mode` | invalida `["profile"]`; sincroniza `discreteMode` na auth store |
| `useNotificationPrefs()` | `useQuery` | `GET /profile/notifications` | `["notificationPrefs"]` |
| `useUpdateNotificationPrefs()` | `useMutation` | `PATCH /profile/notifications` | invalida `["notificationPrefs"]` |

## Utils relacionados

`src/utils/masks.ts`:

- `maskPhone(raw)` / `unmaskPhone(masked)` — formato BR `(XX) XXXXX-XXXX` (10 ou 11 digitos).
- `maskCurrency(raw)` / `unmaskCurrency(masked)` — formato `R$ 1.234,56`.
- `maskDate(raw)` / `unmaskDate(masked)` — formato `DD/MM/AAAA` => ISO `YYYY-MM-DD`, com validacao de dia/mes/ano (`>= 2000`, `<= 2100`).

`src/utils/validation.ts`:

- `validateWithZod(schema, data)` — roda `safeParse` e retorna `{ success: true, data }` ou `{ success: false, errors: Record<string, string> }` com chaves no formato `path.join(".")` (ou `_root` quando o issue nao tem path).
- Tradutor PT-BR coberto: `Required`, `too_small` (string/number/array), `invalid_string` (`email`, `uuid`), e os textos `"Invalid email"`, `"Telefone brasileiro"`, `"Invalid date"`, `"Invalid uuid"`, `"String must contain at least N character(s)"`. Os schemas Zod de origem vivem em `@quita/shared`.

## Convencoes de queryKey

| Domínio | queryKey raiz |
|---|---|
| Dashboard | `["dashboard"]` |
| Dividas | `["debts"]`, `["debts", id]`, `["debtCategories"]` |
| Financas | `["incomes"]`, `["expenses"]`, `["financialSummary"]` |
| Perfil | `["profile"]`, `["notificationPrefs"]` |

A invalidacao cruzada (mutacoes em divida/financa => `["dashboard"]`) garante que a tela inicial sempre reflita o estado mais recente sem refetch manual.
