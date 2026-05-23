FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Dependencies layer (cached)
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/motor/package.json ./packages/motor/
COPY tooling ./tooling
RUN pnpm install --frozen-lockfile

# Build layer
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @quita/shared build && \
    pnpm --filter @quita/motor build && \
    pnpm --filter @quita/api exec prisma generate && \
    pnpm --filter @quita/api build

# Production image — minimal
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache tini && corepack enable && corepack prepare pnpm@10.25.0 --activate

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/pnpm-workspace.yaml /app/package.json ./

EXPOSE 3000
USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/api/dist/main.js"]
