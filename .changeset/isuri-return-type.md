---
'@signinwithethereum/siwe-parser': patch
---

Type `isUri` as returning `boolean` instead of `any`

The return type was inferred as `any` because the result flows through the untyped `apg-js` parser. The parser's `parse()` always sets `success` to a literal `true` or `false`, so the declaration now states `boolean` explicitly. No runtime changes.
