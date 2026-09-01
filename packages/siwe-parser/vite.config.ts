import { copyFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'

/**
 * Node16 resolution reads a lone `.d.ts` in a `"type": "module"` package as
 * ESM-only, so a CJS consumer importing it fails with TS1479. Emitting
 * `.d.mts`/`.d.cts` alongside lets `exports` point each condition at a
 * declaration whose module format matches the JS it describes.
 */
const emitDualDeclarations = async () => {
  const dist = fileURLToPath(new URL('dist', import.meta.url))
  const declarations = (await readdir(dist)).filter((f) => f.endsWith('.d.ts'))

  if (declarations.length === 0) {
    throw new Error(`no .d.ts emitted in ${dist} to copy to .d.mts/.d.cts`)
  }

  await Promise.all(
    declarations.flatMap((name) =>
      ['.d.mts', '.d.cts'].map((extension) =>
        copyFile(
          resolve(dist, name),
          resolve(dist, name.replace(/\.d\.ts$/, extension)),
        ),
      ),
    ),
  )
}

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
  plugins: [dts({ rollupTypes: true, afterBuild: emitDualDeclarations })],
  test: {
    globals: true,
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
})
