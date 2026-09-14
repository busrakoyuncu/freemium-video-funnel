import { NextResponse } from 'next/server';
import { isMockRender, isTerminal, mockStageFor, type JobStatus } from '@/lib/jobs';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-client';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

type JobRow = { id: string; status: JobStatus; video_url: string | null; created_at: string };

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
  const { data } = await supabase
    .from('jobs')
    .select('id, status, video_url, created_at')
    .eq('id', id)
    .maybeSingle<JobRow>();

  let job = data;

  if (!job) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  if (isMockRender() && !isTerminal(job.status)) {
    const next = mockStageFor(job.created_at);

    if (next.status !== job.status) {
      const admin = getSupabaseAdminClient();

      if (!admin) {
        return NextResponse.json(
          { error: 'SUPABASE_SERVICE_ROLE_KEY is required to advance mock renders.' },
          { status: 500 },
        );
      }

      const { data: settled, error } = await admin
        .rpc('settle_job', { job_id: id, next_status: next.status, next_video_url: next.videoUrl })
        .single<JobRow>();

      if (error || !settled) {
        return NextResponse.json({ error: 'Could not update the job.' }, { status: 500 });
      }

      job = settled;
    }
  }

  return NextResponse.json({ id: job.id, status: job.status, videoUrl: job.video_url });
}
