import posthog from 'posthog-js';

export type AnalyticsEvent = 'tool_opened' | 'file_uploaded' | 'processing_done' | 'cta_clicked';

/** Captures a funnel event. Does nothing when PostHog is not configured. */
export function track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>) {
  if (!posthog.__loaded) return;
  posthog.capture(event, properties);
}
