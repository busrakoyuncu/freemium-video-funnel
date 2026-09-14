import { NextRequest, NextResponse } from 'next/server';
import { validateAudioFile } from '@/lib/audio-file';
import { isMockRender } from '@/lib/jobs';

const MOCK_CONVERT_DELAY_MS = 1500;
const MOCK_VIDEO_URL = '/hero-video.mp4';

/** Free conversion. No session required. Mock mode returns a sample video after a short delay. */
export async function POST(request: NextRequest) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'An audio file is required.' }, { status: 422 });
  }

  const validationError = validateAudioFile(file);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 422 });
  }

  if (!isMockRender()) {
    return NextResponse.json(
      { error: 'Conversion is not available. Set MOCK_RENDER=true to use the mock flow.' },
      { status: 501 },
    );
  }

  await new Promise((resolve) => setTimeout(resolve, MOCK_CONVERT_DELAY_MS));

  return NextResponse.json({ videoUrl: MOCK_VIDEO_URL });
}
