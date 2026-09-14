'use client';

import { useEffect, useState } from 'react';
import { isTerminal, type Job } from '@/lib/jobs';

const POLL_INTERVAL_MS = 2000;

type PollState = { jobId: string; job: Job | null; error: string };

/** Polls GET /api/jobs/[id] every two seconds until the job is done or failed. */
export function useJobStatus(jobId: string | null) {
  const [state, setState] = useState<PollState | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const data = (await response.json()) as Job & { error?: string };

        if (cancelled) return;

        if (!response.ok) {
          setState({ jobId, job: null, error: data.error ?? 'Could not load the job.' });
          return;
        }

        setState({ jobId, job: data, error: '' });

        if (!isTerminal(data.status)) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) setState({ jobId, job: null, error: 'Could not reach the server.' });
      }
    };

    void poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId]);

  // Results from a previous job id are ignored rather than reset.
  if (!jobId || state?.jobId !== jobId) {
    return { job: null, error: '' };
  }

  return { job: state.job, error: state.error };
}
