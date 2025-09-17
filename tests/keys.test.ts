import { describe, it, expect } from 'vitest';
import { generateKey, fingerprint, hashKey, verifyKey } from '../src/lib/keys';

describe('keys', () => {
  it('generates url-safe keys', () => {
    const k = generateKey();
    expect(k).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(k.length).toBeGreaterThan(30);
  });

  it('fingerprint is stable and formatted', () => {
    const k = 'test-key';
    const fp1 = fingerprint(k);
    const fp2 = fingerprint(k);
    expect(fp1).toBe(fp2);
    expect(fp1).toMatch(/^([a-f0-9]{4}-){2}[a-f0-9]{4}$/);
  });

  it('hash/verify works', async () => {
    const k = generateKey();
    const h = await hashKey(k);
    expect(await verifyKey(k, h)).toBe(true);
    expect(await verifyKey(k + 'x', h)).toBe(false);
  });
});

