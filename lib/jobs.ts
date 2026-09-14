export const JOB_STATUSES = ['queued', 'rendering', 'voice_added', 'done', 'failed'] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export type Job = {
  id: string;
  status: JobStatus;
  videoUrl: string | null;
};

export const GENERATION_COST = 10;

export const RENDER_STAGES: { status: JobStatus; label: string }[] = [
  { status: 'queued', label: 'Queued' },
  { status: 'rendering', label: 'Rendering' },
  { status: 'voice_added', label: 'Voice added' },
  { status: 'done', label: 'Done' },
];

export function isTerminal(status: JobStatus) {
  return status === 'done' || status === 'failed';
}

export function isMockRender() {
  return process.env.MOCK_RENDER === 'true';
}

const MOCK_VIDEO_URL = '/hero-video.mp4';

/** Derives the mock stage from the job age so it works without a worker or timers. */
export function mockStageFor(createdAt: string): { status: JobStatus; videoUrl: string | null } {
  const ageSeconds = (Date.now() - new Date(createdAt).getTime()) / 1000;

  if (ageSeconds < 4) return { status: 'queued', videoUrl: null };
  if (ageSeconds < 10) return { status: 'rendering', videoUrl: null };
  if (ageSeconds < 15) return { status: 'voice_added', videoUrl: null };
  return { status: 'done', videoUrl: MOCK_VIDEO_URL };
}

export type ShareRewardStatus = 'eligible' | 'no_video' | 'claimed_today';

const SHARE_REWARD_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** Mirrors the rules in claim_share_reward() so the UI can explain them before a click. */
export function shareRewardStatus(finishedJobs: number, claimedAt: string | null): ShareRewardStatus {
  if (finishedJobs === 0) return 'no_video';
  if (claimedAt && Date.now() - new Date(claimedAt).getTime() < SHARE_REWARD_COOLDOWN_MS) {
    return 'claimed_today';
  }
  return 'eligible';
}
