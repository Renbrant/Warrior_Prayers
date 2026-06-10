---
name: Orval schema naming collision + workspace index fix
description: Orval auto-generates workspace index.ts re-exporting ./generated/types even without schemas config; must patch post-codegen. Also: schema name collision rules.
---

## Orval workspace index fix (CRITICAL)
Orval always regenerates `lib/api-zod/src/index.ts` with both `export * from './generated/api'` and `export * from './generated/types'`, even when `schemas` output is removed from `orval.config.ts`. Without `schemas`, `./generated/types` doesn't exist — causing TS2307 on every typecheck.

**Fix:** `lib/api-spec/fix-zod-index.mjs` strips the `./generated/types` line from `lib/api-zod/src/index.ts` after every codegen run. Wired into codegen script in `lib/api-spec/package.json`:
```
"codegen": "orval --config ./orval.config.ts && node ./fix-zod-index.mjs && pnpm -w run typecheck:libs"
```

**Never remove `fix-zod-index.mjs`** — every codegen run will re-break the index otherwise.

## Schema naming collision rule
Orval generates Zod schema consts named `{operationId}Body` (e.g. `createGroup` → `CreateGroupBody`) AND TypeScript types in `types/` with the same name. When an OpenAPI `components/schemas` entry shares that name, TS2308 results.

**How to apply:** Name OpenAPI component schemas with domain-focused names that won't match operationId-derived names:
- ❌ `CreateGroupBody` → clashes with `createGroup` operationId
- ✅ `GroupInput` → safe

## React Query hook queryKey requirement
All generated query hooks require `queryKey` explicitly — it is NOT optional at TypeScript level even though it has a runtime default. Always pass:
```ts
useGetGroup(groupId!, { query: { queryKey: getGetGroupQueryKey(groupId!), enabled: !!groupId } })
```
