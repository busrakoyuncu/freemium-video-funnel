import { describe, expect, it } from 'vitest';
import { formatFileSize, isAcceptedAudio, MAX_FILE_SIZE_BYTES, validateAudioFile } from './audio-file';

describe('isAcceptedAudio', () => {
  it('accepts known audio mime types', () => {
    expect(isAcceptedAudio('song.bin', 'audio/mpeg')).toBe(true);
    expect(isAcceptedAudio('song.bin', 'audio/wav')).toBe(true);
    expect(isAcceptedAudio('song.bin', 'audio/x-m4a')).toBe(true);
  });

  it('falls back to the file extension when the browser sends no useful type', () => {
    expect(isAcceptedAudio('song.mp3', '')).toBe(true);
    expect(isAcceptedAudio('SONG.M4A', 'application/octet-stream')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isAcceptedAudio('notes.txt', 'text/plain')).toBe(false);
    expect(isAcceptedAudio('clip.mp4', 'video/mp4')).toBe(false);
    expect(isAcceptedAudio('noextension', '')).toBe(false);
  });
});

describe('validateAudioFile', () => {
  const audio = { name: 'song.mp3', type: 'audio/mpeg' };

  it('returns null for an acceptable file', () => {
    expect(validateAudioFile({ ...audio, size: 1024 })).toBeNull();
  });

  it('allows a file exactly at the size limit', () => {
    expect(validateAudioFile({ ...audio, size: MAX_FILE_SIZE_BYTES })).toBeNull();
  });

  it('rejects a file one byte over the limit', () => {
    expect(validateAudioFile({ ...audio, size: MAX_FILE_SIZE_BYTES + 1 })).toMatch(/too large/);
  });

  it('reports the type problem before the size problem', () => {
    const result = validateAudioFile({ name: 'notes.txt', type: 'text/plain', size: MAX_FILE_SIZE_BYTES + 1 });
    expect(result).toMatch(/valid audio file/);
  });
});

describe('formatFileSize', () => {
  it('picks the unit from the size', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
