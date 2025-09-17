import pino from 'pino';

export function createLogger(env: { NODE_ENV: string }) {
  const isDev = env.NODE_ENV !== 'production';
  const transport = isDev
    ? {
        target: 'pino-pretty',
        options: { translateTime: 'SYS:standard', ignore: 'pid,hostname' },
      }
    : undefined;

  return pino({ level: 'info' }, transport as any);
}

