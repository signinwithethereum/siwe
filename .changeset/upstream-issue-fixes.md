---
'@signinwithethereum/siwe': patch
'@signinwithethereum/siwe-parser': patch
---

Fixes for issues reported on the upstream spruceid/siwe repository:

**Verification & validation bugs:**

- **spruceid/siwe#202**: `invalidOpts` check was using the wrong array (`invalidParams.length` instead of `invalidOpts.length`) — fixed with correct length check in verification options validation
- **spruceid/siwe#210**: Nonce verification bug where missing `.length` check allowed empty nonces — fixed with truthiness check on construction and exact string comparison on verification
- **spruceid/siwe#211**: `issuedAt` should be required per ERC-4361 — fixed with constructor validation ensuring `issuedAt` is always present
- **spruceid/siwe#216**: Multisig wallet signatures fail with `invalid raw signature length` — fixed by catching malformed signature errors and falling through to EIP-1271 contract wallet verification without logging

**Ethers v5/v6 compatibility:**

- **spruceid/siwe#81**: Support ethers v6 upgrade path — fixed with both v5 and v6 supported via auto-detection
- **spruceid/siwe#187**: `ethers.providers` export doesn't exist in v6 — fixed with try/catch handling for v5 `ethers.utils.*` vs v6 `ethers.*` API
- **spruceid/siwe#205**: Couldn't use library with both ethers v5 and v6 — fixed with runtime auto-detection in `ethersCompat.ts`
- **spruceid/siwe#214**: Ethers v5 types shipped while v6 installed — fixed with runtime auto-detection, no compile-time coupling to either version
- **spruceid/siwe#156**: `verifyMessage` is undefined — fixed with config resolution and clear error messages when ethers isn't installed

**Bundler & environment compatibility:**

- **spruceid/siwe#106**: Drop keccak library that uses `Buffer` — fixed by using `@noble/hashes` instead
- **spruceid/siwe#136**: Drop native node `Buffer` API dependency — fixed; no `Buffer` usage anywhere in source code
- **spruceid/siwe#150**: `@stablelib/random` introduces node dependencies (`crypto`, `buffer`) — fixed by replacing with native `crypto.getRandomValues()` for nonce generation
- **spruceid/siwe#165**: `Buffer.decode` undefined in React Native — fixed by eliminating all `Buffer` usage in favor of `@noble/hashes`
- **spruceid/siwe#167**: Can't resolve `net` error with `SiweMessage` — fixed; ethers is an optional peer dependency, no hard import at the top level
- **spruceid/siwe#189**: Module parse failed with `import`/`export` in Next.js — fixed with dual ESM/CJS builds and proper `exports` map in package.json
- **spruceid/siwe#176**: `isEIP55Address` not a function due to parser version mismatch — fixed with `workspace:^` dependency linking ensuring matching versions

**Architecture & extensibility:**

- **spruceid/siwe#151**: Move ethers from peerDependency to dependency — resolved differently: both ethers and viem are optional peer dependencies; the library works with any crypto backend via the `SiweConfig` interface
- **spruceid/siwe#172**: `console.error` on invalid signature breaks custom logging flows — fixed; zero `console.error`/`log`/`warn` calls in source
- **spruceid/siwe#173**: Viem support — fixed with full `viemAdapter.ts` providing `createViemConfig()` with EIP-1271 and EIP-6492 support
- **spruceid/siwe#180**: Allow simpler configuration via plain RPC URL — fixed with `createConfig(rpcUrl)` that auto-detects viem or ethers

**Smart contract wallet support:**

- **spruceid/siwe#148**: SIWE doesn't work with ERC-4337 (pre-deployed contracts) — fixed with EIP-6492 support. Viem adapter uses `publicClient.verifyMessage` for native support; ethers adapter uses the UniversalSigValidator bytecode via `eth_call`
- **spruceid/siwe#185**: `siwe-parser` crashes on iOS 14 due to `Array.prototype` pollution from polyfills — fixed by using `Object.create(null)` for parser callbacks to prevent prototype pollution breaking `for...in` iteration in apg-js
