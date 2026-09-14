import { NextResponse } from 'next/server';
import { trackServer } from '@/lib/analytics-server';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

/** Grants the share-to-earn reward. The rules (finished video, once a day) live in the database. */
export async function POST() {
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

  const { data: credits, error } = await supabase.rpc('claim_share_reward');

  if (error || typeof credits !== 'number') {
    if (error?.message.includes('No finished video')) {
      return NextResponse.json({ error: 'You need at least one finished video to share.' }, { status: 409 });
    }

    if (error?.message.includes('already claimed')) {
      return NextResponse.json({ error: 'You earned this reward today. Come back tomorrow.' }, { status: 429 });
    }

    console.error('claim_share_reward failed:', error?.message ?? error);

    return NextResponse.json({ error: 'Sharing rewards are not available right now.' }, { status: 500 });
  }

  await trackServer(user.id, 'share_reward_claimed', { credits });

  return NextResponse.json({ credits });
}
