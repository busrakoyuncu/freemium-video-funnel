'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { track } from '@/lib/analytics';
import { formatFileSize, validateAudioFile } from '@/lib/audio-file';
import { useAppStore } from '@/store/use-app-store';
import styles from './free-tool.module.css';

type FreeToolProps = {
  isSignedIn: boolean;
};

export function FreeTool({ isSignedIn }: FreeToolProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { selectedFile, setSelectedFile, openAuthModal } = useAppStore();
  const [errorMessage, setErrorMessage] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    track('tool_opened', { source: 'mp3-to-mp4' });
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
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
    setVideoUrl(null);
    setErrorMessage('');
    track('file_uploaded', { source: 'mp3-to-mp4', size: file.size, type: file.type });
  };

  const handleConvert = async () => {
    if (!selectedFile || isConverting) {
      return;
    }

    setErrorMessage('');
    setIsConverting(true);

    try {
      const body = new FormData();
      body.append('file', selectedFile);

      const response = await fetch('/api/convert', { method: 'POST', body });
      const result = (await response.json()) as { error?: string; videoUrl?: string };

      if (!response.ok || !result.videoUrl) {
        throw new Error(result.error ?? 'Could not convert the file.');
      }

      setVideoUrl(result.videoUrl);
      track('processing_done', { source: 'mp3-to-mp4' });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not convert the file.');
    } finally {
      setIsConverting(false);
    }
  };

  // The full render is the conversion gate. The selected file stays in the store across sign up.
  const handleGenerate = () => {
    track('cta_clicked', { cta: 'generate', source: 'mp3-to-mp4', signed_in: isSignedIn });

    if (isSignedIn) {
      router.push('/generate');
      return;
    }

    openAuthModal('signup');
  };

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <Link className={styles.brand} href="/">freemium video funnel</Link>
        {isSignedIn ? (
          <Link className={styles.topLink} href="/generate">Open workspace</Link>
        ) : (
          <button className={styles.topLink} type="button" onClick={() => openAuthModal('signin')}>
            Sign in / Sign up
          </button>
        )}
      </header>

      <section className={styles.card} aria-labelledby="tool-title">
        <span className={styles.freeTag}>Free tool</span>
        <h1 id="tool-title">MP3 to MP4</h1>
        <p className={styles.lead}>
          Turn any audio file into a shareable video with a static cover. No account needed.
        </p>

        <div className={styles.fileRow}>
          <div className={styles.fileDetails}>
            <strong>{selectedFile?.name ?? 'No audio selected'}</strong>
            <span>
              {selectedFile ? formatFileSize(selectedFile.size) : 'MP3, WAV, or M4A up to 25 MB'}
            </span>
          </div>
          <input
            ref={inputRef}
            className={styles.fileInput}
            type="file"
            accept="audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/aac"
            onChange={handleFileChange}
            aria-label="Choose an audio file"
          />
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            {selectedFile ? 'Change audio' : 'Choose audio'}
          </button>
        </div>

        {errorMessage ? (
          <p className={styles.errorMessage} role="alert">{errorMessage}</p>
        ) : null}

        {videoUrl ? (
          <div className={styles.result}>
            <video className={styles.resultVideo} src={videoUrl} controls playsInline />
            <a className={styles.secondaryButton} href={videoUrl} download>
              Download MP4
            </a>
          </div>
        ) : (
          <button
            className={styles.primaryButton}
            type="button"
            onClick={handleConvert}
            disabled={!selectedFile || isConverting}
          >
            {isConverting ? 'Converting...' : 'Convert for free'}
          </button>
        )}

        {selectedFile ? (
          <div className={styles.upgrade}>
            <div>
              <span className={styles.eyebrow}>Full music video</span>
              <p>Turn this track into a generated video with visuals and voice. Costs 10 credits.</p>
            </div>
            <button className={styles.primaryButton} type="button" onClick={handleGenerate}>
              Generate full video
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
