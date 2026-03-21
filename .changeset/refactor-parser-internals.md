---
'@signinwithethereum/siwe-parser': patch
---

Refactor parser internals: inline ABNF module into parsers.ts, consolidate duplicated `isValidISO8601Date` into utils.ts and re-export it, fix ISO-8601 regex (escape dot in fractional seconds, fix sign character class)
