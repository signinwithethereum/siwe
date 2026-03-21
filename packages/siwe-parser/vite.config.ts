import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/parsers.ts'),
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
