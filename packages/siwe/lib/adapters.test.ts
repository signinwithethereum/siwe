import { Wallet } from 'ethers'
import { SiweMessage } from './client'
import { createEthersConfig } from './ethersCompat'
import { SiweErrorType } from './types'
import { generateNonce } from './utils'
import { createViemConfig } from './viemAdapter'

function createTestMessage(address: string) {
  return new SiweMessage({
    address,
    domain: 'test.example',
    statement: 'Test statement',
    uri: 'https://test.example',
    version: '1',
    nonce: generateNonce(),
    issuedAt: '2022-01-27T17:09:38.578Z',
    chainId: 1,
    expirationTime: '2100-01-01T00:00:00.000Z',
  })
}

describe('generateNonce', () => {
  test('returns a 17-character alphanumeric string', () => {
    const nonce = generateNonce()
    expect(nonce).toHaveLength(17)
    expect(nonce).toMatch(/^[A-Za-z0-9]+$/)
  })

  test('returns unique values across 100 calls', () => {
    const nonces = new Set(Array.from({ length: 100 }, () => generateNonce()))
    expect(nonces.size).toBe(100)
  })
})

describe('Round-trip verification with ethers config', () => {
  test('sign and verify succeeds', async () => {
    const wallet = Wallet.createRandom()
    const config = createEthersConfig()
    const msg = createTestMessage(wallet.address)
    const signature = await wallet.signMessage(msg.toMessage())
    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce },
      { config },
    )
    expect(result.success).toBe(true)
  })

  test('wrong signer fails verification', async () => {
    const wallet = Wallet.createRandom()
    const other = Wallet.createRandom()
    const config = createEthersConfig()
    const msg = createTestMessage(wallet.address)
    const signature = await other.signMessage(msg.toMessage())
    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
  })
})

describe('Round-trip verification with viem config', () => {
  test('sign and verify succeeds', async () => {
    const wallet = Wallet.createRandom()
    const config = await createViemConfig()
    const msg = createTestMessage(wallet.address)
    const signature = await wallet.signMessage(msg.toMessage())
    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce },
      { config },
    )
    expect(result.success).toBe(true)
  })

  test('wrong signer fails verification', async () => {
    const wallet = Wallet.createRandom()
    const other = Wallet.createRandom()
    const config = await createViemConfig()
    const msg = createTestMessage(wallet.address)
    const signature = await other.signMessage(msg.toMessage())
    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
  })
})

describe('viem adapter getChainId fallback', () => {
  test('EIP-1271 succeeds using getChainId when chain.id is absent', async () => {
    const config = await createViemConfig({
      publicClient: {
        readContract: async () => '0x1626ba7e',
        getChainId: async () => 1,
      },
    })

    const wallet = Wallet.createRandom()
    const msg = createTestMessage('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
    const signature = await wallet.signMessage(msg.toMessage())

    // EOA verification will fail (address mismatch), falls through to EIP-1271
    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce },
      { config },
    )
    expect(result.success).toBe(true)
  })

  test('EIP-1271 rejects chain mismatch via getChainId', async () => {
    const config = await createViemConfig({
      publicClient: {
        readContract: async () => '0x1626ba7e',
        getChainId: async () => 5, // wrong chain
      },
    })

    const wallet = Wallet.createRandom()
    const msg = createTestMessage('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
    const signature = await wallet.signMessage(msg.toMessage())

    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
    expect((result.error as any).type).toBe(
      SiweErrorType.INVALID_SIGNATURE_CHAIN_ID,
    )
  })

  test('EIP-1271 rejects when neither chain.id nor getChainId is available', async () => {
    const config = await createViemConfig({
      publicClient: {
        readContract: async () => '0x1626ba7e',
      },
    })

    const wallet = Wallet.createRandom()
    const msg = createTestMessage('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
    const signature = await wallet.signMessage(msg.toMessage())

    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
    expect((result.error as any).type).toBe(
      SiweErrorType.INVALID_SIGNATURE_CHAIN_ID,
    )
  })

  test('EIP-1271 prefers chain.id over getChainId when both are present', async () => {
    const config = await createViemConfig({
      publicClient: {
        readContract: async () => '0x1626ba7e',
        getChainId: async () => 999, // would fail if used
        chain: { id: 1 }, // correct chain — should be used
      },
    })

    const wallet = Wallet.createRandom()
    const msg = createTestMessage('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
    const signature = await wallet.signMessage(msg.toMessage())

    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce },
      { config },
    )
    expect(result.success).toBe(true)
  })
})
