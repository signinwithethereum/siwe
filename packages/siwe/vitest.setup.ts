import { vi } from 'vitest'

vi.mock('ethers', async () => {
  const packages: Record<string, string> = {
    5: 'ethers5',
    6: 'ethers6',
  }
  const version = process.env.ETHERSJS_VERSION || '6'
  console.log('Testing with ethers version', version)

  const originalModule = await vi.importActual<Record<string, unknown>>(
    packages[version],
  )

  return {
    // ethers v6 doesn't export `providers` but tests import it for v5 compat
    providers: undefined,
    ...originalModule,
  }
})
