# ADR-0004: Migração drop+recreate (sem usuários produtivos)

- **Status:** Proposed
- **Data:** 2026-05-22
- **Onda:** 1

## Contexto

A refatoração MVP v3 expande o schema de 12 para 29 tabelas, renomeia campos PT-BR → EN snake_case e altera contratos de domínio (Income/Expense/Debt). Migrar dados em produção seria complexo, mas:

- Não há usuários de produção (auditado 2026-05-22: nenhum deploy público).
- Bancos locais de dev são descartáveis.
- 3 migrations atuais (`init`, `add_monthly_amount_to_debt`, `add_debt_nature`) representam estado intermediário sem valor histórico que justifique preservar.

## Decisão

- Onda 1 abre PR único que:
  1. Deleta `apps/api/prisma/migrations/*`.
  2. Substitui `apps/api/prisma/schema.prisma` pelo schema completo do MVP v3 (29 tabelas conforme Fase 2).
  3. Roda `prisma migrate dev --name 0001_init` para gerar a nova migration única `0001_init.sql`.
  4. Atualiza seeds e fixtures.
- README documenta que devs precisam dropar o DB local antes de pull dessa branch.

## Consequências

- **Positivas:** schema limpo, sem peso histórico; código de motor parte de tipos finais.
- **Negativas / trade-offs:** todo dev precisa drop+recreate; impossível voltar atrás após merge em main.
- **Reversibilidade:** baixíssima — qualquer rollback exige restore de backup pré-onda.

## Alternativas consideradas

- **Migrations incrementais preservando estado:** descartada — sem usuários, é trabalho sem retorno; aumenta superfície de bug em migrations encadeadas.
- **Schema novo em DB separado, dual-write:** descartada — complexidade desnecessária para zero usuários.

## Referências

- `docs/quita-especificacao/00-fundacao/FASE_2_MODELAGEM_DE_DOMINIO_v2.md`
- `docs/quita-especificacao/05-migracao/FASE_6_PLANO_DE_MIGRACAO.md` §1.2
