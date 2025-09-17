import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasGuildAdminRole } from '../src/discord/guards';

vi.mock('../src/lib/db', () => ({
  getPrisma: () => ({ guildConfig: { findUnique: vi.fn().mockResolvedValue({ adminRoleId: 'ROLE1' }) } }),
}));

const makeInteraction = (userId: string, guildId: string, roleIds: string[]) => ({
  user: { id: userId },
  guildId,
  member: { roles: { cache: new Map(roleIds.map((r) => [r, true])) } },
} as any);

describe('guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recognizes admin via ADMIN_IDS', async () => {
    const i = makeInteraction('U1', 'G1', []);
    await expect(hasGuildAdminRole(i, ['U1'])).resolves.toBe(true);
  });

  it('recognizes admin via guild role', async () => {
    const roles = ['ROLE1'];
    const i = makeInteraction('U2', 'G1', roles);
    await expect(hasGuildAdminRole(i, [])).resolves.toBe(true);
  });

  it('non-admin otherwise', async () => {
    const i = makeInteraction('U3', 'G1', []);
    await expect(hasGuildAdminRole(i, [])).resolves.toBe(false);
  });
});

