import { SlashCommandBuilder } from 'discord.js';
import type { CommandModule } from '../types';
import { hasGuildAdminRole } from '../guards';

export const helpCommand: CommandModule = {
  name: 'help',
  data: new SlashCommandBuilder().setName('help').setDescription('Show available commands'),
  handle: async (interaction) => {
    const { client } = interaction;
    const isAdmin = await hasGuildAdminRole(interaction, (client as any).config.ADMIN_IDS);

    const publicCmds = ['help', 'health', 'getkey'];
    const adminCmds = ['license', 'config'];

    const lines = [
      `Available commands:`,
      `- ${publicCmds.map((c) => `/${c}`).join(', ')}`,
      ...(isAdmin ? [`- ${adminCmds.map((c) => `/${c}`).join(', ')}`] : []),
    ];

    await interaction.reply({ content: lines.join('\n'), ephemeral: true });
  },
};

export default helpCommand;

