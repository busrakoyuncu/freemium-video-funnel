import { NextRequest, NextResponse } from 'next/server';
import { isAcceptedAudio, MAX_FILE_SIZE_BYTES } from '@/lib/audio-file';
import { isMockRender } from '@/lib/jobs';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: 'The account service is not configured.' }, { status: 500 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const file = (body as { file?: unknown }).file;

  if (!file || typeof file !== 'object') {
    return NextResponse.json({ error: 'Audio file metadata is required.' }, { status: 422 });
  }

  const { name, size, type } = file as {
    name?: unknown;
    size?: unknown;
    type?: unknown;
  };

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof size !== 'number' ||
    !Number.isInteger(size) ||
    size <= 0 ||
    size > MAX_FILE_SIZE_BYTES ||
    typeof type !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid audio file.' }, { status: 422 });
  }

  if (!isAcceptedAudio(name, type)) {
    return NextResponse.json({ error: 'Invalid audio file.' }, { status: 422 });
  }

  // Real rendering is not connected yet. Refuse before reserving credits.
  if (!isMockRender()) {
    return NextResponse.json(
      { error: 'Rendering is not available. Set MOCK_RENDER=true to use the mock flow.' },
      { status: 501 },
    );
  }

  const { data: jobId, error: reservationError } = await supabase.rpc('reserve_generation');

  if (reservationError || !jobId) {
    if (reservationError?.message.includes('Insufficient credits')) {
      return NextResponse.json({ error: 'You need more credits to generate a video.' }, { status: 402 });
    }

    console.error('reserve_generation failed', reservationError);
    return NextResponse.json({ error: 'Could not start the generation.' }, { status: 500 });
  }

  return NextResponse.json({ jobId, status: 'queued' }, { status: 201 });
}
