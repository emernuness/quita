---
title: Mobile - Services (axios)
tags: [mobile, axios, api, http]
created: 2026-05-04
---

# Mobile - Services

Camada de acesso HTTP em `apps/mobile/src/services/`. Hoje existe um unico cliente, `api`, em `services/api.ts`. Todos os hooks (ver [[05d-providers-hooks]]) e a store de auth (ver [[05b-stores]]) consomem este cliente.

## `api` — `src/services/api.ts`

### Configuracao base

```ts
const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});
```

- **`baseURL`** vem de `process.env.EXPO_PUBLIC_API_URL`. O Expo injeta variaveis prefixadas `EXPO_PUBLIC_*` em build time. Configure em `apps/mobile/.env` para apontar para o backend NestJS (ver [[02-api-arquitetura]]).
- **Fallback**: `http://localhost:3000/api` (server local em dev no host).
- **Timeout**: 15 segundos para qualquer request. Acima disso, axios aborta com `code === "ECONNABORTED"` (tratado adiante).

### Interceptor de request — bearer token

```ts
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

A cada request, le `accessToken` do SecureStore (chave gerenciada por [[05b-stores]]) e injeta em `Authorization: Bearer <token>`. Se nao houver token, a chamada segue sem o header.

### Interceptor de response — traducao + logout em 401

Tres comportamentos compostos:

#### 1. Logout automatico em 401 (com excecao)

```ts
const isAuthEndpoint =
  url.includes("/auth/login") || url.includes("/auth/register");

if (status === 401 && !isAuthEndpoint) {
  await SecureStore.deleteItemAsync("accessToken");
  const { useAuthStore } = require("../stores/auth"); // lazy require
  useAuthStore.getState().logout();
}
```

Em qualquer 401 — exceto nos endpoints de login/registro — o token e descartado e a store de auth e zerada. Isso evita o efeito colateral de "bater login com senha errada => app inteiro deslogado".

O `require` dinamico e proposital, para quebrar o ciclo `services/api.ts <-> stores/auth.ts`.

#### 2. Traducao de mensagens para PT-BR

`extractMessage(error)` resolve nessa ordem:

1. **`ECONNABORTED`** => `"A conexao demorou demais. Verifique sua internet e tente novamente."`
2. **Sem `error.response`** (rede caiu) => `"Sem conexao com o servidor. Verifique sua internet e tente novamente."`
3. **`response.data.message` string** nao-vazia => usa direto (mensagem amigavel ja vinda da API).
4. **`response.data.message` array** com strings => primeiro item (suporta Zod issues).
5. **Fallback** => `friendlyByStatus(status)`.

Tabela de `friendlyByStatus`:

| Status | Mensagem |
|---|---|
| `400` | "Dados invalidos. Confira os campos e tente novamente." |
| `401` | "E-mail ou senha incorretos." |
| `403` | "Voce nao tem permissao para essa acao." |
| `404` | "Recurso nao encontrado." |
| `409` | "Esse registro ja existe." |
| `422` | "Algum campo esta invalido." |
| `429` | "Muitas tentativas. Aguarde um momento e tente novamente." |
| `500` / `502` / `503` / `504` | "O servidor esta com problemas. Tente novamente em instantes." |
| outros / `undefined` | "Algo deu errado. Tente novamente." |

#### 3. Wrapping do erro

```ts
const wrapped = new Error(friendly);
(wrapped as Error & { status?: number; original?: AxiosError }).status = status;
(wrapped as Error & { status?: number; original?: AxiosError }).original = error;
return Promise.reject(wrapped);
```

O `Error` rejeitado tem:

- `message` => string PT-BR amigavel (consumida diretamente em formularios e toasts);
- `status` => http status (quando houver response);
- `original` => `AxiosError` cru (se precisar inspecionar `response.data` em algum caso especifico).

### Como os hooks consomem

Todos os hooks em `src/hooks/*` (ver [[05d-providers-hooks]]) seguem o padrao:

```ts
const { data } = await api.get<ApiResponse<T>>("/endpoint");
return data.data; // a API embrulha em { success, data } — ver [[02-api-arquitetura]]
```

A `ApiResponse<T>` vem de `@quita/shared` e reflete o envelope padrao do backend NestJS.

## Outros services

Nao ha outros arquivos em `src/services/` alem de `api.ts` e `.gitkeep`. As chamadas REST sao orquestradas direto nos hooks React Query.
