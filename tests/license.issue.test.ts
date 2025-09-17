import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleIssue } from '../src/discord/commands/license/issue';

const db = {
  user: { upsert: vi.fn() },
  license: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  auditLog: { create: vi.fn() },
};

vi.mock('../src/lib/db', () => ({ getPrisma: () => db }));

describe('license issue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns existing fingerprint when idempotent', async () => {
    db.license.findFirst.mockResolvedValue({ id: 'L1', fingerprint: 'abcd-efgh-ijkl' });
    db.license.create.mockResolvedValue({ id: 'L2' });
    const res = await handleIssue({ actorId: 'A', targetId: 'T' });
    expect(res.existed).toBe(true);
    expect(res).toHaveProperty('fingerprint');
  });

  it('creates new license when rotating or missing', async () => {
    db.license.findFirst.mockResolvedValue(null);
    db.license.create.mockResolvedValue({ id: 'L2' });
    const res = await handleIssue({ actorId: 'A', targetId: 'T', rotate: true });
    expect(res.existed).toBe(false);
    expect(res).toHaveProperty('rawKey');
    expect(res).toHaveProperty('fingerprint');
  });
});

