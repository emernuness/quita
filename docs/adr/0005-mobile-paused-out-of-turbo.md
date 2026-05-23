# ADR-0005: Apps/mobile pausado, fora do turbo build

- **Status:** Accepted
- **Data:** 2026-05-22
- **Autor(es):** Emerson (PO) + agente
- **Onda:** 0

## Contexto

O monorepo contém `apps/mobile/` (Expo SDK 54) escrito durante o MVP v2 (organizador financeiro). O pivot para MVP v3 (Motor de Decisão) priorizou exclusivamente `apps/web/` (Next.js 15) — ver memória `project_web_pivot.md` e Fase 5 da spec.

O código mobile depende de tipos de `@quita/shared` que serão profundamente alterados na refatoração (modelo de domínio expande de 12 para 29 tabelas). Manter o mobile no pipeline de build forçaria sincronizar refactors em paralelo, dobrando custo sem entregar valor (mobile não está no escopo do MVP de launch).

## Decisão

- Manter `apps/mobile/` no repositório (preserva histórico e código futuro).
- Excluir `@quita/mobile` dos scripts raiz via `--filter=!@quita/mobile` em `dev`, `build`, `typecheck`, `test`.
- Não excluir do `pnpm-workspace.yaml` (preserva resolução de `@quita/shared` para quando for retomado).
- Documentação do mobile fica congelada na revisão atual até retomada formal pós-MVP.

## Consequências

- **Positivas:**
  - CI mais rápido (não compila mobile a cada PR).
  - Refatoração de `@quita/shared` não bloqueia por quebras no mobile.
  - Reduz superfície de testes manuais.
- **Negativas / trade-offs:**
  - Mobile pode acumular drift conforme `@quita/shared` evolui — esperado, será endereçado na retomada.
- **Reversibilidade:** alta — remover os `--filter=!@quita/mobile` dos scripts restaura comportamento.

## Alternativas consideradas

- **Deletar `apps/mobile/`:** descartada — perde código e setup Expo que será útil pós-MVP.
- **Manter no build padrão:** descartada — dobra custo de refactor sem benefício imediato.

## Referências

- `docs/quita-especificacao/04-telas-web/FASE_5_TELAS_WEB.md` (foco em web)
- `docs/quita-especificacao/05-migracao/FASE_6_PLANO_DE_MIGRACAO.md` (mobile fora do MVP)
