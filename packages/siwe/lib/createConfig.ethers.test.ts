/**
 * Tests that createConfig falls back to ethers when viem is unavailable.
 * Mocks 'viem' to simulate it not being installed.
 */
import { vi, describe, test, expect } from 'vitest'

// Make viem unavailable so createConfig falls through to ethers
vi.mock('viem', () => {
  throw new Error('Cannot find module viem')
})

import { Wallet } from 'ethers'
import { SiweMessage } from './client'
import { generateNonce } from './utils'

describe('createConfig ethers fallback (viem unavailable)', () => {
  test('round-trip verify works via ethers path', async () => {
    const { createConfig } = await import('./config')
    const wallet = Wallet.createRandom()
    const config = await createConfig('http://localhost:8545')

    const msg = new SiweMessage({
      address: wallet.address,
      domain: 'test.example',
      statement: 'Test',
      uri: 'https://test.example',
      version: '1',
      nonce: generateNonce(),
      issuedAt: '2022-01-27T17:09:38.578Z',
      chainId: 1,
      expirationTime: '2100-01-01T00:00:00.000Z',
    })
    const signature = await wallet.signMessage(msg.toMessage())
    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce },
      { config },
    )
    expect(result.success).toBe(true)
  })

  test('config includes EIP-1271 support from ethers provider', async () => {
    const { createConfig } = await import('./config')
    const config = await createConfig('http://localhost:8545')
    expect(config.checkContractWalletSignature).toBeTypeOf('function')
  })
})
