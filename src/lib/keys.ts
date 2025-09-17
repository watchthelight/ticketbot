import { randomBytes, createHash } from 'node:crypto';
import argon2 from 'argon2';

export function generateKey(bytes = 32): string {
  const buf = randomBytes(bytes);
  // URL-safe base64 without padding
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function fingerprint(rawKey: string): string {
  const hash = createHash('sha256').update(rawKey).digest('hex');
  // 12 hex chars -> groups like abcd-efgh-ijkl
  const fp = hash.slice(0, 12);
  return `${fp.slice(0, 4)}-${fp.slice(4, 8)}-${fp.slice(8, 12)}`;
}

export function maskFingerprint(fp: string): string {
  // show first 6 and last 4 across groups
  const flat = fp.replace(/-/g, '');
  const masked = `${flat.slice(0, 6)}…${flat.slice(-4)}`;
  return masked;
}

export async function hashKey(rawKey: string): Promise<string> {
  return argon2.hash(rawKey, {
    type: argon2.argon2id,
    memoryCost: 19_456, // ~19 MB
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyKey(rawKey: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, rawKey, { type: argon2.argon2id });
  } catch {
    return false;
  }
}
