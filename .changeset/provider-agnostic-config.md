---
'@signinwithethereum/siwe': major
---

Add provider-agnostic verification architecture: new `SiweConfig` interface, `configure()` / `getGlobalConfig()` global config API, `createEthersConfig()` adapter for ethers v5/v6, and `createViemConfig()` adapter for viem — decoupling signature verification from any specific Ethereum library
