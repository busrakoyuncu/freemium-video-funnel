import Link from 'next/link';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthModal } from '@/components/auth/auth-modal';
import { UploadPanel } from '@/components/features/upload-panel';
import { getSupabaseServerClient } from '@/lib/supabase/server-client';
import styles from './page.module.css';

export default async function Home() {
  const supabase = await getSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const isSignedIn = Boolean(user);

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.brand}>freemium video funnel</div>
        {isSignedIn ? (
          <Link className={styles.authButton} href="/generate">
            Open workspace
          </Link>
        ) : (
          <AuthButton className={styles.authButton} mode="signin">
            Sign in / Sign up
          </AuthButton>
        )}
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

        <UploadPanel isSignedIn={isSignedIn} />

        <Link className={styles.heroLink} href="/mp3-to-mp4">
          Or try the free MP3 to MP4 tool
        </Link>
      </main>

      <AuthModal />
    </div>
  );
}
