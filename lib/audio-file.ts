export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const ACCEPTED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
]);

const ACCEPTED_AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'm4a', 'aac']);

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isValidAudioFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();

  return (
    ACCEPTED_AUDIO_TYPES.has(file.type) ||
    (extension !== undefined && ACCEPTED_AUDIO_EXTENSIONS.has(extension))
  );
}
