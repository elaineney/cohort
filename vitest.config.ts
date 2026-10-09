import { defineConfig } from 'vitest/config'

// Contract + domain suites run under plain Node; no DOM needed.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
    reporters: ['default'],
  },
})
