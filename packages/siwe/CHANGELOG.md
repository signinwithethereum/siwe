# @signinwithethereum/siwe

## 4.0.2

### Patch Changes

- [`abe85a2`](https://github.com/signinwithethereum/siwe/commit/abe85a2e515f7b2b325323a4e6589feda1c73c0e) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Remove hard ethers dependency (dynamically check ethers installation to mirror viem detection)

## 4.0.1

### Patch Changes

- [`a0d0277`](https://github.com/signinwithethereum/siwe/commit/a0d027736a7149555d8fb12242394af2e66ab983) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Add readme

- Updated dependencies [[`a0d0277`](https://github.com/signinwithethereum/siwe/commit/a0d027736a7149555d8fb12242394af2e66ab983)]:
  - @signinwithethereum/siwe-parser@4.0.1

## 4.0.0

### Major Changes

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - ERC-4361 compliance hardening: `domain` and `nonce` are now required in `VerifyParams`, new `strict` mode in `VerifyOpts` that additionally requires `uri` and `chainId` for full contextual binding. Added new error types: `URI_MISMATCH`, `CHAIN_ID_MISMATCH`, `REQUEST_ID_MISMATCH`, `INVALID_SIGNATURE_CHAIN_ID`, `MISSING_DOMAIN`, `MISSING_NONCE`, `MISSING_URI`, `MISSING_CHAIN_ID`

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Add provider-agnostic verification architecture: new `SiweConfig` interface, `configure()` / `getGlobalConfig()` global config API, `createEthersConfig()` adapter for ethers v5/v6, and `createViemConfig()` adapter for viem — decoupling signature verification from any specific Ethereum library

### Minor Changes

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Ship dual ESM/CJS builds via Vite with proper `exports` map — packages are now `"type": "module"` with `.mjs` and `.cjs` entry points

- [`03b3069`](https://github.com/signinwithethereum/siwe/commit/03b3069516d79263f5549d265f347aa0fad3b4f7) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Updrage libraries (typescript, eslint, typedoc, vite, vitest, ...). Replace `@stablelib/random` with `crypto.getRandomValues()` to eliminate Node.js dependency for nonce generation.

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Add `viem` as an optional peer dependency alongside `ethers` — either library can now be used for signature verification via `createViemConfig()` or `createEthersConfig()`

### Patch Changes

- [`10bb2f1`](https://github.com/signinwithethereum/siwe/commit/10bb2f1fbdc59f985a3bf6179b8a15f2508ed314) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Fixes for open issues on the upstream spruceid/siwe repository:

  **Verification & validation bugs:**
  - **spruceid/siwe#216**: Multisig wallet signatures fail with `invalid raw signature length` — fixed by catching malformed signature errors and falling through to EIP-1271 contract wallet verification without logging

  **Ethers v5/v6 compatibility:**
  - **spruceid/siwe#214**: Ethers v5 types shipped while v6 installed — fixed with runtime auto-detection, no compile-time coupling to either version

  **Bundler & environment compatibility:**
  - **spruceid/siwe#136**: Drop native node `Buffer` API dependency — fixed; no `Buffer` usage anywhere in source code
  - **spruceid/siwe#150**: `@stablelib/random` introduces node dependencies (`crypto`, `buffer`) — fixed by replacing with native `crypto.getRandomValues()` for nonce generation
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

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Fix domain validation in SiweMessage constructor, fix signature verification flow, add EIP-1271 chain ID validation to prevent cross-chain replay, and stop logging errors internally (let consumers handle them)

- Updated dependencies [[`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0), [`03b3069`](https://github.com/signinwithethereum/siwe/commit/03b3069516d79263f5549d265f347aa0fad3b4f7), [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0), [`10bb2f1`](https://github.com/signinwithethereum/siwe/commit/10bb2f1fbdc59f985a3bf6179b8a15f2508ed314)]:
  - @signinwithethereum/siwe-parser@4.0.0
