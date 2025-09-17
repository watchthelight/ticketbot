import { SlashCommandBuilder } from 'discord.js';
import type { CommandModule } from '../types';
import { getPrisma } from '../../lib/db';
import { fingerprint, generateKey, hashKey, maskFingerprint } from '../../lib/keys';
import { withRateLimit, withCooldown } from '../guards';

export const getKeyCommand: CommandModule = {
  name: 'getkey',
  data: new SlashCommandBuilder()
    .setName('getkey')
    .setDescription('Claim a one-time license key for your account'),
  handle: withCooldown('getkey:cooldown', 60_000)(
    withRateLimit('getkey:rate', undefined, 1)(async (interaction) => {
      const prisma = getPrisma();
      const userId = interaction.user.id;

      await prisma.user.upsert({
        where: { id: userId },
        create: { id: userId },
        update: {},
      });

      const existing = await prisma.license.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { issuedAt: 'desc' },
      });

      if (existing) {
        await interaction.reply({
          content: `A key is already issued. Fingerprint: ${maskFingerprint(existing.fingerprint)}`,
          ephemeral: true,
        });
        return;
      }

      const raw = generateKey();
      const fp = fingerprint(raw);
      const hashed = await hashKey(raw);

      await prisma.license.create({
        data: {
          userId,
          keyHash: hashed,
          fingerprint: fp,
          status: 'ACTIVE',
        },
      });

      await interaction.reply({
        content: `Your key (save this now, it will not be shown again):\n\`${raw}\`\nFingerprint: ${fp}`,
        ephemeral: true,
      });
    }),
  ),
};

export default getKeyCommand;

