sentinel-bot
============

ticketbot for warlock. TypeScript, discord.js v14, Prisma, and Fastify. It registers slash commands, persists to SQLite/Postgres, and runs clean in Docker and CI.

Features
- Slash commands with permissions and typed handlers
- Prisma ORM (SQLite dev, Postgres prod)
- Fastify HTTP server (/readyz, /livez, seam for /license/check)
- Token bucket rate limiting + cooldowns
- Structured logs with request/interaction IDs
- Docker + GitHub Actions

Quickstart
Prerequisites
- Node 20, npm, Git

Clone + install
```
git clone https://github.com/watchthelight/ticketbot.git
cd ticketbot
npm ci
```

Env
```
cp .env.sample .env
# Fill DISCORD_* and set DATABASE_URL (SQLite default is fine for dev)
```

Run dev
```
npm run prisma:generate
npm run dev
```

First success signal
- Bot logs “Discord client ready” and HTTP responds at http://localhost:3000/readyz with `{ ok: true }`.

Commands & Usage
- `/help` — shows commands you can use.
- `/health` — ping, DB check.
- `/getkey` — claim a one-time key. If already claimed, I show a masked fingerprint.
- `/license issue <user> [expires_in_days] [rotate]` — admin only. Idempotent unless `rotate`.
- `/license rotate <user>` — admin only.
- `/license revoke <user> [reason]` — admin only.
- `/license info <user>` — admin only.
- `/config set-admin-role <role_id>` — set per-guild admin role override.

Example error
```
/license rotate @user
→ "Admin only"
```

Config
VAR | Required | Example | Notes
--- | --- | --- | ---
DISCORD_TOKEN | yes | xoxb… | Bot token
DISCORD_APP_ID | yes | 123456 | Application ID
DISCORD_PUBLIC_KEY | yes | abc… | For future signature checks
DATABASE_URL | yes | file:./dev.db | SQLite for dev; Postgres URL in prod
ADMIN_IDS | no | 123,456 | Comma-separated user IDs with admin access

Dev notes
- Scripts: `dev`, `build`, `start`, `lint`, `test`, `format`, `deploy:commands`.
- `prisma:generate` respects `PRISMA_SCHEMA` (defaults to SQLite). Use `prisma/schema.postgres.prisma` for Postgres.
- Tests mock Prisma; no DB needed.
- I keep code self-explanatory. Minimal comments. Short errors.

Deploy
- Docker Compose: `docker-compose up --build`
- Health: GET `http://localhost:3000/readyz` (200 JSON `{ ok: true }`)

Security notes
- No hardcoded secrets. Env only.
- Least-privileged Discord intents.
- Rotate tokens and keys regularly.

Roadmap
- Implement `/license/check` verification
- Redis-backed rate limiter
- Sharding for large guild counts
- Per-command metrics and SLOs
- Admin UX improvements

License
MIT
