import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.brand}>freemium video funnel</div>
        <button className={styles.authButton} type="button">
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
        <h1>Start Create Video</h1>

        <p>
          Create AI-powered video ideas faster with a polished creator workflow built
          for speed, quality, and creative control.
        </p>

        <button className={styles.primaryCta} type="button">
          Start Create Video
        </button>
      </main>
    </div>
  );
}
