# ADR-0002: Refresh tokens stateful com HMAC-SHA256

- **Status:** Proposed
- **Data:** 2026-05-22
- **Onda:** 1

## Contexto

Implementação atual de `refresh` (apps/api/src/modules/auth/auth.service.ts) apenas re-emite um JWT do mesmo usuário sem invalidação possível: não há tabela de tokens, não há revogação, não há detecção de uso após logout. Logout efetivo é impossível.

Spec Fase 4 exige refresh stateful para suportar logout, logout-all e detecção de token comprometido.

## Decisão

- Nova tabela `refresh_tokens` (Prisma):
  - `id` UUID PK
  - `user_id` FK → users
  - `token_hash` (HMAC-SHA256 do refresh token com chave do servidor)
  - `expires_at` (now + 30d)
  - `revoked_at` (nullable)
  - `created_ip`, `user_agent`
- Endpoint `/auth/refresh` valida hash em banco, rotaciona (revoga o antigo, emite novo).
- Endpoint `/auth/logout` revoga o refresh atual.
- Endpoint `/auth/logout-all` revoga todos do `user_id`.
- Detecção de reuso (token já revogado sendo apresentado) → revoga **todos** os tokens do usuário e dispara alerta no Sentry + linha em `auth_audit_logs`.

## Consequências

- **Positivas:** logout real; revogação por incidente; trilha auditável.
- **Negativas / trade-offs:** +1 query por refresh; armazena estado em DB (era stateless).
- **Reversibilidade:** média — voltar a stateless exige migration reversa e mudança de contrato.

## Alternativas consideradas

- **JWT refresh stateless com blacklist:** descartada — blacklist em Redis tem mesma complexidade sem benefício de auditoria.
- **Tokens opacos sem HMAC (raw em banco):** descartada — vazamento de DB expõe tokens em claro.

## Referências

- `docs/quita-especificacao/02-arquitetura/FASE_4_ARQUITETURA_TECNICA.md` §3.2
