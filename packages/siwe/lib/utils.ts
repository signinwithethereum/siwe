import { randomStringForEntropy } from '@stablelib/random';
import { isValidISO8601Date } from '@signinwithethereum/ts-parser';

import type { SiweMessage } from './client';
import type { SiweConfig } from './config';

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
  config?: SiweConfig
): Promise<boolean> => {
  if (!config?.checkContractWalletSignature) {
    return false;
  }

  return config.checkContractWalletSignature(
    message.address,
    message.prepareMessage(),
    signature
  );
};

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
  const nonce = randomStringForEntropy(96);
  if (!nonce || nonce.length < 8) {
    throw new Error('Error during nonce creation.');
  }
  return nonce;
};

export { isValidISO8601Date };

export const checkInvalidKeys = <T>(
  obj: T,
  keys: Array<keyof T>
): Array<keyof T> => {
  const invalidKeys: Array<keyof T> = [];
  Object.keys(obj).forEach(key => {
    if (!keys.includes(key as keyof T)) {
      invalidKeys.push(key as keyof T);
    }
  });
  return invalidKeys;
};
