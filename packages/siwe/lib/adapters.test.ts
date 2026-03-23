import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Wallet } from 'ethers'
import { SiweMessage } from './client'
import {
  EIP6492_MAGIC_SUFFIX,
  EIP6492_VALIDATOR_BYTECODE,
  isEIP6492Signature,
} from './eip6492'
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

describe('isEIP6492Signature', () => {
  test('detects EIP-6492 magic suffix', () => {
    const sig = '0x' + 'ab'.repeat(32) + EIP6492_MAGIC_SUFFIX
    expect(isEIP6492Signature(sig)).toBe(true)
  })

  test('rejects normal ECDSA signatures', () => {
    const sig = '0x' + 'ab'.repeat(65)
    expect(isEIP6492Signature(sig)).toBe(false)
  })

  test('rejects signatures shorter than 32 bytes', () => {
    expect(isEIP6492Signature('0x1234')).toBe(false)
  })

  test('handles missing 0x prefix', () => {
    const sig = 'ab'.repeat(32) + EIP6492_MAGIC_SUFFIX
    expect(isEIP6492Signature(sig)).toBe(true)
  })
})

describe('EIP6492_VALIDATOR_BYTECODE integrity', () => {
  test('matches viem erc6492SignatureValidatorByteCode', () => {
    // Find the viem contracts file in node_modules
    const viemContractsPath = resolve(
      require.resolve('viem/package.json'),
      '../constants/contracts.ts',
    )
    const source = readFileSync(viemContractsPath, 'utf8')
    const match = source.match(
      /erc6492SignatureValidatorByteCode\s*=\s*'(0x[0-9a-f]+)'/,
    )
    expect(match).not.toBeNull()
    expect(EIP6492_VALIDATOR_BYTECODE).toBe(match![1])
  })
})

describe('viem adapter EIP-6492 support', () => {
  test('uses verifyMessage when available (EIP-6492 signature)', async () => {
    let verifyMessageCalled = false
    const config = await createViemConfig({
      publicClient: {
        readContract: async () => {
          throw new Error('should not be called')
        },
        verifyMessage: async ({ address, message, signature }) => {
          verifyMessageCalled = true
          return true
        },
        getChainId: async () => 1,
      },
    })

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    // Create a mock EIP-6492 signature (magic suffix appended)
    const baseSig = await wallet.signMessage(msg.toMessage())
    const eip6492Sig = baseSig + EIP6492_MAGIC_SUFFIX

    const result = await msg.verify(
      { signature: eip6492Sig, domain: msg.domain, nonce: msg.nonce },
      { config },
    )
    expect(result.success).toBe(true)
    expect(verifyMessageCalled).toBe(true)
  })

  test('uses verifyMessage for standard ERC-1271 signatures too', async () => {
    let verifyMessageCalled = false
    const config = await createViemConfig({
      publicClient: {
        readContract: async () => {
          throw new Error('should not be called')
        },
        verifyMessage: async () => {
          verifyMessageCalled = true
          return true
        },
        getChainId: async () => 1,
      },
    })

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const signature = await wallet.signMessage(msg.toMessage())

    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce },
      { config },
    )
    expect(result.success).toBe(true)
    expect(verifyMessageCalled).toBe(true)
  })

  test('verifyMessage returning false rejects signature', async () => {
    const config = await createViemConfig({
      publicClient: {
        readContract: async () => '0x1626ba7e',
        verifyMessage: async () => false,
        getChainId: async () => 1,
      },
    })

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const signature = await wallet.signMessage(msg.toMessage())

    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
  })

  test('falls back to readContract when verifyMessage is not available', async () => {
    let readContractCalled = false
    const config = await createViemConfig({
      publicClient: {
        readContract: async () => {
          readContractCalled = true
          return '0x1626ba7e'
        },
        getChainId: async () => 1,
      },
    })

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const signature = await wallet.signMessage(msg.toMessage())

    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce },
      { config },
    )
    expect(result.success).toBe(true)
    expect(readContractCalled).toBe(true)
  })

  test('chain ID mismatch rejects before verifyMessage is called', async () => {
    let verifyMessageCalled = false
    const config = await createViemConfig({
      publicClient: {
        readContract: async () => '0x1626ba7e',
        verifyMessage: async () => {
          verifyMessageCalled = true
          return true
        },
        getChainId: async () => 5, // wrong chain
      },
    })

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const baseSig = await wallet.signMessage(msg.toMessage())
    const eip6492Sig = baseSig + EIP6492_MAGIC_SUFFIX

    const result = await msg.verify(
      { signature: eip6492Sig, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
    expect((result.error as any).type).toBe(
      SiweErrorType.INVALID_SIGNATURE_CHAIN_ID,
    )
    expect(verifyMessageCalled).toBe(false)
  })

  test('verifyMessage RPC error propagates as verification failure', async () => {
    const config = await createViemConfig({
      publicClient: {
        readContract: async () => '0x1626ba7e',
        verifyMessage: async () => {
          throw new Error('RPC connection failed')
        },
        getChainId: async () => 1,
      },
    })

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const baseSig = await wallet.signMessage(msg.toMessage())
    const eip6492Sig = baseSig + EIP6492_MAGIC_SUFFIX

    const result = await msg.verify(
      { signature: eip6492Sig, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(Error)
    expect((result.error as Error).message).toBe('RPC connection failed')
  })

  test('EIP-6492 sig without publicClient fails as INVALID_SIGNATURE', async () => {
    const config = await createViemConfig() // no publicClient

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const baseSig = await wallet.signMessage(msg.toMessage())
    const eip6492Sig = baseSig + EIP6492_MAGIC_SUFFIX

    const result = await msg.verify(
      { signature: eip6492Sig, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
    expect((result.error as any).type).toBe(SiweErrorType.INVALID_SIGNATURE)
  })
})

describe('ethers adapter EIP-6492 support', () => {
  test('uses provider.call for EIP-6492 signatures', async () => {
    let providerCallData: string | null = null
    const mockProvider = {
      getNetwork: async () => ({ chainId: 1n }),
      call: async ({ data }: { data: string }) => {
        providerCallData = data
        return '0x01' // valid
      },
    }
    const config = createEthersConfig(mockProvider)

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const baseSig = await wallet.signMessage(msg.toMessage())
    const eip6492Sig = baseSig + EIP6492_MAGIC_SUFFIX

    const result = await msg.verify(
      { signature: eip6492Sig, domain: msg.domain, nonce: msg.nonce },
      { config },
    )
    expect(result.success).toBe(true)
    expect(providerCallData).not.toBeNull()
    // Verify the call data starts with the validator bytecode
    expect(providerCallData!.startsWith('0x6080604052')).toBe(true)
  })

  test('EIP-6492 verification rejects invalid signature', async () => {
    const mockProvider = {
      getNetwork: async () => ({ chainId: 1n }),
      call: async () => '0x00', // invalid
    }
    const config = createEthersConfig(mockProvider)

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const baseSig = await wallet.signMessage(msg.toMessage())
    const eip6492Sig = baseSig + EIP6492_MAGIC_SUFFIX

    const result = await msg.verify(
      { signature: eip6492Sig, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
  })

  test('accepts zero-padded 32-byte provider response', async () => {
    const mockProvider = {
      getNetwork: async () => ({ chainId: 1n }),
      // Some nodes return padded 32-byte results from eth_call
      call: async () =>
        '0x0000000000000000000000000000000000000000000000000000000000000001',
    }
    const config = createEthersConfig(mockProvider)

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const baseSig = await wallet.signMessage(msg.toMessage())
    const eip6492Sig = baseSig + EIP6492_MAGIC_SUFFIX

    const result = await msg.verify(
      { signature: eip6492Sig, domain: msg.domain, nonce: msg.nonce },
      { config },
    )
    expect(result.success).toBe(true)
  })

  test('rejects zero-padded 32-byte invalid response', async () => {
    const mockProvider = {
      getNetwork: async () => ({ chainId: 1n }),
      call: async () =>
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    }
    const config = createEthersConfig(mockProvider)

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const baseSig = await wallet.signMessage(msg.toMessage())
    const eip6492Sig = baseSig + EIP6492_MAGIC_SUFFIX

    const result = await msg.verify(
      { signature: eip6492Sig, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
  })

  test('non-EIP-6492 signatures use standard ERC-1271 path (not validator bytecode)', async () => {
    let callDataUsed: string | null = null
    const mockProvider = {
      getNetwork: async () => ({ chainId: 1n }),
      // ethers Contract internally uses provider.call for readContract,
      // so we capture the call data to verify it's NOT the EIP-6492 validator
      call: async (tx: any) => {
        callDataUsed = typeof tx === 'string' ? tx : tx?.data ?? null
        // Return ERC-1271 magic value (0x1626ba7e, left-padded to 32 bytes)
        return '0x1626ba7e00000000000000000000000000000000000000000000000000000000'
      },
    }
    const config = createEthersConfig(mockProvider)

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const signature = await wallet.signMessage(msg.toMessage())

    const result = await msg.verify(
      { signature, domain: msg.domain, nonce: msg.nonce },
      { config },
    )
    expect(result.success).toBe(true)
    // Verify the call used the ERC-1271 isValidSignature selector, not the validator bytecode
    expect(callDataUsed).toBeTruthy()
    expect(callDataUsed!.startsWith('0x1626ba7e')).toBe(true) // isValidSignature selector
  })

  test('chain ID mismatch rejects before provider.call for EIP-6492', async () => {
    let providerCallUsed = false
    const mockProvider = {
      getNetwork: async () => ({ chainId: 5n }), // wrong chain
      call: async () => {
        providerCallUsed = true
        return '0x01'
      },
    }
    const config = createEthersConfig(mockProvider)

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const baseSig = await wallet.signMessage(msg.toMessage())
    const eip6492Sig = baseSig + EIP6492_MAGIC_SUFFIX

    const result = await msg.verify(
      { signature: eip6492Sig, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
    expect((result.error as any).type).toBe(
      SiweErrorType.INVALID_SIGNATURE_CHAIN_ID,
    )
    expect(providerCallUsed).toBe(false)
  })

  test('provider.call RPC error propagates as verification failure', async () => {
    const mockProvider = {
      getNetwork: async () => ({ chainId: 1n }),
      call: async () => {
        throw new Error('eth_call reverted')
      },
    }
    const config = createEthersConfig(mockProvider)

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const baseSig = await wallet.signMessage(msg.toMessage())
    const eip6492Sig = baseSig + EIP6492_MAGIC_SUFFIX

    const result = await msg.verify(
      { signature: eip6492Sig, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(Error)
    expect((result.error as Error).message).toBe('eth_call reverted')
  })

  test('provider.call returning empty result rejects signature', async () => {
    const mockProvider = {
      getNetwork: async () => ({ chainId: 1n }),
      call: async () => '0x',
    }
    const config = createEthersConfig(mockProvider)

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const baseSig = await wallet.signMessage(msg.toMessage())
    const eip6492Sig = baseSig + EIP6492_MAGIC_SUFFIX

    const result = await msg.verify(
      { signature: eip6492Sig, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
  })

  test('EIP-6492 sig without provider fails as INVALID_SIGNATURE', async () => {
    const config = createEthersConfig() // no provider

    const wallet = Wallet.createRandom()
    const contractAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const msg = createTestMessage(contractAddr)
    const baseSig = await wallet.signMessage(msg.toMessage())
    const eip6492Sig = baseSig + EIP6492_MAGIC_SUFFIX

    const result = await msg.verify(
      { signature: eip6492Sig, domain: msg.domain, nonce: msg.nonce },
      { config, suppressExceptions: true },
    )
    expect(result.success).toBe(false)
    expect((result.error as any).type).toBe(SiweErrorType.INVALID_SIGNATURE)
  })
})
