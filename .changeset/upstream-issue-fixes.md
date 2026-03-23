---
'@signinwithethereum/siwe': patch
---

Fixes for issues reported on the upstream spruceid/siwe repository:

- **spruceid/siwe#202**: `invalidOpts` check was using the wrong array (`invalidParams.length` instead of `invalidOpts.length`) — fixed with correct length check in verification options validation
- **spruceid/siwe#210**: Nonce verification bug where missing `.length` check allowed empty nonces — fixed with truthiness check on construction and exact string comparison on verification
- **spruceid/siwe#211**: `issuedAt` should be required per ERC-4361 — fixed with constructor validation ensuring `issuedAt` is always present
- **spruceid/siwe#205**: Couldn't use library with both ethers v5 and v6 — fixed with runtime auto-detection in `ethersCompat.ts`
- **spruceid/siwe#187**: `ethers.providers` export doesn't exist in v6 — fixed with try/catch handling for v5 `ethers.utils.*` vs v6 `ethers.*` API
- **spruceid/siwe#156**: `verifyMessage` is undefined — fixed with config resolution and clear error messages when ethers isn't installed
- **spruceid/siwe#106**: Drop keccak library that uses `Buffer` — fixed by using `@noble/hashes` instead
- **spruceid/siwe#81**: Support ethers v6 upgrade path — fixed with both v5 and v6 supported via auto-detection
- **spruceid/siwe#165**: `Buffer.decode` undefined in React Native — fixed by eliminating all `Buffer` usage in favor of `@noble/hashes`
