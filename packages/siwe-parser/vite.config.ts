import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'lib/parsers.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => `parsers.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: [/^apg-js/, /^@noble\/hashes/],
    },
  },
  plugins: [dts({ rollupTypes: true })],
  test: {
    globals: true,
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
})
