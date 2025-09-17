import { SlashCommandBuilder } from 'discord.js';
import type { CommandModule } from '../types';
import { getPrisma } from '../../lib/db';

export const healthCommand: CommandModule = {
  name: 'health',
  data: new SlashCommandBuilder().setName('health').setDescription('Bot health status'),
  handle: async (interaction) => {
    const prisma = getPrisma();
    let dbOk = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }
    const latency = interaction.client.ws.ping;

    await interaction.reply({
      content: `Status: OK\nLatency: ${latency}ms\nDB: ${dbOk ? 'connected' : 'error'}`,
      ephemeral: true,
    });
  },
};

export default healthCommand;

