---
name: Drizzle params typing
description: Express req.params values are typed as string | string[] but Drizzle eq() requires string — must cast.
---

TypeScript types `req.params` as `ParamsDictionary` where values are `string | string[]`. Drizzle's `eq()` only accepts `string | SQLWrapper`, so passing a raw `req.params.id` causes TS2769.

**Why:** Express types are permissive for query param arrays. Drizzle is strict.

**How to apply:** Always extract and cast route params at the top of the handler:
```typescript
const groupId = String(req.params.groupId);
const memberId = String(req.params.memberId);
const token = String(req.params.token);
```

This is safe because Express route params are always strings at runtime — the type is just overly permissive.
