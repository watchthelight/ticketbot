import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { loadEnv } from '../env';
import commands from './commands';

async function main() {
  const env = loadEnv();
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
  const body = commands.map((c) => c.data.toJSON());
  await rest.put(Routes.applicationCommands(env.DISCORD_APP_ID), { body });
  // eslint-disable-next-line no-console
  console.log(`Registered ${body.length} application commands.`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

