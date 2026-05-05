---
title: "Status do projeto — o que está no código"
tags: [status, roadmap, decisions]
fonte: leitura direta dos arquivos do repo
data: 2026-05-04
---

# 13 · Status do Projeto

> Snapshot honesto do que está implementado no repositório. Tudo aqui foi confirmado lendo o código — não há suposições. Pendências marcadas como "TODO" são `grep` literal nas fontes.

## Stack atualizada

### Mobile ([apps/mobile/package.json](../../apps/mobile/package.json))

| Dependência | Versão |
| --- | --- |
| `expo` | `~54.0.34` |
| `expo-router` | `~6.0.23` |
| `expo-secure-store` | `~15.0.8` |
| `expo-linear-gradient` | `~15.0.8` |
| `react` | `^19.1.0` |
| `react-native` | `~0.81.5` |
| `@tanstack/react-query` | `^5.90.21` |
| `zustand` | `^5.0.11` |
| `axios` | `^1.13.6` |
| `zod` | `^3.25.76` |
| `@expo-google-fonts/plus-jakarta-sans` | `^0.4.2` |

### Backend ([apps/api/package.json](../../apps/api/package.json))

| Dependência | Versão |
| --- | --- |
| `@nestjs/common`, `@nestjs/core` | `^11.0.0` |
| `@nestjs/jwt` | `^11.0.2` |
| `@nestjs/passport` + `passport-jwt` | `^11.0.5` / `^4.0.1` |
| `@prisma/client` + `prisma` | `^6.0.0` |
| `bcryptjs` | `^3.0.3` |
| `zod` | `^3.24.0` |

### Shared ([packages/shared/package.json](../../packages/shared/package.json))

- `zod ^3.24`. Build com `tsc` puro. Consumido como `workspace:*`.

## O que está implementado

### Brand 100% aplicado

- Tokens em [apps/mobile/src/theme/tokens.ts](../../apps/mobile/src/theme/tokens.ts) cobrem: paleta primária/secundária/neutra/semântica do `quita-brand.json`, escala Plus Jakarta Sans (4 pesos), `spacing` xs–xxxl, `radius` input/sm/md/card/lg/page/xl/pill/full e helpers de `badges`. Ver [[08-brand]].
- Fontes carregadas via `useFonts` em [apps/mobile/app/_layout.tsx](../../apps/mobile/app/_layout.tsx) com gating de splash do Expo até o load terminar.
- Logos e ícones do brand presentes em `apps/mobile/assets/brand/` e referenciados no [app.json](../../apps/mobile/app.json) (icon: `icon-01.png`; splash: `logo-01.png` sobre `#F4F6F4`; adaptive icon Android: foreground `icon-01.png` sobre `#0A5248`).
- Splash visual customizado em [apps/mobile/app/splash.tsx](../../apps/mobile/app/splash.tsx) com fade entre 5 imagens Unsplash, gradient teal + escurecimento lateral, logo monocromático (`logo-04.png`), botão CTA `accentGreen` e link "Já tenho conta".
- Componentes compartilhados (`Button`, `Input`, badges) em [apps/mobile/src/components](../../apps/mobile/src/components) usando os tokens — ver [[06-componentes]].

### Auth completa (e-mail/senha)

- Endpoints `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` em [apps/api/src/modules/auth/auth.controller.ts](../../apps/api/src/modules/auth/auth.controller.ts).
- Validação Zod no entry-point via `ZodValidationPipe` + schemas do [[09-shared|@quita/shared]].
- Senha com `bcrypt.hash(_, 10)`.
- JWT 7 dias confirmado em [apps/api/src/modules/auth/auth.module.ts](../../apps/api/src/modules/auth/auth.module.ts) (`signOptions: { expiresIn: "7d" }`).
- Strategy `passport-jwt` em [apps/api/src/modules/auth/jwt.strategy.ts](../../apps/api/src/modules/auth/jwt.strategy.ts).
- Mensagens de erro em PT já lançadas no service: "Esse e-mail já está cadastrado.", "E-mail ou senha incorretos.", "Usuário não encontrado." Ver [[10-tratamento-erros]].
- Mobile: `useAuthStore` ([apps/mobile/src/stores/auth.ts](../../apps/mobile/src/stores/auth.ts)) com `login`, `register`, `logout`, `loadToken`, `setUser`. Token em `SecureStore["accessToken"]`.
- Auto-login no boot via `AuthInit` no [_layout.tsx](../../apps/mobile/app/_layout.tsx) chamando `loadToken` + `GET /auth/me`.
- Login com **remember-me** ([apps/mobile/app/(auth)/login.tsx](../../apps/mobile/app/(auth)/login.tsx)) usando `SecureStore["rememberedEmail"]` e `["rememberMe"]`. Quando OFF, deleta `accessToken` no submit.
- 401 fora de auth → logout automático no response interceptor de [apps/mobile/src/services/api.ts](../../apps/mobile/src/services/api.ts).
- Tela register lida com **409 Conflict** mostrando Alert "Conta já existe" → "Fazer login".

Ver [[11-fluxo-autenticacao]] para diagrama completo.

### Tratamento de erros

- `HttpExceptionFilter` global ([apps/api/src/common/filters/http-exception.filter.ts](../../apps/api/src/common/filters/http-exception.filter.ts)) padronizando envelope `{ success:false, message, ... }`.
- `ZodValidationPipe` com payload `{ message:"Validation failed", errors:[{field,message}] }`.
- Axios com timeout 15s, mensagens amigáveis em PT (`friendlyByStatus`), tratamento dedicado de `ECONNABORTED` e network errors.
- UI atual: erros de rede via `Alert` nativo; erros de validação Zod inline via `<Input error=... />`.

Ver [[10-tratamento-erros]].

### Pacote @quita/shared

- 9 famílias de schemas (auth, debt, payment, income, expense, plan, profile, onboarding, export).
- 12 enums no padrão `as const`.
- Constants de plano (`FREE_DEBT_LIMIT`, `PREMIUM_PRICE`, etc.) e seeds (`DEBT_CATEGORY_SEEDS`).
- Types alinhados 1:1 com Prisma (datas como `string` ISO).
- Utils: `formatBRL`, `formatBRLCompact`, `parseBRL`, `isValidCPF`, `isValidPhone`, `formatPhone`, `formatDateBR`, `formatMonthBR`, `getRelativeTime`.

Ver [[09-shared]].

## Decisões arquiteturais (detectáveis pelo código)

| Decisão | Onde aparece |
| --- | --- |
| Envelope `{ success, data, message? }` em todas as respostas | [HttpExceptionFilter](../../apps/api/src/common/filters/http-exception.filter.ts) + interfaces `ApiResponse<T>` em [packages/shared/src/types](../../packages/shared/src/types/index.ts) |
| JWT de 7 dias, sem refresh-token long-lived | `JwtModule.register({ signOptions: { expiresIn: "7d" } })` em [auth.module.ts](../../apps/api/src/modules/auth/auth.module.ts) |
| Validação compartilhada (mesmo schema Zod no cliente e servidor) | [auth.controller.ts](../../apps/api/src/modules/auth/auth.controller.ts) + [login.tsx](../../apps/mobile/app/(auth)/login.tsx) ambos importam `loginSchema` de `@quita/shared` |
| Persistência de credenciais via `expo-secure-store` (não AsyncStorage) | [stores/auth.ts](../../apps/mobile/src/stores/auth.ts), [services/api.ts](../../apps/mobile/src/services/api.ts) |
| 401 em endpoints não-auth força logout global | [services/api.ts:73-77](../../apps/mobile/src/services/api.ts) |
| Enums via objeto `as const` (sem TS `enum`, melhor tree-shaking) | [packages/shared/src/enums/index.ts](../../packages/shared/src/enums/index.ts) |
| Datas em ISO string (não `Date`) atravessam fronteira HTTP | [packages/shared/src/types/index.ts](../../packages/shared/src/types/index.ts) |
| Soft-delete via `deletedAt` no User; soft-disable via `isActive` em Income/Expense | tipos em [types/index.ts](../../packages/shared/src/types/index.ts) |

## Pendências visíveis no código

### TODOs literais (`grep -rn "TODO"`)

| Arquivo | Linha | Comentário |
| --- | --- | --- |
| `apps/mobile/app/(tabs)/profile/export-data.tsx` | 41 | `/* TODO: export PDF */` |
| `apps/mobile/app/(tabs)/profile/export-data.tsx` | 57 | `/* TODO: export CSV */` |
| `apps/mobile/app/(tabs)/profile/export-data.tsx` | 78 | `/* TODO: delete account flow */` |
| `apps/mobile/app/(tabs)/profile/security.tsx` | 70 | `/* TODO: navigate to change password */` |
| `apps/mobile/app/(auth)/forgot-password.tsx` | 114 | `// TODO: call forgot password API` |

### Funcionalidades visíveis na UI mas sem backing real

- **Login com Google** — botão visível em [login.tsx](../../apps/mobile/app/(auth)/login.tsx) e [register.tsx](../../apps/mobile/app/(auth)/register.tsx) abre `Alert.alert("Em breve", ...)`. Sem rota OAuth no backend (nada em `auth.controller.ts`).
- **Esqueci a senha** — UI completa, validação Zod funcional, mas `onPress` do "Enviar código" tem comentário TODO; sem endpoint correspondente.
- **Refresh token endpoint** — backend expõe `POST /auth/refresh`, mas o mobile (`stores/auth.ts`) não chama em nenhum momento.
- **Export de dados (PDF/CSV)** — schema `createExportSchema` existe em `@quita/shared`, e tipos `DataExport` estão no shared, mas a tela só tem TODOs.
- **Fluxo de exclusão de conta** — TODO em `export-data.tsx`.
- **Trocar senha** — TODO em `security.tsx`.

### O que já existe parcialmente (precisa cross-check com [[04c-api-financial]] / [[04d-api-debts]])

- Modules backend de `debts`, `income`, `expense`, `payment`, `plan`, `dashboard`, `financial`, `insights`, `notifications`, `export`, `onboarding`, `profile` — verificar com o agente da API.
- Telas mobile de `(tabs)/*`, `(modals)/*`, `(onboarding)/*` — verificar com o agente das telas.

## Rotas estruturais do app

Definidas em [apps/mobile/app/_layout.tsx](../../apps/mobile/app/_layout.tsx):

```ts
<Stack.Screen name="splash" />
<Stack.Screen name="(auth)" />
<Stack.Screen name="(onboarding)" />
<Stack.Screen name="(tabs)" />
<Stack.Screen name="(modals)" options={{ presentation: "modal" }} />
```

Sem `headerShown` por padrão. Modais em `presentation: "modal"`.

## Configuração e segredos visíveis

- `JWT_SECRET` — fallback hardcoded `"dev-secret-change-in-production"` em [auth.module.ts](../../apps/api/src/modules/auth/auth.module.ts) e [jwt.strategy.ts](../../apps/api/src/modules/auth/jwt.strategy.ts). **Pendência clara**: precisa estar em `.env` em produção.
- `EXPO_PUBLIC_API_URL` — fallback `http://localhost:3000/api` em [services/api.ts](../../apps/mobile/src/services/api.ts).

## Notas relacionadas

- [[01-arquitetura]]
- [[02-dev-workflow]]
- [[04-api-overview]]
- [[08-brand]]
- [[09-shared]]
- [[10-tratamento-erros]]
- [[11-fluxo-autenticacao]]
- [[12-fluxos-de-dados]]
