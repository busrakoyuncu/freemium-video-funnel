'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/auth/auth-modal';
import { UploadPanel } from '@/components/features/upload-panel';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useAppStore } from '@/store/use-app-store';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const {
    isUploadOpen,
    setUploadOpen,
    setAuthEntryMode,
    setAuthModalOpen,
    setShowSignupReminder,
  } = useAppStore();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (isMounted && data.session) {
        router.replace('/generate');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthEntryMode(mode);
    setShowSignupReminder(false);
    setAuthModalOpen(true);
  };

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.brand}>freemium video funnel</div>
        <button
          className={styles.authButton}
          type="button"
          onClick={() => openAuth('signin')}
        >
          Sign in / Sign up
        </button>
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
          onOpen={() => setUploadOpen(true)}
          onClose={() => setUploadOpen(false)}
          onAuthClick={() => openAuth('signin')}
        />
      </main>

      <AuthModal />
    </div>
  );
}
