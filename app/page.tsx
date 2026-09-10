'use client';

import { useState } from 'react';
import { UploadPanel } from '@/components/features/upload-panel';
import styles from './page.module.css';

export default function Home() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.brand}>freemium video funnel</div>
        {!isUploadOpen ? (
          <button className={styles.authButton} type="button">
            Sign in / Sign up
          </button>
        ) : null}
      </header>

      <div className={styles.videoWrap}>
        <video
          className={styles.video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Background video preview"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className={styles.overlay} />
      </div>

      <main className={styles.hero}>
        <h1>Create your next video</h1>

        <p>
          Upload your idea, choose a style, and generate a polished video in
          minutes.
        </p>

        <UploadPanel
          isUploadOpen={isUploadOpen}
          onOpen={() => setIsUploadOpen(true)}
          onClose={() => setIsUploadOpen(false)}
          onAuthClick={() => {
            // placeholder for future auth flow
          }}
        />
      </main>
    </div>
  );
}
