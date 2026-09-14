import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

vi.mock('@/lib/supabase/server-client', () => ({ getSupabaseServerClient: vi.fn() }));
vi.mock('@/lib/analytics-server', () => ({ trackServer: vi.fn() }));

import { trackServer } from '@/lib/analytics-server';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

const user = { id: 'user-1' };

function fakeClient(rpc: unknown, signedIn = true) {
  return {
    auth: { getUser: async () => ({ data: { user: signedIn ? user : null }, error: null }) },
    rpc: vi.fn(async () => rpc),
  };
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/credits/share', () => {
  it('returns 401 without a signed-in user', async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue(fakeClient(null, false) as never);
    expect((await POST()).status).toBe(401);
  });

  it('returns 409 when the user has no finished video to share', async () => {
    const client = fakeClient({ data: null, error: { message: 'No finished video to share' } });
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);

    const response = await POST();

    expect(response.status).toBe(409);
    expect(trackServer).not.toHaveBeenCalled();
  });

  it('returns 429 when the reward was already claimed today', async () => {
    const client = fakeClient({ data: null, error: { message: 'Reward already claimed today' } });
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);

    expect((await POST()).status).toBe(429);
  });

  it('returns 500 for any other failure', async () => {
    const client = fakeClient({ data: null, error: { message: 'boom' } });
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);

    expect((await POST()).status).toBe(500);
  });

  it('returns the new balance and reports share_reward_claimed', async () => {
    const client = fakeClient({ data: 60, error: null });
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);

    const response = await POST();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ credits: 60 });
    expect(client.rpc).toHaveBeenCalledWith('claim_share_reward');
    expect(trackServer).toHaveBeenCalledWith('user-1', 'share_reward_claimed', { credits: 60 });
  });
});
