# @signinwithethereum/siwe-parser

## 4.0.0

### Major Changes

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Ship dual ESM/CJS builds via Vite with proper `exports` map — packages are now `"type": "module"` with `.mjs` and `.cjs` entry points

### Patch Changes

- [`8e37765`](https://github.com/signinwithethereum/siwe/commit/8e3776504ee8fc07b462c49dcb279861a16571b0) Thanks [@jwahdatehagh](https://github.com/jwahdatehagh)! - Refactor parser internals: inline ABNF module into parsers.ts, consolidate duplicated `isValidISO8601Date` into utils.ts and re-export it, fix ISO-8601 regex (escape dot in fractional seconds, fix sign character class)
