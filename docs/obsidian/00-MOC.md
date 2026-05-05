---
title: Quita — Mapa de Conteúdo
tags: [moc, índice, quita]
updated: 2026-05-05
---

# Quita — Mapa de Conteúdo

Cérebro do app. Documentação viva de **tudo** que está construído: arquitetura, banco, API, mobile, telas, brand, fluxos.

> Sempre que algo mudar no código, atualize a nota correspondente. As notas são a fonte canônica de "como o app funciona hoje".

## Como navegar

- Comece por [[01-arquitetura]] para o panorama do monorepo.
- Para rodar localmente, [[02-dev-workflow]].
- Para entender um endpoint, [[04-api-overview]] e os módulos `04a..04g`.
- Para entender uma tela, [[07-telas-overview]] e os arquivos `07a..07f`.
- Para identidade visual, [[08-brand]].
- Para o status atual e pendências, [[13-status-projeto]].

## Núcleo

- [[01-arquitetura]] — Stack, monorepo, dependências
- [[02-dev-workflow]] — Setup, scripts, portas, troubleshooting

## Banco de dados

- [[03-banco-de-dados]] — Visão geral Postgres + Prisma
- [[03a-modelos]] — Cada model em detalhe
- [[03b-relacoes]] — Relacionamentos + diagrama ER
- [[03c-enums]] — Enums Prisma
- [[03d-seed]] — Dados iniciais

## API (NestJS)

- [[04-api-overview]] — Bootstrap, prefix `/api`, JWT, Zod, envelope `{success,data}`
- [[04a-api-auth]] — `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/me`
- [[04b-api-onboarding]] — Renda, categorias, dívidas, despesas, complete
- [[04c-api-financial]] — Summary, incomes, expenses
- [[04d-api-debts]] — CRUD dívidas, pagamentos, categorias
- [[04e-api-dashboard]] — Visão consolidada
- [[04f-api-profile]] — Perfil, senha, segurança, modo discreto, notificações
- [[04g-api-erros]] — HttpExceptionFilter, ZodValidationPipe, formato de erro

## Mobile (Expo SDK 54)

- [[05-mobile-arquitetura]] — Stack, boot, providers
- [[05a-roteamento]] — Árvore de rotas Expo Router
- [[05b-stores]] — Zustand + SecureStore
- [[05c-services]] — Axios + interceptor de erros
- [[05d-providers-hooks]] — QueryProvider, hooks
- [[06-componentes]] — Button, Input, DebtCard, MetricCard, etc.

## Telas

- [[07-telas-overview]] — Mapa + fluxos principais
- [[07a-telas-auth]] — splash, login, register, forgot
- [[07b-telas-onboarding]] — income → categorias → dívidas → despesas
- [[07c-telas-tabs]] — Hoje, Plano, layout das tabs
- [[07d-telas-financas]] — Lista, detalhe, charts
- [[07e-telas-profile]] — Perfil + sub-rotas
- [[07f-telas-modais]] — new-debt, pay-debt, celebration, blue-mode, etc.

## Brand & shared

- [[08-brand]] — Sistema de design (cores, tipografia, espaçamento, componentes)
- [[09-shared]] — Pacote `@quita/shared` (zod schemas, enums, constants)

## Transversais

- [[10-tratamento-erros]] — Backend → Mobile (PT-BR friendly)
- [[11-fluxo-autenticacao]] — Register, login, remember-me, refresh, logout
- [[12-fluxos-de-dados]] — Criação de dívidas, pagamentos, receitas/despesas
- [[13-status-projeto]] — O que existe hoje, decisões, pendências

## Convenções dos arquivos

- Frontmatter YAML (`title`, `tags`, `updated`)
- Wiki-links `[[arquivo]]` para cross-references
- Português BR
- Diagramas em **Mermaid** (`flowchart`, `sequenceDiagram`, `erDiagram`)
- Citação direta de paths e identificadores quando relevante
- Marcar `(verificar)` quando algo não pôde ser confirmado pelo código
