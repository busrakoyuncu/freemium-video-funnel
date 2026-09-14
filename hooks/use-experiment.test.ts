import { describe, expect, it } from 'vitest';
import { toVariant } from './use-experiment';

describe('toVariant', () => {
  it('maps only the exact test key to the test variant', () => {
    expect(toVariant('test')).toBe('test');
  });

  it('falls back to control for anything else, including a flag that has not loaded', () => {
    expect(toVariant('control')).toBe('control');
    expect(toVariant(undefined)).toBe('control');
    expect(toVariant(false)).toBe('control');
    expect(toVariant(true)).toBe('control');
    expect(toVariant('Test')).toBe('control');
  });
});
