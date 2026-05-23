# Runbook on-call — Quita

Procedimentos para incidentes em produção. Mantenha atualizado conforme novos modos de falha
aparecem.

## Severidades

| Sev | Definição | SLA resposta |
|---|---|---|
| **P0** | Down geral; users não conseguem logar | 15 min |
| **P1** | Funcionalidade core quebrada (motor, pagamentos) | 1h |
| **P2** | Bug em tela secundária; degradação parcial | 4h |
| **P3** | Cosmético, sem impacto funcional | próximo ciclo |

## Canais
- **Pager**: Sentry → Slack/email do on-call.
- **Status**: status.quita.com.br (a configurar Onda 7).
- **Comunicação com users**: e-mail via Resend + post em status page.

## Playbooks

### API não responde
1. Checar Railway dashboard — service status, deploy recente?
2. `railway logs --service quita-api --tail 200`.
3. Sentry → últimos erros.
4. Se OOM: rollback do último deploy via Railway UI.

### DB down
1. Railway → Postgres service.
2. Se travou: restart service.
3. Se corrompeu: restaurar último backup diário (Railway → Snapshots).
4. Comunicar users sobre janela de manutenção via Resend + status page.

### Pico de 401 inesperado
1. Verificar se `JWT_SECRET` ou `REFRESH_TOKEN_HMAC_SECRET` mudou (incidente de rotação).
2. Se sim: revogar refresh tokens em massa (`UPDATE refresh_tokens SET revoked_at = now() WHERE revoked_at IS NULL`).
3. Force logout de todos os users — eles fazem login novamente.

### Detecção de reuso de refresh em massa
- AuthAuditLog event_type=refresh_reuse_detected indica ataque ou bug.
- Investigar IP origem; bloquear se necessário via CORS_ORIGINS ou Cloudflare.
- Alerta no Sentry deve ser configurado para esse event_type.

### Webhook Stripe falhando
1. Stripe dashboard → Events.
2. Comparar payload com handler em `subscription.controller.ts`.
3. Se assinatura inválida: confirmar STRIPE_WEBHOOK_SECRET no Railway.
4. Replay manual via Stripe CLI: `stripe events resend evt_xxxxx`.

## Rotação de secrets
- JWT_SECRET / REFRESH_TOKEN_HMAC_SECRET: a cada 90 dias.
- Stripe webhook secret: imediatamente em caso de vazamento.
- Sentry DSN, PostHog key: a cada 180 dias.
- R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY: a cada 90 dias. Gerar nova credencial no Cloudflare Dashboard > R2 > Manage API tokens, atualizar Railway, restart, **revogar a anterior** após 24h.
- OpenAI API key: a cada 180 dias ou em caso de vazamento.
- Procedimento: gerar novo → atualizar Railway → restart → verificar logs por 10 min.

## Storage R2 (Cloudflare)
- Bucket default: `quita-ocr-uploads`
- Retenção: 30 dias (OcrCleanupProcessor diário 05:00 UTC apaga e nula `SettlementEvaluation.ocrImageUrl`)
- Limite custo: 10GB free tier; depois $0.015/GB/mês storage + zero egress
- Verificar uso: Cloudflare Dashboard > R2 > Metrics
- Em caso de bucket cheio: revisar OcrCleanupProcessor logs; aumentar TTL ou comprar storage adicional
- Backup: R2 não tem snapshot nativo. Para audit forense, replicar para bucket secundário via Cloudflare Worker

## Schedulers BullMQ (6 crons)
- `monthly-rollover` 0 3 1 * * — todo dia 1 às 03:00 UTC
- `data-retention-cleanup` 0 4 * * * — diário 04:00 UTC
- `ocr-cleanup` 0 5 * * * — diário 05:00 UTC
- `data-freshness-review` 0 6 * * 1 — segunda 06:00 UTC
- `interest-rate-update` 0 2 5 * * — dia 5 do mês 02:00 UTC (BCB SGS)
- `settlement-revalidation` 0 7 * * 2 — terça 07:00 UTC
- Verificar via BullBoard (futuro) ou `redis-cli LRANGE bull:motor-scheduled:wait 0 -1`
