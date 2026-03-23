# @signinwithethereum/siwe-parser

A parser for [EIP-4361: Sign in with Ethereum](https://eips.ethereum.org/EIPS/eip-4361) messages, using an ABNF grammar for strict specification compliance.

## Installation

```bash
npm install @signinwithethereum/siwe-parser
```

## Usage

### Parsing a SIWE message

```typescript
import { ParsedMessage } from '@signinwithethereum/siwe-parser'

const message = new ParsedMessage(rawMessage)

console.log(message.domain)
console.log(message.address)
console.log(message.uri)
console.log(message.version)
console.log(message.chainId)
console.log(message.nonce)
console.log(message.issuedAt)
```

The constructor throws if the message does not conform to EIP-4361.

### Validating a URI

```typescript
import { isUri } from '@signinwithethereum/siwe-parser'

isUri('https://example.com') // true
```

### Utilities

```typescript
import {
  isEIP55Address,
  isValidISO8601Date,
} from '@signinwithethereum/siwe-parser'

isEIP55Address('0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B') // true
isValidISO8601Date('2024-01-01T00:00:00Z') // true
```

## Parsed Fields

| Field            | Type       | Required |
| ---------------- | ---------- | -------- |
| `domain`         | `string`   | Yes      |
| `address`        | `string`   | Yes      |
| `uri`            | `string`   | Yes      |
| `version`        | `string`   | Yes      |
| `chainId`        | `number`   | Yes      |
| `nonce`          | `string`   | Yes      |
| `issuedAt`       | `string`   | Yes      |
| `scheme`         | `string`   | No       |
| `statement`      | `string`   | No       |
| `expirationTime` | `string`   | No       |
| `notBefore`      | `string`   | No       |
| `requestId`      | `string`   | No       |
| `resources`      | `string[]` | No       |

## Related

For full SIWE message creation, signing, and verification (including ERC-1271 and EIP-6492 support), use [`@signinwithethereum/siwe`](https://www.npmjs.com/package/@signinwithethereum/siwe) which includes this parser.

## Disclaimer

Our TypeScript library for Sign In with Ethereum has not yet undergone a formal security
audit. We welcome continued feedback on the usability, architecture, and security
of this implementation.
