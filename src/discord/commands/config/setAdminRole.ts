import { SlashCommandBuilder } from 'discord.js';
import type { CommandModule } from '../../types';
import { requireAdmin } from '../../guards';
import { getPrisma } from '../../../lib/db';

export const configSetAdminRoleCommand: CommandModule = {
  name: 'config',
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configuration commands')
    .addSubcommand((sc) =>
      sc
        .setName('set-admin-role')
        .setDescription('Set admin role for this guild')
        .addStringOption((opt) =>
          opt.setName('role_id').setDescription('Role ID').setRequired(true),
        ),
    ),
  handle: requireAdmin()(async (interaction) => {
    const sub = interaction.options.getSubcommand();
    if (sub !== 'set-admin-role') return;
    const roleId = interaction.options.getString('role_id', true);
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({ content: 'Guild not found.', ephemeral: true });
      return;
    }
    const prisma = getPrisma();
    await prisma.guildConfig.upsert({
      where: { guildId },
      create: { guildId, adminRoleId: roleId },
      update: { adminRoleId: roleId },
    });
    await prisma.auditLog.create({
      data: {
        actorId: interaction.user.id,
        action: 'CONFIG_SET',
        targetId: guildId,
        details: { adminRoleId: roleId },
        success: true,
      },
    });
    await interaction.reply({ content: `Admin role set to ${roleId}`, ephemeral: true });
  }),
};

export default configSetAdminRoleCommand;
