---
name: Object Storage Setup
description: How object storage (App Storage) is wired in this project — composite tsconfig quirk, pnpm overrides for Uppy v5, and serving URL pattern.
---

## Setup done
Object storage is fully provisioned and wired. `setupObjectStorage()` was already called — bucket exists.

## Key quirks

**composite: true required**
`lib/object-storage-web/tsconfig.json` must have `"composite": true` for `warrior-prayers` to reference it as a project reference. Without it, TypeScript errors with TS6306.

**Build before typecheck**
After any change to `lib/object-storage-web/src/`, run `pnpm -w run typecheck:libs` to rebuild the `.d.ts` files in `dist/` before running warrior-prayers typecheck. Otherwise TS6305 ("output file has not been built from source file").

**pnpm overrides for Uppy v5**
Uppy v5 peer-requires `react>=19` but project uses 19.1.0. Root `package.json` has:
```json
"pnpm": { "overrides": { "react": "19.1.0", "react-dom": "19.1.0" } }
```
Cannot use `$react` shorthand unless root has react as a direct dep.

**Serving URL pattern**
`objectPath` returned by upload is `/objects/uploads/<uuid>`.
Serving URL = `/api/storage` + objectPath = `/api/storage/objects/uploads/<uuid>`.
Store the full serving URL (`/api/storage${objectPath}`) in the DB so `<img src=...>` works directly.

**Why:**
Storing the full serving path avoids needing to reconstruct URLs on the frontend and works with both new uploads and previously stored external URLs (Clerk avatar URLs still work as-is).
