'use client';

import { useEffect, useState } from 'react';
import posthog from 'posthog-js';

export type Variant = 'control' | 'test';

/** Anything that is not exactly the test variant renders control, including "flag not loaded". */
export function toVariant(value: unknown): Variant {
  return value === 'test' ? 'test' : 'control';
}

/**
 * Variant for a PostHog experiment flag. Returns control until PostHog has answered.
 * Reading the flag records the exposure, so call this only where the variant is visible.
 */
export function useExperiment(flagKey: string): Variant {
  const [variant, setVariant] = useState<Variant>('control');

  useEffect(() => {
    if (!posthog.__loaded) return;

    return posthog.onFeatureFlags(() => {
      setVariant(toVariant(posthog.getFeatureFlag(flagKey)));
    });
  }, [flagKey]);

  return variant;
}
