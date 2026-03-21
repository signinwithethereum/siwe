# @signinwithethereum/siwe

## 4.0.0

### Major Changes

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - ERC-4361 compliance hardening: `domain` and `nonce` are now required in `VerifyParams`, new `strict` mode in `VerifyOpts` that additionally requires `uri` and `chainId` for full contextual binding. Added new error types: `URI_MISMATCH`, `CHAIN_ID_MISMATCH`, `REQUEST_ID_MISMATCH`, `INVALID_SIGNATURE_CHAIN_ID`, `MISSING_DOMAIN`, `MISSING_NONCE`, `MISSING_URI`, `MISSING_CHAIN_ID`

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Add provider-agnostic verification architecture: new `SiweConfig` interface, `configure()` / `getGlobalConfig()` global config API, `createEthersConfig()` adapter for ethers v5/v6, and `createViemConfig()` adapter for viem — decoupling signature verification from any specific Ethereum library

### Minor Changes

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Ship dual ESM/CJS builds via Vite with proper `exports` map — packages are now `"type": "module"` with `.mjs` and `.cjs` entry points

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Add `viem` as an optional peer dependency alongside `ethers` — either library can now be used for signature verification via `createViemConfig()` or `createEthersConfig()`

### Patch Changes

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Fix domain validation in SiweMessage constructor, fix signature verification flow, add EIP-1271 chain ID validation to prevent cross-chain replay, and stop logging errors internally (let consumers handle them)

- Updated dependencies [[`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0), [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0)]:
  - @signinwithethereum/siwe-parser@4.0.0
