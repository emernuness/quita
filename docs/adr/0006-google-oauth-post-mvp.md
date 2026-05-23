# ADR-0006: Google OAuth empurrado para pós-MVP

- **Status:** Accepted
- **Data:** 2026-05-22
- **Autor(es):** Emerson (PO)
- **Onda:** 0

## Contexto

A Fase 1 §6.1.1 da spec marca "Google OAuth (opcional)" como recurso desejável no fluxo de autenticação. O MVP precisa ser cortado a um conjunto mínimo defensável; provedores OAuth exigem:

- Conta Google Cloud Console + projeto OAuth + tela de consentimento revisada
- Domínio próprio configurado (não disponível na Onda 0–1)
- Política de privacidade publicada (depende de advogado fintech, ver checklist Fase 6 §13.7)
- Maior superfície de manutenção e debug em caso de falha

## Decisão

- Onda 1 implementa **apenas** autenticação por e-mail + senha, conforme contrato de segurança da spec (httpOnly cookie + refresh stateful HMAC + bcrypt 12).
- Botão "Continuar com Google" não aparece em nenhuma tela do MVP.
- Schema do `User` mantém colunas que permitem federação futura (`auth_provider`, `provider_user_id`) para evitar migration adicional quando OAuth for retomado.
- Retomada planejada para fase de crescimento pós-launch (não tem onda dedicada no plano atual; entra no backlog regular).

## Consequências

- **Positivas:**
  - Reduz dependências externas para iniciar Onda 1.
  - Política de privacidade pode ser publicada sem cláusulas OAuth.
  - Sem dependência de domínio configurado para Onda 1.
- **Negativas / trade-offs:**
  - Atrito de cadastro maior (não tem 1-click signup).
  - Risco menor de aquisição na fase beta.
- **Reversibilidade:** média — adicionar OAuth pós-MVP envolve novo endpoint, telas, ADR específico, mas schema já está preparado.

## Alternativas consideradas

- **OAuth na Onda 1:** descartada — bloqueia pré-requisitos externos (domínio + privacy policy) que não estão prontos.
- **OAuth apenas para beta:** descartada — manter binário simples no MVP reduz risco.

## Referências

- `docs/quita-especificacao/00-fundacao/FASE_1_ESPECIFICACAO_DE_PRODUTO_v2.md` §6.1.1
- `docs/quita-especificacao/05-migracao/FASE_6_PLANO_DE_MIGRACAO.md` §13.7
