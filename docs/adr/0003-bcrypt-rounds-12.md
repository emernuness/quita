# ADR-0003: bcrypt rounds = 12

- **Status:** Proposed
- **Data:** 2026-05-22
- **Onda:** 1

## Contexto

Atual: `bcrypt.hash(data.password, 10)` em `apps/api/src/modules/auth/auth.service.ts:27`. Rounds=10 era razoável em 2014; em hardware de 2026, ataques de força bruta offline em GPU consumer recuperam senhas fracas dessa faixa em horas.

OWASP Password Storage Cheat Sheet recomenda rounds ≥ 12 para bcrypt em 2026.

## Decisão

- Constante `BCRYPT_ROUNDS = 12` exportada de `apps/api/src/modules/auth/constants.ts`.
- Hashes existentes (caso haja registros em dev) podem coexistir com novos — bcrypt detecta o cost no próprio prefixo `$2b$10$` vs `$2b$12$`.
- Sem rehash automático no MVP (poucos usuários ainda). Pós-MVP: rehash on-login se cost < 12.

## Consequências

- **Positivas:** dobra o tempo de verificação por login (~250ms vs ~120ms num MacBook M-series) — aceitável.
- **Negativas / trade-offs:** custo CPU maior em login burst.
- **Reversibilidade:** alta — mudar a constante.

## Alternativas consideradas

- **argon2id:** preferido pela OWASP atualmente, descartado para o MVP por exigir nova dependência nativa e tuning de parâmetros memory/time/parallelism. Reavaliar pós-beta.
- **scrypt:** descartado — sem ganho prático sobre bcrypt 12.

## Referências

- OWASP Password Storage Cheat Sheet (2025)
- `docs/quita-especificacao/02-arquitetura/FASE_4_ARQUITETURA_TECNICA.md` §3.3
