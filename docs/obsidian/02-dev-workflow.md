---
title: Dev Workflow
tags: [dev, workflow, scripts, setup, troubleshooting]
updated: 2026-05-04
---

# Dev Workflow

Como rodar o monorepo Quita localmente, scripts disponíveis, portas e dicas de troubleshooting. Para a visão geral da stack e estrutura, ver [[01-arquitetura]].

## Pré-requisitos

- **Node.js** 20 LTS ou superior (verificar; alinhado com Expo SDK 54 e NestJS 11).
- **pnpm** `10.25.0` — versão fixada em `package.json` via `packageManager`. Instalável via `corepack enable && corepack prepare pnpm@10.25.0 --activate`.
- **Docker** + **Docker Compose** (para Postgres e Redis locais).
- **Expo Go** instalado no celular físico (iOS App Store / Android Play Store) **ou** simulador iOS/emulador Android.
- Git.

## Scripts da raiz

Definidos em `package.json` na raiz e orquestrados por Turborepo:

| Script              | Comando                                                      | Descrição                                              |
|---------------------|--------------------------------------------------------------|--------------------------------------------------------|
| `pnpm dev`          | `turbo run dev`                                              | Sobe API (Nest watch) e Mobile (Expo) em paralelo.     |
| `pnpm build`        | `turbo run build`                                            | Build de todos os pacotes (`shared`, `api`).           |
| `pnpm typecheck`    | `turbo run typecheck`                                        | `tsc --noEmit` em todos os workspaces.                 |
| `pnpm lint`         | `biome check .`                                              | Lint + format check (somente leitura).                 |
| `pnpm lint:fix`     | `biome check --write .`                                      | Auto-fix de lint/format.                               |
| `pnpm clean`        | `turbo run clean`                                            | Remove `dist/`, `.expo/`, caches.                      |
| `pnpm db:generate`  | `turbo run db:generate --filter=@quita/api`                  | `prisma generate` (gera `@prisma/client`).             |
| `pnpm db:push`      | `turbo run db:push --filter=@quita/api`                      | Sincroniza schema com o banco (sem migration).         |
| `pnpm db:migrate`   | `turbo run db:migrate --filter=@quita/api`                   | `prisma migrate dev` (gera migration).                 |
| `pnpm db:seed`      | `turbo run db:seed --filter=@quita/api`                      | Roda `apps/api/prisma/seed.ts` via `ts-node`.          |
| `pnpm db:studio`    | `turbo run db:studio --filter=@quita/api`                    | Abre Prisma Studio (UI web do banco).                  |

## Setup inicial

Execute na raiz do monorepo:

```bash
# 1. Instalar dependências do workspace
pnpm install

# 2. Copiar e ajustar variáveis de ambiente da API
cp apps/api/.env.example apps/api/.env

# 3. Subir Postgres + Redis em containers
docker compose up -d

# 4. Gerar Prisma Client
pnpm db:generate

# 5. Sincronizar schema com o banco (dev)
pnpm db:push

# 6. Popular dados iniciais
pnpm db:seed

# 7. Subir API e Mobile em modo dev
pnpm dev
```

Após o `pnpm dev`:

- **API** disponível em `http://localhost:3000`.
- **Metro** abre QR code e expõe DevTools em `http://localhost:8081`.

## Portas

| Serviço     | Porta  | Origem                            |
|-------------|--------|-----------------------------------|
| API (Nest)  | `3000` | `apps/api/.env` → `PORT=3000`     |
| Metro (Expo)| `8081` | padrão Expo CLI                   |
| Postgres    | `5432` | `docker-compose.yml` → `postgres` |
| Redis       | `6379` | `docker-compose.yml` → `redis`    |

## Variáveis de ambiente

### `apps/api/.env`

Modelo em `apps/api/.env.example`:

```env
DATABASE_URL="postgresql://quita:quita@localhost:5432/quita?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=3000
JWT_SECRET="change-me-in-production"
```

- `DATABASE_URL` — string de conexão Postgres (usuário/senha/db = `quita` por padrão, conforme `docker-compose.yml`).
- `REDIS_URL` — string de conexão Redis local.
- `PORT` — porta HTTP da API (Nest lê em `main.ts`, verificar).
- `JWT_SECRET` — segredo para assinar JWTs. **Trocar em produção**.

### `apps/mobile/.env`

Não há `.env.example` versionado para o mobile (verificar). Variáveis Expo precisam do prefixo `EXPO_PUBLIC_` para serem expostas ao bundle:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000
```

> **Atenção:** ao testar em **celular físico via Expo Go**, `localhost` aponta para o próprio aparelho — use o **IP da LAN** da sua máquina (ex.: `192.168.x.x`). Em simulador iOS pode-se usar `http://localhost:3000`; no emulador Android, o equivalente é `http://10.0.2.2:3000`.

### Como descobrir o IP da LAN

```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

## Conectando o Expo Go

1. Rodar `pnpm dev` (ou `pnpm --filter=@quita/mobile dev`).
2. O Metro imprime no terminal um QR code e uma URL no formato `exp://<IP-LAN>:8081`.
3. No celular conectado **na mesma rede Wi-Fi**:
   - **iOS:** abrir Câmera, mirar no QR, abrir no Expo Go.
   - **Android:** abrir Expo Go → "Scan QR code".
4. Garantir que `EXPO_PUBLIC_API_URL` aponte para o **mesmo** IP da LAN, não para `localhost`.

## Troubleshooting

### Banco fora de sincronia / quero recomeçar (apenas dev)

```bash
pnpm --filter=@quita/api exec prisma db push --force-reset
pnpm db:seed
```

> ⚠️ `--force-reset` **apaga todos os dados** do banco. Nunca usar em ambientes compartilhados ou produção.

### Cache do Metro corrompido / erros estranhos no mobile

```bash
pnpm --filter=@quita/mobile dev -- --clear
# ou
pnpm --filter=@quita/mobile exec expo start --clear
```

### `node_modules` "sujo" — reinstalação limpa

```bash
# Da raiz
pnpm clean
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
pnpm db:generate   # @prisma/client precisa ser regenerado após reinstall
```

### `@prisma/client` indefinido / "did you forget to run prisma generate?"

```bash
pnpm db:generate
```

Sempre rodar após:

- Reinstalação de `node_modules`.
- Alteração no `apps/api/prisma/schema.prisma`.
- `git pull` que tocou no schema.

### Mobile não enxerga a API

- Confirmar que o celular e a máquina estão na **mesma rede**.
- Verificar firewall do macOS/Linux (porta 3000 liberada).
- Se a API está em `localhost`, garantir que ela escute também em `0.0.0.0` (verificar `main.ts`).
- Conferir `EXPO_PUBLIC_API_URL` (precisa do prefixo `EXPO_PUBLIC_` e reiniciar Metro com `--clear` ao alterar).

### Postgres/Redis não sobem

```bash
docker compose ps
docker compose logs postgres
docker compose logs redis

# Recriar do zero (mantém volumes)
docker compose down
docker compose up -d

# Recriar apagando dados (destrutivo)
docker compose down -v
docker compose up -d
pnpm db:push && pnpm db:seed
```

## Comandos pnpm filtered (workspaces)

A flag `--filter` (`-F`) restringe um comando a um workspace específico.

| Comando                                                | Efeito                                                     |
|--------------------------------------------------------|------------------------------------------------------------|
| `pnpm --filter=@quita/api dev`                         | Sobe apenas a API em watch mode.                           |
| `pnpm --filter=@quita/mobile dev`                      | Sobe apenas o Expo/Metro.                                  |
| `pnpm --filter=@quita/api typecheck`                   | Typecheck só do backend.                                   |
| `pnpm --filter=@quita/mobile typecheck`                | Typecheck só do mobile.                                    |
| `pnpm --filter=@quita/shared build`                    | Compila o pacote compartilhado para `dist/`.               |
| `pnpm --filter=@quita/api db:studio`                   | Abre Prisma Studio na porta padrão.                        |
| `pnpm --filter=@quita/api db:migrate`                  | Cria nova migration interativamente.                       |
| `pnpm --filter=@quita/api exec prisma <cmd>`           | Executa qualquer comando da CLI Prisma no contexto da API. |
| `pnpm --filter=@quita/mobile exec expo <cmd>`          | Executa qualquer comando da CLI Expo no contexto do app.   |
| `pnpm --filter=@quita/api add <pkg>`                   | Adiciona dependência só na API.                            |
| `pnpm --filter=@quita/mobile add <pkg>`                | Adiciona dependência só no mobile.                         |

## Notas relacionadas

- [[01-arquitetura]]
- [[03-api-overview]]
- [[04-mobile-overview]]
- [[06-prisma-schema]]
- [[08-docker-infra]]
