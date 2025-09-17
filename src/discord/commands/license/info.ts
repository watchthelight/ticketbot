import { getPrisma } from '../../../lib/db';

export async function handleInfo(options: { actorId: string; targetId: string }) {
  const prisma = getPrisma();
  const existing = await prisma.license.findFirst({
    where: { userId: options.targetId },
    orderBy: { issuedAt: 'desc' },
  });
  await prisma.auditLog.create({
    data: {
      actorId: options.actorId,
      action: 'INFO',
      targetId: options.targetId,
      details: { licenseId: existing?.id ?? null },
      success: true,
    },
  });
  return existing;
}

