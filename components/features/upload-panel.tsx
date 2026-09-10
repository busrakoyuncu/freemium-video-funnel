'use client';

import { ChangeEvent, KeyboardEvent, useRef, useState } from 'react';
import styles from './upload-panel.module.css';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
]);

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidAudioFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = new Set(['mp3', 'wav', 'm4a', 'aac']);

  return (
    ACCEPTED_AUDIO_TYPES.has(file.type) ||
    (extension !== undefined && allowedExtensions.has(extension))
  );
}

type UploadPanelProps = {
  isUploadOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onAuthClick?: () => void;
};

export function UploadPanel({
  isUploadOpen,
  onOpen,
  onClose,
  onAuthClick,
}: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      setErrorMessage('');
      return;
    }

    if (!isValidAudioFile(file)) {
      setSelectedFile(null);
      setErrorMessage('Please upload a valid audio file: MP3, WAV, or M4A.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setErrorMessage('The selected file is too large. Please choose a file under 25 MB.');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
  };

  const handlePickFile = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePickFile();
    }
  };

  const handlePrimaryAction = () => {
    if (!isUploadOpen) {
      onOpen();
      return;
    }

    onAuthClick?.();
  };

  return (
    <>
      <button className={styles.primaryCta} type="button" onClick={handlePrimaryAction}>
        {isUploadOpen ? 'Sign up / Sign in' : 'Start creating video'}
      </button>

      {isUploadOpen ? (
        <button type="button" className={styles.hideUploadLink} onClick={onClose}>
          Hide upload
        </button>
      ) : null}

      {isUploadOpen ? (
        <section className={styles.uploadPanel} aria-label="Upload audio to generate a video">
          <div className={styles.uploadHeader}>
            <span className={styles.kicker}>Upload</span>
            <span className={styles.helperLabel}>MP3, WAV, M4A</span>
          </div>

          <div
            className={styles.dropZone}
            onClick={handlePickFile}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Select an audio file to upload"
          >
            <input
              ref={inputRef}
              type="file"
              accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/aac"
              onChange={handleFileChange}
              hidden
            />

            <div className={styles.uploadContent}>
              <div className={styles.uploadIcon}>↑</div>
              <div className={styles.uploadText}>
                <strong>{selectedFile ? selectedFile.name : 'Upload audio'}</strong>
                <span>
                  {selectedFile
                    ? formatFileSize(selectedFile.size)
                    : 'Drag and drop or browse a file'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.actionRow}>
            <div className={styles.metaColumn}>
              <span className={styles.statusText}>
                {selectedFile ? 'Ready to generate' : 'Select an audio file to begin'}
              </span>
              {errorMessage ? (
                <span className={styles.errorText} role="alert" aria-live="polite">
                  {errorMessage}
                </span>
              ) : null}
            </div>

            <button className={styles.secondaryButton} type="button" onClick={handlePickFile}>
              Browse
            </button>

            <button className={styles.primaryCtaSmall} type="button" disabled={!selectedFile}>
              Generate video
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}
