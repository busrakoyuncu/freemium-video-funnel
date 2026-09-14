import { redirect } from 'next/navigation';
import { GenerateWorkspace } from '@/components/features/generate-workspace';
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

  const [{ job }, { data: profile }] = await Promise.all([
    searchParams,
    supabase.from('profiles').select('credits').eq('user_id', user.id).single<{ credits: number }>(),
  ]);

  return <GenerateWorkspace credits={profile?.credits ?? 0} jobId={job ?? null} />;
}
