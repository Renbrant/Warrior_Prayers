---
name: Warrior Prayers Architecture
description: Key architectural decisions and wiring details for the Warrior Prayers app
---

## Auth
- Clerk provisioned via Replit-managed tenant (setupClerkWhitelabelAuth)
- Frontend uses `publishableKeyFromHost` from `@clerk/react/internal`
- `VITE_CLERK_PROXY_URL` is unconditional (no NODE_ENV gate)
- Backend uses `clerkMiddleware` from `@clerk/express` + `clerkProxyMiddleware` at CLERK_PROXY_PATH
- User sync happens via `syncUserFromClerk` middleware on every authenticated route

## Database (Drizzle + PostgreSQL)
- 13 tables defined in `lib/db/src/schema/index.ts`
- Sensitive fields stored encrypted (suffix `_encrypted`): description, prayer_person_name, comment, update_text, answered_testimony, closed_note
- DB package has composite TS references — must run `pnpm -w run typecheck:libs` (tsc --build) after schema changes before api-server typecheck will pass

## API
- OpenAPI spec in `lib/api-spec/openapi.yaml`, codegen via Orval
- Generated hooks: useGetMe, useUpdateMe, useUpdateLanguage, useGetDashboardSummary
- Generated Zod schemas: GetMeResponse, UpdateMeBody, UpdateLanguageBody, DashboardSummary
- Routes: GET/PATCH /api/users/me, PATCH /api/users/me/language, GET /api/dashboard/summary

## Frontend
- Dark-only theme (no mode toggle), charcoal + warm orange (#e07b2a)
- i18next + react-i18next, three locales: en, pt, es
- Wouter for routing; base path from `import.meta.env.BASE_URL`
- queryClient lives in `src/lib/queryClient.ts`
- App shell: mobile bottom nav + desktop sidebar at /app/* routes

**Why:** Spec requires private, intimate feel — dark theme enforces this. No light mode to avoid distraction from the prayer focus.
