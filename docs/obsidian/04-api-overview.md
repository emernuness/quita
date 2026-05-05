---
title: API Overview
tags: [api, nestjs, overview]
updated: 2026-05-04
---

# 04 - Visão Geral da API

API REST do QUITA construída com **NestJS**. Localizada em `apps/api/src/`.

## Bootstrap

Arquivo: `apps/api/src/main.ts`.

- Usa `NestFactory.create(AppModule)`.
- Prefixo global: `app.setGlobalPrefix("api")` — todas as rotas são acessadas em `/api/...`.
- CORS habilitado sem restrição de origem: `app.enableCors()`.
- Porta: `process.env.PORT ?? 3000`.

## Módulos registrados

`apps/api/src/app.module.ts` importa:

- `PrismaModule` — acesso ao banco (ver [[03-banco-de-dados]]).
- `AuthModule` — ver [[04a-api-auth]].
- `OnboardingModule` — ver [[04b-api-onboarding]].
- `FinancialModule` — ver [[04c-api-financial]].
- `DebtsModule` — ver [[04d-api-debts]].
- `DashboardModule` — ver [[04e-api-dashboard]].
- `ProfileModule` — ver [[04f-api-profile]].

## Providers globais

Registrados em `app.module.ts` via `APP_INTERCEPTOR` e `APP_FILTER`:

| Provider | Função |
| --- | --- |
| `TransformInterceptor` | Envelopa toda resposta 2xx em `{ success: true, data: <retorno> }`. |
| `HttpExceptionFilter` | Captura `HttpException` e responde `{ success: false, message, ...rest }`. Ver [[04g-api-erros]]. |

## Autenticação

- Estratégia: **JWT Bearer** (`passport-jwt`).
- Token obtido via `POST /api/auth/login` ou `POST /api/auth/register`.
- Header esperado: `Authorization: Bearer <accessToken>`.
- Guard: `JwtAuthGuard` (`apps/api/src/modules/auth/jwt-auth.guard.ts`) — extends `AuthGuard("jwt")`.
- Strategy: `JwtStrategy` valida o `sub` do payload contra `prisma.user.findUnique` e injeta o usuário (sem `passwordHash`) em `request.user`.
- Decorator de conveniência: `@CurrentUser()` (`apps/api/src/common/decorators/current-user.decorator.ts`) — retorna `request.user` ou um campo (`@CurrentUser("id")`).
- Segredo: `process.env.JWT_SECRET` (fallback `"dev-secret-change-in-production"`).
- Expiração: `7d` (registrado em `AuthModule`).

## Validação

- Pipe: `ZodValidationPipe` (`apps/api/src/common/pipes/zod-validation.pipe.ts`) recebe um `ZodSchema` no construtor.
- Schemas Zod compartilhados via `@quita/shared` (ver [[09-shared]]).
- Em caso de falha: lança `BadRequestException({ message: "Validation failed", errors: [{ field, message }] })`.

## Guards e decorators auxiliares

- `PremiumGuard` (`apps/api/src/common/guards/premium.guard.ts`) — usa `Reflector` para detectar `@PremiumOnly()`. Se metadata `isPremiumOnly` for `true` e `request.user.planType !== "premium"`, lança `ForbiddenException("Esta funcionalidade requer o plano Premium")`. (Não está aplicado globalmente; precisa ser declarado por handler/classe.)
- `@PremiumOnly()` (`apps/api/src/common/decorators/premium-only.decorator.ts`) — `SetMetadata("isPremiumOnly", true)`.

## Formato de resposta

### Sucesso (2xx)

```json
{
  "success": true,
  "data": <payload retornado pelo controller>
}
```

### Erro

```json
{
  "success": false,
  "message": "...",
  "...": "campos extras do exception body"
}
```

Detalhes em [[04g-api-erros]].

## Notas relacionadas

- [[01-arquitetura]]
- [[03-banco-de-dados]]
- [[03a-modelos]]
- [[09-shared]]
