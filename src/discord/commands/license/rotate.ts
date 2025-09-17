import { fingerprint, generateKey, hashKey } from '../../../lib/keys';
import { getPrisma } from '../../../lib/db';

export async function handleRotate(options: { actorId: string; targetId: string }) {
  const prisma = getPrisma();
  const existing = await prisma.license.findFirst({
    where: { userId: options.targetId, status: 'ACTIVE' },
    orderBy: { issuedAt: 'desc' },
  });
  if (!existing) return { rotated: false } as const;
  const raw = generateKey();
  const fp = fingerprint(raw);
  const hashed = await hashKey(raw);
  await prisma.license.update({ where: { id: existing.id }, data: { status: 'EXPIRED' } });
  const to = await prisma.license.create({
    data: {
      userId: options.targetId,
      keyHash: hashed,
      fingerprint: fp,
      status: 'ACTIVE',
      rotatedFromId: existing.id,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: options.actorId,
      action: 'ROTATE',
      targetId: options.targetId,
      details: { from: existing.id, to: to.id },
      success: true,
    },
  });
  return { rotated: true, fingerprint: fp, rawKey: raw } as const;
}

