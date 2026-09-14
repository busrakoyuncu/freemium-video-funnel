import { afterEach, describe, expect, it, vi } from 'vitest';
import { isMockRender, isTerminal, mockStageFor } from './jobs';

describe('isTerminal', () => {
  it('treats only done and failed as terminal', () => {
    expect(isTerminal('done')).toBe(true);
    expect(isTerminal('failed')).toBe(true);
    expect(isTerminal('queued')).toBe(false);
    expect(isTerminal('rendering')).toBe(false);
    expect(isTerminal('voice_added')).toBe(false);
  });
});

describe('mockStageFor', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const createdAt = '2026-09-14T12:00:00.000Z';

  const at = (secondsLater: number) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.parse(createdAt) + secondsLater * 1000));
    return mockStageFor(createdAt);
  };

  it('starts queued', () => {
    expect(at(0)).toEqual({ status: 'queued', videoUrl: null });
    expect(at(3.9)).toEqual({ status: 'queued', videoUrl: null });
  });

  it('moves through rendering and voice added', () => {
    expect(at(4).status).toBe('rendering');
    expect(at(9.9).status).toBe('rendering');
    expect(at(10).status).toBe('voice_added');
    expect(at(14.9).status).toBe('voice_added');
  });

  it('finishes with a video url after fifteen seconds', () => {
    const result = at(15);
    expect(result.status).toBe('done');
    expect(result.videoUrl).toMatch(/\.mp4$/);
  });

  it('never returns a video url before done', () => {
    expect(at(0).videoUrl).toBeNull();
    expect(at(12).videoUrl).toBeNull();
  });
});

describe('isMockRender', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is on only when MOCK_RENDER is exactly "true"', () => {
    vi.stubEnv('MOCK_RENDER', 'true');
    expect(isMockRender()).toBe(true);
    vi.stubEnv('MOCK_RENDER', 'TRUE');
    expect(isMockRender()).toBe(false);
    vi.stubEnv('MOCK_RENDER', '');
    expect(isMockRender()).toBe(false);
  });
});
