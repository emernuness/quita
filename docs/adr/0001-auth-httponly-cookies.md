# ADR-0001: Auth — JWT em httpOnly cookies (não localStorage)

- **Status:** Proposed
- **Data:** 2026-05-22 (será aceito na abertura da Onda 1)
- **Autor(es):** Spec (Fase 4 §3.1) + agente
- **Onda:** 1

## Contexto

Estado atual (auditado 2026-05-22): `apps/web/src/lib/api.ts` salva o JWT em `window.localStorage` (`TOKEN_KEY = "quita.accessToken"`). Spec Fase 6 cataloga isso como **R1 — risco de XSS**: qualquer script malicioso (CDN comprometida, dependência transitiva, extensão de navegador) com acesso ao DOM lê o token e exfiltra a sessão.

A spec exige cookies httpOnly como contrato mínimo de segurança para ir a beta.

## Decisão

- API NestJS retorna o JWT (15 min TTL) em `Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax; Path=/`.
- Refresh token (30d) também em cookie httpOnly separado (`refresh_token`), ver ADR-0002.
- `apps/web` remove `getToken()` / `setToken()` em localStorage; axios envia credentials por cookie automaticamente (`withCredentials: true`).
- Backend extrai token do cookie via interceptor/guard customizado (não mais `Bearer` header em produção, exceto endpoints públicos de health).

## Consequências

- **Positivas:** mitiga XSS de roubo de token; alinhado com OWASP ASVS v4 §3.4.
- **Negativas / trade-offs:** exige CSRF token complementar (ver ADR a ser criado na Onda 1); cookies cross-domain pedem CORS com `credentials: true` e origem explícita (R2).
- **Reversibilidade:** baixa após beta — clientes em produção dependerão do contrato de cookie.

## Alternativas consideradas

- **Token em memória + refresh por endpoint dedicado:** descartada — perde sessão no refresh de página, exige re-login frequente.
- **SessionStorage:** descartada — mesmo vetor de XSS, sem benefício real sobre localStorage.

## Referências

- `docs/quita-especificacao/02-arquitetura/FASE_4_ARQUITETURA_TECNICA.md` §3.1
- `docs/quita-especificacao/05-migracao/FASE_6_PLANO_DE_MIGRACAO.md` R1
