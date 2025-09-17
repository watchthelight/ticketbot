import 'dotenv/config';
import { createLogger } from './lib/logger';
import { randomUUID } from 'node:crypto';
import { loadEnv } from './env';
import { createClient } from './discord/client';
import commands from './discord/commands';
import { createServer } from './http/server';
import { disconnectPrisma, getPrisma } from './lib/db';
import { Events, InteractionType } from 'discord.js';
import { UserFacingError } from './lib/errors';
import { InMemoryRateLimiter } from './lib/rateLimit';

async function main() {
  const env = loadEnv();
  const logger = createLogger(env);

  const prisma = getPrisma();
  await prisma.$connect();

  const client = createClient();
  (client as any).config = env; // attach config for access in handlers

  client.once(Events.ClientReady, async (c) => {
    logger.info({ user: c.user.tag }, 'Discord client ready');
  });

  client.on(Events.Error, (err) => {
    logger.error({ err }, 'Discord client error');
  });

  const defaultLimiter = new InMemoryRateLimiter({
    points: Number(env.RATE_LIMIT_POINTS),
    durationMs: Number(env.RATE_LIMIT_DURATION_SEC) * 1000,
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;
    if (!interaction.isChatInputCommand()) return;
    const cmd = commands.find((c) => c.name === interaction.commandName);
    const correlationId = randomUUID();
    const child = logger.child({ correlationId, command: interaction.commandName, user: interaction.user.id });

    if (!cmd) return;
    try {
      // default per-user-per-command rate limit
      const key = `cmd:${interaction.commandName}:${interaction.user.id}`;
      const res = defaultLimiter.consume(key, 1);
      if (!res.ok) {
        const sec = Math.ceil((res.retryAfterMs ?? 1000) / 1000);
        await interaction.reply({ content: `Slow down. Try again in ~${sec}s.`, ephemeral: true });
        return;
      }
      await cmd.handle(interaction);
      child.info('Handled command');
    } catch (err) {
      child.error({ err }, 'Command error');
      const msg = err instanceof UserFacingError ? err.message : 'Something went wrong.';
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: msg, ephemeral: true });
      } else {
        await interaction.reply({ content: msg, ephemeral: true });
      }
    }
  });

  const http = createServer(logger);

  const port = 3000;
  await http.listen({ port, host: '0.0.0.0' });
  logger.info({ port }, 'HTTP server listening');

  await client.login(env.DISCORD_TOKEN);

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    try {
      await http.close();
      await client.destroy();
      await disconnectPrisma();
      logger.info('Shutdown complete');
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
