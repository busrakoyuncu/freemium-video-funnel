import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobStatus } from '@/lib/jobs';
import { GET } from './route';

vi.mock('@/lib/supabase/server-client', () => ({ getSupabaseServerClient: vi.fn() }));
vi.mock('@/lib/supabase/admin-client', () => ({ getSupabaseAdminClient: vi.fn() }));
vi.mock('@/lib/analytics-server', () => ({ trackServer: vi.fn() }));

import { trackServer } from '@/lib/analytics-server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-client';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

const user = { id: 'user-1' };

function job(status: JobStatus, ageSeconds: number, videoUrl: string | null = null) {
  return {
    id: 'job-1',
    status,
    video_url: videoUrl,
    created_at: new Date(Date.now() - ageSeconds * 1000).toISOString(),
  };
}

/** A user client whose job reads come from a queue, so a test can script "before" and "after". */
function fakeClient(reads: unknown[], failJob: unknown = { data: null, error: null }) {
  const maybeSingle = vi.fn();
  reads.forEach((row) => maybeSingle.mockResolvedValueOnce({ data: row, error: null }));

  return {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
    rpc: vi.fn(async () => failJob),
    maybeSingle,
  };
}

function fakeAdmin(result: unknown = { data: null, error: null }) {
  return { rpc: vi.fn(async () => result) };
}

const get = () => GET(new Request('http://localhost/api/jobs/job-1'), { params: Promise.resolve({ id: 'job-1' }) });

beforeEach(() => {
  vi.stubEnv('MOCK_RENDER', 'true');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('GET /api/jobs/[id]', () => {
  it('returns 401 without a signed-in user', async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    } as never);

    expect((await get()).status).toBe(401);
  });

  it('returns 404 when the job is not visible to the caller', async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue(fakeClient([null]) as never);

    expect((await get()).status).toBe(404);
  });

  it('returns a terminal job untouched', async () => {
    const client = fakeClient([job('done', 100, '/hero-video.mp4')]);
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);
    const admin = fakeAdmin();
    vi.mocked(getSupabaseAdminClient).mockReturnValue(admin as never);

    const response = await get();

    expect(await response.json()).toEqual({ id: 'job-1', status: 'done', videoUrl: '/hero-video.mp4' });
    expect(admin.rpc).not.toHaveBeenCalled();
    expect(trackServer).not.toHaveBeenCalled();
  });

  it('leaves a job alone when its stage has not changed yet', async () => {
    const client = fakeClient([job('queued', 1)]);
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);
    const admin = fakeAdmin();
    vi.mocked(getSupabaseAdminClient).mockReturnValue(admin as never);

    const response = await get();

    expect((await response.json()).status).toBe('queued');
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it('advances the job with the service role and reports job_completed', async () => {
    const client = fakeClient([job('queued', 20), job('done', 20, '/hero-video.mp4')]);
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);
    const admin = fakeAdmin();
    vi.mocked(getSupabaseAdminClient).mockReturnValue(admin as never);

    const response = await get();

    expect(admin.rpc).toHaveBeenCalledWith('settle_job', {
      job_id: 'job-1',
      next_status: 'done',
      next_video_url: '/hero-video.mp4',
    });
    expect(await response.json()).toEqual({ id: 'job-1', status: 'done', videoUrl: '/hero-video.mp4' });
    expect(trackServer).toHaveBeenCalledWith('user-1', 'job_completed', { job_id: 'job-1' });
  });

  it('does not report an event for a non-terminal stage change', async () => {
    const client = fakeClient([job('queued', 5), job('rendering', 5)]);
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(fakeAdmin() as never);

    const response = await get();

    expect((await response.json()).status).toBe('rendering');
    expect(trackServer).not.toHaveBeenCalled();
  });

  it('fails the job and refunds when the service role key is missing', async () => {
    const client = fakeClient([job('queued', 20), job('failed', 20)]);
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(null);

    const response = await get();

    expect(client.rpc).toHaveBeenCalledWith('fail_job', { job_id: 'job-1' });
    expect((await response.json()).status).toBe('failed');
    expect(trackServer).toHaveBeenCalledWith('user-1', 'job_failed', { job_id: 'job-1' });
  });

  it('fails the job and refunds when settle_job errors', async () => {
    const client = fakeClient([job('queued', 20), job('failed', 20)]);
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      fakeAdmin({ data: null, error: { message: 'Invalid API key' } }) as never,
    );

    const response = await get();

    expect(client.rpc).toHaveBeenCalledWith('fail_job', { job_id: 'job-1' });
    expect((await response.json()).status).toBe('failed');
  });

  it('returns 500 when even the refund fails', async () => {
    const client = fakeClient([job('queued', 20)], { data: null, error: { message: 'nope' } });
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(null);

    expect((await get()).status).toBe(500);
  });

  it('never advances a job when mock rendering is off', async () => {
    vi.stubEnv('MOCK_RENDER', '');
    const client = fakeClient([job('queued', 100)]);
    vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);
    const admin = fakeAdmin();
    vi.mocked(getSupabaseAdminClient).mockReturnValue(admin as never);

    const response = await get();

    expect((await response.json()).status).toBe('queued');
    expect(admin.rpc).not.toHaveBeenCalled();
  });
});
