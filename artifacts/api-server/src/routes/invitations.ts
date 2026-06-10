import { Router } from "express";
import { randomBytes } from "crypto";
import { db } from "@workspace/db";
import {
  groupInvitesTable,
  groupMembersTable,
  prayerGroupsTable,
  usersTable,
  notificationsTable,
} from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { syncUserFromClerk, requireAuth } from "../lib/auth";
import type { AuthenticatedRequest } from "../lib/auth";
import {
  requireGroupMember,
  requireGroupRole,
  type GroupAuthRequest,
} from "../lib/groupAuth";

const router = Router();

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

function buildInviteUrl(
  token: string,
  req: { headers: Record<string, string | string[] | undefined> },
): string {
  const host = req.headers.host ?? "localhost";
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  return `${proto}://${host}/invite/${token}`;
}

// GET /groups/:groupId/invites — list invites (admin only)
router.get(
  "/groups/:groupId/invites",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  requireGroupRole("admin"),
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;

      const invites = await db
        .select()
        .from(groupInvitesTable)
        .where(eq(groupInvitesTable.groupId, groupId))
        .orderBy(groupInvitesTable.createdAt);

      res.json(
        invites.map((inv) => ({
          id: inv.id,
          groupId: inv.groupId,
          invitedEmail: inv.invitedEmail,
          token: inv.token,
          status: inv.status,
          expiresAt: inv.expiresAt?.toISOString() ?? null,
          maxUses: inv.maxUses,
          usedCount: inv.usedCount,
          createdAt: inv.createdAt.toISOString(),
          acceptedAt: inv.acceptedAt?.toISOString() ?? null,
          revokedAt: inv.revokedAt?.toISOString() ?? null,
          inviteUrl: buildInviteUrl(inv.token, req),
        })),
      );
    } catch (err) {
      req.log.error({ err }, "Failed to list invites");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// POST /groups/:groupId/invites — create invite (admin only)
router.post(
  "/groups/:groupId/invites",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  requireGroupRole("admin"),
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const dbUserId = req.dbUserId!;
      const { invitedEmail, expiresInDays, maxUses } = req.body as {
        invitedEmail?: string;
        expiresInDays?: number;
        maxUses?: number;
      };

      const token = generateToken();
      let expiresAt: Date | undefined;

      if (expiresInDays && expiresInDays > 0) {
        expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
      }

      const [invite] = await db
        .insert(groupInvitesTable)
        .values({
          groupId,
          invitedEmail: invitedEmail?.toLowerCase() ?? null,
          invitedByUserId: dbUserId,
          token,
          status: "pending",
          expiresAt,
          maxUses,
          usedCount: 0,
        })
        .returning();

      if (!invite) {
        res.status(500).json({ error: "Failed to create invite" });
        return;
      }

      if (invitedEmail) {
        const [group] = await db
          .select({ name: prayerGroupsTable.name })
          .from(prayerGroupsTable)
          .where(eq(prayerGroupsTable.id, groupId))
          .limit(1);

        const [existingUser] = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.email, invitedEmail.toLowerCase()))
          .limit(1);

        if (existingUser) {
          await db.insert(notificationsTable).values({
            userId: existingUser.id,
            groupId,
            type: "group_invitation",
            title: "Prayer Group Invitation",
            message: `You have been invited to join "${group?.name ?? "a prayer group"}".`,
            relatedEntityType: "group_invite",
            relatedEntityId: invite.id,
          });
        }
      }

      res.status(201).json({
        id: invite.id,
        groupId: invite.groupId,
        invitedEmail: invite.invitedEmail,
        token: invite.token,
        status: invite.status,
        expiresAt: invite.expiresAt?.toISOString() ?? null,
        maxUses: invite.maxUses,
        usedCount: invite.usedCount,
        createdAt: invite.createdAt.toISOString(),
        acceptedAt: null,
        revokedAt: null,
        inviteUrl: buildInviteUrl(invite.token, req),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to create invite");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// DELETE /groups/:groupId/invites/:inviteId — revoke invite (admin only)
router.delete(
  "/groups/:groupId/invites/:inviteId",
  syncUserFromClerk,
  requireAuth,
  requireGroupMember,
  requireGroupRole("admin"),
  async (req: GroupAuthRequest, res) => {
    try {
      const groupId = req.groupId!;
      const inviteId = String(req.params.inviteId);

      const [invite] = await db
        .select()
        .from(groupInvitesTable)
        .where(
          and(
            eq(groupInvitesTable.id, inviteId),
            eq(groupInvitesTable.groupId, groupId),
          ),
        )
        .limit(1);

      if (!invite) {
        res.status(404).json({ error: "Invite not found" });
        return;
      }

      if (invite.status !== "pending") {
        res.status(400).json({ error: "Only pending invites can be revoked" });
        return;
      }

      await db
        .update(groupInvitesTable)
        .set({ status: "revoked", revokedAt: new Date() })
        .where(eq(groupInvitesTable.id, inviteId));

      res.status(204).send();
    } catch (err) {
      req.log.error({ err }, "Failed to revoke invite");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// GET /invitations/my — list pending invitations for current user
router.get(
  "/invitations/my",
  syncUserFromClerk,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const dbUserEmail = req.dbUserEmail;
      if (!dbUserEmail) {
        res.json([]);
        return;
      }

      const invites = await db
        .select({
          id: groupInvitesTable.id,
          token: groupInvitesTable.token,
          groupId: groupInvitesTable.groupId,
          expiresAt: groupInvitesTable.expiresAt,
          createdAt: groupInvitesTable.createdAt,
          groupName: prayerGroupsTable.name,
          groupDescription: prayerGroupsTable.description,
          inviterFullName: usersTable.fullName,
          inviterEmail: usersTable.email,
        })
        .from(groupInvitesTable)
        .innerJoin(
          prayerGroupsTable,
          eq(groupInvitesTable.groupId, prayerGroupsTable.id),
        )
        .innerJoin(
          usersTable,
          eq(groupInvitesTable.invitedByUserId, usersTable.id),
        )
        .where(
          and(
            eq(groupInvitesTable.invitedEmail, dbUserEmail),
            eq(groupInvitesTable.status, "pending"),
          ),
        )
        .orderBy(groupInvitesTable.createdAt);

      res.json(
        invites
          .filter((inv) => !inv.expiresAt || inv.expiresAt > new Date())
          .map((inv) => ({
            id: inv.id,
            token: inv.token,
            groupId: inv.groupId,
            groupName: inv.groupName,
            groupDescription: inv.groupDescription,
            invitedByName: inv.inviterFullName,
            invitedByEmail: inv.inviterEmail,
            createdAt: inv.createdAt.toISOString(),
            expiresAt: inv.expiresAt?.toISOString() ?? null,
          })),
      );
    } catch (err) {
      req.log.error({ err }, "Failed to list my invitations");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// GET /invitations/:token — get invite preview (public)
router.get("/invitations/:token", async (req, res) => {
  try {
    const token = String(req.params.token);

    const [invite] = await db
      .select({
        id: groupInvitesTable.id,
        token: groupInvitesTable.token,
        groupId: groupInvitesTable.groupId,
        status: groupInvitesTable.status,
        expiresAt: groupInvitesTable.expiresAt,
        maxUses: groupInvitesTable.maxUses,
        usedCount: groupInvitesTable.usedCount,
        groupName: prayerGroupsTable.name,
        groupDescription: prayerGroupsTable.description,
        inviterFullName: usersTable.fullName,
      })
      .from(groupInvitesTable)
      .innerJoin(
        prayerGroupsTable,
        eq(groupInvitesTable.groupId, prayerGroupsTable.id),
      )
      .innerJoin(
        usersTable,
        eq(groupInvitesTable.invitedByUserId, usersTable.id),
      )
      .where(eq(groupInvitesTable.token, token))
      .limit(1);

    if (!invite) {
      res.status(404).json({ error: "Invite not found" });
      return;
    }

    const isExpired =
      (invite.expiresAt !== null && invite.expiresAt < new Date()) ||
      (invite.maxUses !== null && invite.usedCount >= invite.maxUses) ||
      invite.status !== "pending";

    res.json({
      id: invite.id,
      token: invite.token,
      groupId: invite.groupId,
      groupName: invite.groupName,
      groupDescription: invite.groupDescription,
      invitedByName: invite.inviterFullName,
      status: invite.status,
      expiresAt: invite.expiresAt?.toISOString() ?? null,
      isExpired,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /invitations/:token/accept
router.post(
  "/invitations/:token/accept",
  syncUserFromClerk,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const token = String(req.params.token);
      const dbUserId = req.dbUserId!;
      const dbUserEmail = req.dbUserEmail;

      const [invite] = await db
        .select()
        .from(groupInvitesTable)
        .where(eq(groupInvitesTable.token, token))
        .limit(1);

      if (!invite) {
        res.status(404).json({ error: "Invite not found" });
        return;
      }

      if (invite.status !== "pending") {
        res.status(400).json({ error: `Invite is ${invite.status}` });
        return;
      }

      if (invite.expiresAt && invite.expiresAt < new Date()) {
        await db
          .update(groupInvitesTable)
          .set({ status: "expired" })
          .where(eq(groupInvitesTable.id, invite.id));
        res.status(400).json({ error: "Invite has expired" });
        return;
      }

      if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
        res.status(400).json({ error: "Invite has reached its maximum uses" });
        return;
      }

      if (
        invite.invitedEmail &&
        dbUserEmail &&
        invite.invitedEmail !== dbUserEmail
      ) {
        res
          .status(403)
          .json({ error: "This invite was sent to a different email address" });
        return;
      }

      const [existingMember] = await db
        .select()
        .from(groupMembersTable)
        .where(
          and(
            eq(groupMembersTable.groupId, invite.groupId),
            eq(groupMembersTable.userId, dbUserId),
          ),
        )
        .limit(1);

      if (existingMember) {
        if (existingMember.status === "active") {
          res
            .status(400)
            .json({ error: "You are already a member of this group" });
          return;
        }
        await db
          .update(groupMembersTable)
          .set({ status: "active", role: "member" })
          .where(eq(groupMembersTable.id, existingMember.id));
      } else {
        await db.insert(groupMembersTable).values({
          groupId: invite.groupId,
          userId: dbUserId,
          role: "member",
          status: "active",
          invitedByUserId: invite.invitedByUserId,
        });
      }

      const newUsedCount = invite.usedCount + 1;
      const isEmailInvite = !!invite.invitedEmail;
      const isExhausted = invite.maxUses !== null && newUsedCount >= invite.maxUses;

      await db
        .update(groupInvitesTable)
        .set({
          usedCount: newUsedCount,
          ...(isEmailInvite
            ? { status: "accepted", acceptedAt: new Date() }
            : isExhausted
              ? { status: "expired" }
              : {}),
        })
        .where(eq(groupInvitesTable.id, invite.id));

      const [group] = await db
        .select()
        .from(prayerGroupsTable)
        .where(eq(prayerGroupsTable.id, invite.groupId))
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
            eq(groupMembersTable.groupId, invite.groupId),
            eq(groupMembersTable.status, "active"),
          ),
        );

      res.json({
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
        memberCount: Number(memberCountResult?.cnt ?? 0),
        myRole: "member",
        createdByUserId: group.createdByUserId,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to accept invite");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// POST /invitations/:token/decline
router.post(
  "/invitations/:token/decline",
  syncUserFromClerk,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const token = String(req.params.token);

      const [invite] = await db
        .select()
        .from(groupInvitesTable)
        .where(eq(groupInvitesTable.token, token))
        .limit(1);

      if (!invite) {
        res.status(404).json({ error: "Invite not found" });
        return;
      }

      if (invite.status !== "pending") {
        res
          .status(400)
          .json({ error: `Invite is already ${invite.status}` });
        return;
      }

      const dbUserEmail = req.dbUserEmail;
      if (invite.invitedEmail && dbUserEmail && invite.invitedEmail !== dbUserEmail) {
        res.status(403).json({ error: "This invite was not sent to you" });
        return;
      }

      await db
        .update(groupInvitesTable)
        .set({ status: "declined" })
        .where(eq(groupInvitesTable.id, invite.id));

      res.json({ success: true });
    } catch (err) {
      req.log.error({ err }, "Failed to decline invite");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
