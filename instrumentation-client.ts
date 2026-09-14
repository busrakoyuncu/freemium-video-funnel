import posthog from 'posthog-js';

// Runs once in the browser before the app hydrates. Skipped when no key is set.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    defaults: '2026-05-30',
  });

  // Lets the browser console inspect flags and override experiment variants during QA.
  window.posthog = posthog;
}

declare global {
  interface Window {
    posthog?: typeof posthog;
  }
}
