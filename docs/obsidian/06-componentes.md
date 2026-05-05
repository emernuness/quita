---
title: Mobile - Inventario de Componentes
tags: [mobile, ui, componentes, design-system]
created: 2026-05-04
---

# Mobile - Inventario de Componentes

Componentes UI em `apps/mobile/src/components/`. Re-exportados em `src/components/index.ts`. Todos consomem `colors`, `fonts`, `radius`, `spacing` e `badges` de `src/theme/tokens.ts` — ver [[08-brand]].

| Componente | Arquivo | Re-export |
|---|---|---|
| `Button` | `src/components/Button.tsx` | `Button` |
| `Input` | `src/components/Input.tsx` | `Input` |
| `DebtCard` | `src/components/DebtCard.tsx` | `DebtCard` |
| `MetricCard` | `src/components/MetricCard.tsx` | `MetricCard` |
| `CategoryChip` | `src/components/CategoryChip.tsx` | `CategoryChip` |
| `ProgressBar` | `src/components/ProgressBar.tsx` | `ProgressBar` |
| `ActionCard` | `src/components/ActionCard.tsx` | `ActionCard` |
| `CustomTabBar` | `src/components/TabBar.tsx` | `CustomTabBar` |
| `ScreenHeader` | `src/components/ScreenHeader.tsx` | `ScreenHeader` |

Onde sao usados: ver [[07-telas-auth]], [[07-telas-onboarding]], [[07-telas-tabs]], [[07-telas-modals]].

---

## `Button`

`src/components/Button.tsx`

### Props

```ts
type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

interface ButtonProps {
  variant?: ButtonVariant;   // default: "primary"
  label: string;
  onPress?: () => void;
  disabled?: boolean;        // default: false
  loading?: boolean;         // default: false
  style?: ViewStyle;         // override do container
}
```

### Variantes

| Variant | Background | Borda | Texto | Indicator (loading) |
|---|---|---|---|---|
| `primary` | `colors.brandTealDark` | — | `colors.white` | `colors.white` |
| `secondary` | `transparent` | `1.5px colors.brandTealDark` | `colors.brandTealDark` | `colors.brandTealDark` |
| `ghost` | `transparent` | `1.5px colors.accentGreen` | `colors.accentGreen` | `colors.accentGreen` |
| `destructive` | `colors.dangerRed` | — | `colors.white` | `colors.white` |

### Estados

- **`loading`**: substitui o `Text` por `ActivityIndicator` (cor depende da variant). Bloqueia `onPress`.
- **`disabled`**: aplica `opacity: 0.5`. Bloqueia `onPress`.
- **`pressed`** (sem `disabled`/`loading`): `opacity: 0.85`.

### Layout fixo

`height: 48`, `width: "100%"`, `borderRadius: radius.sm`, `paddingHorizontal: spacing.lg + 4`, `fontFamily: fonts.bodySemiBold`, `fontSize: 14`.

### Brand

`colors.brandTealDark`, `colors.accentGreen`, `colors.dangerRed`, `colors.white` — todos definidos em [[08-brand]].

---

## `Input`

`src/components/Input.tsx`

### Props

```ts
interface InputProps {
  label: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters"; // default: "none"
}
```

### Estados visuais

- **Default**: borda `colors.border`.
- **Focused** (interno via `useState`): borda `colors.brandTealDark`.
- **Error** (qualquer string em `error`): borda `colors.dangerRed` + linha de mensagem em vermelho abaixo.

### Layout

- Container vertical com `gap: spacing.sm`.
- `label` em `fonts.bodyMedium` 12, cor `colors.textSecondary`.
- Campo: altura 48, `backgroundColor: colors.surface`, `borderRadius: radius.input`, texto `fonts.body` 14.
- `placeholderTextColor: colors.textTertiary`.

### Brand

Tokens: `colors.surface`, `colors.border`, `colors.brandTealDark`, `colors.dangerRed`, tipografia `fonts.body` / `fonts.bodyMedium` (ver [[08-brand]]).

---

## `DebtCard`

`src/components/DebtCard.tsx`

### Props

```ts
type DebtStatus = "pending" | "negotiating" | "settled";

interface DebtCardProps {
  creditor: string;
  category: string;
  amount: number;
  status: DebtStatus;
  dueDate: string;
  onPress?: () => void;
}
```

### Variantes (status)

Mapeadas em `statusConfig`, lendo `badges` do theme (ver [[08-brand]]):

| Status | Label | Badge tokens | Cor do valor |
|---|---|---|---|
| `pending` | "Pendente" | `badges.warning` | `colors.warningOrange` |
| `negotiating` | "Negociando" | `badges.info` | `colors.textPrimary` |
| `settled` | "Quitada" | `badges.success` | `colors.successGreen` |

### Comportamento

- `onPress` opcional — quando definido, o `Pressable` reage com `opacity: 0.85` no press.
- `formatCurrency` interno produz `R$ 1.234,56` (sempre `Math.abs(value)`).
- Numero de linhas do `creditor` limitado a 1.

### Layout

- Card branco (`colors.surface`), borda `0.5px colors.border`, `radius.card`, padding ~`spacing.md + 2`.
- Badge pill no canto superior direito (dot colorido + label).

### Brand

`colors.surface`, `colors.border`, `colors.successGreen`, `colors.warningOrange`, `colors.textPrimary/Secondary/Tertiary`, `radius.card`, `radius.pill`, `radius.full`, `badges.{warning,info,success}` — ver [[08-brand]].

---

## `MetricCard`

`src/components/MetricCard.tsx`

### Props

```ts
interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  valueColor?: string;       // default: colors.textPrimary
  style?: ViewStyle;
}
```

### Variantes

Sem variantes nominais — `valueColor` permite tematizar o numero principal (ex.: dividas em vermelho, saldo positivo em verde).

### Layout

- `backgroundColor: colors.gray100`, borda `0.5px colors.border`, `radius.card`, padding `spacing.lg`.
- `label` 11px `fonts.bodyMedium` em `colors.textTertiary`.
- `value` 22px `fonts.heading`.
- `subtitle` opcional, 13px `fonts.bodyMedium` em `colors.textTertiary`.

### Brand

`colors.gray100`, `colors.border`, `colors.textPrimary/Tertiary`, `radius.card`, `fonts.heading` — ver [[08-brand]].

---

## `ActionCard`

`src/components/ActionCard.tsx`

### Props

```ts
interface ActionCardProps {
  title: string;
  description: string;
  onPress?: () => void;
}
```

### Variantes

Unica — card de acao primaria de marca: fundo `colors.brandTealDark`, texto `colors.white`, icone `Feather "chevron-right"` 20px branco a direita.

### Estados

- **Pressed** (com `onPress`): `opacity: 0.9`.

### Layout

- `flexDirection: "row"`, padding `spacing.lg`, `radius.card`.
- Bloco esquerdo: `title` 14 `fonts.bodySemiBold`, `description` 13 `fonts.body` com `opacity: 0.8`.

### Brand

`colors.brandTealDark`, `colors.white`, `radius.card` — ver [[08-brand]].

---

## `CategoryChip`

`src/components/CategoryChip.tsx`

### Props

```ts
interface CategoryChipProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  selected?: boolean;        // default: false
  onPress?: () => void;
}
```

### Variantes (estado)

| Estado | Background | Icone/label |
|---|---|---|
| `selected: true` | `colors.brandTealDark` | `colors.white` |
| `selected: false` | `colors.gray100` | `colors.textPrimary` |

### Estados

- **Pressed** (com `onPress`): `opacity: 0.85`.

### Layout

- Pilula horizontal, altura 36, `radius.pill`, padding horizontal ~`spacing.md + 2`, `gap: spacing.sm - 2`.
- Icone Feather 16px + label 13px `fonts.bodyMedium`.

### Brand

`colors.brandTealDark`, `colors.gray100`, `colors.white`, `colors.textPrimary`, `radius.pill` — ver [[08-brand]].

---

## `ProgressBar`

`src/components/ProgressBar.tsx`

### Props

```ts
interface ProgressBarProps {
  progress: number;          // 0..1, clampado
  color?: string;            // default: colors.accentGreen
  style?: ViewStyle;
}
```

### Variantes

Sem variantes nominais. `color` controla o preenchimento; `style` permite override do track.

### Layout

- Track: `width: "100%"`, `height: 4`, `backgroundColor: colors.gray200`, `borderRadius: 2`, `overflow: "hidden"`.
- Fill: `width: ${progress*100}%`, mesma altura, `backgroundColor: color ?? colors.accentGreen`.

### Brand

`colors.gray200`, `colors.accentGreen` — ver [[08-brand]].

---

## `ScreenHeader`

`src/components/ScreenHeader.tsx`

### Props

```ts
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  stepLabel?: string;
  showBack?: boolean;        // default: false
  onBack?: () => void;
}
```

### Variantes / blocos opcionais

| Bloco | Renderiza quando | Tipografia |
|---|---|---|
| Botao "Voltar" (`Feather arrow-left` + texto) | `showBack === true` | `fonts.bodyMedium` 13, cor `colors.textPrimary` |
| `stepLabel` (ex.: "Passo 2 de 4") | `stepLabel` truthy | `fonts.bodyMedium` 12, cor `colors.brandTealDark` |
| `title` | sempre | `fonts.heading` 24, cor `colors.textPrimary` |
| `subtitle` | `subtitle` truthy | `fonts.body` 14, cor `colors.textSecondary` |

### Estados

- Pressed do botao Voltar: `opacity: 0.6`.

### Layout

- Container vertical com `gap: spacing.sm`, `backgroundColor: colors.surface`, borda inferior `0.5px colors.border`, padding-bottom `spacing.md`.

### Brand

`colors.surface`, `colors.border`, `colors.brandTealDark`, `colors.textPrimary/Secondary`, `fonts.heading/body/bodyMedium` — ver [[08-brand]].

---

## `CustomTabBar`

`src/components/TabBar.tsx` (re-exportado como `CustomTabBar`)

Tab bar customizado consumido pelo `(tabs)/_layout.tsx` (ver [[05a-roteamento]]).

### Tabs (constante interna `TABS`)

```ts
const TABS = [
  { name: "index",    label: "Inicio",   icon: "home" },
  { name: "finances", label: "Financas", icon: "dollar-sign" },
  { name: "plan",     label: "Plano",    icon: "target" },
  { name: "profile",  label: "Perfil",   icon: "user" },
];
```

### Props

Recebe a interface esperada pelo Expo Router / React Navigation custom tab bar:

```ts
interface CustomTabBarProps {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: string; target: string; canPreventDefault: boolean })
      => { defaultPrevented: boolean };
  };
}
```

Usa `useSafeAreaInsets()` (`react-native-safe-area-context`) e aplica `paddingBottom: Math.max(insets.bottom, spacing.sm)` para nao cobrir o home indicator.

### Comportamento

- Em cada tap, emite `tabPress` no `navigation.emit` com `target: routes[i].key`. Se `defaultPrevented === false`, chama `navigation.navigate(tab.name)` (mantem o comportamento padrao de "double-tap volta para a raiz" do React Navigation).

### Variantes (estado)

| Estado | Icone | Label |
|---|---|---|
| Ativo | `colors.brandTealDark` | `colors.brandTealDark` + `fonts.bodySemiBold` |
| Inativo | `colors.textSecondary` | `colors.textSecondary` + `fonts.bodyMedium` |

### Layout

- Wrapper absoluto na base (`position: "absolute"`, `bottom: 0`, `left/right: 0`), fundo `colors.surface`, borda superior `0.5px colors.border`.
- Linha horizontal de 4 abas com `flex: 1`, icone Feather 18px + label 12px.

### Brand

`colors.surface`, `colors.border`, `colors.brandTealDark`, `colors.textSecondary`, `radius.sm`, `fonts.bodyMedium/bodySemiBold` — ver [[08-brand]].

---

## Onde sao usados

Para nao duplicar a documentacao das telas, ver:

- [[07-telas-auth]] — `(auth)/login.tsx`, `register.tsx`, `forgot-password.tsx` consomem `Input`, `Button`, `ScreenHeader`.
- [[07-telas-onboarding]] — telas de income/categories/debt-detail/expenses usam `ScreenHeader`, `CategoryChip`, `Button`, `ProgressBar`.
- [[07-telas-tabs]] — dashboard (`Inicio`) compõe `MetricCard`, `DebtCard`, `ActionCard`, `ProgressBar`; tab bar = `CustomTabBar`.
- [[07-telas-modals]] — modais de novo/pagar/celebrar usam `Input`, `Button`, `CategoryChip`, `ActionCard`.
