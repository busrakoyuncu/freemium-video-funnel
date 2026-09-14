import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

vi.mock('@/lib/supabase/server-client', () => ({ getSupabaseServerClient: vi.fn() }));
vi.mock('@/lib/analytics-server', () => ({ trackServer: vi.fn() }));

import { trackServer } from '@/lib/analytics-server';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

const user = { id: 'user-1' };
const validFile = { name: 'song.mp3', size: 1024, type: 'audio/mpeg' };

function fakeClient(options: { user?: typeof user | null; rpc?: unknown } = {}) {
  return {
    auth: { getUser: async () => ({ data: { user: options.user ?? null }, error: null }) },
    rpc: vi.fn(async () => options.rpc ?? { data: 'job-1', error: null }),
  };
}

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.stubEnv('MOCK_RENDER', 'true');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('POST /api/jobs', () => {
  it('returns 500 when Supabase is not configured', async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue(null);
    const response = await post({ file: validFile });
    expect(response.status).toBe(500);
  });

  it('returns 401 without a signed-in user', async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue(fakeClient({ user: null }) as never);
    const response = await post({ file: validFile });
    expect(response.status).toBe(401);
  });

  it('returns 400 for a body that is not JSON', async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue(fakeClient({ user }) as never);
    const response = await post('not json');
    expect(response.status).toBe(400);
  });

  it('returns 422 when the file metadata is missing or not audio', async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue(fakeClient({ user }) as never);
    expect((await post({})).status).toBe(422);
    expect((await post({ file: { name: 'notes.txt', size: 10, type: 'text/plain' } })).status).toBe(422);
    expect((await post({ file: { ...validFile, size: 26 * 1024 * 1024 } })).status).toBe(422);
    expect((await post({ file: { ...validFile, size: 0 } })).status).toBe(422);
  });

  it('refuses with 501 before reserving credits when rendering is off', async () => {
    vi.stubEnv('MOCK_RENDER', '');
    const client = fakeClient({ user });
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);

    const response = await post({ file: validFile });

    expect(response.status).toBe(501);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('returns 402 when credits are insufficient', async () => {
    const client = fakeClient({ user, rpc: { data: null, error: { message: 'Insufficient credits' } } });
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);

    const response = await post({ file: validFile });

    expect(response.status).toBe(402);
    expect(trackServer).not.toHaveBeenCalled();
  });

  it('returns 500 for any other reservation failure', async () => {
    const client = fakeClient({ user, rpc: { data: null, error: { message: 'boom' } } });
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);

    const response = await post({ file: validFile });

    expect(response.status).toBe(500);
  });

  it('reserves credits, creates the job, and reports job_created', async () => {
    const client = fakeClient({ user });
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);

    const response = await post({ file: validFile });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ jobId: 'job-1', status: 'queued' });
    expect(client.rpc).toHaveBeenCalledWith('reserve_generation');
    expect(trackServer).toHaveBeenCalledWith('user-1', 'job_created', { job_id: 'job-1' });
  });
});
