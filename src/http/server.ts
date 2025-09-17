import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import type { Logger } from 'pino';

export function createServer(logger: Logger) {
  const app = Fastify({
    logger: logger.child({ component: 'http' }),
    genReqId: () => randomUUID(),
    requestIdHeader: 'x-request-id',
  });

  app.get('/readyz', async () => ({ ok: true }));
  app.get('/livez', async () => ({ ok: true }));

  // Future: license verification hook for client integrations
  app.post('/license/check', async (_req, reply) => {
    reply.code(501).send({ error: 'Not implemented' });
  });

  return app;
}
