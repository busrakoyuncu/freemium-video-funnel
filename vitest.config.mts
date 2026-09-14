import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Mirrors the "@/..." alias from tsconfig.json.
    alias: { '@': import.meta.dirname },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next'],
  },
});
