import type { ChatInputCommandInteraction, GuildMemberRoleManager } from 'discord.js';
import { InMemoryRateLimiter } from '../lib/rateLimit';
import { PermissionError, RateLimitError, UserFacingError } from '../lib/errors';
import type { CommandHandler } from './types';
import { getPrisma } from '../lib/db';

const globalLimiter = new InMemoryRateLimiter({ points: 5, durationMs: 15_000 });
const cooldowns = new Map<string, number>();

function getAdminIds(interaction: ChatInputCommandInteraction): string[] {
  return (interaction.client as any).config?.ADMIN_IDS ?? [];
}

export async function hasGuildAdminRole(
  interaction: ChatInputCommandInteraction,
  adminIds: string[],
): Promise<boolean> {
  if (adminIds.includes(interaction.user.id)) return true;
  const guildId = interaction.guildId;
  if (!guildId) return false;
  const prisma = getPrisma();
  const cfg = await prisma.guildConfig.findUnique({ where: { guildId } });
  if (!cfg?.adminRoleId) return false;

  const memberRoles = (interaction.member?.roles as GuildMemberRoleManager | undefined)?.cache;
  return memberRoles?.has(cfg.adminRoleId) ?? false;
}

export function requireAdmin(msg = 'Admin only'): (h: CommandHandler) => CommandHandler {
  return (handler: CommandHandler) => async (interaction) => {
    const ok = await hasGuildAdminRole(interaction, getAdminIds(interaction));
    if (!ok) throw new PermissionError(msg);
    return handler(interaction);
  };
}

export function withRateLimit(
  keyPrefix: string,
  limiter = globalLimiter,
  cost = 1,
): (h: CommandHandler) => CommandHandler {
  return (handler) => async (interaction) => {
    const key = `${keyPrefix}:${interaction.user.id}`;
    const res = limiter.consume(key, cost);
    if (!res.ok) {
      const retryAfterSec = Math.ceil((res.retryAfterMs ?? 1000) / 1000);
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ~${retryAfterSec}s`,
        retryAfterSec,
      );
    }
    return handler(interaction);
  };
}

export function withCooldown(
  keyPrefix: string,
  durationMs: number,
): (h: CommandHandler) => CommandHandler {
  return (handler) => async (interaction) => {
    const key = `${keyPrefix}:${interaction.user.id}`;
    const now = Date.now();
    const until = cooldowns.get(key) ?? 0;
    if (now < until) {
      const retryAfterSec = Math.ceil((until - now) / 1000);
      throw new UserFacingError(
        `Cooldown active. Please wait ~${retryAfterSec}s before retrying.`,
      );
    }
    const res = await handler(interaction);
    cooldowns.set(key, now + durationMs);
    return res;
  };
}
