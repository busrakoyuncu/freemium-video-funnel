'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics';
import { GENERATION_COST, type ShareRewardStatus } from '@/lib/jobs';
import styles from './credits-modal.module.css';

const SHARE_REWARD = 50;
const BRAND_HANDLE = '@freemiumvideo';

type CreditsModalProps = {
  credits: number;
  shareStatus: ShareRewardStatus;
  isOpen: boolean;
  onClose: () => void;
};

/** Shown when a render costs more than the user has. Sharing a finished video earns credits. */
export function CreditsModal({ credits, shareStatus, isOpen, onClose }: CreditsModalProps) {
  const router = useRouter();
  const [claimed, setClaimed] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const shareText = `I turned my track into a video with freemium video funnel ${BRAND_HANDLE}. Try the free MP3 to MP4 tool: ${window.location.origin}/mp3-to-mp4`;
  const shareUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}`;

  // The link opens the share in a new tab; this claims the reward alongside it.
  const handleShare = async () => {
    track('cta_clicked', { cta: 'share_to_earn', source: 'workspace', signed_in: true });
    setErrorMessage('');

    try {
      const response = await fetch('/api/credits/share', { method: 'POST' });
      const result = (await response.json()) as { credits?: number; error?: string };

      if (!response.ok || typeof result.credits !== 'number') {
        throw new Error(result.error ?? 'Could not add the credits.');
      }

      setClaimed(result.credits);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not add the credits.');
    }
  };

  const balanceLine = `You have ${credits} credits. A full video costs ${GENERATION_COST}.`;

  let title: string;
  let text: string;
  let canShare = false;

  if (claimed !== null) {
    title = 'Thanks for sharing';
    text = `You got ${SHARE_REWARD} credits. You now have ${claimed}.`;
  } else if (shareStatus === 'no_video') {
    title = 'You need at least one finished video';
    text = `${balanceLine} Finish a video, then share it to earn ${SHARE_REWARD} credits.`;
  } else if (shareStatus === 'claimed_today') {
    title = 'You earned this reward today';
    text = `${balanceLine} You can share again tomorrow for another ${SHARE_REWARD} credits.`;
  } else {
    title = credits < GENERATION_COST ? 'You need more credits' : 'Earn more credits';
    text = `${balanceLine} Share your video and tag ${BRAND_HANDLE} to earn ${SHARE_REWARD} credits.`;
    canShare = true;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="credits-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>

        <span className={styles.eyebrow}>Credits</span>
        <h3 id="credits-modal-title" className={styles.title}>{title}</h3>
        <p className={styles.text}>{text}</p>

        {errorMessage ? (
          <p className={styles.error} role="alert">{errorMessage}</p>
        ) : null}

        <div className={styles.actions}>
          {canShare ? (
            <a
              className={styles.primary}
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => void handleShare()}
            >
              Share to earn {SHARE_REWARD} credits
            </a>
          ) : null}
          <button type="button" className={canShare ? styles.secondary : styles.primary} onClick={onClose}>
            {claimed !== null ? 'Back to the workspace' : canShare ? 'Not now' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}
