# ADR-0007: BullMQ + Redis para jobs assíncronos

- **Status:** Proposed
- **Data:** 2026-05-22
- **Onda:** 1

## Contexto

Spec Fase 4 define 14 jobs assíncronos em 2 queues:

- `motor-recalc` com `groupId={userId}` (concorrência 1 por usuário, evita race em recálculo do motor).
- `motor-scheduled` para tarefas periódicas (notificações, projeções de longo prazo, snapshots).

Atualmente: nenhum job runner instalado, embora `docker-compose.yml` já provisione `redis:7-alpine`.

## Decisão

- Usar `@nestjs/bullmq` + `bullmq` + `ioredis`.
- 2 queues conforme spec.
- Workers vivem no mesmo processo da API no MVP (separar em deploy próprio só se métricas exigirem).
- Dashboard interno (BullBoard) em `/admin/queues` protegido por guard de role `ADMIN`.

## Consequências

- **Positivas:** padrão maduro em Node/Nest; suporte nativo a groupId; observabilidade boa.
- **Negativas / trade-offs:** Redis vira dependência crítica de produção (não só cache).
- **Reversibilidade:** média — substituir por outro runner é refactor grande.

## Alternativas consideradas

- **Cron jobs em DB (pg_cron):** descartada — não cobre groupId e tem pior observabilidade.
- **Inngest / Trigger.dev:** descartada para MVP — dependência externa paga; reavaliar pós-launch.

## Referências

- `docs/quita-especificacao/02-arquitetura/FASE_4_ARQUITETURA_TECNICA.md` §4
