# ADR-0008: Motor de decisão com funções puras

- **Status:** Proposed
- **Data:** 2026-05-22
- **Onda:** 2

## Contexto

O motor (12 módulos: capacity-calculator, state-classifier, mode-selector, etc.) é o coração do produto e precisa ser:

- Testável contra os 8 cenários canônicos (Maria, João, Roberto, Ana, Carlos, ...).
- Determinístico (mesmos inputs ⇒ mesma decisão; auditável legalmente).
- Replayable (snapshot do contexto + função reproduz decisão).

## Decisão

- Cada módulo do motor exporta funções puras: `(MotorContext) ⇒ MotorResult<T>`.
- Sem injeção de PrismaService, sem `Date.now()` interno (recebe `now` no contexto), sem `Math.random()`.
- Side effects (persistir resultado, emitir evento, enfileirar job) ficam no `motor-orchestrator` NestJS, **fora** das funções puras.
- Tipos vivem em `@quita/shared` para uso simultâneo no backend e no frontend (preview de simulação).

## Consequências

- **Positivas:** testes unitários rápidos sem mocks; snapshot testing; possibilidade futura de rodar motor no edge/client.
- **Negativas / trade-offs:** orquestrador precisa montar `MotorContext` rico (mais queries de leitura).
- **Reversibilidade:** baixa — toda a arquitetura do motor depende dessa convenção.

## Alternativas consideradas

- **Serviços NestJS com DI completa:** descartada — acopla lógica financeira ao runtime, dificulta testes e portabilidade.

## Referências

- `docs/quita-especificacao/01-motor/FASE_3_MOTOR_DE_DECISAO.md`
