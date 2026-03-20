import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/siwe.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => `siwe.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        '@signinwithethereum/ts-parser',
        '@stablelib/random',
        'ethers',
        'viem',
      ],
    },
  },
  plugins: [
    dts({ rollupTypes: true }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
