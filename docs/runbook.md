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
- Procedimento: gerar novo → atualizar Railway → restart → verificar logs por 10 min.
