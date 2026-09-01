import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'

/**
 * Node16 resolution reads a lone `.d.ts` in a `"type": "module"` package as
 * ESM-only, so a CJS consumer importing it fails with TS1479. Emitting
 * `.d.mts`/`.d.cts` alongside lets `exports` point each condition at a
 * declaration whose module format matches the JS it describes.
 */
const emitDualDeclarations = async () => {
  const dist = resolve(process.cwd(), 'dist')
  const source = resolve(dist, 'siwe.d.ts')

  await Promise.all([
    copyFile(source, resolve(dist, 'siwe.d.mts')),
    copyFile(source, resolve(dist, 'siwe.d.cts')),
  ])
}

export default defineConfig({
  build: {
    lib: {
      entry: 'lib/siwe.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => `siwe.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['@signinwithethereum/siwe-parser', 'ethers', 'viem'],
    },
  },
  plugins: [dts({ rollupTypes: true, afterBuild: emitDualDeclarations })],
  test: {
    globals: true,
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
