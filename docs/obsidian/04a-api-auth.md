---
title: API - Auth
tags: [api, auth, jwt]
updated: 2026-05-04
---

# 04a - Módulo Auth

Arquivos: `apps/api/src/modules/auth/`.

## Responsabilidade

Cadastro, login, refresh de token JWT e leitura do usuário autenticado. Usa `bcryptjs` para hash de senha (rounds = 10) e `@nestjs/jwt` para emissão de tokens.

Configuração do módulo (`auth.module.ts`):

- `JwtModule.register({ secret: process.env.JWT_SECRET || "dev-secret-change-in-production", signOptions: { expiresIn: "7d" } })`.
- Providers: `AuthService`, `JwtStrategy`, `JwtAuthGuard`.
- Exporta: `AuthService`, `JwtAuthGuard`.

## Endpoints

Prefixo do controller: `auth` (rota efetiva inclui o prefixo global `/api`).

| Método | Rota | Guard | Body | Resposta `data` |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | — | `registerSchema` ([[09-shared]]) | `{ accessToken, user }` (user sem `passwordHash`) |
| POST | `/api/auth/login` | — | `loginSchema` ([[09-shared]]) | `{ accessToken, user }` |
| POST | `/api/auth/refresh` | `JwtAuthGuard` | — | `{ accessToken, user }` |
| GET | `/api/auth/me` | `JwtAuthGuard` | — | `user` (sem `passwordHash`) |

Toda resposta 2xx é envelopada por `TransformInterceptor` em `{ success: true, data: ... }`.

## Lógica relevante

### `register(data: RegisterInput)`

1. `prisma.user.findUnique({ where: { email } })`. Se existir, lança `ConflictException("Esse e-mail já está cadastrado.")`.
2. Hash de senha: `bcrypt.hash(data.password, 10)`.
3. Cria usuário com `name`, `email`, `phone`, `passwordHash`, e gera `avatarInitials`:
   - `name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)`.
4. Gera token: `jwt.sign({ sub: user.id, email: user.email })`.
5. Retorna `{ accessToken, user }` removendo `passwordHash` por desestruturação.

### `login(data: LoginInput)`

1. Busca por `email`.
2. Se não encontrado: `UnauthorizedException("E-mail ou senha incorretos.")`.
3. `bcrypt.compare(data.password, user.passwordHash)`.
4. Se inválido: `UnauthorizedException("E-mail ou senha incorretos.")`.
5. Gera token e retorna `{ accessToken, user }` sem `passwordHash`.

### `refresh(userId)`

1. Busca usuário pelo `id` extraído do token (via `@CurrentUser("id")`).
2. Se não encontrado: `UnauthorizedException("Usuário não encontrado.")`.
3. Gera novo token e retorna `{ accessToken, user }`.

### `me(userId)`

1. Busca usuário; se não encontrado: `UnauthorizedException("Usuário não encontrado.")`.
2. Retorna o usuário sem `passwordHash`.

### `JwtStrategy.validate(payload)`

- `secretOrKey`: `process.env.JWT_SECRET || "dev-secret-change-in-production"`.
- `jwtFromRequest`: `ExtractJwt.fromAuthHeaderAsBearerToken()`.
- `ignoreExpiration: false`.
- Carrega `prisma.user.findUnique({ where: { id: payload.sub } })`. Se não existir: `UnauthorizedException("User not found")` (mensagem em inglês — apenas neste caminho).
- Injeta o usuário (sem `passwordHash`) em `request.user`.

## Erros lançados

| Origem | Exception | Mensagem |
| --- | --- | --- |
| `register` (e-mail duplicado) | `ConflictException` (409) | `Esse e-mail já está cadastrado.` |
| `login` (usuário não existe ou senha errada) | `UnauthorizedException` (401) | `E-mail ou senha incorretos.` |
| `refresh` / `me` (usuário sumiu) | `UnauthorizedException` (401) | `Usuário não encontrado.` |
| `JwtStrategy.validate` | `UnauthorizedException` (401) | `User not found` |
| Validação Zod | `BadRequestException` (400) | `Validation failed` + `errors[]` |

## Models tocados

- `User` — ver [[03a-modelos]].

## Notas relacionadas

- [[04-api-overview]]
- [[04g-api-erros]]
- [[09-shared]]
