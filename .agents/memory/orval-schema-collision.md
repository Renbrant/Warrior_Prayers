---
name: Orval schema naming collision
description: Orval auto-generates Zod const names from operationIds — OpenAPI component schemas must not share those same names.
---

Orval generates Zod schema consts in `api.ts` named `{operationId}Body` (e.g. `createGroup` → `CreateGroupBody`) AND TypeScript types in `types/` with the same name. When an OpenAPI `components/schemas` entry has the exact same name (e.g. `CreateGroupBody`), both exports clash and TypeScript raises TS2308.

**Why:** Orval uses two output files — `api.ts` for Zod consts (one per operation) and `types/` for schema types (one per component schema). Both re-export from `index.ts`, causing duplicate identifiers.

**How to apply:** Name OpenAPI component schemas with domain-focused names that won't match operationId-derived names. For example:
- ❌ `CreateGroupBody` (clashes with `createGroup` operationId → `CreateGroupBody`)
- ✅ `GroupInput` (no operationId generates this name)
- ❌ `UpdateGroupBody` (clashes with `updateGroup` → `UpdateGroupBody`)
- ✅ `GroupSettingsInput`

Before adding new schemas, check if any operationId in the spec matches `{newSchemaName}` without the suffix, which would cause a collision.
