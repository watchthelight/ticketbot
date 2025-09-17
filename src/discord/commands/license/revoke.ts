import { getPrisma } from '../../../lib/db';

export async function handleRevoke(options: {
  actorId: string;
  targetId: string;
  reason?: string;
}) {
  const prisma = getPrisma();
  const existing = await prisma.license.findFirst({
    where: { userId: options.targetId, status: 'ACTIVE' },
    orderBy: { issuedAt: 'desc' },
  });
  if (!existing) return { revoked: false } as const;
  await prisma.license.update({
    where: { id: existing.id },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedBy: options.actorId,
      revokeReason: options.reason,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: options.actorId,
      action: 'REVOKE',
      targetId: options.targetId,
      details: { licenseId: existing.id, reason: options.reason ?? null },
      success: true,
    },
  });
  return { revoked: true } as const;
}

