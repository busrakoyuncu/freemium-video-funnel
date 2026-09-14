export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const ACCEPTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
];

const ACCEPTED_AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac'];

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isAcceptedAudio(name: string, type: string) {
  const extension = name.split('.').pop()?.toLowerCase() ?? '';

  return ACCEPTED_AUDIO_TYPES.includes(type) || ACCEPTED_AUDIO_EXTENSIONS.includes(extension);
}

/** Returns an error message, or null when the file is acceptable. */
export function validateAudioFile(file: { name: string; size: number; type: string }) {
  if (!isAcceptedAudio(file.name, file.type)) {
    return 'Please upload a valid audio file: MP3, WAV, or M4A.';
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'The selected file is too large. Please choose a file under 25 MB.';
  }

  return null;
}
