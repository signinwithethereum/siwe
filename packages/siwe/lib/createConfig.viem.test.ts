/**
 * Tests that createConfig selects the viem adapter when viem is available.
 * Viem is installed as a devDependency so this is the default path.
 */
import { vi, describe, test, expect } from 'vitest'
import { Wallet } from 'ethers'
import { SiweMessage } from './client'
import { generateNonce } from './utils'
import * as viemAdapter from './viemAdapter'

describe('createConfig selects viem when available', () => {
  test('delegates to createViemConfig', async () => {
    const spy = vi.spyOn(viemAdapter, 'createViemConfig')
    const { createConfig } = await import('./config')

    await createConfig('http://localhost:8545')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  test('round-trip verify works via viem path', async () => {
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
})
