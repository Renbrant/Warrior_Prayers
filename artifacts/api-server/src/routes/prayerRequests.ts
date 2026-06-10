import { Router } from "express";
import { db } from "@workspace/db";
import {
  prayerRequestsTable,
  prayerCommitmentsTable,
  prayerCommentsTable,
  prayerUpdatesTable,
  prayerCategoriesTable,
  prayerGroupsTable,
  auditLogsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, inArray, count, sql, isNull } from "drizzle-orm";
import { syncUserFromClerk, requireAuth } from "../lib/auth";
import {
  requireGroupMember,
  requireGroupRole,
  type GroupAuthRequest,
} from "../lib/groupAuth";
import { encrypt, encryptOrNull, decryptOrNull } from "../lib/encryption";

const router = Router();

function computeInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);
}

async function resolveAuthor(
  createdByUserId: string,
  isAnonymous: boolean,
  memberRole: string,
  adminsCanViewAnonymousAuthors: boolean,
  requesterId: string,
) {
  const isAuthor = createdByUserId === requesterId;
  const isMod = memberRole === "admin" || memberRole === "moderator";
  const isAdmin = memberRole === "admin";

  if (!isAnonymous || isAuthor || (isAdmin && adminsCanViewAnonymousAuthors)) {
    const [user] = await db
      .select({ fullName: usersTable.fullName, id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, createdByUserId))
      .limit(1);
    return {
      authorId: isMod || isAuthor ? createdByUserId : null,
      authorName: user?.fullName ?? null,
      isAnonymous,
    };
  }
  return { authorId: null, authorName: null, isAnonymous: true };
}

async function buildRequestSummary(
  req_row: typeof prayerRequestsTable.$inferSelect,
  group: { hidePrayerPersonNames: boolean; adminsCanViewAnonymousAuthors: boolean },
  memberRole: string,
  requesterId: string,
  commitmentCount: number,
  iCommitted: boolean,
  category: { name: string; color: string | null; icon: string | null } | null,
) {
  const prayerPersonName = decryptOrNull(req_row.prayerPersonNameEncrypted);
  const author = await resolveAuthor(
    req_row.createdByUserId,
    req_row.isAnonymous,
    memberRole,
    group.adminsCanViewAnonymousAuthors,
    requesterId,
  );
  return {
    id: req_row.id,
    groupId: req_row.groupId,
    title: req_row.title,
    prayerPersonName: group.hidePrayerPersonNames ? null : prayerPersonName,
    prayerPersonInitials: req_row.prayerPersonInitials,
    categoryId: req_row.categoryId,
    categoryName: category?.name ?? null,
    categoryColor: category?.color ?? null,
    categoryIcon: category?.icon ?? null,
    urgency: req_row.urgency,
    status: req_row.status,
    closureReason: req_row.closureReason,
    isAnonymous: req_row.isAnonymous,
    allowComments: req_row.allowComments,
    importantDate: req_row.importantDate,
    authorId: author.authorId,
    authorName: author.authorName,
    commitmentCount,
    iCommitted,
    createdAt: req_row.createdAt,
    updatedAt: req_row.updatedAt,
    closedAt: req_row.closedAt,
  };
}

async function buildRequestDetail(
  req_row: typeof prayerRequestsTable.$inferSelect,
  group: { hidePrayerPersonNames: boolean; adminsCanViewAnonymousAuthors: boolean },
  memberRole: string,
  requesterId: string,
  commitmentCount: number,
  iCommitted: boolean,
  category: { name: string; color: string | null; icon: string | null } | null,
  updates: { id: string; updateText: string; authorName: string | null; createdAt: Date }[],
) {
  const prayerPersonName = decryptOrNull(req_row.prayerPersonNameEncrypted);
  const description = decryptOrNull(req_row.descriptionEncrypted);
  const testimony = decryptOrNull(req_row.answeredTestimonyEncrypted);
  const closedNote = decryptOrNull(req_row.closedNoteEncrypted);
  const author = await resolveAuthor(
    req_row.createdByUserId,
    req_row.isAnonymous,
    memberRole,
    group.adminsCanViewAnonymousAuthors,
    requesterId,
  );
  return {
    id: req_row.id,
    groupId: req_row.groupId,
    title: req_row.title,
    description,
    prayerPersonName: group.hidePrayerPersonNames ? null : prayerPersonName,
    prayerPersonInitials: req_row.prayerPersonInitials,
    categoryId: req_row.categoryId,
    categoryName: category?.name ?? null,
    categoryColor: category?.color ?? null,
    categoryIcon: category?.icon ?? null,
    urgency: req_row.urgency,
    status: req_row.status,
    closureReason: req_row.closureReason,
    isAnonymous: req_row.isAnonymous,
    allowComments: req_row.allowComments,
    importantDate: req_row.importantDate,
    answeredTestimony: testimony,
    closedNote,
    authorId: author.authorId,
    authorName: author.authorName,
    isMyRequest: req_row.createdByUserId === requesterId,
    commitmentCount,
    iCommitted,
    updates,
    createdAt: req_row.createdAt,
    updatedAt: req_row.updatedAt,
    closedAt: req_row.closedAt,
    archivedAt: req_row.archivedAt,
  };
}

async function getCommitmentInfo(requestId: string, userId: string) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(prayerCommitmentsTable)
    .where(eq(prayerCommitmentsTable.prayerRequestId, requestId));

  const [myCommit] = await db
    .select({ id: prayerCommitmentsTable.id })
    .from(prayerCommitmentsTable)
    .where(
      and(
        eq(prayerCommitmentsTable.prayerRequestId, requestId),
        eq(prayerCommitmentsTable.userId, userId),
      ),
    )
    .limit(1);

  return { commitmentCount: Number(total), iCommitted: !!myCommit };
}

async function getRecentUpdates(requestId: string) {
  const rows = await db
    .select({
      id: prayerUpdatesTable.id,
      updateTextEncrypted: prayerUpdatesTable.updateTextEncrypted,
      userId: prayerUpdatesTable.userId,
      authorName: usersTable.fullName,
      createdAt: prayerUpdatesTable.createdAt,
    })
    .from(prayerUpdatesTable)
    .leftJoin(usersTable, eq(prayerUpdatesTable.userId, usersTable.id))
    .where(eq(prayerUpdatesTable.prayerRequestId, requestId))
    .orderBy(prayerUpdatesTable.createdAt);

  return rows.map((r) => ({
    id: r.id,
    updateText: decryptOrNull(r.updateTextEncrypted) ?? "",
    authorName: r.authorName ?? null,
    createdAt: r.createdAt,
  }));
}

async function getCategory(categoryId: string | null) {
  if (!categoryId) return null;
  const [cat] = await db
    .select({
      name: prayerCategoriesTable.name,
      color: prayerCategoriesTable.color,
      icon: prayerCategoriesTable.icon,
    })
    .from(prayerCategoriesTable)
    .where(eq(prayerCategoriesTable.id, categoryId))
    .limit(1);
  return cat ?? null;
}

async function getGroupSettings(groupId: string) {
  const [group] = await db
    .select({
      hidePrayerPersonNames: prayerGroupsTable.hidePrayerPersonNames,
      adminsCanViewAnonymousAuthors: prayerGroupsTable.adminsCanViewAnonymousAuthors,
      allowComments: prayerGroupsTable.allowComments,
    })
    .from(prayerGroupsTable)
    .where(eq(prayerGroupsTable.id, groupId))
    .limit(1);
  return group ?? null;
}

// ─── GET /groups/:groupId/requests ───────────────────────────────────────────

router.get(
  "/groups/:groupId/requests",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const memberRole = req.memberRole!;
      const userId = req.dbUserId!;
      const { status, categoryId, urgency } = req.query as Record<string, string>;

      const group = await getGroupSettings(groupId);
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      const isAdmin = memberRole === "admin";
      const isMod = memberRole === "admin" || memberRole === "moderator";

      const conditions = [eq(prayerRequestsTable.groupId, groupId)];
      if (status) {
        // Only admins can explicitly query archived requests
        if (status === "archived" && !isAdmin) {
          res.status(403).json({ error: "Only admins can view archived requests" });
          return;
        }
        conditions.push(eq(prayerRequestsTable.status, status));
      } else {
        // Default: exclude closed/archived from regular member view
        conditions.push(inArray(prayerRequestsTable.status, ["active", "follow_up"]));
      }
      if (categoryId) conditions.push(eq(prayerRequestsTable.categoryId, categoryId));
      if (urgency) conditions.push(eq(prayerRequestsTable.urgency, urgency));

      const rows = await db
        .select()
        .from(prayerRequestsTable)
        .where(and(...conditions))
        .orderBy(sql`${prayerRequestsTable.createdAt} DESC`);

      const results = await Promise.all(
        rows.map(async (row) => {
          const { commitmentCount, iCommitted } = await getCommitmentInfo(row.id, userId);
          const category = await getCategory(row.categoryId);
          return buildRequestSummary(row, group, memberRole, userId, commitmentCount, iCommitted, category);
        }),
      );

      res.json(results);
    } catch (err) {
      req.log.error({ err }, "Failed to list prayer requests");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── POST /groups/:groupId/requests ──────────────────────────────────────────

router.post(
  "/groups/:groupId/requests",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const userId = req.dbUserId!;
      const memberRole = req.memberRole!;
      const body = req.body as {
        title: string;
        description?: string;
        prayerPersonName?: string;
        categoryId?: string;
        urgency?: string;
        isAnonymous?: boolean;
        allowComments?: boolean;
        importantDate?: string;
      };

      if (!body.title?.trim()) {
        res.status(400).json({ error: "Title is required" });
        return;
      }

      const group = await getGroupSettings(groupId);
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      const prayerPersonName = body.prayerPersonName?.trim() ?? null;
      const initials = prayerPersonName ? computeInitials(prayerPersonName) : null;

      const [created] = await db
        .insert(prayerRequestsTable)
        .values({
          groupId,
          createdByUserId: userId,
          title: body.title.trim(),
          descriptionEncrypted: encryptOrNull(body.description),
          prayerPersonNameEncrypted: prayerPersonName ? encrypt(prayerPersonName) : null,
          prayerPersonInitials: initials,
          categoryId: body.categoryId ?? null,
          urgency: body.urgency ?? "normal",
          status: "active",
          isAnonymous: body.isAnonymous ?? false,
          allowComments: body.allowComments ?? true,
          importantDate: body.importantDate ? new Date(body.importantDate) : null,
        })
        .returning();

      await db.insert(auditLogsTable).values({
        userId,
        groupId,
        action: "prayer_request_created",
        entityType: "prayer_request",
        entityId: created.id,
      });

      const { commitmentCount, iCommitted } = await getCommitmentInfo(created.id, userId);
      const category = await getCategory(created.categoryId);
      const detail = await buildRequestDetail(created, group, memberRole, userId, commitmentCount, iCommitted, category, []);

      res.status(201).json(detail);
    } catch (err) {
      req.log.error({ err }, "Failed to create prayer request");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── GET /groups/:groupId/requests/:requestId ────────────────────────────────

router.get(
  "/groups/:groupId/requests/:requestId",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const memberRole = req.memberRole!;
      const userId = req.dbUserId!;
      const requestId = String(req.params.requestId);

      const [row] = await db
        .select()
        .from(prayerRequestsTable)
        .where(and(eq(prayerRequestsTable.id, requestId), eq(prayerRequestsTable.groupId, groupId)))
        .limit(1);

      if (!row) {
        res.status(404).json({ error: "Prayer request not found" });
        return;
      }

      const group = await getGroupSettings(groupId);
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      const { commitmentCount, iCommitted } = await getCommitmentInfo(requestId, userId);
      const category = await getCategory(row.categoryId);
      const updates = await getRecentUpdates(requestId);
      const detail = await buildRequestDetail(row, group, memberRole, userId, commitmentCount, iCommitted, category, updates);

      res.json(detail);
    } catch (err) {
      req.log.error({ err }, "Failed to get prayer request");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── PATCH /groups/:groupId/requests/:requestId ──────────────────────────────

router.patch(
  "/groups/:groupId/requests/:requestId",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const memberRole = req.memberRole!;
      const userId = req.dbUserId!;
      const requestId = String(req.params.requestId);
      const body = req.body as {
        title?: string;
        description?: string;
        prayerPersonName?: string;
        categoryId?: string;
        urgency?: string;
        isAnonymous?: boolean;
        allowComments?: boolean;
        importantDate?: string;
      };

      const [row] = await db
        .select()
        .from(prayerRequestsTable)
        .where(and(eq(prayerRequestsTable.id, requestId), eq(prayerRequestsTable.groupId, groupId)))
        .limit(1);

      if (!row) {
        res.status(404).json({ error: "Prayer request not found" });
        return;
      }

      const isAuthor = row.createdByUserId === userId;
      const isMod = memberRole === "admin" || memberRole === "moderator";
      if (!isAuthor && !isMod) {
        res.status(403).json({ error: "Only the author or a moderator can edit this request" });
        return;
      }

      const updates: Partial<typeof prayerRequestsTable.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (body.title !== undefined) updates.title = body.title.trim();
      if (body.description !== undefined) updates.descriptionEncrypted = encryptOrNull(body.description);
      if (body.prayerPersonName !== undefined) {
        const name = body.prayerPersonName?.trim() ?? null;
        updates.prayerPersonNameEncrypted = name ? encrypt(name) : null;
        updates.prayerPersonInitials = name ? computeInitials(name) : null;
      }
      if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
      if (body.urgency !== undefined) updates.urgency = body.urgency;
      if (body.isAnonymous !== undefined) updates.isAnonymous = body.isAnonymous;
      if (body.allowComments !== undefined) updates.allowComments = body.allowComments;
      if (body.importantDate !== undefined)
        updates.importantDate = body.importantDate ? new Date(body.importantDate) : null;

      const [updated] = await db
        .update(prayerRequestsTable)
        .set(updates)
        .where(eq(prayerRequestsTable.id, requestId))
        .returning();

      const group = await getGroupSettings(groupId);
      const { commitmentCount, iCommitted } = await getCommitmentInfo(requestId, userId);
      const category = await getCategory(updated.categoryId);
      const recentUpdates = await getRecentUpdates(requestId);
      const detail = await buildRequestDetail(
        updated,
        group ?? { hidePrayerPersonNames: false, adminsCanViewAnonymousAuthors: true },
        memberRole,
        userId,
        commitmentCount,
        iCommitted,
        category,
        recentUpdates,
      );

      res.json(detail);
    } catch (err) {
      req.log.error({ err }, "Failed to update prayer request");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── DELETE /groups/:groupId/requests/:requestId ─────────────────────────────

router.delete(
  "/groups/:groupId/requests/:requestId",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const memberRole = req.memberRole!;
      const userId = req.dbUserId!;
      const requestId = String(req.params.requestId);

      const [row] = await db
        .select({ id: prayerRequestsTable.id, createdByUserId: prayerRequestsTable.createdByUserId })
        .from(prayerRequestsTable)
        .where(and(eq(prayerRequestsTable.id, requestId), eq(prayerRequestsTable.groupId, groupId)))
        .limit(1);

      if (!row) {
        res.status(404).json({ error: "Prayer request not found" });
        return;
      }

      const isAuthor = row.createdByUserId === userId;
      const isAdmin = memberRole === "admin";
      if (!isAuthor && !isAdmin) {
        res.status(403).json({ error: "Only the author or an admin can delete this request" });
        return;
      }

      await db.delete(prayerRequestsTable).where(eq(prayerRequestsTable.id, requestId));

      res.status(204).send();
    } catch (err) {
      req.log.error({ err }, "Failed to delete prayer request");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── POST /groups/:groupId/requests/:requestId/commit ────────────────────────

router.post(
  "/groups/:groupId/requests/:requestId/commit",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const requestId = String(req.params.requestId);
      const userId = req.dbUserId!;

      // Verify request belongs to this group before toggling commitment
      const [prayerReq] = await db
        .select({ id: prayerRequestsTable.id })
        .from(prayerRequestsTable)
        .where(and(eq(prayerRequestsTable.id, requestId), eq(prayerRequestsTable.groupId, groupId)))
        .limit(1);

      if (!prayerReq) {
        res.status(404).json({ error: "Prayer request not found" });
        return;
      }

      const [existing] = await db
        .select({ id: prayerCommitmentsTable.id })
        .from(prayerCommitmentsTable)
        .where(
          and(
            eq(prayerCommitmentsTable.prayerRequestId, requestId),
            eq(prayerCommitmentsTable.userId, userId),
          ),
        )
        .limit(1);

      if (existing) {
        await db.delete(prayerCommitmentsTable).where(eq(prayerCommitmentsTable.id, existing.id));
      } else {
        await db.insert(prayerCommitmentsTable).values({ prayerRequestId: requestId, userId });
      }

      const { commitmentCount, iCommitted } = await getCommitmentInfo(requestId, userId);
      res.json({ commitmentCount, iCommitted });
    } catch (err) {
      req.log.error({ err }, "Failed to toggle commitment");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── GET /groups/:groupId/requests/:requestId/comments ───────────────────────

router.get(
  "/groups/:groupId/requests/:requestId/comments",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const requestId = String(req.params.requestId);
      const userId = req.dbUserId!;

      // Verify request belongs to this group and comments are allowed
      const [prayerReq] = await db
        .select({
          id: prayerRequestsTable.id,
          allowComments: prayerRequestsTable.allowComments,
        })
        .from(prayerRequestsTable)
        .where(and(eq(prayerRequestsTable.id, requestId), eq(prayerRequestsTable.groupId, groupId)))
        .limit(1);

      if (!prayerReq) {
        res.status(404).json({ error: "Prayer request not found" });
        return;
      }

      // Enforce group-level allowComments setting
      const groupSettings = await getGroupSettings(groupId);
      if (!groupSettings?.allowComments) {
        res.json([]);
        return;
      }

      if (!prayerReq.allowComments) {
        res.json([]);
        return;
      }

      const rows = await db
        .select({
          id: prayerCommentsTable.id,
          commentEncrypted: prayerCommentsTable.commentEncrypted,
          userId: prayerCommentsTable.userId,
          authorName: usersTable.fullName,
          createdAt: prayerCommentsTable.createdAt,
          deletedAt: prayerCommentsTable.deletedAt,
        })
        .from(prayerCommentsTable)
        .leftJoin(usersTable, eq(prayerCommentsTable.userId, usersTable.id))
        .where(
          and(
            eq(prayerCommentsTable.prayerRequestId, requestId),
            isNull(prayerCommentsTable.deletedAt),
          ),
        )
        .orderBy(prayerCommentsTable.createdAt);

      const result = rows.map((r) => ({
        id: r.id,
        comment: decryptOrNull(r.commentEncrypted) ?? "",
        authorId: r.userId,
        authorName: r.authorName ?? null,
        isMyComment: r.userId === userId,
        createdAt: r.createdAt,
      }));

      res.json(result);
    } catch (err) {
      req.log.error({ err }, "Failed to list comments");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── POST /groups/:groupId/requests/:requestId/comments ──────────────────────

router.post(
  "/groups/:groupId/requests/:requestId/comments",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const requestId = String(req.params.requestId);
      const userId = req.dbUserId!;
      const { comment } = req.body as { comment?: string };

      if (!comment?.trim()) {
        res.status(400).json({ error: "Comment text is required" });
        return;
      }

      const [prayerReq] = await db
        .select({ allowComments: prayerRequestsTable.allowComments, groupId: prayerRequestsTable.groupId })
        .from(prayerRequestsTable)
        .where(and(eq(prayerRequestsTable.id, requestId), eq(prayerRequestsTable.groupId, groupId)))
        .limit(1);

      if (!prayerReq) {
        res.status(404).json({ error: "Prayer request not found" });
        return;
      }

      // Enforce group-level allowComments setting server-side
      const groupSettings = await getGroupSettings(groupId);
      if (!groupSettings?.allowComments) {
        res.status(400).json({ error: "Comments are disabled for this group" });
        return;
      }

      if (!prayerReq.allowComments) {
        res.status(400).json({ error: "Comments are disabled for this prayer request" });
        return;
      }

      const [created] = await db
        .insert(prayerCommentsTable)
        .values({
          prayerRequestId: requestId,
          userId,
          commentEncrypted: encrypt(comment.trim()),
        })
        .returning();

      const [user] = await db
        .select({ fullName: usersTable.fullName })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      res.status(201).json({
        id: created.id,
        comment: comment.trim(),
        authorId: userId,
        authorName: user?.fullName ?? null,
        isMyComment: true,
        createdAt: created.createdAt,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to add comment");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── DELETE /groups/:groupId/requests/:requestId/comments/:commentId ─────────

router.delete(
  "/groups/:groupId/requests/:requestId/comments/:commentId",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const requestId = String(req.params.requestId);
      const commentId = String(req.params.commentId);
      const userId = req.dbUserId!;
      const memberRole = req.memberRole!;

      // Verify comment belongs to the correct request AND group (prevent cross-group deletion)
      const [comment] = await db
        .select({ id: prayerCommentsTable.id, userId: prayerCommentsTable.userId })
        .from(prayerCommentsTable)
        .innerJoin(prayerRequestsTable, eq(prayerCommentsTable.prayerRequestId, prayerRequestsTable.id))
        .where(
          and(
            eq(prayerCommentsTable.id, commentId),
            eq(prayerCommentsTable.prayerRequestId, requestId),
            eq(prayerRequestsTable.groupId, groupId),
            isNull(prayerCommentsTable.deletedAt),
          ),
        )
        .limit(1);

      if (!comment) {
        res.status(404).json({ error: "Comment not found" });
        return;
      }

      const isAuthor = comment.userId === userId;
      const isMod = memberRole === "admin" || memberRole === "moderator";
      if (!isAuthor && !isMod) {
        res.status(403).json({ error: "Only the author or a moderator can delete this comment" });
        return;
      }

      await db
        .update(prayerCommentsTable)
        .set({ deletedAt: new Date() })
        .where(eq(prayerCommentsTable.id, commentId));

      res.status(204).send();
    } catch (err) {
      req.log.error({ err }, "Failed to delete comment");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── POST /groups/:groupId/requests/:requestId/updates ───────────────────────

router.post(
  "/groups/:groupId/requests/:requestId/updates",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const memberRole = req.memberRole!;
      const userId = req.dbUserId!;
      const requestId = String(req.params.requestId);
      const body = req.body as {
        updateText: string;
        newStatus?: string;
        closureReason?: string;
        testimony?: string;
        closingNote?: string;
      };

      if (!body.updateText?.trim()) {
        res.status(400).json({ error: "Update text is required" });
        return;
      }

      const [row] = await db
        .select()
        .from(prayerRequestsTable)
        .where(and(eq(prayerRequestsTable.id, requestId), eq(prayerRequestsTable.groupId, groupId)))
        .limit(1);

      if (!row) {
        res.status(404).json({ error: "Prayer request not found" });
        return;
      }

      const isAuthor = row.createdByUserId === userId;
      const isMod = memberRole === "admin" || memberRole === "moderator";
      const isAdminForUpdate = memberRole === "admin";

      if (!isAuthor && !isMod) {
        res.status(403).json({ error: "Only the author or a moderator can add updates" });
        return;
      }

      // ── Validate ALL status-transition rules BEFORE any DB writes ────────────
      const requestUpdates: Partial<typeof prayerRequestsTable.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (body.newStatus && body.newStatus !== row.status) {
        // Archiving is admin-only
        if (body.newStatus === "archived" && !isAdminForUpdate) {
          res.status(403).json({ error: "Only admins can archive prayer requests" });
          return;
        }

        // Closing requires a valid closure reason
        if (body.newStatus === "closed") {
          const validReasons = ["answered_prayer", "no_longer_needed"];
          if (!body.closureReason || !validReasons.includes(body.closureReason)) {
            res.status(400).json({ error: "A valid closure reason is required when closing a request (answered_prayer or no_longer_needed)" });
            return;
          }
        }

        requestUpdates.status = body.newStatus;

        if (body.newStatus === "closed") {
          requestUpdates.closedAt = new Date();
          requestUpdates.closureReason = body.closureReason!;
          if (body.closureReason === "answered_prayer" && body.testimony) {
            requestUpdates.answeredTestimonyEncrypted = encryptOrNull(body.testimony);
          }
          if (body.closureReason === "no_longer_needed" && body.closingNote) {
            requestUpdates.closedNoteEncrypted = encryptOrNull(body.closingNote);
          }
        }

        if (body.newStatus === "archived") {
          requestUpdates.archivedAt = new Date();
        }
      }

      // ── All validations passed — now write atomically ────────────────────────
      await db.insert(prayerUpdatesTable).values({
        prayerRequestId: requestId,
        userId,
        updateTextEncrypted: encrypt(body.updateText.trim()),
      });

      const [updated] = await db
        .update(prayerRequestsTable)
        .set(requestUpdates)
        .where(eq(prayerRequestsTable.id, requestId))
        .returning();

      await db.insert(auditLogsTable).values({
        userId,
        groupId,
        action: body.newStatus === "closed" ? "prayer_request_closed" : "prayer_request_updated",
        entityType: "prayer_request",
        entityId: requestId,
        metadata: body.newStatus ? { newStatus: body.newStatus, closureReason: body.closureReason } : undefined,
      });

      const group = await getGroupSettings(groupId);
      const { commitmentCount, iCommitted } = await getCommitmentInfo(requestId, userId);
      const category = await getCategory(updated.categoryId);
      const recentUpdates = await getRecentUpdates(requestId);
      const detail = await buildRequestDetail(
        updated,
        group ?? { hidePrayerPersonNames: false, adminsCanViewAnonymousAuthors: true },
        memberRole,
        userId,
        commitmentCount,
        iCommitted,
        category,
        recentUpdates,
      );

      res.status(201).json(detail);
    } catch (err) {
      req.log.error({ err }, "Failed to add prayer update");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── GET /groups/:groupId/history ────────────────────────────────────────────

router.get(
  "/groups/:groupId/history",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const memberRole = req.memberRole!;
      const userId = req.dbUserId!;
      const { closureReason } = req.query as Record<string, string>;

      const group = await getGroupSettings(groupId);
      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      const conditions = [
        eq(prayerRequestsTable.groupId, groupId),
        inArray(prayerRequestsTable.status, ["closed", "archived"]),
      ];
      if (closureReason) conditions.push(eq(prayerRequestsTable.closureReason, closureReason));

      const rows = await db
        .select()
        .from(prayerRequestsTable)
        .where(and(...conditions))
        .orderBy(sql`${prayerRequestsTable.closedAt} DESC NULLS LAST`);

      const results = await Promise.all(
        rows.map(async (row) => {
          const { commitmentCount, iCommitted } = await getCommitmentInfo(row.id, userId);
          const category = await getCategory(row.categoryId);
          return buildRequestSummary(row, group, memberRole, userId, commitmentCount, iCommitted, category);
        }),
      );

      res.json(results);
    } catch (err) {
      req.log.error({ err }, "Failed to get prayer history");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
