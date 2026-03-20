/** EIP-1271 magic value returned by isValidSignature for valid signatures */
export const EIP1271_MAGICVALUE = '0x1626ba7e';

/**
 * Provider-agnostic configuration for SIWE verification.
 * Implement this interface to use any Ethereum library (ethers, viem, etc.).
 */
export interface SiweConfig {
  /** Recover the signer address from an EIP-191 signed message */
  verifyMessage: (
    message: string,
    signature: string
  ) => string | Promise<string>;

  /** Hash a message per EIP-191 personal_sign */
  hashMessage: (message: string) => string;

  /** Normalize an address to EIP-55 checksum format */
  getAddress: (address: string) => string;

  /**
   * Check EIP-1271 smart contract wallet signature.
   * Optional — required only for contract wallet support.
   * @param address - The wallet contract address
   * @param message - The raw message string (adapter should hash it)
   * @param signature - The signature bytes
   */
  checkContractWalletSignature?: (
    address: string,
    message: string,
    signature: string
  ) => Promise<boolean>;
}

let globalConfig: SiweConfig | null = null;

/**
 * Set the global SIWE verification config.
 * Used as the default when no config is passed to verify().
 *
 * @example
 * ```ts
 * // With ethers
 * import { configure, createEthersConfig } from '@signinwithethereum/ts';
 * configure(createEthersConfig(provider));
 *
 * // With viem
 * import { configure, createViemConfig } from '@signinwithethereum/ts';
 * configure(await createViemConfig({ publicClient }));
 * ```
 */
export function configure(config: SiweConfig): void {
  globalConfig = config;
}

/** Get the current global config, or null if not set. */
export function getGlobalConfig(): SiweConfig | null {
  return globalConfig;
}
