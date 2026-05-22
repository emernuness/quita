# ADR-0010: Schema EN snake_case

- **Status:** Proposed
- **Data:** 2026-05-22
- **Onda:** 1

## Contexto

Schema atual mistura PT-BR e EN (ex.: `pagamento`, `categoria`, `monthly_amount`). Fase 2 da spec padroniza tudo em EN snake_case para:

- Compatibilidade com bibliotecas (Prisma, queries SQL, dashboards).
- Onboarding de devs externos.
- Logs de erro legíveis em telemetria.

PT-BR vive na camada de apresentação (`apps/web/src/lib/labels.ts`).

## Decisão

- Todas as tabelas e colunas em EN snake_case.
- Enums em PT-BR no banco apenas quando o valor é parte do contrato de domínio do usuário (ex.: `nature: 'essencial' | 'variavel'`) — esses são strings semânticas, não nomes técnicos.
- `@quita/shared` mantém tipos TS em camelCase (convenção JS) com mapeamento via Prisma.
- Documentação técnica em EN; documentação de produto em PT-BR.

## Consequências

- **Positivas:** clareza; alinhamento com ecossistema TS/Postgres.
- **Negativas / trade-offs:** devs PT-BR pagam custo cognitivo pequeno; layer de labels carrega traduções.
- **Reversibilidade:** muito baixa após migration — toda a base de código depende.

## Alternativas consideradas

- **PT-BR em tudo:** descartada — atrita com tooling e devs externos.
- **camelCase no banco:** descartada — fricção com Postgres que case-folds identifiers.

## Referências

- `docs/quita-especificacao/00-fundacao/FASE_2_MODELAGEM_DE_DOMINIO_v2.md`
