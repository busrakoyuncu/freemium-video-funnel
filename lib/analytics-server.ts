import { PostHog } from 'posthog-node';

export type ServerAnalyticsEvent = 'signup_completed' | 'job_created' | 'job_completed' | 'job_failed';

/**
 * Captures a funnel event from a route handler and flushes it before returning,
 * since serverless functions may stop right after the response. No-op without a key.
 */
export async function trackServer(
  distinctId: string,
  event: ServerAnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!key) return;

  const client = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  });

  client.capture({ distinctId, event, properties });
  await client.shutdown();
}
