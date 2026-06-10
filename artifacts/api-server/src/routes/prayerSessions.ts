import { Router } from "express";
import { db } from "@workspace/db";
import {
  prayerRequestsTable,
  prayerSessionsTable,
  prayerSessionItemsTable,
  prayerCategoriesTable,
  prayerGroupsTable,
  prayerCommitmentsTable,
  prayerUpdatesTable,
  prayerLogsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, inArray, count, sql, desc } from "drizzle-orm";
import { syncUserFromClerk, requireAuth } from "../lib/auth";
import {
  requireGroupMember,
  type GroupAuthRequest,
} from "../lib/groupAuth";
import { decryptOrNull } from "../lib/encryption";

const router = Router();

// ─── helpers ─────────────────────────────────────────────────────────────────

async function getGroupSettings(groupId: string) {
  const [group] = await db
    .select({
      hidePrayerPersonNames: prayerGroupsTable.hidePrayerPersonNames,
      adminsCanViewAnonymousAuthors: prayerGroupsTable.adminsCanViewAnonymousAuthors,
    })
    .from(prayerGroupsTable)
    .where(eq(prayerGroupsTable.id, groupId))
    .limit(1);
  return group ?? null;
}

async function getCommitmentCounts(requestIds: string[], userId: string) {
  if (requestIds.length === 0) return { counts: {}, myCommits: new Set<string>() };

  const [countRows, myRows] = await Promise.all([
    db
      .select({
        prayerRequestId: prayerCommitmentsTable.prayerRequestId,
        total: count(),
      })
      .from(prayerCommitmentsTable)
      .where(inArray(prayerCommitmentsTable.prayerRequestId, requestIds))
      .groupBy(prayerCommitmentsTable.prayerRequestId),
    db
      .select({ prayerRequestId: prayerCommitmentsTable.prayerRequestId })
      .from(prayerCommitmentsTable)
      .where(
        and(
          inArray(prayerCommitmentsTable.prayerRequestId, requestIds),
          eq(prayerCommitmentsTable.userId, userId),
        ),
      ),
  ]);

  const counts: Record<string, number> = {};
  for (const row of countRows) counts[row.prayerRequestId] = Number(row.total);
  const myCommits = new Set(myRows.map((r) => r.prayerRequestId));
  return { counts, myCommits };
}

async function getLatestUpdates(requestIds: string[]) {
  if (requestIds.length === 0) return {} as Record<string, string>;
  const rows = await db
    .select({
      prayerRequestId: prayerUpdatesTable.prayerRequestId,
      updateTextEncrypted: prayerUpdatesTable.updateTextEncrypted,
      createdAt: prayerUpdatesTable.createdAt,
    })
    .from(prayerUpdatesTable)
    .where(inArray(prayerUpdatesTable.prayerRequestId, requestIds))
    .orderBy(sql`${prayerUpdatesTable.createdAt} DESC`);

  const latest: Record<string, string> = {};
  for (const row of rows) {
    if (!(row.prayerRequestId in latest)) {
      latest[row.prayerRequestId] = decryptOrNull(row.updateTextEncrypted) ?? "";
    }
  }
  return latest;
}

function urgencyOrder(u: string) {
  if (u === "urgent") return 0;
  if (u === "important") return 1;
  return 2;
}

// ─── POST /groups/:groupId/sessions ──────────────────────────────────────────

router.post(
  "/groups/:groupId/sessions",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const userId = req.dbUserId!;
      const memberRole = req.memberRole!;
      const body = req.body as {
        mode: "compact" | "detailed";
        organizationType?: "priority" | "category";
        filter?: string;
      };

      if (!body.mode || !["compact", "detailed"].includes(body.mode)) {
        res.status(400).json({ error: "mode must be compact or detailed" });
        return;
      }

      const mode = body.mode;
      const organizationType = body.organizationType ?? "priority";
      const filter = body.filter ?? "all_active";
      const categoryId = (body as { categoryId?: string }).categoryId ?? null;

      const groupSettings = await getGroupSettings(groupId);
      if (!groupSettings) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      // Create session row
      const [session] = await db
        .insert(prayerSessionsTable)
        .values({
          groupId,
          userId,
          mode,
          organizationType,
          filters: { filter },
        })
        .returning();

      // Build base query: active or follow_up requests in this group
      let rows = await db
        .select()
        .from(prayerRequestsTable)
        .where(
          and(
            eq(prayerRequestsTable.groupId, groupId),
            inArray(prayerRequestsTable.status, ["active", "follow_up"]),
          ),
        );

      // Apply filter
      if (filter === "urgent_only") {
        rows = rows.filter((r) => r.urgency === "urgent");
      } else if (filter === "important_urgent") {
        rows = rows.filter((r) => r.urgency === "urgent" || r.urgency === "important");
      } else if (filter === "created_by_me") {
        rows = rows.filter((r) => r.createdByUserId === userId);
      } else if (filter === "anonymous") {
        rows = rows.filter((r) => r.isAnonymous);
      } else if (filter === "recent_updates") {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentUpdateRows =
          rows.length > 0
            ? await db
                .select({ prayerRequestId: prayerUpdatesTable.prayerRequestId })
                .from(prayerUpdatesTable)
                .where(
                  and(
                    inArray(
                      prayerUpdatesTable.prayerRequestId,
                      rows.map((r) => r.id),
                    ),
                    sql`${prayerUpdatesTable.createdAt} >= ${sevenDaysAgo}`,
                  ),
                )
            : [];
        const recentIds = new Set(recentUpdateRows.map((r) => r.prayerRequestId));
        rows = rows.filter((r) => recentIds.has(r.id));
      } else if (filter === "by_category") {
        if (categoryId) {
          rows = rows.filter((r) => r.categoryId === categoryId);
        }
      } else if (filter === "not_yet_prayed") {
        const prayedRows =
          rows.length > 0
            ? await db
                .select({ prayerRequestId: prayerSessionItemsTable.prayerRequestId })
                .from(prayerSessionItemsTable)
                .innerJoin(
                  prayerSessionsTable,
                  eq(prayerSessionItemsTable.prayerSessionId, prayerSessionsTable.id),
                )
                .where(
                  and(
                    eq(prayerSessionsTable.userId, userId),
                    eq(prayerSessionsTable.groupId, groupId),
                    sql`${prayerSessionItemsTable.prayedAt} IS NOT NULL`,
                    inArray(
                      prayerSessionItemsTable.prayerRequestId,
                      rows.map((r) => r.id),
                    ),
                  ),
                )
            : [];
        const prayedIds = new Set(prayedRows.map((r) => r.prayerRequestId));
        rows = rows.filter((r) => !prayedIds.has(r.id));
      }
      // "already_praying" requires joining commitments — handled below

      if (filter === "already_praying") {
        const commitRows =
          rows.length > 0
            ? await db
                .select({ prayerRequestId: prayerCommitmentsTable.prayerRequestId })
                .from(prayerCommitmentsTable)
                .where(
                  and(
                    inArray(
                      prayerCommitmentsTable.prayerRequestId,
                      rows.map((r) => r.id),
                    ),
                    eq(prayerCommitmentsTable.userId, userId),
                  ),
                )
            : [];
        const alreadyPrayingIds = new Set(commitRows.map((r) => r.prayerRequestId));
        rows = rows.filter((r) => alreadyPrayingIds.has(r.id));
      }

      // Sort
      if (organizationType === "priority") {
        rows.sort((a, b) => {
          const uo = urgencyOrder(a.urgency) - urgencyOrder(b.urgency);
          if (uo !== 0) return uo;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });
      } else {
        // Group by category then urgency
        rows.sort((a, b) => {
          const ca = a.categoryId ?? "";
          const cb = b.categoryId ?? "";
          if (ca !== cb) return ca.localeCompare(cb);
          const uo = urgencyOrder(a.urgency) - urgencyOrder(b.urgency);
          if (uo !== 0) return uo;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });
      }

      const requestIds = rows.map((r) => r.id);

      // Fetch categories, commitment counts, latest updates in parallel
      const [categoryRows, { counts, myCommits }, latestUpdates] = await Promise.all([
        requestIds.length > 0
          ? db
              .select()
              .from(prayerCategoriesTable)
              .where(
                inArray(
                  prayerCategoriesTable.id,
                  rows
                    .map((r) => r.categoryId)
                    .filter((id): id is string => id != null),
                ),
              )
          : Promise.resolve([]),
        getCommitmentCounts(requestIds, userId),
        getLatestUpdates(requestIds),
      ]);

      const categoryMap = new Map(categoryRows.map((c) => [c.id, c]));

      // Resolve author name (respecting privacy rules)
      const userIds = [...new Set(rows.map((r) => r.createdByUserId))];
      const userRows =
        userIds.length > 0
          ? await db
              .select({ id: usersTable.id, fullName: usersTable.fullName })
              .from(usersTable)
              .where(inArray(usersTable.id, userIds))
          : [];
      const userMap = new Map(userRows.map((u) => [u.id, u.fullName]));

      // Create session items for each request
      const sessionItems =
        requestIds.length > 0
          ? await db
              .insert(prayerSessionItemsTable)
              .values(
                requestIds.map((rid) => ({
                  prayerSessionId: session.id,
                  prayerRequestId: rid,
                })),
              )
              .returning()
          : [];

      const itemByRequestId = new Map(sessionItems.map((i) => [i.prayerRequestId, i]));

      const isMod = memberRole === "admin" || memberRole === "moderator";
      const sessionRequests = rows.map((row) => {
        const category = row.categoryId ? (categoryMap.get(row.categoryId) ?? null) : null;
        const item = itemByRequestId.get(row.id);

        // Privacy: hide person name if group setting requires
        const prayerPersonName = groupSettings.hidePrayerPersonNames
          ? null
          : decryptOrNull(row.prayerPersonNameEncrypted);

        const description = decryptOrNull(row.descriptionEncrypted);
        const latestUpdate = latestUpdates[row.id] ?? null;

        return {
          id: row.id,
          groupId: row.groupId,
          title: row.title,
          prayerPersonName,
          prayerPersonInitials: row.prayerPersonInitials,
          categoryId: row.categoryId,
          categoryName: category?.name ?? null,
          categoryColor: category?.color ?? null,
          categoryIcon: category?.icon ?? null,
          urgency: row.urgency,
          status: row.status,
          isAnonymous: row.isAnonymous,
          description,
          latestUpdate: latestUpdate || null,
          importantDate: row.importantDate ? row.importantDate.toISOString() : null,
          commitmentCount: counts[row.id] ?? 0,
          iCommitted: myCommits.has(row.id),
          sessionItemId: item?.id ?? "",
          prayedAt: item?.prayedAt ? item.prayedAt.toISOString() : null,
          skippedAt: item?.skippedAt ? item.skippedAt.toISOString() : null,
          createdAt: row.createdAt.toISOString(),
        };
      });

      res.status(201).json({
        id: session.id,
        groupId: session.groupId,
        mode: session.mode,
        organizationType: session.organizationType,
        filter: filter ?? null,
        startedAt: session.startedAt.toISOString(),
        requests: sessionRequests,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to start prayer session");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── POST /groups/:groupId/sessions/:sessionId/mark-prayed ───────────────────

router.post(
  "/groups/:groupId/sessions/:sessionId/mark-prayed",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const userId = req.dbUserId!;
      const sessionId = String(req.params.sessionId);
      const body = req.body as { requestId: string };

      if (!body.requestId) {
        res.status(400).json({ error: "requestId is required" });
        return;
      }

      // Verify session belongs to user in this group
      const [session] = await db
        .select()
        .from(prayerSessionsTable)
        .where(
          and(
            eq(prayerSessionsTable.id, sessionId),
            eq(prayerSessionsTable.groupId, groupId),
            eq(prayerSessionsTable.userId, userId),
          ),
        )
        .limit(1);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      // Verify requestId is a seeded item from this session (prevents cross-group IDOR)
      const [existingItem] = await db
        .select()
        .from(prayerSessionItemsTable)
        .where(
          and(
            eq(prayerSessionItemsTable.prayerSessionId, sessionId),
            eq(prayerSessionItemsTable.prayerRequestId, body.requestId),
          ),
        )
        .limit(1);

      if (!existingItem) {
        res.status(404).json({ error: "Request not found in this session" });
        return;
      }

      const now = new Date();

      const [item] = await db
        .update(prayerSessionItemsTable)
        .set({ prayedAt: now })
        .where(eq(prayerSessionItemsTable.id, existingItem.id))
        .returning();

      const PRAYED_COOLDOWN_MS = 30 * 60 * 1000;
      const [latestSessionLog] = await db
        .select({ prayedAt: prayerLogsTable.prayedAt })
        .from(prayerLogsTable)
        .where(
          and(
            eq(prayerLogsTable.prayerRequestId, body.requestId),
            eq(prayerLogsTable.userId, userId),
          ),
        )
        .orderBy(desc(prayerLogsTable.prayedAt))
        .limit(1);

      if (!latestSessionLog || Date.now() >= latestSessionLog.prayedAt.getTime() + PRAYED_COOLDOWN_MS) {
        await db.insert(prayerLogsTable).values({ prayerRequestId: body.requestId, userId });
      }

      res.json({
        sessionItemId: item.id,
        requestId: body.requestId,
        prayedAt: item.prayedAt!.toISOString(),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to mark prayer as prayed");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── POST /groups/:groupId/sessions/:sessionId/complete ──────────────────────

router.post(
  "/groups/:groupId/sessions/:sessionId/complete",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const userId = req.dbUserId!;
      const sessionId = String(req.params.sessionId);

      const [session] = await db
        .select()
        .from(prayerSessionsTable)
        .where(
          and(
            eq(prayerSessionsTable.id, sessionId),
            eq(prayerSessionsTable.groupId, groupId),
            eq(prayerSessionsTable.userId, userId),
          ),
        )
        .limit(1);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      const now = new Date();

      // Mark session as completed
      await db
        .update(prayerSessionsTable)
        .set({ completedAt: now })
        .where(eq(prayerSessionsTable.id, sessionId));

      // Fetch all session items
      const items = await db
        .select({
          id: prayerSessionItemsTable.id,
          prayerRequestId: prayerSessionItemsTable.prayerRequestId,
          prayedAt: prayerSessionItemsTable.prayedAt,
        })
        .from(prayerSessionItemsTable)
        .where(eq(prayerSessionItemsTable.prayerSessionId, sessionId));

      const prayedItems = items.filter((i) => i.prayedAt != null);
      const prayedRequestIds = prayedItems.map((i) => i.prayerRequestId);

      // Fetch prayed request titles + categories (group-scoped for defense-in-depth)
      const prayedRequests =
        prayedRequestIds.length > 0
          ? await db
              .select({
                id: prayerRequestsTable.id,
                title: prayerRequestsTable.title,
                categoryId: prayerRequestsTable.categoryId,
              })
              .from(prayerRequestsTable)
              .where(
                and(
                  inArray(prayerRequestsTable.id, prayedRequestIds),
                  eq(prayerRequestsTable.groupId, groupId),
                ),
              )
          : [];

      const categoryIds = [
        ...new Set(prayedRequests.map((r) => r.categoryId).filter((id): id is string => id != null)),
      ];

      const categoryRows =
        categoryIds.length > 0
          ? await db
              .select({ id: prayerCategoriesTable.id, name: prayerCategoriesTable.name })
              .from(prayerCategoriesTable)
              .where(inArray(prayerCategoriesTable.id, categoryIds))
          : [];

      const categoryNameMap = new Map(categoryRows.map((c) => [c.id, c.name]));
      const categoriesCovered = [
        ...new Set(
          prayedRequests
            .map((r) => (r.categoryId ? (categoryNameMap.get(r.categoryId) ?? null) : null))
            .filter((n): n is string => n != null),
        ),
      ];

      const durationSeconds = Math.round((now.getTime() - session.startedAt.getTime()) / 1000);

      res.json({
        sessionId: session.id,
        mode: session.mode,
        prayedCount: prayedItems.length,
        totalCount: items.length,
        durationSeconds,
        categoriesCovered,
        prayedRequests: prayedRequests.map((r) => ({ id: r.id, title: r.title })),
        completedAt: now.toISOString(),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to complete prayer session");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── GET /groups/:groupId/sessions/:sessionId ────────────────────────────────

router.get(
  "/groups/:groupId/sessions/:sessionId",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const userId = req.dbUserId!;
      const memberRole = req.memberRole!;
      const sessionId = String(req.params.sessionId);

      const [session] = await db
        .select()
        .from(prayerSessionsTable)
        .where(
          and(
            eq(prayerSessionsTable.id, sessionId),
            eq(prayerSessionsTable.groupId, groupId),
            eq(prayerSessionsTable.userId, userId),
          ),
        )
        .limit(1);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      const groupSettings = await getGroupSettings(groupId);
      if (!groupSettings) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      const items = await db
        .select()
        .from(prayerSessionItemsTable)
        .where(eq(prayerSessionItemsTable.prayerSessionId, sessionId));

      const requestIds = items.map((i) => i.prayerRequestId);

      if (requestIds.length === 0) {
        res.json({
          id: session.id,
          groupId: session.groupId,
          mode: session.mode,
          organizationType: session.organizationType,
          filter: (session.filters as { filter?: string }).filter ?? null,
          startedAt: session.startedAt.toISOString(),
          requests: [],
        });
        return;
      }

      const rows = await db
        .select()
        .from(prayerRequestsTable)
        .where(
          and(
            inArray(prayerRequestsTable.id, requestIds),
            eq(prayerRequestsTable.groupId, groupId),
          ),
        );

      const [categoryRows, { counts, myCommits }, latestUpdates] = await Promise.all([
        db
          .select()
          .from(prayerCategoriesTable)
          .where(
            inArray(
              prayerCategoriesTable.id,
              rows.map((r) => r.categoryId).filter((id): id is string => id != null),
            ),
          ),
        getCommitmentCounts(requestIds, userId),
        getLatestUpdates(requestIds),
      ]);

      const categoryMap = new Map(categoryRows.map((c) => [c.id, c]));
      const itemMap = new Map(items.map((i) => [i.prayerRequestId, i]));
      const isMod = memberRole === "admin" || memberRole === "moderator";

      const userIds = [...new Set(rows.map((r) => r.createdByUserId))];
      const userRows =
        userIds.length > 0
          ? await db
              .select({ id: usersTable.id, fullName: usersTable.fullName })
              .from(usersTable)
              .where(inArray(usersTable.id, userIds))
          : [];
      const userMap = new Map(userRows.map((u) => [u.id, u.fullName]));

      const sessionRequests = rows.map((row) => {
        const category = row.categoryId ? (categoryMap.get(row.categoryId) ?? null) : null;
        const item = itemMap.get(row.id);
        const prayerPersonName = groupSettings.hidePrayerPersonNames
          ? null
          : decryptOrNull(row.prayerPersonNameEncrypted);
        const description = decryptOrNull(row.descriptionEncrypted);
        const latestUpdate = latestUpdates[row.id] ?? null;

        return {
          id: row.id,
          groupId: row.groupId,
          title: row.title,
          prayerPersonName,
          prayerPersonInitials: row.prayerPersonInitials,
          categoryId: row.categoryId,
          categoryName: category?.name ?? null,
          categoryColor: category?.color ?? null,
          categoryIcon: category?.icon ?? null,
          urgency: row.urgency,
          status: row.status,
          isAnonymous: row.isAnonymous,
          description,
          latestUpdate: latestUpdate || null,
          importantDate: row.importantDate ? row.importantDate.toISOString() : null,
          commitmentCount: counts[row.id] ?? 0,
          iCommitted: myCommits.has(row.id),
          sessionItemId: item?.id ?? "",
          prayedAt: item?.prayedAt ? item.prayedAt.toISOString() : null,
          skippedAt: item?.skippedAt ? item.skippedAt.toISOString() : null,
          createdAt: row.createdAt.toISOString(),
        };
      });

      res.json({
        id: session.id,
        groupId: session.groupId,
        mode: session.mode,
        organizationType: session.organizationType,
        filter: (session.filters as { filter?: string }).filter ?? null,
        startedAt: session.startedAt.toISOString(),
        requests: sessionRequests,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to get session requests");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── POST /groups/:groupId/sessions/:sessionId/mark-skipped ──────────────────

router.post(
  "/groups/:groupId/sessions/:sessionId/mark-skipped",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const userId = req.dbUserId!;
      const sessionId = String(req.params.sessionId);
      const body = req.body as { requestId: string };

      if (!body.requestId) {
        res.status(400).json({ error: "requestId is required" });
        return;
      }

      const [session] = await db
        .select()
        .from(prayerSessionsTable)
        .where(
          and(
            eq(prayerSessionsTable.id, sessionId),
            eq(prayerSessionsTable.groupId, groupId),
            eq(prayerSessionsTable.userId, userId),
          ),
        )
        .limit(1);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      // Only allow skipping seeded session items (prevents IDOR)
      const [existingItem] = await db
        .select()
        .from(prayerSessionItemsTable)
        .where(
          and(
            eq(prayerSessionItemsTable.prayerSessionId, sessionId),
            eq(prayerSessionItemsTable.prayerRequestId, body.requestId),
          ),
        )
        .limit(1);

      if (!existingItem) {
        res.status(404).json({ error: "Request not found in this session" });
        return;
      }

      const now = new Date();

      const [item] = await db
        .update(prayerSessionItemsTable)
        .set({ skippedAt: now })
        .where(eq(prayerSessionItemsTable.id, existingItem.id))
        .returning();

      res.json({
        sessionItemId: item.id,
        requestId: body.requestId,
        skippedAt: item.skippedAt!.toISOString(),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to mark request as skipped");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
