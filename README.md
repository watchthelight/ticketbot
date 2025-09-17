sentinel-bot
===========

Production-ready Discord bot scaffold in TypeScript with discord.js, Fastify, and Prisma. Ships with slash command framework, rate limiting, logging, Docker, and CI.

Quickstart
-
- Requirements: Node 20, npm (or pnpm/yarn), SQLite (file based), Git
- Copy env: `cp .env.sample .env`, fill DISCORD_*
- Install deps: `npm i`
- Generate Prisma client (SQLite dev schema): `npm run prisma:generate`
- Start dev: `npm run dev`

Deploy Commands
-
- Update slash commands with: `npm run deploy:commands`

Docker Compose
-
- `docker-compose up --build`
- App listens on `http://localhost:3000/readyz` when healthy
- Uses Postgres for `DATABASE_URL` and sets `PRISMA_SCHEMA=prisma/schema.postgres.prisma`

Security & Ops
-
- No secrets in code; uses env vars
- Minimal intents, structured logging, correlation IDs
- Token bucket rate limiter and simple cooldowns
- Input validation via zod in env; command options validated by discord
- Graceful shutdown on SIGINT/SIGTERM

Architecture
-
- Discord client: `src/discord/client.ts`
- Commands registered via `src/discord/deployCommands.ts`
- HTTP server (health + future license check): `src/http/server.ts`
- Prisma client: `src/lib/db.ts`, schema in `prisma/`
- Key helpers: `src/lib/keys.ts`
- Rate limit: `src/lib/rateLimit.ts`

Dev vs Prod DB
-
- Dev default: SQLite via `prisma/schema.prisma` and `DATABASE_URL="file:./dev.db"`
- Prod: Postgres via `prisma/schema.postgres.prisma` and `DATABASE_URL` postgres URL
- Control Prisma schema with `PRISMA_SCHEMA` env; scripts use `scripts/prisma-ctl.mjs`

Testing
-
- `npm test` runs vitest unit tests (no DB required; Prisma is mocked)

Future License Server Integration
-
- Add HTTP endpoint implementation at `src/http/server.ts: /license/check` to verify presented keys
- Use `keys.verifyKey` against stored hashes and update audit logs

