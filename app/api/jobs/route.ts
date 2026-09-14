import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAcceptedAudio, MAX_FILE_SIZE_BYTES } from '@/lib/audio-file';

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get('authorization');

  if (!url || !key || !authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });

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

  const { data: jobId, error: reservationError } = await supabase.rpc('reserve_generation');

  if (reservationError || !jobId) {
    if (reservationError?.message.includes('Insufficient credits')) {
      return NextResponse.json({ error: 'You need more credits to generate a video.' }, { status: 402 });
    }

    return NextResponse.json({ error: 'Could not start the generation.' }, { status: 500 });
  }

  return NextResponse.json({ jobId, status: 'queued' }, { status: 201 });
}
