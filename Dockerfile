# syntax=docker/dockerfile:1.6

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then corepack enable && yarn install --frozen-lockfile; \
    else npm ci; fi
COPY . .
ENV PRISMA_SCHEMA=prisma/schema.postgres.prisma
RUN node scripts/prisma-ctl.mjs generate
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/index.js"]

