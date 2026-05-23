# Pull Request

## Summary
<!-- 1-3 bullets explicando o quê + porquê -->

## Type
- [ ] feat (nova funcionalidade)
- [ ] fix (bug)
- [ ] refactor (sem mudança de comportamento)
- [ ] docs (apenas documentação)
- [ ] test (apenas testes)
- [ ] chore (build/CI/deps)

## Self-review checklist
- [ ] `pnpm typecheck` verde
- [ ] `pnpm lint` clean
- [ ] `pnpm test` todos passam
- [ ] Coverage threshold mantido (`pnpm --filter @quita/api exec vitest run --coverage`)
- [ ] Schema mudou? Migration criada + documentada em `docs/MIGRATIONS.md`
- [ ] Quebra contrato API? Notas no PR
- [ ] Variáveis env novas? Atualizei `.env.example` + `validateEnv()`
- [ ] Spec/runbook precisa atualizar? Feito
- [ ] Testei localmente o golden path

## Test plan
<!-- Como reproduzir/validar a mudança -->

## Migration impact
<!-- Reversível? Destrutiva? Backfill necessário? -->

## Rollback steps
<!-- Como desfazer se algo quebrar em prod -->

## Screenshots / Demo
<!-- Se UI -->

🤖 Generated with [Claude Code](https://claude.com/claude-code)
