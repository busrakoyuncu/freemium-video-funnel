import { NextResponse } from 'next/server';
import { trackServer } from '@/lib/analytics-server';
import { isMockRender, isTerminal, mockStageFor, type JobStatus } from '@/lib/jobs';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-client';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

type JobRow = { id: string; status: JobStatus; video_url: string | null; created_at: string };

const JOB_COLUMNS = 'id, status, video_url, created_at';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: 'The account service is not configured.' }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { id } = await params;

  // Row-level security limits this read to the caller's own jobs.
  const readJob = () =>
    supabase.from('jobs').select(JOB_COLUMNS).eq('id', id).maybeSingle<JobRow>();

  let { data: job } = await readJob();

  if (!job) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  if (isMockRender() && !isTerminal(job.status)) {
    const next = mockStageFor(job.created_at);

    if (next.status !== job.status) {
      const advanced = await advanceJob(id, next.status, next.videoUrl);

      if (!advanced) {
        // The render cannot be moved forward, so fail it and give the credits back.
        const { error } = await supabase.rpc('fail_job', { job_id: id });

        if (error) {
          console.error('fail_job failed', error);
          return NextResponse.json({ error: 'Could not update the job.' }, { status: 500 });
        }
      }

      job = (await readJob()).data ?? job;

      if (isTerminal(job.status)) {
        await trackServer(user.id, job.status === 'done' ? 'job_completed' : 'job_failed', {
          job_id: job.id,
        });
      }
    }
  }

  return NextResponse.json({ id: job.id, status: job.status, videoUrl: job.video_url });
}

/** Moves the job forward with the service role. Returns false when that is not possible. */
async function advanceJob(jobId: string, status: JobStatus, videoUrl: string | null) {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing; cannot advance the job');
    return false;
  }

  const { error } = await admin.rpc('settle_job', {
    job_id: jobId,
    next_status: status,
    next_video_url: videoUrl,
  });

  if (error) {
    console.error('settle_job failed', error);
    return false;
  }

  return true;
}
