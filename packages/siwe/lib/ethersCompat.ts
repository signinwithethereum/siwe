import { ethers } from 'ethers';
import type { SiweConfig } from './config';

type Ethers6BigNumberish = string | number | bigint;

// NB: This compatibility type omits the `Signature` class defined in ethers v6;
// however, a `Signature` instance is compatible with the object type defined.
type Ethers6SignatureLike =
  | string
  | {
      r: string;
      s: string;
      v: Ethers6BigNumberish;
      yParity?: 0 | 1;
      yParityAndS?: string;
    }
  | {
      r: string;
      yParityAndS: string;
      yParity?: 0 | 1;
      s?: string;
      v?: number;
    }
  | {
      r: string;
      s: string;
      yParity: 0 | 1;
      v?: Ethers6BigNumberish;
      yParityAndS?: string;
    };

const EIP1271_ABI = [
  'function isValidSignature(bytes32 _message, bytes _signature) public view returns (bytes4)',
];
const EIP1271_MAGICVALUE = '0x1626ba7e';

let ethersVerifyMessage = null;
let ethersHashMessage = null;
let ethersGetAddress = null;

try {
  // @ts-expect-error -- v6 compatibility hack
  ethersVerifyMessage = ethers.utils.verifyMessage;
  // @ts-expect-error -- v6 compatibility hack
  ethersHashMessage = ethers.utils.hashMessage;
  // @ts-expect-error -- v6 compatibility hack
  ethersGetAddress = ethers.utils.getAddress;
} catch {
  ethersVerifyMessage = ethers.verifyMessage as (
    message: Uint8Array | string,
    sig: Ethers6SignatureLike
  ) => string;

  ethersHashMessage = ethers.hashMessage as (
    message: Uint8Array | string
  ) => string;

  ethersGetAddress = ethers.getAddress as (address: string) => string;
}

// @ts-expect-error -- v6 compatibility hack
type ProviderV5 = ethers.providers.Provider;
type ProviderV6 = ethers.Provider;

/** @deprecated Use SiweConfig instead */
export type Provider = ProviderV6 extends undefined ? ProviderV5 : ProviderV6;
export const verifyMessage = ethersVerifyMessage;
export const hashMessage = ethersHashMessage;
export const getAddress = ethersGetAddress;

const EthersContract = ethers.Contract;

/**
 * Create a SiweConfig using ethers.js (v5 or v6).
 * Auto-detects the installed ethers version.
 *
 * @param provider - ethers Provider for EIP-1271 contract wallet verification (optional)
 *
 * @example
 * ```ts
 * import { createEthersConfig, configure } from '@signinwithethereum/ts';
 * import { ethers } from 'ethers';
 *
 * const provider = new ethers.JsonRpcProvider('https://...');
 * configure(createEthersConfig(provider));
 * ```
 */
export function createEthersConfig(provider?: any): SiweConfig {
  if (!ethersVerifyMessage) {
    throw new Error(
      'ethers is required for createEthersConfig. Install it with: npm install ethers'
    );
  }

  const config: SiweConfig = {
    verifyMessage: (message: string, signature: string) => {
      return ethersVerifyMessage(message, signature);
    },
    hashMessage: (message: string) => {
      return ethersHashMessage(message);
    },
    getAddress: (address: string) => {
      return ethersGetAddress(address);
    },
  };

  if (provider && EthersContract) {
    config.checkContractWalletSignature = async (
      address: string,
      message: string,
      signature: string
    ) => {
      const walletContract = new EthersContract(
        address,
        EIP1271_ABI,
        provider
      );
      const hashedMessage = ethersHashMessage(message);
      const res = await walletContract.isValidSignature(
        hashedMessage,
        signature
      );
      return res === EIP1271_MAGICVALUE;
    };
  }

  return config;
}

/**
 * Try to create an ethers-based SiweConfig automatically.
 * Returns null if ethers is not available.
 */
export function tryAutoDetectEthers(provider?: any): SiweConfig | null {
  if (!ethersVerifyMessage) return null;
  return createEthersConfig(provider);
}
