'use client';

import { ChangeEvent, KeyboardEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/analytics';
import { formatFileSize, validateAudioFile } from '@/lib/audio-file';
import { useAppStore } from '@/hooks/use-app-store';
import { useExperiment } from '@/hooks/use-experiment';
import styles from './upload-panel.module.css';

type UploadPanelProps = {
  isSignedIn: boolean;
};

export function UploadPanel({ isSignedIn }: UploadPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Experiment 1 in docs/EXPERIMENTS.md: hero button copy.
  const ctaVariant = useExperiment('landing-cta-copy');
  const {
    isUploadOpen,
    setUploadOpen,
    openAuthModal,
    selectedFile,
    errorMessage,
    setSelectedFile,
    setErrorMessage,
  } = useAppStore();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      setErrorMessage('');
      return;
    }

    const validationError = validateAudioFile(file);

    if (validationError) {
      setSelectedFile(null);
      setErrorMessage(validationError);
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    track('file_uploaded', { source: 'landing', size: file.size, type: file.type });
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
      setUploadOpen(true);
      track('tool_opened', { source: 'landing' });
      return;
    }

    if (isSignedIn) {
      router.push('/generate');
      return;
    }

    openAuthModal('signin');
  };

  // Generate is the conversion gate, so signed-out users land on the sign up tab.
  const handleGenerateClick = () => {
    if (!selectedFile) return;

    track('cta_clicked', { cta: 'generate', source: 'landing', signed_in: isSignedIn });

    if (isSignedIn) {
      router.push('/generate');
      return;
    }

    openAuthModal('signup');
  };

  const primaryLabel = !isUploadOpen
    ? ctaVariant === 'test'
      ? 'Try it free'
      : 'Start creating video'
    : isSignedIn
      ? 'Open workspace'
      : 'Sign up / Sign in';

  return (
    <>
      <button className={styles.primaryCta} type="button" onClick={handlePrimaryAction}>
        {primaryLabel}
      </button>

      <div className={`${styles.uploadShell} ${isUploadOpen ? styles.open : ''}`}>
        <div className={styles.uploadInner}>
          <button type="button" className={styles.hideUploadLink} onClick={() => setUploadOpen(false)}>
            Hide upload
          </button>

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

              <button
                className={styles.primaryCtaSmall}
                type="button"
                disabled={!selectedFile}
                onClick={handleGenerateClick}
              >
                Generate video
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
