# @signinwithethereum/siwe

TypeScript implementation of [Sign in with Ethereum](https://eips.ethereum.org/EIPS/eip-4361) (EIP-4361). Create, parse, and verify SIWE messages with support for EOA, ERC-1271 (smart contract wallets), and EIP-6492 (pre-deployed wallets).

Works with **viem** or **ethers** (v5/v6).

## Why this package?

Smart account verification is tricky to get right. This package handles ERC-1271 (smart contract wallets) and EIP-6492 (pre-deployed wallets) automatically alongside standard EOA recovery, so `verify()` works for every type of Ethereum account without extra code: EOAs, multisigs, and smart wallets.

## Install

```bash
npm install @signinwithethereum/siwe
```

Install a peer dependency (at least one required):

```bash
npm install viem    # recommended
# or
npm install ethers  # v5 or v6
```

## Quick Start

```ts
import { SiweMessage, configure, createConfig } from '@signinwithethereum/siwe'

// One-time setup — auto-detects viem or ethers
configure(await createConfig('https://eth.llamarpc.com'))

// Create a message
const message = new SiweMessage({
  domain: 'example.com',
  address: '0x...',
  statement: 'Sign in to Example',
  uri: 'https://example.com',
  version: '1',
  chainId: 1,
  nonce: 'abc12345defg78901',
  issuedAt: new Date().toISOString(),
})

// Get the EIP-4361 string to sign
const messageString = message.prepareMessage()

// Verify a signature (after signing on the client)
const { success, data, error } = await message.verify(
  { signature, domain: 'example.com', nonce: message.nonce },
  { suppressExceptions: true },
)
```

## Configuration

You must configure a verification backend before calling `verify()`. There are three approaches:

### `createConfig(rpcUrl)` — auto-detect

Detects whether viem or ethers is installed and creates the appropriate config with full EIP-1271 support.

```ts
import { configure, createConfig } from '@signinwithethereum/siwe'

configure(await createConfig('https://eth.llamarpc.com'))
```

### `createViemConfig(opts)` — viem

```ts
import { configure, createViemConfig } from '@signinwithethereum/siwe'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({ chain: mainnet, transport: http() })
configure(await createViemConfig({ publicClient }))
```

### `createEthersConfig(provider)` — ethers

```ts
import { configure, createEthersConfig } from '@signinwithethereum/siwe'
import { ethers } from 'ethers'

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com')
configure(createEthersConfig(provider))
```

### Per-call config

Instead of setting a global config, you can pass `config` in verify options:

```ts
const config = await createViemConfig({ publicClient })
await message.verify({ signature, domain, nonce }, { config })
```

## API

### `SiweMessage`

Create from an object or parse from an EIP-4361 string:

```ts
// From object
const msg = new SiweMessage({ domain, address, uri, version, chainId, nonce, issuedAt })

// From EIP-4361 string
const msg = new SiweMessage(rawMessageString)
```

**Fields:** `domain`, `address`, `uri`, `version`, `chainId`, `nonce`, `issuedAt` (required) and `scheme`, `statement`, `expirationTime`, `notBefore`, `requestId`, `resources` (optional).

#### `prepareMessage(): string`

Returns the EIP-4361 formatted message string, ready for EIP-191 signing.

#### `verify(params, opts?): Promise<SiweResponse>`

Verifies a signed message. Returns `{ success, data, error }`.

**`params` (VerifyParams):**

| Field | Required | Description |
|---|---|---|
| `signature` | yes | The wallet signature |
| `domain` | yes | Expected domain (origin binding) |
| `nonce` | yes | Expected nonce (replay protection) |
| `scheme` | no | Expected URI scheme |
| `uri` | no | Expected URI (required in strict mode) |
| `chainId` | no | Expected chain ID (required in strict mode) |
| `requestId` | no | Expected request ID |
| `time` | no | ISO 8601 time to check against (defaults to now) |

**`opts` (VerifyOpts):**

| Field | Description |
|---|---|
| `config` | Per-call `SiweConfig` (overrides global) |
| `suppressExceptions` | Return errors in response instead of throwing (default: `false`) |
| `strict` | Require `uri` and `chainId` in params |
| `verificationFallback` | Custom verification function run alongside EIP-1271 |

### `generateNonce(): string`

Returns a cryptographically secure random nonce (96 bits of entropy, alphanumeric).

```ts
import { generateNonce } from '@signinwithethereum/siwe'

const nonce = generateNonce()
```

### `SiweConfig`

Interface for bringing your own verification backend:

```ts
interface SiweConfig {
  verifyMessage: (message: string, signature: string) => string | Promise<string>
  hashMessage: (message: string) => string
  getAddress: (address: string) => string
  checkContractWalletSignature?: (
    address: string, message: string, signature: string, chainId: number,
  ) => Promise<boolean>
}
```

### EIP-6492 Utilities

```ts
import { isEIP6492Signature, EIP6492_MAGIC_SUFFIX } from '@signinwithethereum/siwe'

if (isEIP6492Signature(sig)) {
  // Signature is from a pre-deployed smart contract wallet
}
```

### Error Handling

`SiweError` includes `type`, `expected`, and `received` fields. Error types are defined in the `SiweErrorType` enum covering domain/nonce/signature mismatches, expiration, and parsing failures.

## Related

The ABNF parser is available as a standalone package at [`@signinwithethereum/siwe-parser`](https://www.npmjs.com/package/@signinwithethereum/siwe-parser) for projects that only need message parsing without verification.

## License

Apache-2.0
