import { Router } from "express";
import { db } from "@workspace/db";
import { prayerCategoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { syncUserFromClerk, requireAuth } from "../lib/auth";
import {
  requireGroupMember,
  requireGroupRole,
  type GroupAuthRequest,
} from "../lib/groupAuth";

const router = Router();

function formatCategory(cat: typeof prayerCategoriesTable.$inferSelect) {
  return {
    id: cat.id,
    groupId: cat.groupId,
    name: cat.name,
    description: cat.description,
    icon: cat.icon,
    color: cat.color,
    isDefault: cat.isDefault,
    isActive: cat.isActive,
    createdAt: cat.createdAt,
  };
}

// ─── GET /groups/:groupId/categories ─────────────────────────────────────────

router.get(
  "/groups/:groupId/categories",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const memberRole = req.memberRole!;
      const isAdmin = memberRole === "admin";

      // Admins see all categories (including inactive) to allow reactivation
      // Regular members only see active categories
      const conditions = isAdmin
        ? [eq(prayerCategoriesTable.groupId, groupId)]
        : [eq(prayerCategoriesTable.groupId, groupId), eq(prayerCategoriesTable.isActive, true)];

      const rows = await db
        .select()
        .from(prayerCategoriesTable)
        .where(and(...conditions))
        .orderBy(prayerCategoriesTable.isDefault, prayerCategoriesTable.name);

      res.json(rows.map(formatCategory));
    } catch (err) {
      req.log.error({ err }, "Failed to list categories");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── POST /groups/:groupId/categories ────────────────────────────────────────

router.post(
  "/groups/:groupId/categories",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  requireGroupRole("admin"),
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const userId = req.dbUserId!;
      const body = req.body as { name: string; description?: string; icon?: string; color?: string };

      if (!body.name?.trim()) {
        res.status(400).json({ error: "Category name is required" });
        return;
      }

      const [created] = await db
        .insert(prayerCategoriesTable)
        .values({
          groupId,
          name: body.name.trim(),
          description: body.description ?? null,
          icon: body.icon ?? null,
          color: body.color ?? null,
          isDefault: false,
          isActive: true,
          createdByUserId: userId,
        })
        .returning();

      res.status(201).json(formatCategory(created));
    } catch (err) {
      req.log.error({ err }, "Failed to create category");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ─── PATCH /groups/:groupId/categories/:categoryId ───────────────────────────

router.patch(
  "/groups/:groupId/categories/:categoryId",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  requireGroupRole("admin"),
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const categoryId = String(req.params.categoryId);
      const body = req.body as {
        name?: string;
        description?: string;
        icon?: string;
        color?: string;
        isActive?: boolean;
      };

      const [existing] = await db
        .select()
        .from(prayerCategoriesTable)
        .where(
          and(eq(prayerCategoriesTable.id, categoryId), eq(prayerCategoriesTable.groupId, groupId)),
        )
        .limit(1);

      if (!existing) {
        res.status(404).json({ error: "Category not found" });
        return;
      }

      const updates: Partial<typeof prayerCategoriesTable.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (body.name !== undefined) updates.name = body.name.trim();
      if (body.description !== undefined) updates.description = body.description;
      if (body.icon !== undefined) updates.icon = body.icon;
      if (body.color !== undefined) updates.color = body.color;
      if (body.isActive !== undefined) updates.isActive = body.isActive;

      const [updated] = await db
        .update(prayerCategoriesTable)
        .set(updates)
        .where(eq(prayerCategoriesTable.id, categoryId))
        .returning();

      res.json(formatCategory(updated));
    } catch (err) {
      req.log.error({ err }, "Failed to update category");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
