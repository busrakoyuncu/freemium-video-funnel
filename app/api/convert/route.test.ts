import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

function post(file?: File) {
  const body = new FormData();
  if (file) body.append('file', file);
  return POST(new NextRequest('http://localhost/api/convert', { method: 'POST', body }));
}

const audio = new File([new Uint8Array(2048)], 'song.mp3', { type: 'audio/mpeg' });

beforeEach(() => {
  vi.stubEnv('MOCK_RENDER', 'true');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('POST /api/convert', () => {
  it('returns 422 without a file', async () => {
    expect((await post()).status).toBe(422);
  });

  it('returns 422 for a file that is not audio', async () => {
    const response = await post(new File(['hello'], 'notes.txt', { type: 'text/plain' }));
    expect(response.status).toBe(422);
    expect((await response.json()).error).toMatch(/valid audio file/);
  });

  it('refuses with 501 when rendering is off', async () => {
    vi.stubEnv('MOCK_RENDER', '');
    expect((await post(audio)).status).toBe(501);
  });

  it('returns the sample video in mock mode after the delay', async () => {
    vi.useFakeTimers();

    const pending = post(audio);
    await vi.advanceTimersByTimeAsync(1500);
    const response = await pending;

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ videoUrl: '/hero-video.mp4' });
  });
});
