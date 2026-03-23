/**
 * Tests that createConfig throws when neither viem nor ethers is available.
 * Mocks both libraries to simulate neither being installed.
 */
import { vi, test, expect } from 'vitest'

vi.mock('viem', () => {
  throw new Error('Cannot find module viem')
})

vi.mock('ethers', () => {
  throw new Error('Cannot find module ethers')
})

test('createConfig throws when neither library is available', async () => {
  const { createConfig } = await import('./config')
  await expect(createConfig('http://localhost:8545')).rejects.toThrow(
    'createConfig requires viem or ethers',
  )
})
