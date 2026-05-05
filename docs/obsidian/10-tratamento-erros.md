---
title: "Tratamento de erros — backend → mobile"
tags: [errors, axios, nestjs, ux]
camadas: [api, mobile]
---

# 10 · Tratamento de erros

> Como uma falha sai do banco, atravessa o NestJS, chega no axios do app e termina como um `Alert` em PT-BR para o usuário.

## Visão geral

```
[ Service (throws) ]
        ↓
[ HttpExceptionFilter ]  → JSON envelope { success:false, message, errors? }
        ↓ HTTP
[ Axios response.use error ]
        ↓
[ extractMessage() → friendlyByStatus() fallback ]
        ↓
[ Tela: Alert.alert("Erro ao …", message) ]
```

## Backend

### `HttpExceptionFilter`

Definido em [apps/api/src/common/filters/http-exception.filter.ts](../../apps/api/src/common/filters/http-exception.filter.ts). Captura todo `HttpException` (já cobrindo as Nest exceptions: `BadRequestException`, `UnauthorizedException`, `ConflictException`, etc.) e devolve o envelope canônico:

```ts
response.status(status).json({
  success: false,
  ...(typeof exceptionResponse === "string"
    ? { message: exceptionResponse }
    : exceptionResponse),
});
```

Com isso:

- `throw new ConflictException("Esse e-mail já está cadastrado.")` →
  `{ "success": false, "message": "Esse e-mail já está cadastrado.", "statusCode": 409 }`.
- `throw new UnauthorizedException("E-mail ou senha incorretos.")` →
  `{ "success": false, "message": "E-mail ou senha incorretos.", "statusCode": 401 }`.

### `ZodValidationPipe`

Em [apps/api/src/common/pipes/zod-validation.pipe.ts](../../apps/api/src/common/pipes/zod-validation.pipe.ts). Usa `safeParse`. Em caso de falha lança `BadRequestException` com payload estruturado:

```ts
throw new BadRequestException({
  message: "Validation failed",
  errors: result.error.errors.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  })),
});
```

Resposta resultante (após o filter):

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email" },
    { "field": "password", "message": "String must contain at least 8 character(s)" }
  ],
  "statusCode": 400
}
```

### Mensagens em PT já implementadas

Hoje, mensagens em português são lançadas explicitamente nos seguintes pontos do [[11-fluxo-autenticacao|fluxo de autenticação]]:

| Local | Mensagem | Status |
| --- | --- | --- |
| `AuthService.register` | `"Esse e-mail já está cadastrado."` | 409 |
| `AuthService.login` | `"E-mail ou senha incorretos."` | 401 (usuário não existe) |
| `AuthService.login` | `"E-mail ou senha incorretos."` | 401 (senha errada) |
| `AuthService.refresh` / `me` | `"Usuário não encontrado."` | 401 |
| Schemas Zod (`auth`, `onboarding`) | `"Telefone brasileiro inválido"`, `"Campo obrigatório"`, `"Informe sua renda principal"` | 400 |

> Mensagens das exceptions padrão do Nest (não customizadas) ainda saem em inglês — o frontend tem fallback (ver abaixo).

## Mobile

### Cliente axios

Definido em [apps/mobile/src/services/api.ts](../../apps/mobile/src/services/api.ts). Configuração:

```ts
axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,                    // 15s
});
```

### Request interceptor

Pega `accessToken` do `SecureStore` e injeta `Authorization: Bearer <token>` automaticamente em todas as requests.

### Response interceptor — extração de mensagem

Função `extractMessage(error)`, em ordem de prioridade:

1. `error.code === "ECONNABORTED"` → `"A conexão demorou demais. Verifique sua internet e tente novamente."` (timeout do axios).
2. Sem `error.response` (network down) → `"Sem conexão com o servidor. Verifique sua internet e tente novamente."`.
3. `error.response.data.message` (string) → usa direto. **Aqui é onde as mensagens em PT do backend chegam intactas.**
4. `error.response.data.message` (array) → usa o primeiro elemento string (lista de erros do Nest).
5. Fallback `friendlyByStatus(status)` por código HTTP:

| Status | Mensagem amigável |
| --- | --- |
| `400` | `"Dados inválidos. Confira os campos e tente novamente."` |
| `401` | `"E-mail ou senha incorretos."` |
| `403` | `"Você não tem permissão para essa ação."` |
| `404` | `"Recurso não encontrado."` |
| `409` | `"Esse registro já existe."` |
| `422` | `"Algum campo está inválido."` |
| `429` | `"Muitas tentativas. Aguarde um momento e tente novamente."` |
| `500-504` | `"O servidor está com problemas. Tente novamente em instantes."` |
| outros | `"Algo deu errado. Tente novamente."` |

### Logout automático em 401 (exceto auth)

```ts
const isAuthEndpoint =
  url.includes("/auth/login") || url.includes("/auth/register");

if (status === 401 && !isAuthEndpoint) {
  await SecureStore.deleteItemAsync("accessToken");
  useAuthStore.getState().logout();
}
```

> 401 em `/auth/login` ou `/auth/register` **não** força logout — a tela quer mostrar a mensagem inline.
> Em qualquer outro endpoint, 401 significa token expirado/inválido → limpa SecureStore + zera `useAuthStore`. Ver [[11-fluxo-autenticacao]].

### Erro propagado

O interceptor sempre rejeita um `Error` com mensagem amigável e metadata:

```ts
const wrapped = new Error(friendly);
wrapped.status = status;
wrapped.original = error;          // axios original, se precisar inspecionar
return Promise.reject(wrapped);
```

## Como a tela renderiza

Login ([apps/mobile/app/(auth)/login.tsx](../../apps/mobile/app/(auth)/login.tsx)):

```ts
try {
  await login(normalizedEmail, password);
  // ...
} catch (error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Verifique suas credenciais e tente novamente.";
  Alert.alert("Erro ao entrar", message);
}
```

Register ([apps/mobile/app/(auth)/register.tsx](../../apps/mobile/app/(auth)/register.tsx)) — caso especial de **409 Conflict** (e-mail já cadastrado): exibe Alert com 2 botões — "Cancelar" e "Fazer login" (que navega para `/(auth)/login`). Outros erros caem no fluxo padrão de `Alert.alert("Erro ao criar conta", message)`.

> Hoje toda comunicação de erro de rede é via `Alert` nativo. Erros de **validação local** (Zod) são exibidos inline nos `<Input error={errors.email} />` antes de chegar à API.

## Notas relacionadas

- [[04-api-overview]]
- [[09-shared]]
- [[11-fluxo-autenticacao]]
- [[12-fluxos-de-dados]]
