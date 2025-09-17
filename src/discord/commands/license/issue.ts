import { fingerprint, generateKey, hashKey } from '../../../lib/keys';
import { getPrisma } from '../../../lib/db';

export async function handleIssue(options: {
  actorId: string;
  targetId: string;
  expiresDays?: number;
  rotate?: boolean;
}) {
  const prisma = getPrisma();
  await prisma.user.upsert({ where: { id: options.targetId }, create: { id: options.targetId }, update: {} });
  const existing = await prisma.license.findFirst({
    where: { userId: options.targetId, status: 'ACTIVE' },
    orderBy: { issuedAt: 'desc' },
  });
  if (existing && !options.rotate) {
    await prisma.auditLog.create({
      data: {
        actorId: options.actorId,
        action: 'ISSUE',
        targetId: options.targetId,
        details: { note: 'idempotent existing' },
        success: true,
      },
    });
    return { existed: true, fingerprint: existing.fingerprint } as const;
  }

  const raw = generateKey();
  const fp = fingerprint(raw);
  const hashed = await hashKey(raw);
  const expiresAt = options.expiresDays
    ? new Date(Date.now() + options.expiresDays * 24 * 3600 * 1000)
    : null;

  let rotatedFromId: string | undefined;
  if (existing) {
    await prisma.license.update({ where: { id: existing.id }, data: { status: 'EXPIRED' } });
    rotatedFromId = existing.id;
  }
  const lic = await prisma.license.create({
    data: {
      userId: options.targetId,
      keyHash: hashed,
      fingerprint: fp,
      status: 'ACTIVE',
      expiresAt: expiresAt ?? undefined,
      rotatedFromId,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: options.actorId,
      action: existing ? 'ROTATE' : 'ISSUE',
      targetId: options.targetId,
      details: { licenseId: lic.id },
      success: true,
    },
  });
  return { existed: false, fingerprint: fp, rawKey: raw } as const;
}

