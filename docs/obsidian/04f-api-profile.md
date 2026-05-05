---
title: API - Profile
tags: [api, profile, security, notifications]
updated: 2026-05-04
---

# 04f - Módulo Profile

Arquivos: `apps/api/src/modules/profile/`.

## Responsabilidade

Leitura e atualização do perfil do usuário autenticado (nome/telefone, senha, biometria, modo discreto e preferências de notificação). Todas as rotas exigem JWT (`@UseGuards(JwtAuthGuard)` na classe).

## Endpoints

Prefixo: `profile`.

| Método | Rota | Guard | Body (Zod) | Resposta `data` |
| --- | --- | --- | --- | --- |
| GET | `/api/profile` | `JwtAuthGuard` | — | `User` sem `passwordHash` |
| PATCH | `/api/profile` | `JwtAuthGuard` | `updateProfileSchema` | `User` atualizado sem `passwordHash` |
| PATCH | `/api/profile/password` | `JwtAuthGuard` | `changePasswordSchema` | `{ updated: true }` |
| PATCH | `/api/profile/security` | `JwtAuthGuard` | `updateSecuritySchema` | `User` atualizado sem `passwordHash` |
| PATCH | `/api/profile/discrete-mode` | `JwtAuthGuard` | `updateDiscreteModeSchema` | `User` atualizado sem `passwordHash` |
| GET | `/api/profile/notifications` | `JwtAuthGuard` | — | `NotificationPreference` (criada se não existir) |
| PATCH | `/api/profile/notifications` | `JwtAuthGuard` | `updateNotificationPrefsSchema` | `NotificationPreference` (upsert) |

Schemas em [[09-shared]].

## Lógica relevante

### `getProfile(userId)`

- `prisma.user.findUnique({ where: { id: userId } })`.
- `NotFoundException("User not found")` se ausente.
- Remove `passwordHash` antes de retornar.

### `updateProfile(userId, data)`

- `user.update` somente com campos definidos:
  - Se `data.name !== undefined`: grava `name` e regera `avatarInitials`:
    - `name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)`.
  - Se `data.phone !== undefined`: grava `phone`.
- Retorna `User` sem `passwordHash`.

### `changePassword(userId, data)`

1. Carrega o usuário; se ausente: `NotFoundException("User not found")`.
2. `bcrypt.compare(data.currentPassword, user.passwordHash)`.
3. Se inválido: `UnauthorizedException("Current password is incorrect")`.
4. Hash novo: `bcrypt.hash(data.newPassword, 10)`.
5. `user.update({ passwordHash })`.
6. Retorna `{ updated: true }`.

### `updateSecurity(userId, data)`

- Atualiza apenas campos definidos: `biometricFingerprint` e/ou `biometricFace` (booleans).
- Retorna `User` sem `passwordHash`.

### `toggleDiscreteMode(userId, data)`

- `user.update({ discreteMode: data.enabled })`.
- Retorna `User` sem `passwordHash`.

### `getNotificationPrefs(userId)`

- `notificationPreference.findUnique({ where: { userId } })`.
- Se não existe, cria com defaults via `notificationPreference.create({ data: { userId } })`.
- Retorna o registro.

### `updateNotificationPrefs(userId, data)`

- `notificationPreference.upsert({ where: { userId }, create: { userId, ...data }, update: data })`.
- Retorna o registro.

## Erros lançados

| Origem | Exception | Mensagem |
| --- | --- | --- |
| `getProfile` / `changePassword` usuário ausente | `NotFoundException` (404) | `User not found` |
| `changePassword` senha atual inválida | `UnauthorizedException` (401) | `Current password is incorrect` |
| Validação Zod | `BadRequestException` (400) | `Validation failed` + `errors[]` |
| Token inválido/ausente | `UnauthorizedException` (401) | (via `JwtAuthGuard`) |

## Models tocados

- `User` (campos `name`, `phone`, `avatarInitials`, `passwordHash`, `biometricFingerprint`, `biometricFace`, `discreteMode`).
- `NotificationPreference`.

Ver [[03a-modelos]].

## Notas relacionadas

- [[04-api-overview]]
- [[04a-api-auth]]
- [[09-shared]]
