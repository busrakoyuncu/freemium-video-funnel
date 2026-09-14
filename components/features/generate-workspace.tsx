'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import posthog from 'posthog-js';
import { track } from '@/lib/analytics';
import { formatFileSize, validateAudioFile } from '@/lib/audio-file';
import { GENERATION_COST, isTerminal, RENDER_STAGES } from '@/lib/jobs';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useJobStatus } from '@/hooks/use-job-status';
import { useAppStore } from '@/hooks/use-app-store';
import styles from './generate-workspace.module.css';

type GenerateWorkspaceProps = {
  credits: number;
  jobId: string | null;
};

export function GenerateWorkspace({ credits, jobId }: GenerateWorkspaceProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { selectedFile, setSelectedFile } = useAppStore();
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { job, error: jobError } = useJobStatus(jobId);

  // Credits are rendered on the server, so re-render once the job settles (refunds on failure).
  useEffect(() => {
    if (job && isTerminal(job.status)) {
      router.refresh();
    }
  }, [job, router]);

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
    track('file_uploaded', { source: 'workspace', size: file.size, type: file.type });
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    // The next visitor in this browser must not inherit this user's identity.
    if (posthog.__loaded) posthog.reset();
    setSelectedFile(null);
    router.push('/');
    router.refresh();
  };

  const handleGenerate = async () => {
    if (!selectedFile || isSubmitting) {
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    track('cta_clicked', { cta: 'generate', source: 'workspace', signed_in: true });

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
      const result = (await response.json()) as { error?: string; jobId?: string };

      if (!response.ok || !result.jobId) {
        throw new Error(result.error ?? 'Could not start the generation.');
      }

      // The job id lives in the URL so a refresh keeps the progress view.
      router.replace(`/generate?job=${result.jobId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not start the generation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStageIndex = job ? RENDER_STAGES.findIndex((stage) => stage.status === job.status) : -1;

  return (
    <main className={styles.workspace}>
      <aside className={styles.sidebar}>
        <div className={styles.brandMark}>fv</div>
        <p className={styles.brandName}>freemium video funnel</p>
        <nav className={styles.nav} aria-label="Workspace navigation">
          <Link className={styles.navItemActive} href="/generate">Workspace</Link>
          <Link className={styles.navItem} href="/mp3-to-mp4">Free tool</Link>
          <Link className={styles.navItem} href="/">Home</Link>
        </nav>
        <div className={styles.planCard}>
          <span className={styles.eyebrow}>Free plan</span>
          <strong>{credits} credits</strong>
          <span>{GENERATION_COST} credits per full video</span>
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
          <span className={styles.credits}>{credits} credits</span>
        </header>

        {jobId ? (
          <section className={styles.contentSection} aria-labelledby="job-title">
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.eyebrow}>Render job</span>
                <h2 id="job-title">
                  {job?.status === 'done'
                    ? 'Your video is ready'
                    : job?.status === 'failed'
                      ? 'The render failed'
                      : 'Rendering your video'}
                </h2>
              </div>
              <span className={styles.status}>{job?.status.replace('_', ' ') ?? 'loading'}</span>
            </div>

            {jobError ? (
              <p className={styles.errorMessage} role="alert">{jobError}</p>
            ) : null}

            {job?.status === 'failed' ? (
              <p className={styles.renderNote}>
                Your {GENERATION_COST} credits were refunded. You can start a new render.
              </p>
            ) : (
              <ol className={styles.stages} aria-label="Render progress">
                {RENDER_STAGES.map((stage, index) => (
                  <li
                    key={stage.status}
                    className={
                      index < activeStageIndex
                        ? styles.stageDone
                        : index === activeStageIndex
                          ? styles.stageActive
                          : styles.stage
                    }
                    aria-current={index === activeStageIndex ? 'step' : undefined}
                  >
                    {stage.label}
                  </li>
                ))}
              </ol>
            )}

            {job?.status === 'done' && job.videoUrl ? (
              <div className={styles.result}>
                <video className={styles.resultVideo} src={job.videoUrl} controls playsInline />
                <a className={styles.primaryButton} href={job.videoUrl} download>
                  Download MP4
                </a>
              </div>
            ) : null}

            {job && isTerminal(job.status) ? (
              <div className={styles.renderPanel}>
                <p>Ready for another one?</p>
                <Link className={styles.secondaryButton} href="/generate">
                  Start a new render
                </Link>
              </div>
            ) : null}
          </section>
        ) : (
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
                <h3>{isSubmitting ? 'Starting your render' : 'Ready when you are'}</h3>
                <p>
                  {GENERATION_COST} credits are reserved when the render starts and refunded if it fails.
                </p>
              </div>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={handleGenerate}
                disabled={!selectedFile || isSubmitting}
              >
                {isSubmitting ? 'Starting...' : `Generate video · ${GENERATION_COST} credits`}
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
