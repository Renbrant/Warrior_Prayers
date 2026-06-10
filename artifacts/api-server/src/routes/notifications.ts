import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, isNull, desc, count } from "drizzle-orm";
import { syncUserFromClerk, requireAuth } from "../lib/auth";
import type { AuthenticatedRequest } from "../lib/auth";

const router = Router();

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    userId: n.userId,
    groupId: n.groupId ?? null,
    type: n.type,
    title: n.title,
    message: n.message,
    relatedEntityType: n.relatedEntityType ?? null,
    relatedEntityId: n.relatedEntityId ?? null,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  };
}

// GET /notifications — list current user's notifications
router.get(
  "/notifications",
  syncUserFromClerk,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const dbUserId = req.dbUserId!;

      const [unreadResult] = await db
        .select({ cnt: count() })
        .from(notificationsTable)
        .where(
          and(
            eq(notificationsTable.userId, dbUserId),
            isNull(notificationsTable.readAt),
          ),
        );

      const unreadCount = Number(unreadResult?.cnt ?? 0);

      const notifications = await db
        .select()
        .from(notificationsTable)
        .where(eq(notificationsTable.userId, dbUserId))
        .orderBy(desc(notificationsTable.createdAt))
        .limit(200);

      res.json({
        notifications: notifications.map(formatNotification),
        unreadCount,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to list notifications");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// PATCH /notifications/read-all — mark all notifications as read
router.patch(
  "/notifications/read-all",
  syncUserFromClerk,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const dbUserId = req.dbUserId!;
      const now = new Date();

      await db
        .update(notificationsTable)
        .set({ readAt: now })
        .where(
          and(
            eq(notificationsTable.userId, dbUserId),
            isNull(notificationsTable.readAt),
          ),
        );

      res.json({ success: true });
    } catch (err) {
      req.log.error({ err }, "Failed to mark all notifications read");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// PATCH /notifications/:notificationId/read — mark single notification as read
router.patch(
  "/notifications/:notificationId/read",
  syncUserFromClerk,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const dbUserId = req.dbUserId!;
      const notificationId = String(req.params.notificationId);

      const [notification] = await db
        .select()
        .from(notificationsTable)
        .where(
          and(
            eq(notificationsTable.id, notificationId),
            eq(notificationsTable.userId, dbUserId),
          ),
        )
        .limit(1);

      if (!notification) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }

      const [updated] = await db
        .update(notificationsTable)
        .set({ readAt: new Date() })
        .where(eq(notificationsTable.id, notificationId))
        .returning();

      res.json(formatNotification(updated!));
    } catch (err) {
      req.log.error({ err }, "Failed to mark notification read");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
