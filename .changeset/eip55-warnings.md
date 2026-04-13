---
'@signinwithethereum/siwe': minor
'@signinwithethereum/siwe-parser': minor
---

Accept unchecksummed addresses with a warning; verify signatures regardless of address case

**Parsing no longer rejects all-lowercase or all-uppercase addresses.** Previously, any address that wasn't properly EIP-55 checksummed produced a parse error. Now only *mixed-case* addresses with an incorrect checksum fail — all-lowercase and all-uppercase addresses parse successfully and surface a non-fatal warning on the new `warnings: string[]` field of `ParsedMessage` and `SiweMessage`. Applications that want strict behavior can check `message.warnings.length === 0` after construction.

**Verification is case-insensitive for EOA signature recovery.** The recovered address (always EIP-55) is compared to the message address without regard to case, so messages carrying a lowercase or uppercase address verify correctly against a wallet signature.

**Object-constructed messages are normalized to EIP-55.** `new SiweMessage({ address: '0xabc...' })` stores the checksummed form so the emitted message — and the bytes presented to the signer — are spec-compliant. A warning is still recorded when the input needed normalization. Mixed-case inputs with an incorrect checksum throw. Messages constructed from a raw string preserve the address verbatim so signature re-construction matches what the wallet signed.

**New exports from `@signinwithethereum/siwe-parser`:**

- `classifyAddressCase(address)` — returns `'valid-checksum' | 'unchecksummed' | 'invalid-checksum'`
- `toChecksumAddress(address)` — canonical EIP-55 encoder (accepts any-case input)
- `AddressCaseStatus` type

**Error message reworded** — mixed-case addresses with a bad checksum now report `invalid EIP-55 address checksum` (was `invalid EIP-55 address`).
