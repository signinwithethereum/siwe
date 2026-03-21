---
'@signinwithethereum/siwe': major
---

ERC-4361 compliance hardening: `domain` and `nonce` are now required in `VerifyParams`, new `strict` mode in `VerifyOpts` that additionally requires `uri` and `chainId` for full contextual binding. Added new error types: `URI_MISMATCH`, `CHAIN_ID_MISMATCH`, `REQUEST_ID_MISMATCH`, `INVALID_SIGNATURE_CHAIN_ID`, `MISSING_DOMAIN`, `MISSING_NONCE`, `MISSING_URI`, `MISSING_CHAIN_ID`
