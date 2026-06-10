# Warrior Prayers — Security Checklist (Phase 6)

Audit date: 2026-06-10
Auditor: automated security review (Phase 6 task)

---

## 1. Route Access Control Audit

Every Express route checked for correct auth middleware.

| Route file | Auth middleware coverage | Notes |
|---|---|---|
| `GET /groups` | `syncUserFromClerk` + `requireAuth` | Lists caller's own groups via membership table — no group param, correct |
| `POST /groups` | `syncUserFromClerk` + `requireAuth` | Creates new group, no existing group access — correct |
| `GET /groups/:groupId` | + `requireGroupMember` | ✅ |
| `PATCH /groups/:groupId` | + `requireGroupMember` + `requireGroupRole("admin")` | ✅ |
| `GET /groups/:groupId/members` | + `requireGroupMember` | ✅ |
| `PATCH /groups/:groupId/members/:memberId` | + `requireGroupMember` + `requireGroupRole("admin")` | ✅ |
| `DELETE /groups/:groupId/members/:memberId` | + `requireGroupMember` + `requireGroupRole("admin")` | ✅ |
| `DELETE /groups/:groupId/members/me` | + `requireGroupMember` | ✅ — self-leave with last-admin guard |
| All prayerRequests routes | + `requireGroupMember` on every route | ✅ |
| Role-gated prayerRequests (delete comment, etc.) | + `requireGroupRole` or inline ownership check | ✅ |
| `GET /groups/:groupId/categories` | + `requireGroupMember` | ✅ |
| `POST /groups/:groupId/categories` | + `requireGroupMember` + `requireGroupRole("admin")` | ✅ |
| `PATCH /groups/:groupId/categories/:id` | + `requireGroupMember` + `requireGroupRole("admin")` | ✅ |
| All prayerSessions routes | + `requireGroupMember` on every route | ✅ |
| Session mark-prayed / mark-skipped | validates `session.groupId = req.groupId` AND `session.userId = req.dbUserId` | ✅ — IDOR prevented |
| `GET /invitations/my` | + `requireAuth` (user-scoped, no group param) | ✅ |
| `GET /invitations/:token` | Public (intentional — preview before login) | ✅ — returns only group name/description, no member data |
| `POST /invitations/:token/accept` | + `requireAuth` | ✅ — validates token status, expiry, maxUses, email match |
| `GET /invitations/:groupId/...` | + `requireGroupMember` + `requireGroupRole("admin")` | ✅ |
| `GET /notifications` | + `requireAuth` (user-scoped) | ✅ |
| All notification mutations | + `requireAuth` + userId scope enforcement | ✅ |
| `GET /users/me`, `PATCH /users/me` | + `requireAuth` | ✅ |

**Result: PASS — no unguarded routes found.**

---

## 2. Encryption Audit

Six sensitive fields confirmed encrypted at rest using AES-256-GCM with random 12-byte IV and auth tag verification.

| Field | Column | Write | Read |
|---|---|---|---|
| Prayer request description | `description_encrypted` | `encryptOrNull()` ✅ | `decryptOrNull()` ✅ |
| Prayer person name | `prayer_person_name_encrypted` | `encrypt()` ✅ | `decryptOrNull()` ✅ |
| Answered testimony | `answered_testimony_encrypted` | `encryptOrNull()` ✅ | `decryptOrNull()` ✅ |
| Closing note | `closed_note_encrypted` | `encryptOrNull()` ✅ | `decryptOrNull()` ✅ |
| Comment text | `comment_encrypted` | `encrypt()` ✅ | `decryptOrNull()` ✅ |
| Update text | `update_text_encrypted` | `encrypt()` ✅ | `decryptOrNull()` ✅ |

- `ENCRYPTION_KEY` read exclusively from `process.env.ENCRYPTION_KEY` — never hardcoded ✅
- Key validated as 64-character hex string (32 bytes) at first use ✅
- Algorithm: AES-256-GCM; IV: 12 random bytes per encrypt call; auth tag: 16 bytes ✅
- `decryptOrNull()` catches decryption errors gracefully — prevents 500 on tampered ciphertext ✅

**Result: PASS — all 6 encrypted fields correctly handled.**

---

## 3. Privacy Leak Audit

### 3a. `hide_prayer_person_names`
Applied in every response that includes `prayerPersonName`:
- `buildRequestSummary()` — line 82: `group.hidePrayerPersonNames ? null : prayerPersonName` ✅
- `buildRequestDetail()` — line 130: same guard ✅
- `prayerSessions.ts` POST start session — line 304: same guard ✅
- `prayerSessions.ts` GET session items — line 633: same guard ✅

### 3b. Anonymous author suppression
`resolveAuthor()` logic (prayerRequests.ts):
```
if (!isAnonymous || isAuthor || (isAdmin && adminsCanViewAnonymousAuthors)) {
  // reveal author
} else {
  return { authorId: null, authorName: null, isAnonymous: true }
}
```
- Regular members cannot see anonymous author name or ID ✅
- Moderators cannot see anonymous authors (only admins with the group setting enabled) ✅
- Authors always see their own request author info ✅
- Prayer Mode session responses do not include `authorId`/`authorName` at all ✅

### 3c. Notification content review
Notifications contain only non-sensitive data:
- Request title (unencrypted by design — visible to all group members) ✅
- Group name ✅
- Member full name (public within the group) ✅
- No encrypted fields (description, testimony, person name) appear in notification messages ✅

**Result: PASS — no privacy leaks found.**

---

## 4. Log Sanitization

- Zero `console.log` / `console.error` / `console.warn` calls in API server source ✅
- All logging uses pino `req.log.error({ err }, "static message")` — only the error object and a static string ✅
- Request body (which may contain prayer content) is never logged ✅
- HTTP request serializer strips query params: `url?.split("?")[0]` ✅
- Response serializer logs only status code ✅

**Result: PASS — no sensitive data in logs.**

---

## 5. XSS / SQL Injection Review

### 5a. XSS
- `dangerouslySetInnerHTML` appears once: `artifacts/warrior-prayers/src/components/ui/chart.tsx:79`
  - Content: `Object.entries(THEMES).map(...)` — injects hardcoded CSS custom-property strings, not user-supplied data ✅
- No other `dangerouslySetInnerHTML` / `__html` usage in the frontend codebase ✅
- React JSX escapes all dynamic content by default ✅

### 5b. SQL Injection
- All queries use Drizzle ORM parameterized query builder ✅
- `sql` tagged template usage: 5 occurrences, all for ORDER BY with Drizzle column references (not user input):
  - `sql\`${prayerUpdatesTable.createdAt} DESC\``
  - `sql\`${prayerRequestsTable.createdAt} DESC\``
  - `sql\`${prayerSessionItemsTable.prayedAt} IS NOT NULL\``
  - These are Drizzle column references that Drizzle safely serializes — not user-controlled strings ✅
- No raw SQL string concatenation with user input found ✅

**Result: PASS — no XSS or injection vectors found.**

---

## 6. Cross-Group Access Verification

`requireGroupMember` middleware (groupAuth.ts):
1. Reads `req.params.groupId` from the URL
2. Queries `group_members` for `(groupId, userId, status = 'active')`
3. Returns 403 if no active membership found
4. Attaches `req.groupId`, `req.memberRole`, `req.memberId` only on success

This means:
- User A (member of group 1) calling `/api/groups/GROUP_2_ID/requests` → 403 ✅
- User A calling `/api/groups/GROUP_2_ID/members` → 403 ✅
- User A calling `/api/groups/GROUP_2_ID/sessions` → 403 ✅

Prayer session IDOR protection: mark-prayed and mark-skipped additionally verify
`session.groupId = req.groupId` AND `session.userId = req.dbUserId` before any update ✅

**Result: PASS — no cross-group data leakage possible.**

---

## 7. Session Management

- Authentication handled entirely by Clerk (JWT) — no custom session tokens ✅
- Clerk middleware validates JWT on every request via `clerkMiddleware` in `app.ts` ✅
- `syncUserFromClerk` reads identity from Clerk session claims, not from request body ✅
- No weak session secrets; session security is delegated to Clerk's infrastructure ✅
- No password hashing in application code — Clerk handles credential storage ✅
- `passwordHash` column in schema exists but is never written to by the application ✅

**Result: PASS — session management is secure.**

---

## 8. Secret / Credential Audit

- `ENCRYPTION_KEY` — Replit environment secret ✅
- `DATABASE_URL` — Replit environment secret ✅
- `CLERK_SECRET_KEY` — Replit environment secret ✅
- `CLERK_PUBLISHABLE_KEY` — Replit environment variable ✅
- No `.env` files in repository ✅
- No hardcoded API keys, tokens, or passwords found anywhere in source ✅

**Result: PASS — all secrets in environment, none hardcoded.**

---

## 9. Build & TypeScript Verification

- `pnpm run typecheck` — all artifacts pass with zero errors ✅
- API server compiles cleanly ✅
- Warrior Prayers frontend compiles cleanly ✅

---

## 10. MVP Acceptance Criteria Verification

All 36 MVP acceptance criteria verified against the implementation:

| # | Criterion | Status |
|---|---|---|
| 1 | User can register and log in via Clerk (email, Google OAuth) | ✅ |
| 2 | User profile with full name, language, church, city | ✅ |
| 3 | Dark theme throughout (charcoal + warm orange #e07b2a) | ✅ |
| 4 | i18n support: English, Portuguese, Spanish | ✅ |
| 5 | Create a prayer group with name, description, verse, settings | ✅ |
| 6 | Invite members by email with expiry and max-uses | ✅ |
| 7 | Accept / decline invitations | ✅ |
| 8 | Admin can remove members and change roles | ✅ |
| 9 | Members can leave a group | ✅ (Phase 5) |
| 10 | Role-based access: admin, moderator, member | ✅ |
| 11 | Group privacy settings: hide names, allow anonymous, admin-view-anon | ✅ |
| 12 | Create prayer requests with title, description, person name, urgency | ✅ |
| 13 | Description and prayer person name encrypted at rest | ✅ |
| 14 | Prayer requests can be anonymous | ✅ |
| 15 | Anonymous authors hidden from non-admin members | ✅ |
| 16 | Hidden prayer person names enforced server-side | ✅ |
| 17 | Categories: admin manages per-group prayer categories | ✅ |
| 18 | Commit to pray on a request | ✅ |
| 19 | Add comments to prayer requests (encrypted) | ✅ |
| 20 | Add updates / testimony to requests (encrypted) | ✅ |
| 21 | Close a request with reason (answered / no longer needed) | ✅ |
| 22 | Archive a request | ✅ |
| 23 | Prayer history / closed request list | ✅ |
| 24 | Prayer Mode: focused session for a group's active requests | ✅ |
| 25 | Prayer Mode: mark as prayed / skip | ✅ |
| 26 | Prayer Mode: session completion with summary | ✅ |
| 27 | In-app notifications: new request, comment, update, invitation | ✅ |
| 28 | Notification unread badge | ✅ |
| 29 | Mark notifications read (single / all) | ✅ |
| 30 | User profile page with connected auth accounts | ✅ |
| 31 | Language change on profile persists | ✅ |
| 32 | Dashboard with group stat summary | ✅ |
| 33 | Responsive design: desktop sidebar + mobile bottom nav | ✅ |
| 34 | Sidebar group shortcuts | ✅ (Phase 5) |
| 35 | Error states with retry on all data-fetching pages | ✅ (Phase 5) |
| 36 | Audit log for admin actions | ✅ |

**Result: All 36 MVP acceptance criteria verified. ✅**

---

## Summary

| Area | Result |
|---|---|
| Route access control | ✅ PASS |
| Encryption at rest | ✅ PASS |
| Privacy enforcement | ✅ PASS |
| Log sanitization | ✅ PASS |
| XSS / SQL injection | ✅ PASS |
| Cross-group access | ✅ PASS |
| Session security | ✅ PASS |
| Hardcoded secrets | ✅ PASS |
| TypeScript build | ✅ PASS |
| MVP criteria (36/36) | ✅ PASS |

**Overall: NO CRITICAL ISSUES FOUND. The application is ready for deployment.**
