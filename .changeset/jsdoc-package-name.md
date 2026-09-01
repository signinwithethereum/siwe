---
'@signinwithethereum/siwe': patch
---

Correct the package name in JSDoc usage examples

The `@example` blocks on `configure` and `createViemConfig` imported from `@signinwithethereum/ts`, which does not exist; they now import from `@signinwithethereum/siwe`. The ethers example on `configure` also gained the missing `await` on `createEthersConfig`. These examples appear in editor hover documentation via the published declarations. No runtime or API changes.
