/**
 * Tests behavior when neither viem nor ethers is available.
 * Mocks both libraries to simulate neither being installed.
 */
import { vi, test, expect, describe } from 'vitest'

vi.mock('viem', () => {
  throw new Error('Cannot find module viem')
})

vi.mock('ethers', () => {
  throw new Error('Cannot find module ethers')
})

describe('no ethers or viem installed', () => {
  test('importing the package does not crash', async () => {
    const mod = await import('./siwe')
    expect(mod.SiweMessage).toBeDefined()
    expect(mod.createEthersConfig).toBeDefined()
    expect(mod.createViemConfig).toBeDefined()
  })

  test('SiweMessage can be constructed without ethers', async () => {
    const { SiweMessage } = await import('./client')
    const msg = new SiweMessage({
      domain: 'test.example',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      uri: 'https://test.example',
      version: '1',
      nonce: 'abcdefgh12345678',
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
    })
    expect(msg.domain).toBe('test.example')
  })

  test('createEthersConfig rejects with helpful error', async () => {
    const { createEthersConfig } = await import('./ethersCompat')
    await expect(createEthersConfig()).rejects.toThrow(
      'ethers is required for createEthersConfig',
    )
  })

  test('createConfig throws when neither library is available', async () => {
    const { createConfig } = await import('./config')
    await expect(createConfig('http://localhost:8545')).rejects.toThrow(
      'createConfig requires viem or ethers',
    )
  })
})
