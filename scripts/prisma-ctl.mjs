import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const schema = process.env.PRISMA_SCHEMA || 'prisma/schema.prisma';

const prismaArgs = [...args, '--schema', schema];

const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', ...prismaArgs], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));

