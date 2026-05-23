# Architecture Decision Records (ADRs)

Decisões arquiteturais reversíveis do projeto QUITA. Cada ADR captura **contexto**, **decisão**, **consequências** e **alternativas consideradas** para uma escolha técnica não-trivial.

## Convenção

- Nome de arquivo: `NNNN-kebab-case-titulo.md` (NNNN = 4 dígitos sequenciais)
- Status: `Proposed` → `Accepted` → `Deprecated` / `Superseded by ADR-XXXX`
- Toda nova decisão arquitetural durante a refatoração das 7 ondas (Fase 6) abre um **ADR-PR separado** (sem código) que requer aprovação humana antes de implementar (regra do plano de execução do Patch v1.1).
- Decisões já validadas pela spec em `docs/quita-especificacao/` ganham ADR documental retroativo no início da onda correspondente.

## Template

Ver `0000-template.md`.

## Índice

| # | Título | Status | Onda |
|---|--------|--------|------|
| 0001 | Auth: JWT em httpOnly cookies | Proposed | 1 |
| 0002 | Refresh tokens stateful com HMAC-SHA256 | Proposed | 1 |
| 0003 | bcrypt rounds = 12 | Proposed | 1 |
| 0004 | Migração drop+recreate (sem usuários produtivos) | Proposed | 1 |
| 0005 | Apps/mobile pausado, fora do turbo build | Accepted | 0 |
| 0006 | Google OAuth empurrado para pós-MVP | Accepted | 0 |
| 0007 | BullMQ + Redis para jobs assíncronos | Proposed | 1 |
| 0008 | Motor de decisão com funções puras | Proposed | 2 |
| 0009 | Onboarding fracionado (Crítico vs Refinamento) | Proposed | 3 |
| 0010 | Schema EN snake_case | Proposed | 1 |
