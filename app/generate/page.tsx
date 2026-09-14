import { redirect } from 'next/navigation';
import { IdentifyUser } from '@/components/analytics/identify-user';
import { GenerateWorkspace } from '@/components/features/generate-workspace';
import { shareRewardStatus } from '@/lib/jobs';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

type GeneratePageProps = {
  searchParams: Promise<{ job?: string }>;
};

export default async function GeneratePage({ searchParams }: GeneratePageProps) {
  const supabase = await getSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!supabase || !user) {
    redirect('/');
  }

  const [{ job }, { data: profile }, { count: finishedJobs }] = await Promise.all([
    searchParams,
    supabase
      .from('profiles')
      .select('credits, share_reward_claimed_at')
      .eq('user_id', user.id)
      .single<{ credits: number; share_reward_claimed_at: string | null }>(),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'done'),
  ]);

  return (
    <>
      <IdentifyUser userId={user.id} email={user.email} />
      <GenerateWorkspace
        credits={profile?.credits ?? 0}
        jobId={job ?? null}
        shareStatus={shareRewardStatus(finishedJobs ?? 0, profile?.share_reward_claimed_at ?? null)}
      />
    </>
  );
}
