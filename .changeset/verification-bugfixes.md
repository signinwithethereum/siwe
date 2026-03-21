---
'@signinwithethereum/siwe': patch
---

Fix domain validation in SiweMessage constructor, fix signature verification flow, add EIP-1271 chain ID validation to prevent cross-chain replay, and stop logging errors internally (let consumers handle them)
