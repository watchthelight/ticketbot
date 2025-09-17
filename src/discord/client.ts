import { Client, GatewayIntentBits, Partials } from 'discord.js';

export function createClient() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel],
  });

  return client;
}

