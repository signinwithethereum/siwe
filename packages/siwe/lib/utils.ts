import { isValidISO8601Date } from '@signinwithethereum/siwe-parser'

import type { SiweMessage } from './client'
import type { SiweConfig } from './config'

/**
 * This method calls the EIP-1271 method for Smart Contract wallets
 * via the provided SiweConfig.
 * @param message The EIP-4361 parsed message
 * @param signature The signature to verify
 * @param config SiweConfig with checkContractWalletSignature support
 * @returns {Promise<boolean>} Whether the signature is valid for the contract wallet.
 */
export const checkContractWalletSignature = async (
  message: SiweMessage,
  signature: string,
  config?: SiweConfig,
): Promise<boolean> => {
  if (!config?.checkContractWalletSignature) {
    return false
  }

  return config.checkContractWalletSignature(
    message.address,
    message.prepareMessage(),
    signature,
    message.chainId,
  )
}

const ALPHANUMERIC =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/**
 * This method leverages a native CSPRNG with support for both browser and Node.js
 * environments in order generate a cryptographically secure nonce for use in the
 * SiweMessage in order to prevent replay attacks.
 *
 * 96 bits has been chosen as a number to sufficiently balance size and security considerations
 * relative to the lifespan of it's usage.
 *
 * @returns cryptographically generated random nonce with 96 bits of entropy encoded with
 * an alphanumeric character set.
 */
export const generateNonce = (): string => {
  // 96 bits of entropy with alphanumeric charset (62 chars, ~5.95 bits/char)
  // requires ceil(96 / log2(62)) = 17 characters
  const LENGTH = 17
  const bytes = new Uint8Array(LENGTH)
  crypto.getRandomValues(bytes)
  let nonce = ''
  for (let i = 0; i < LENGTH; i++) {
    nonce += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length]
  }
  if (!nonce || nonce.length < 8) {
    throw new Error('Error during nonce creation.')
  }
  return nonce
}

export { isValidISO8601Date }

/**
 * Thrown by adapter chain-ID validation so the caller can match
 * on type instead of fragile string checks.
 */
export class ChainIdMismatchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChainIdMismatchError'
  }
}

export const checkInvalidKeys = <T>(obj: T, keys: (keyof T)[]): (keyof T)[] => {
  const invalidKeys: (keyof T)[] = []
  Object.keys(obj).forEach((key) => {
    if (!keys.includes(key as keyof T)) {
      invalidKeys.push(key as keyof T)
    }
  })
  return invalidKeys
}
