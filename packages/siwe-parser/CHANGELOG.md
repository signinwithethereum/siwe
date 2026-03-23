# @signinwithethereum/siwe-parser

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
