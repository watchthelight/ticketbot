import type { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

export type CommandData = SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;

export type CommandHandler = (interaction: ChatInputCommandInteraction) => Promise<void>;

export type CommandModule = {
  data: CommandData;
  name: string;
  handle: CommandHandler;
};

