import { Router } from "express";
import { db } from "@workspace/db";
import {
  prayerGroupsTable,
  groupMembersTable,
  prayerCategoriesTable,
  auditLogsTable,
  notificationsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, count, inArray } from "drizzle-orm";
import { syncUserFromClerk, requireAuth } from "../lib/auth";
import type { AuthenticatedRequest } from "../lib/auth";
import {
  requireGroupMember,
  requireGroupRole,
  type GroupAuthRequest,
} from "../lib/groupAuth";
import { DEFAULT_PRAYER_CATEGORIES } from "../lib/defaultCategories";

const router = Router();

function formatGroup(
  group: typeof prayerGroupsTable.$inferSelect,
  memberCount: number,
  myRole: string,
) {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    churchName: group.churchName,
    city: group.city,
    imageUrl: group.imageUrl,
    verse: group.verse,
    hidePrayerPersonNames: group.hidePrayerPersonNames,
    allowCustomCategories: group.allowCustomCategories,
    allowComments: group.allowComments,
    allowAnonymousRequests: group.allowAnonymousRequests,
    adminsCanViewAnonymousAuthors: group.adminsCanViewAnonymousAuthors,
    memberCount,
    myRole,
    createdByUserId: group.createdByUserId,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

// GET /groups — list user's groups
router.get(
  "/groups",
  syncUserFromClerk,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const dbUserId = req.dbUserId!;

      const memberships = await db
        .select({
          groupId: groupMembersTable.groupId,
          role: groupMembersTable.role,
        })
        .from(groupMembersTable)
        .where(
          and(
            eq(groupMembersTable.userId, dbUserId),
            eq(groupMembersTable.status, "active"),
          ),
        );

      if (memberships.length === 0) {
        res.json([]);
        return;
      }

      const groupIds = memberships.map((m) => m.groupId);
      const roleMap = Object.fromEntries(memberships.map((m) => [m.groupId, m.role]));

      const groups = await db
        .select()
        .from(prayerGroupsTable)
        .where(inArray(prayerGroupsTable.id, groupIds));

      const memberCounts = await db
        .select({
          groupId: groupMembersTable.groupId,
          cnt: count(),
        })
        .from(groupMembersTable)
        .where(
          and(
            inArray(groupMembersTable.groupId, groupIds),
            eq(groupMembersTable.status, "active"),
          ),
        )
        .groupBy(groupMembersTable.groupId);

      const countMap = Object.fromEntries(
        memberCounts.map((c) => [c.groupId, Number(c.cnt)]),
      );

      res.json(
        groups.map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          churchName: g.churchName,
          city: g.city,
          imageUrl: g.imageUrl,
          verse: g.verse,
          memberCount: countMap[g.id] ?? 0,
          myRole: roleMap[g.id] ?? "member",
          createdAt: g.createdAt.toISOString(),
        })),
      );
    } catch (err) {
      req.log.error({ err }, "Failed to list groups");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// POST /groups — create a group
router.post(
  "/groups",
  syncUserFromClerk,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const dbUserId = req.dbUserId!;
      const {
        name,
        description,
        churchName,
        city,
        imageUrl,
        verse,
        hidePrayerPersonNames = false,
        allowCustomCategories = true,
        allowComments = true,
        allowAnonymousRequests = true,
        adminsCanViewAnonymousAuthors = true,
      } = req.body as {
        name: string;
        description?: string;
        churchName?: string;
        city?: string;
        imageUrl?: string;
        verse?: string;
        hidePrayerPersonNames?: boolean;
        allowCustomCategories?: boolean;
        allowComments?: boolean;
        allowAnonymousRequests?: boolean;
        adminsCanViewAnonymousAuthors?: boolean;
      };

      if (!name || name.trim().length === 0) {
        res.status(400).json({ error: "Group name is required" });
        return;
      }

      const [newGroup] = await db
        .insert(prayerGroupsTable)
        .values({
          name: name.trim(),
          description,
          churchName,
          city,
          imageUrl,
          verse,
          createdByUserId: dbUserId,
          hidePrayerPersonNames,
          allowCustomCategories,
          allowComments,
          allowAnonymousRequests,
          adminsCanViewAnonymousAuthors,
        })
        .returning();

      if (!newGroup) {
        res.status(500).json({ error: "Failed to create group" });
        return;
      }

      await db.insert(groupMembersTable).values({
        groupId: newGroup.id,
        userId: dbUserId,
        role: "admin",
        status: "active",
      });

      await db.insert(prayerCategoriesTable).values(
        DEFAULT_PRAYER_CATEGORIES.map((cat) => ({
          groupId: newGroup.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          isDefault: true,
          isActive: true,
        })),
      );

      await db.insert(auditLogsTable).values({
        groupId: newGroup.id,
        action: "group_created",
        entityType: "prayer_group",
        entityId: newGroup.id,
        metadata: { name: newGroup.name },
      });

      res.status(201).json(formatGroup(newGroup, 1, "admin"));
    } catch (err) {
      req.log.error({ err }, "Failed to create group");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// GET /groups/:groupId
router.get(
  "/groups/:groupId",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const myRole = req.memberRole!;

      const [group] = await db
        .select()
        .from(prayerGroupsTable)
        .where(eq(prayerGroupsTable.id, groupId))
        .limit(1);

      if (!group) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      const [memberCountResult] = await db
        .select({ cnt: count() })
        .from(groupMembersTable)
        .where(
          and(
            eq(groupMembersTable.groupId, groupId),
            eq(groupMembersTable.status, "active"),
          ),
        );

      res.json(formatGroup(group, Number(memberCountResult?.cnt ?? 0), myRole));
    } catch (err) {
      req.log.error({ err }, "Failed to get group");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// PATCH /groups/:groupId — update group settings (admin only)
router.patch(
  "/groups/:groupId",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  requireGroupRole("admin"),
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const {
        name,
        description,
        churchName,
        city,
        imageUrl,
        verse,
        hidePrayerPersonNames,
        allowCustomCategories,
        allowComments,
        allowAnonymousRequests,
        adminsCanViewAnonymousAuthors,
      } = req.body as Record<string, unknown>;

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (name !== undefined) updates.name = String(name).trim();
      if (description !== undefined) updates.description = description;
      if (churchName !== undefined) updates.churchName = churchName;
      if (city !== undefined) updates.city = city;
      if (imageUrl !== undefined) updates.imageUrl = imageUrl;
      if (verse !== undefined) updates.verse = verse;
      if (hidePrayerPersonNames !== undefined)
        updates.hidePrayerPersonNames = hidePrayerPersonNames;
      if (allowCustomCategories !== undefined)
        updates.allowCustomCategories = allowCustomCategories;
      if (allowComments !== undefined) updates.allowComments = allowComments;
      if (allowAnonymousRequests !== undefined)
        updates.allowAnonymousRequests = allowAnonymousRequests;
      if (adminsCanViewAnonymousAuthors !== undefined)
        updates.adminsCanViewAnonymousAuthors = adminsCanViewAnonymousAuthors;

      const [updated] = await db
        .update(prayerGroupsTable)
        .set(updates)
        .where(eq(prayerGroupsTable.id, groupId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Group not found" });
        return;
      }

      await db.insert(auditLogsTable).values({
        groupId,
        action: "group_settings_updated",
        entityType: "prayer_group",
        entityId: groupId,
        metadata: updates,
      });

      const [memberCountResult] = await db
        .select({ cnt: count() })
        .from(groupMembersTable)
        .where(
          and(
            eq(groupMembersTable.groupId, groupId),
            eq(groupMembersTable.status, "active"),
          ),
        );

      res.json(formatGroup(updated, Number(memberCountResult?.cnt ?? 0), "admin"));
    } catch (err) {
      req.log.error({ err }, "Failed to update group");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// GET /groups/:groupId/members
router.get(
  "/groups/:groupId/members",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;

      const members = await db
        .select({
          id: groupMembersTable.id,
          userId: groupMembersTable.userId,
          groupId: groupMembersTable.groupId,
          role: groupMembersTable.role,
          status: groupMembersTable.status,
          joinedAt: groupMembersTable.joinedAt,
          fullName: usersTable.fullName,
          email: usersTable.email,
          profilePhotoUrl: usersTable.profilePhotoUrl,
        })
        .from(groupMembersTable)
        .innerJoin(usersTable, eq(groupMembersTable.userId, usersTable.id))
        .where(
          and(
            eq(groupMembersTable.groupId, groupId),
            eq(groupMembersTable.status, "active"),
          ),
        )
        .orderBy(groupMembersTable.joinedAt);

      res.json(
        members.map((m) => ({
          id: m.id,
          userId: m.userId,
          groupId: m.groupId,
          role: m.role,
          status: m.status,
          joinedAt: m.joinedAt.toISOString(),
          fullName: m.fullName,
          email: m.email,
          profilePhotoUrl: m.profilePhotoUrl,
        })),
      );
    } catch (err) {
      req.log.error({ err }, "Failed to list group members");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// PATCH /groups/:groupId/members/:memberId — update member role (admin only)
router.patch(
  "/groups/:groupId/members/:memberId",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  requireGroupRole("admin"),
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const memberId = String(req.params.memberId);
      const dbUserId = req.dbUserId!;
      const { role } = req.body as { role: "admin" | "moderator" | "member" };

      if (!["admin", "moderator", "member"].includes(role)) {
        res.status(400).json({ error: "Invalid role" });
        return;
      }

      const [targetMember] = await db
        .select()
        .from(groupMembersTable)
        .where(
          and(
            eq(groupMembersTable.id, memberId),
            eq(groupMembersTable.groupId, groupId),
            eq(groupMembersTable.status, "active"),
          ),
        )
        .limit(1);

      if (!targetMember) {
        res.status(404).json({ error: "Member not found" });
        return;
      }

      if (targetMember.userId === dbUserId) {
        res.status(400).json({ error: "You cannot change your own role" });
        return;
      }

      await db
        .update(groupMembersTable)
        .set({ role })
        .where(eq(groupMembersTable.id, memberId));

      const [user] = await db
        .select({
          fullName: usersTable.fullName,
          email: usersTable.email,
          profilePhotoUrl: usersTable.profilePhotoUrl,
        })
        .from(usersTable)
        .where(eq(usersTable.id, targetMember.userId))
        .limit(1);

      res.json({
        id: memberId,
        userId: targetMember.userId,
        groupId,
        role,
        status: targetMember.status,
        joinedAt: targetMember.joinedAt.toISOString(),
        fullName: user?.fullName ?? null,
        email: user?.email ?? "",
        profilePhotoUrl: user?.profilePhotoUrl ?? null,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to update member role");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// DELETE /groups/:groupId/members/:memberId — remove member (admin only)
router.delete(
  "/groups/:groupId/members/:memberId",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  requireGroupRole("admin"),
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const memberId = String(req.params.memberId);
      const dbUserId = req.dbUserId!;

      const [targetMember] = await db
        .select()
        .from(groupMembersTable)
        .where(
          and(
            eq(groupMembersTable.id, memberId),
            eq(groupMembersTable.groupId, groupId),
            eq(groupMembersTable.status, "active"),
          ),
        )
        .limit(1);

      if (!targetMember) {
        res.status(404).json({ error: "Member not found" });
        return;
      }

      if (targetMember.userId === dbUserId) {
        res.status(400).json({ error: "You cannot remove yourself" });
        return;
      }

      await db
        .update(groupMembersTable)
        .set({ status: "removed" })
        .where(eq(groupMembersTable.id, memberId));

      await db.insert(notificationsTable).values({
        userId: targetMember.userId,
        groupId,
        type: "removed_from_group",
        title: "Removed from group",
        message: "You have been removed from a prayer group.",
        relatedEntityType: "prayer_group",
        relatedEntityId: groupId,
      });

      res.status(204).send();
    } catch (err) {
      req.log.error({ err }, "Failed to remove member");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
