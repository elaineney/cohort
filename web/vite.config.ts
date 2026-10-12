import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  plugins: [wasm()],

  // The recruitment page reaches into ../contract for the compiled circuits.
  server: { fs: { allow: ['..'] } },

  // Top-level await from the wasm loader needs an es2022 floor everywhere.
  esbuild: { target: 'es2022' },
  base: './',
  build: { target: 'es2022', outDir: '../dist', emptyOutDir: true, sourcemap: false },
  optimizeDeps: {
    esbuildOptions: { target: 'es2022' },
    exclude: ['@midnightntwrk/onchain-runtime-v4'],
  },
})
