# Migrations — plano de aplicação e rollback

Listagem completa de todas migrations Prisma do projeto, com plano de rollback explícito por migration. Crítica para deploys de produção.

## Status atual

**Dev**: 7 migrations aplicadas via drop+recreate em sessões de refactor.
**Prod**: nunca rodou. Primeiro deploy aplicará as 7 em ordem em DB vazio.

## Lista por ordem

| # | Migration | Tipo | Reversível? | Notas |
|---|-----------|------|-------------|-------|
| 0001 | initial_schema | criação | ✅ DROP TABLE | Base completa (users, debts, incomes, expenses, payments, BehaviorProfile, MonthlyActionPlan, etc) |
| 0002 | stripe_customer_id | add column | ✅ DROP COLUMN | `User.stripeCustomerId` nullable |
| 0003 | user_deleted_at | add column | ✅ DROP COLUMN | `User.deletedAt` para soft-delete LGPD |
| 0004 | settlement_ocr_fields | add columns | ✅ DROP COLUMNS | `SettlementEvaluation.{usedOcr, ocrImageUrl, ocrExtractedData, ocrConfidence}` |
| 0005 | drop_legacy_fields | **DROP COLUMNS** | ⚠️ **IRREVERSÍVEL** | Vide notas abaixo |
| 0006 | notifications | criação + enum | ✅ DROP TABLE + TYPE | Nova tabela `notifications` + enums NotificationCategory/Severity |
| 0007 | (futura) user_role | add column | ✅ DROP COLUMN | Enum `user`/`admin` para Bull Board (planejada Onda E) |

## Migration 0005 — `drop_legacy_fields`

**Status: IRREVERSÍVEL.** Dropa colunas legadas que existiam pré-refactor v3 mas não eram mais utilizadas. Em dev verificou-se que estavam vazias.

**Em prod (primeiro deploy):** aplica em DB vazio → sem impacto.

**Em prod (deploys futuros após row 1):** REQUER backup completo antes + janela de manutenção. Down migration não existe — se precisar reverter, restaurar do snapshot pré-deploy.

## Estratégia de deploy

### Primeiro deploy em prod (DB vazio)
```bash
pnpm --filter @quita/api exec prisma migrate deploy
pnpm --filter @quita/api db:seed
```

Aplica 0001-0007 em ordem + popula RegionalMinimumVital (54 entradas), DebtCategory (12), SupportChannel (10), ScoringWeight (11), InterestRateReference (6).

### Deploys subsequentes
1. **Sempre** snapshot do DB antes (Railway/RDS automated backup)
2. `pnpm --filter @quita/api exec prisma migrate deploy` (idempotente — só aplica novas)
3. Verificar `_prisma_migrations` no DB para histórico
4. Se falhou no meio: `prisma migrate resolve --rolled-back <name>` + investigar

### Rollback de emergência
Não tente desfazer migration via `prisma migrate reset` em prod (destrutivo). Em vez disso:
1. Restaure DB do snapshot mais recente (Railway → Snapshots → Restore)
2. Deploy commit anterior do código
3. Comunique users via status page

## Próximas migrations planejadas

- 0008 `user_timezone` — adicionar `User.timezone` (TZ Olson) para per-user notification window (dívida técnica documentada na issue `notification-tz-per-user`)
- 0009 `behavior_profile_levels` — `motivationLevel` + `disciplineLevel` se necessário refinar scoring
