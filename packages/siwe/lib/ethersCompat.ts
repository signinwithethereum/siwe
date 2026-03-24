import { EIP1271_MAGICVALUE } from './config'
import type { SiweConfig } from './config'
import { isEIP6492Signature, EIP6492_VALIDATOR_BYTECODE } from './eip6492'
import { ChainIdMismatchError } from './utils'

const EIP1271_ABI = [
  'function isValidSignature(bytes32 _message, bytes _signature) public view returns (bytes4)',
]

interface EthersHelpers {
  verifyMessage: (message: string, signature: any) => string
  hashMessage: (message: string) => string
  getAddress: (address: string) => string
  abiEncode: (types: string[], values: any[]) => string
  Contract: any
}

// undefined = not yet tried, null = ethers not available
let _cached: EthersHelpers | null | undefined

async function loadEthers(): Promise<EthersHelpers | null> {
  if (_cached !== undefined) return _cached

  try {
    const { ethers } = await import('ethers')

    let verifyMessage: any
    let hashMessage: any
    let getAddress: any
    let abiEncode: (types: string[], values: any[]) => string

    try {
      // ethers v5
      verifyMessage = (ethers as any).utils.verifyMessage
      hashMessage = (ethers as any).utils.hashMessage
      getAddress = (ethers as any).utils.getAddress
      abiEncode = (types: string[], values: any[]) =>
        (ethers as any).utils.defaultAbiCoder.encode(types, values)
    } catch {
      // ethers v6
      verifyMessage = ethers.verifyMessage
      hashMessage = ethers.hashMessage
      getAddress = ethers.getAddress
      abiEncode = (types: string[], values: any[]) =>
        new (ethers as any).AbiCoder().encode(types, values)
    }

    _cached = {
      verifyMessage,
      hashMessage,
      getAddress,
      abiEncode,
      Contract: ethers.Contract,
    }
  } catch {
    _cached = null
  }

  return _cached
}

/**
 * Create a SiweConfig using ethers.js (v5 or v6).
 * Auto-detects the installed ethers version.
 *
 * @param provider - ethers Provider for EIP-1271 contract wallet verification (optional)
 *
 * @example
 * ```ts
 * import { createEthersConfig, configure } from '@signinwithethereum/siwe';
 * import { ethers } from 'ethers';
 *
 * const provider = new ethers.JsonRpcProvider('https://...');
 * configure(await createEthersConfig(provider));
 * ```
 */
export async function createEthersConfig(
  provider?: any,
): Promise<SiweConfig> {
  const helpers = await loadEthers()
  if (!helpers) {
    throw new Error(
      'ethers is required for createEthersConfig. Install it with: npm install ethers',
    )
  }

  const config: SiweConfig = {
    verifyMessage: helpers.verifyMessage,
    hashMessage: helpers.hashMessage,
    getAddress: helpers.getAddress,
  }

  if (provider && helpers.Contract) {
    config.checkContractWalletSignature = async (
      address: string,
      message: string,
      signature: string,
      chainId: number,
    ) => {
      if (typeof provider.getNetwork !== 'function') {
        throw new ChainIdMismatchError(
          'EIP-1271/EIP-6492 verification requires a provider with getNetwork() support.',
        )
      }

      const network = await provider.getNetwork()
      const providerChainId = Number(network?.chainId)
      if (providerChainId !== chainId) {
        throw new ChainIdMismatchError(
          `Provider chainId ${providerChainId} does not match message chainId ${chainId}.`,
        )
      }

      if (isEIP6492Signature(signature)) {
        const hashedMessage = helpers.hashMessage(message)
        const encoded = helpers.abiEncode(
          ['address', 'bytes32', 'bytes'],
          [address, hashedMessage, signature],
        )
        const data = EIP6492_VALIDATOR_BYTECODE + encoded.slice(2)
        const result: string = await provider.call({ data })
        // Validator returns 0x01 (valid) or 0x00 (invalid), possibly zero-padded to 32 bytes
        const hex = result.replace(/^0x0*/, '') || '0'
        return hex === '1'
      }

      const walletContract = new helpers.Contract(
        address,
        EIP1271_ABI,
        provider,
      )
      const hashedMessage = helpers.hashMessage(message)
      const res = await walletContract.isValidSignature(
        hashedMessage,
        signature,
      )
      return res === EIP1271_MAGICVALUE
    }
  }

  return config
}

let cachedDefaultConfig: SiweConfig | null = null

/**
 * Try to create an ethers-based SiweConfig automatically.
 * Returns null if ethers is not available.
 * Memoizes the no-provider case to avoid allocation per verify() call.
 */
export async function tryAutoDetectEthers(
  provider?: any,
): Promise<SiweConfig | null> {
  const helpers = await loadEthers()
  if (!helpers) return null
  if (!provider) {
    if (!cachedDefaultConfig) {
      cachedDefaultConfig = await createEthersConfig()
    }
    return cachedDefaultConfig
  }
  return createEthersConfig(provider)
}
