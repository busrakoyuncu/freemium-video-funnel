import type { Metadata } from 'next';
import { AuthModal } from '@/components/auth/auth-modal';
import { FreeTool } from '@/components/features/free-tool';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

export const metadata: Metadata = {
  title: 'Free MP3 to MP4 converter',
  description: 'Turn an audio file into a shareable MP4 for free. No account needed.',
};

export default async function Mp3ToMp4Page() {
  const supabase = await getSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <>
      <FreeTool isSignedIn={Boolean(user)} />
      <AuthModal />
    </>
  );
}
