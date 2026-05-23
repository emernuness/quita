# ADR-0009: Onboarding fracionado (Crítico vs Refinamento)

- **Status:** Proposed
- **Data:** 2026-05-22
- **Onda:** 3

## Contexto

Pessoas endividadas chegam ao Quita em sofrimento agudo. Onboarding longo (>10 min) tem alto risco de abandono. Mas decisões de qualidade exigem dados detalhados (provisão sazonal, renda protegida, perfil comportamental).

Fase 1 §7.1 e §7.4 desenharam um fracionamento: **Crítico (3–5 min)** entrega `diagnosisLevel='minimal'` e libera o app; **Refinamento Progressivo** é opcional, ganha telas avançadas, melhora qualidade do plano.

## Decisão

- Crítico (obrigatório): renda principal, despesas essenciais, dívidas com nome do credor + valor + status.
- Refinamento (opcional, granular): sazonalidade, rendas extras, despesas variáveis, perfil comportamental, metas.
- Onboarding cria `User.diagnosisLevel = 'minimal'` no fim do Crítico.
- Motor opera com qualquer `diagnosisLevel`; resultados ganham flags de confiança quando incompleto.
- UI mostra prompts contextuais sugerindo refinamento quando o motor identifica baixa confiança.

## Consequências

- **Positivas:** baixa fricção inicial; cresce engajamento ao longo do tempo.
- **Negativas / trade-offs:** motor precisa suportar contexto incompleto; cobertura de testes maior.
- **Reversibilidade:** alta — exigir refinamento é mudança de UX, não de schema.

## Alternativas consideradas

- **Onboarding único longo:** descartada — abandono inaceitável (>40% projetado).
- **Sem onboarding (entrada manual gradual):** descartada — motor não consegue decidir nada útil sem mínimo de contexto.

## Referências

- `docs/quita-especificacao/00-fundacao/FASE_1_ESPECIFICACAO_DE_PRODUTO_v2.md` §7
