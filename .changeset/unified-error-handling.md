---
'@signinwithethereum/siwe': minor
'@signinwithethereum/siwe-parser': minor
---

Harden and unify error handling across the library

**`SiweError` now extends `Error`** — Provides stack traces, works with `instanceof Error`, and integrates with error reporting tools (Sentry, etc.). The `type`, `expected`, and `received` fields are now `readonly`.

**`SiweError.type` narrowed from `SiweErrorType | string` to `SiweErrorType`** — Enables exhaustive `switch`/`case` on error types without a default fallback.

**`SiweResponse.error` narrowed from `SiweError | Error` to `SiweError`** — No more type narrowing needed when handling verification results.

**`verify()` now throws `SiweError` directly** when `suppressExceptions` is `false` (the default). Previously it threw the entire `SiweResponse` object. Update catch blocks:

```ts
// Before (v4):
try {
  await msg.verify(params)
} catch (e) {
  console.log(e.error.type)
} // e was SiweResponse

// After (v5):
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
