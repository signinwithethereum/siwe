import { EIP1271_MAGICVALUE } from './config';
import type { SiweConfig } from './config';
import { ChainIdMismatchError } from './utils';

const EIP1271_ABI = [
  {
    inputs: [
      { name: '_message', type: 'bytes32' },
      { name: '_signature', type: 'bytes' },
    ],
    name: 'isValidSignature',
    outputs: [{ name: '', type: 'bytes4' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface ViemConfigOpts {
  /** viem PublicClient for EIP-1271 smart contract wallet verification */
  publicClient?: {
    readContract: (args: any) => Promise<any>;
    chain?: {
      id: number;
    };
  };
}

/**
 * Create a SiweConfig using viem.
 * Requires viem to be installed as a peer dependency.
 *
 * @example
 * ```ts
 * import { createViemConfig, configure } from '@signinwithethereum/ts';
 * import { createPublicClient, http } from 'viem';
 * import { mainnet } from 'viem/chains';
 *
 * const publicClient = createPublicClient({ chain: mainnet, transport: http() });
 * configure(await createViemConfig({ publicClient }));
 * ```
 */
export async function createViemConfig(opts?: ViemConfigOpts): Promise<SiweConfig> {
  let viem: any;
  try {
    viem = await import('viem');
  } catch {
    throw new Error(
      'viem is required for createViemConfig. Install it with: npm install viem'
    );
  }

  const config: SiweConfig = {
    verifyMessage: async (message: string, signature: string) => {
      return viem.recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      });
    },
    hashMessage: (message: string) => {
      return viem.hashMessage(message);
    },
    getAddress: (address: string) => {
      return viem.getAddress(address);
    },
  };

  if (opts?.publicClient) {
    const publicClient = opts.publicClient;
    config.checkContractWalletSignature = async (
      address: string,
      message: string,
      signature: string,
      chainId: number
    ) => {
      const clientChainId = publicClient.chain?.id;
      if (clientChainId == null) {
        throw new ChainIdMismatchError(
          'EIP-1271 verification requires a viem publicClient with chain.id.'
        );
      }
      if (clientChainId !== chainId) {
        throw new ChainIdMismatchError(
          `publicClient chainId ${clientChainId} does not match message chainId ${chainId}.`
        );
      }

      const hashedMessage = viem.hashMessage(message);
      const result = await publicClient.readContract({
        address: address as `0x${string}`,
        abi: EIP1271_ABI,
        functionName: 'isValidSignature',
        args: [
          hashedMessage as `0x${string}`,
          signature as `0x${string}`,
        ],
      });
      return result === EIP1271_MAGICVALUE;
    };
  }

  return config;
}
