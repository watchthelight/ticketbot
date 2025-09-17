import { SlashCommandBuilder, userMention } from 'discord.js';
import type { CommandModule } from '../../types';
import { requireAdmin } from '../../guards';
import { getPrisma } from '../../../lib/db';
import { maskFingerprint } from '../../../lib/keys';
import { handleIssue } from './issue';
import { handleRotate } from './rotate';
import { handleRevoke } from './revoke';
import { handleInfo } from './info';

export const licenseIssueCommand: CommandModule = {
  name: 'license',
  data: new SlashCommandBuilder()
    .setName('license')
    .setDescription('License administration')
    .addSubcommand((sc) =>
      sc
        .setName('issue')
        .setDescription('Issue a license for a user')
        .addUserOption((opt) =>
          opt.setName('user').setDescription('Discord user').setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName('expires_in_days')
            .setDescription('Optional expiry in days')
            .setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt.setName('rotate').setDescription('Rotate if exists').setRequired(false),
        ),
    )
    .addSubcommand((sc) => sc.setName('rotate').setDescription('Rotate a license').addUserOption((opt) => opt.setName('user').setDescription('Discord user').setRequired(true)))
    .addSubcommand((sc) => sc.setName('revoke').setDescription('Revoke a license').addUserOption((opt) => opt.setName('user').setDescription('Discord user').setRequired(true)).addStringOption((opt) => opt.setName('reason').setDescription('Reason').setRequired(false)))
    .addSubcommand((sc) => sc.setName('info').setDescription('License info').addUserOption((opt) => opt.setName('user').setDescription('Discord user').setRequired(true))),
  handle: requireAdmin()(async (interaction) => {
    const prisma = getPrisma();
    const sub = interaction.options.getSubcommand();

    if (sub === 'issue') {
      const target = interaction.options.getUser('user', true);
      const expiresDays = interaction.options.getInteger('expires_in_days') ?? undefined;
      const rotate = interaction.options.getBoolean('rotate') ?? false;
      const res = await handleIssue({ actorId: interaction.user.id, targetId: target.id, expiresDays: expiresDays ?? undefined, rotate });
      if (res.existed) {
        await interaction.reply({
          content: `Existing license. Fingerprint: ${maskFingerprint(res.fingerprint)}`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `Issued to ${userMention(target.id)}. Key (save now):\n\`${res.rawKey}\`\nFingerprint: ${res.fingerprint}`,
          ephemeral: true,
        });
      }
      return;
    }

    if (sub === 'rotate') {
      const target = interaction.options.getUser('user', true);
      const res = await handleRotate({ actorId: interaction.user.id, targetId: target.id });
      if (!res.rotated) {
        await interaction.reply({ content: 'No active license to rotate.', ephemeral: true });
      } else {
        await interaction.reply({
          content: `Rotated for ${userMention(target.id)}. New key:\n\`${res.rawKey}\`\nFingerprint: ${res.fingerprint}`,
          ephemeral: true,
        });
      }
      return;
    }

    if (sub === 'revoke') {
      const target = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason') ?? undefined;
      const res = await handleRevoke({ actorId: interaction.user.id, targetId: target.id, reason });
      if (!res.revoked) {
        await interaction.reply({ content: 'No active license found.', ephemeral: true });
      } else {
        await interaction.reply({ content: `Revoked for ${userMention(target.id)}.`, ephemeral: true });
      }
      return;
    }

    if (sub === 'info') {
      const target = interaction.options.getUser('user', true);
      const existing = await handleInfo({ actorId: interaction.user.id, targetId: target.id });
      if (!existing) {
        await interaction.reply({ content: 'No license found.', ephemeral: true });
      } else {
        const masked = maskFingerprint(existing.fingerprint);
        const info = [
          `Status: ${existing.status}`,
          `Fingerprint: ${masked}`,
          `Issued: ${existing.issuedAt.toISOString()}`,
          `Expires: ${existing.expiresAt ? existing.expiresAt.toISOString() : 'none'}`,
          `Revoked: ${existing.revokedAt ? existing.revokedAt.toISOString() : 'no'}`,
        ].join('\n');
        await interaction.reply({ content: info, ephemeral: true });
      }
      return;
    }
  }),
};

export default licenseIssueCommand;
