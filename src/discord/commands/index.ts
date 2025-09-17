import type { CommandModule } from '../types';
import helpCommand from './help';
import healthCommand from './health';
import getKeyCommand from './getkey';
import licenseCommand from './license';
import configSetAdminRoleCommand from './config/setAdminRole';

export const commands: CommandModule[] = [
  helpCommand,
  healthCommand,
  getKeyCommand,
  licenseCommand,
  configSetAdminRoleCommand,
];

export default commands;

