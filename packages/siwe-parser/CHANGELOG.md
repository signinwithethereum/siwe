# @signinwithethereum/siwe-parser

## 4.2.0

### Minor Changes

- [`66f5176`](https://github.com/signinwithethereum/siwe/commit/66f51766ad0a2404797fc5031af061c5708c7829) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Accept unchecksummed addresses with a warning; verify signatures regardless of address case

  **Parsing no longer rejects all-lowercase or all-uppercase addresses.** Previously, any address that wasn't properly EIP-55 checksummed produced a parse error. Now only _mixed-case_ addresses with an incorrect checksum fail — all-lowercase and all-uppercase addresses parse successfully and surface a non-fatal warning on the new `warnings: string[]` field of `ParsedMessage` and `SiweMessage`. Applications that want strict behavior can check `message.warnings.length === 0` after construction.

  **Verification is case-insensitive for EOA signature recovery.** The recovered address (always EIP-55) is compared to the message address without regard to case, so messages carrying a lowercase or uppercase address verify correctly against a wallet signature.

  **Object-constructed messages are normalized to EIP-55.** `new SiweMessage({ address: '0xabc...' })` stores the checksummed form so the emitted message — and the bytes presented to the signer — are spec-compliant. A warning is still recorded when the input needed normalization. Mixed-case inputs with an incorrect checksum throw. Messages constructed from a raw string preserve the address verbatim so signature re-construction matches what the wallet signed.

  **New exports from `@signinwithethereum/siwe-parser`:**
  - `classifyAddressCase(address)` — returns `'valid-checksum' | 'unchecksummed' | 'invalid-checksum'`
  - `toChecksumAddress(address)` — canonical EIP-55 encoder (accepts any-case input)
  - `AddressCaseStatus` type

  **Error message reworded** — mixed-case addresses with a bad checksum now report `invalid EIP-55 address checksum` (was `invalid EIP-55 address`).

## 4.1.0

### Minor Changes

- [`f537bdb`](https://github.com/signinwithethereum/siwe/commit/f537bdb290effcfc2206a963009db4ebc911ea3c) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Harden and unify error handling across the library

  **`SiweError` now extends `Error`** — Provides stack traces, works with `instanceof Error`, and integrates with error reporting tools (Sentry, etc.). The `type`, `expected`, and `received` fields are now `readonly`.

  **`SiweError.type` narrowed from `SiweErrorType | string` to `SiweErrorType`** — Enables exhaustive `switch`/`case` on error types without a default fallback.

  **`SiweResponse.error` narrowed from `SiweError | Error` to `SiweError`** — No more type narrowing needed when handling verification results.

  **`verify()` now throws `SiweError` directly** when `suppressExceptions` is `false` (the default). Previously it threw the entire `SiweResponse` object. Update catch blocks:

  ```ts
  // Before (v4.0):
  try {
    await msg.verify(params)
  } catch (e) {
    console.log(e.error.type)
  } // e was SiweResponse

  // After (v4.1):
  try {
    await msg.verify(params)
  } catch (e) {
    if (e instanceof SiweError) {
      console.log(e.type) // e is SiweError directly
    }
  }
  ```

  **All error paths now throw `SiweError`** — Configuration errors (`createConfig`, `createEthersConfig`, `createViemConfig`), nonce generation, invalid verify params, and message preparation failures all throw typed `SiweError` instances instead of bare `Error`.

  **New `SiweErrorType` entries:**
  - `MISSING_CONFIG` — no verification config found
  - `MISSING_PROVIDER_LIBRARY` — required provider library (viem/ethers) not installed
  - `NONCE_GENERATION_FAILED` — nonce creation failed
  - `INVALID_PARAMS` — invalid keys passed to `verify()`
  - `MALFORMED_MESSAGE` — message could not be prepared for signing

  **`SiweParseError`** — New structured error class in `@signinwithethereum/siwe-parser` (and re-exported from `@signinwithethereum/siwe`) for parse failures, with an `errors: string[]` field containing individual validation errors.

## 4.0.2

### Patch Changes

- [`8c80434`](https://github.com/signinwithethereum/siwe/commit/8c8043498becdc37bfa46ae0160fa9e9ef753c2e) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Fix esm issue: include apg-js.

## 4.0.1

### Patch Changes

- [`a0d0277`](https://github.com/signinwithethereum/siwe/commit/a0d027736a7149555d8fb12242394af2e66ab983) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Add readme

## 4.0.0

### Major Changes

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Ship dual ESM/CJS builds via Vite with proper `exports` map — packages are now `"type": "module"` with `.mjs` and `.cjs` entry points

### Minor Changes

- [`03b3069`](https://github.com/signinwithethereum/siwe/commit/03b3069516d79263f5549d265f347aa0fad3b4f7) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Updrage libraries (typescript, eslint, typedoc, vite, vitest, ...). Replace `@stablelib/random` with `crypto.getRandomValues()` to eliminate Node.js dependency for nonce generation.

### Patch Changes

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Refactor parser internals: inline ABNF module into parsers.ts, consolidate duplicated `isValidISO8601Date` into utils.ts and re-export it, fix ISO-8601 regex (escape dot in fractional seconds, fix sign character class)

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
