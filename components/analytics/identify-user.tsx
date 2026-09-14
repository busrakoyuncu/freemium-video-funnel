'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

type IdentifyUserProps = {
  userId: string;
  email?: string;
};

/** Ties this browser's events to the signed-in user. Render it on signed-in pages. */
export function IdentifyUser({ userId, email }: IdentifyUserProps) {
  useEffect(() => {
    if (!posthog.__loaded) return;
    posthog.identify(userId, email ? { email } : undefined);
  }, [userId, email]);

  return null;
}
