---
'@signinwithethereum/siwe-parser': patch
'@signinwithethereum/siwe': patch
---

Ship `.d.mts` and `.d.cts` declarations so CJS TypeScript consumers resolve types correctly under Node16

Both packages set `"type": "module"` and publish dual `.mjs`/`.cjs` builds, but shipped a single `.d.ts` that both the `import` and `require` export conditions pointed at. Under `moduleResolution: "Node16"`, TypeScript reads that lone declaration as ESM-only, so any consumer emitting `require()` calls failed with TS1479 even though the runtime `require()` of the `.cjs` build worked fine.

Each export condition now points at a declaration whose module format matches the JavaScript it describes. No runtime or API changes.
