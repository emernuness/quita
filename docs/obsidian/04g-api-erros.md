---
title: API - Erros e Validação
tags: [api, errors, validation, zod]
updated: 2026-05-04
---

# 04g - Erros e Validação

Como a API trata exceções e validação de entrada.

## HttpExceptionFilter

Arquivo: `apps/api/src/common/filters/http-exception.filter.ts`. Registrado globalmente em `app.module.ts` via `APP_FILTER`.

```ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      success: false,
      ...(typeof exceptionResponse === "string"
        ? { message: exceptionResponse }
        : exceptionResponse),
    });
  }
}
```

Comportamento:

- Captura apenas `HttpException` (e subclasses: `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException` etc.).
- Mantém o `status` HTTP da exceção.
- Faz spread do `exceptionResponse`:
  - Se for `string`, retorna `{ success: false, message: <string> }`.
  - Se for objeto (formato padrão do Nest `{ statusCode, message, error }`), retorna `{ success: false, statusCode, message, error, ...resto }`.
- Erros não-HTTP (ex.: erro inesperado de runtime) **não são tratados** por este filtro — caem no handler default do Nest (500 sem o envelope `success: false`).

### Forma da resposta de erro

```json
{
  "success": false,
  "message": "Esse e-mail já está cadastrado.",
  "statusCode": 409,
  "error": "Conflict"
}
```

Quando o body lançado pela exceção tem campos extras (ex.: `errors` da validação), eles também aparecem no nível raiz por causa do spread.

## TransformInterceptor (resposta de sucesso)

Arquivo: `apps/api/src/common/interceptors/transform.interceptor.ts`. Registrado em `app.module.ts` via `APP_INTERCEPTOR`. Toda resposta 2xx vira:

```json
{ "success": true, "data": <retorno do controller> }
```

Como o filtro só atua em exceções, o envelope de erro **não** tem o campo `data`.

## ZodValidationPipe

Arquivo: `apps/api/src/common/pipes/zod-validation.pipe.ts`.

```ts
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      throw new BadRequestException({ message: "Validation failed", errors });
    }
    return result.data;
  }
}
```

Comportamento:

- É instanciado por handler: `@Body(new ZodValidationPipe(loginSchema))`.
- Em sucesso, retorna `result.data` (o body já parseado/coerced pelo Zod).
- Em falha, lança `BadRequestException` com body `{ message: "Validation failed", errors: [{ field, message }] }`.
- O filtro envelopa para:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email inválido" },
    { "field": "password", "message": "Mínimo de 6 caracteres" }
  ],
  "error": "Bad Request"
}
```

Schemas Zod ficam em `@quita/shared` — ver [[09-shared]].

## Mensagens em PT-BR já implementadas

Apenas o módulo de Auth tem mensagens em PT-BR ([[04a-api-auth]]):

| Cenário | Status | Mensagem |
| --- | --- | --- |
| Registro com e-mail existente | 409 | `Esse e-mail já está cadastrado.` |
| Login com credenciais inválidas | 401 | `E-mail ou senha incorretos.` |
| Refresh/me com usuário ausente | 401 | `Usuário não encontrado.` |
| `PremiumGuard` bloqueia acesso | 403 | `Esta funcionalidade requer o plano Premium` |

Demais módulos lançam mensagens em inglês (ex.: `Income not found`, `Not your resource`, `Debt not found`, `User not found`, `Current password is incorrect`, `Payment already undone`, `Undo window expired`). O cliente mobile traduz por status quando a mensagem não for amigável (ver abaixo).

## Como o mobile interpreta

Arquivo: `apps/mobile/src/services/api.ts`.

O interceptor de resposta do `axios`:

1. Em `401` fora dos endpoints de auth (`/auth/login`, `/auth/register`):
   - `SecureStore.deleteItemAsync("accessToken")`.
   - `useAuthStore.getState().logout()` (require dinâmico para evitar ciclo).
2. Extrai a mensagem via `extractMessage(error)`:
   - `ECONNABORTED` → `"A conexão demorou demais. Verifique sua internet e tente novamente."`.
   - Sem `error.response` → `"Sem conexão com o servidor. Verifique sua internet e tente novamente."`.
   - Se `response.data.message` é string não vazia → usa direto.
   - Se `response.data.message` é array com primeira string → usa o primeiro item.
   - Senão, fallback `friendlyByStatus(status)`.
3. Cria um novo `Error(friendly)` com `.status` e `.original` anexados, e rejeita.

`friendlyByStatus`:

| Status | Mensagem |
| --- | --- |
| 400 | `Dados inválidos. Confira os campos e tente novamente.` |
| 401 | `E-mail ou senha incorretos.` |
| 403 | `Você não tem permissão para essa ação.` |
| 404 | `Recurso não encontrado.` |
| 409 | `Esse registro já existe.` |
| 422 | `Algum campo está inválido.` |
| 429 | `Muitas tentativas. Aguarde um momento e tente novamente.` |
| 500 / 502 / 503 / 504 | `O servidor está com problemas. Tente novamente em instantes.` |
| outros | `Algo deu errado. Tente novamente.` |

Ou seja: como a API responde com `{ success: false, message: "..." }`, o mobile **prioriza** a `message` da API (PT-BR no Auth). Para mensagens em inglês de outros módulos a UI ainda mostrará a string vinda da API; o fallback `friendlyByStatus` só entra quando a API não envia `message`.

## Notas relacionadas

- [[04-api-overview]]
- [[04a-api-auth]]
- [[09-shared]]
