'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { formatFileSize, validateAudioFile } from '@/lib/audio-file';
import { useAppStore } from '@/store/use-app-store';
import styles from './page.module.css';

export default function GeneratePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { selectedFile, setSelectedFile, errorMessage, setErrorMessage } = useAppStore();
  const [isRendering, setIsRendering] = useState(false);

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
    setErrorMessage('');
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    setSelectedFile(null);
    router.push('/');
    router.refresh();
  };

  const handleGenerate = async () => {
    if (!selectedFile || isRendering) {
      return;
    }

    setErrorMessage('');
    setIsRendering(true);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: {
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type,
          },
        }),
      });
      const result = (await response.json()) as { error?: string; status?: string };

      if (!response.ok) {
        throw new Error(result.error ?? 'Could not start the generation.');
      }
    } catch (error) {
      setIsRendering(false);
      setErrorMessage(error instanceof Error ? error.message : 'Could not start the generation.');
    }
  };

  return (
    <main className={styles.workspace}>
      <aside className={styles.sidebar}>
        <div className={styles.brandMark}>fv</div>
        <p className={styles.brandName}>freemium video funnel</p>
        <nav className={styles.nav} aria-label="Workspace navigation">
          <Link className={styles.navItemActive} href="/generate">Workspace</Link>
          <Link className={styles.navItem} href="/">Upload</Link>
        </nav>
        <div className={styles.planCard}>
          <span className={styles.eyebrow}>Free plan</span>
          <strong>50 credits</strong>
          <span>10 credits per full video</span>
        </div>
        <button className={styles.signOutButton} type="button" onClick={handleSignOut}>
          Sign out
        </button>
      </aside>

      <section className={styles.content}>
        <header className={styles.toolbar}>
          <div>
            <span className={styles.eyebrow}>Creator workspace</span>
            <h1>Generate your video</h1>
          </div>
          <span className={styles.credits}>50 credits</span>
        </header>

        <section className={styles.contentSection} aria-labelledby="render-title">
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.eyebrow}>New render</span>
              <h2 id="render-title">Turn your audio into a video</h2>
            </div>
            <span className={styles.status}>Draft</span>
          </div>

          <div className={styles.fileRow}>
            <div className={styles.fileIcon}>MP3</div>
            <div className={styles.fileDetails}>
              <strong>{selectedFile?.name ?? 'No audio selected'}</strong>
              <span>
                {selectedFile
                  ? `${formatFileSize(selectedFile.size)} · Ready to render`
                  : 'Choose an audio file to start your render'}
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
            <p className={styles.errorMessage} role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className={styles.renderPanel}>
            <div>
              <span className={styles.eyebrow}>Full music video</span>
              <h3>{isRendering ? 'Preparing your video' : 'Ready when you are'}</h3>
              <p>
                {isRendering
                  ? 'Your render request is being prepared. This demo will connect to the generation service next.'
                  : 'Your selected audio will be used for the first generation request.'}
              </p>
            </div>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={handleGenerate}
              disabled={!selectedFile || isRendering}
            >
              {isRendering ? 'Preparing...' : 'Generate video · 10 credits'}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
