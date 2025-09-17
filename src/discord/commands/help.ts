import { SlashCommandBuilder } from 'discord.js';
import type { CommandModule } from '../types';
import { hasGuildAdminRole } from '../guards';

export const helpCommand: CommandModule = {
  name: 'help',
  data: new SlashCommandBuilder().setName('help').setDescription('Show available commands'),
  handle: async (interaction) => {
    const { client } = interaction;
    const isAdmin = await hasGuildAdminRole(interaction, (client as any).config.ADMIN_IDS);

    const list = (xs: string[]) => xs.map((c) => `/${c}`).join(', ');
    const publicCmds = list(['help', 'health', 'getkey']);
    const adminCmds = list(['license', 'config']);
    const lines = [
      'Available commands:',
      `- ${publicCmds}`,
      ...(isAdmin ? [`- ${adminCmds}`] : []),
    ];

    await interaction.reply({ content: lines.join('\n'), ephemeral: true });
  },
};

export default helpCommand;
