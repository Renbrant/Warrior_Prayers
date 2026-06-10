import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  groupMembersTable,
  prayerRequestsTable,
  prayerCommitmentsTable,
  groupInvitesTable,
} from "@workspace/db";
import { eq, and, count, inArray } from "drizzle-orm";
import { requireAuth, syncUserFromClerk } from "../lib/auth";
import type { AuthenticatedRequest } from "../lib/auth";

const router = Router();

router.get(
  "/users/me",
  syncUserFromClerk,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const dbUserId = req.dbUserId;
      if (!dbUserId) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, dbUserId))
        .limit(1);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        id: user.id,
        clerkId: user.clerkId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        churchName: user.churchName,
        city: user.city,
        profilePhotoUrl: user.profilePhotoUrl,
        preferredLanguage: user.preferredLanguage || "en",
        primaryAuthProvider: user.primaryAuthProvider,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        isProfileComplete: !!(user.fullName && user.fullName.trim().length > 0),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to get user profile");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.patch(
  "/users/me",
  syncUserFromClerk,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const dbUserId = req.dbUserId;
      if (!dbUserId) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { fullName, phone, churchName, city, profilePhotoUrl, preferredLanguage } =
        req.body as {
          fullName?: string;
          phone?: string;
          churchName?: string;
          city?: string;
          profilePhotoUrl?: string;
          preferredLanguage?: string;
        };

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (fullName !== undefined) updates.fullName = fullName;
      if (phone !== undefined) updates.phone = phone;
      if (churchName !== undefined) updates.churchName = churchName;
      if (city !== undefined) updates.city = city;
      if (profilePhotoUrl !== undefined) updates.profilePhotoUrl = profilePhotoUrl;
      if (preferredLanguage !== undefined)
        updates.preferredLanguage = preferredLanguage;

      const [updated] = await db
        .update(usersTable)
        .set(updates)
        .where(eq(usersTable.id, dbUserId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        id: updated.id,
        clerkId: updated.clerkId,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        churchName: updated.churchName,
        city: updated.city,
        profilePhotoUrl: updated.profilePhotoUrl,
        preferredLanguage: updated.preferredLanguage || "en",
        primaryAuthProvider: updated.primaryAuthProvider,
        emailVerified: updated.emailVerified,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        lastLoginAt: updated.lastLoginAt?.toISOString() ?? null,
        isProfileComplete: !!(updated.fullName && updated.fullName.trim().length > 0),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to update user profile");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.patch(
  "/users/me/language",
  syncUserFromClerk,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const dbUserId = req.dbUserId;
      if (!dbUserId) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { language } = req.body as { language: string };

      if (!["en", "pt", "es"].includes(language)) {
        res.status(400).json({ error: "Invalid language. Must be en, pt, or es." });
        return;
      }

      const [updated] = await db
        .update(usersTable)
        .set({ preferredLanguage: language, updatedAt: new Date() })
        .where(eq(usersTable.id, dbUserId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        id: updated.id,
        clerkId: updated.clerkId,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        churchName: updated.churchName,
        city: updated.city,
        profilePhotoUrl: updated.profilePhotoUrl,
        preferredLanguage: updated.preferredLanguage || "en",
        primaryAuthProvider: updated.primaryAuthProvider,
        emailVerified: updated.emailVerified,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        lastLoginAt: updated.lastLoginAt?.toISOString() ?? null,
        isProfileComplete: !!(updated.fullName && updated.fullName.trim().length > 0),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to update language");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.get(
  "/dashboard/summary",
  syncUserFromClerk,
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const dbUserId = req.dbUserId;
      if (!dbUserId) {
        res.json({
          groupCount: 0,
          activeRequestCount: 0,
          closedRequestCount: 0,
          answeredPrayerCount: 0,
          myCommittedRequestCount: 0,
          pendingInvitationCount: 0,
        });
        return;
      }

      const activeMemberships = await db
        .select({ groupId: groupMembersTable.groupId })
        .from(groupMembersTable)
        .where(
          and(
            eq(groupMembersTable.userId, dbUserId),
            eq(groupMembersTable.status, "active"),
          ),
        );

      const groupIds = activeMemberships.map((m) => m.groupId);
      const groupCount = groupIds.length;

      let activeRequestCount = 0;
      let closedRequestCount = 0;
      let answeredPrayerCount = 0;

      if (groupIds.length > 0) {
        const activeResult = await db
          .select({ count: count() })
          .from(prayerRequestsTable)
          .where(
            and(
              inArray(prayerRequestsTable.groupId, groupIds),
              inArray(prayerRequestsTable.status, ["active", "follow_up"]),
            ),
          );

        const closedResult = await db
          .select({ count: count() })
          .from(prayerRequestsTable)
          .where(
            and(
              inArray(prayerRequestsTable.groupId, groupIds),
              eq(prayerRequestsTable.status, "closed"),
            ),
          );

        const answeredResult = await db
          .select({ count: count() })
          .from(prayerRequestsTable)
          .where(
            and(
              inArray(prayerRequestsTable.groupId, groupIds),
              eq(prayerRequestsTable.closureReason, "answered_prayer"),
            ),
          );

        activeRequestCount = Number(activeResult[0]?.count ?? 0);
        closedRequestCount = Number(closedResult[0]?.count ?? 0);
        answeredPrayerCount = Number(answeredResult[0]?.count ?? 0);
      }

      const committedResult = await db
        .select({ count: count() })
        .from(prayerCommitmentsTable)
        .where(eq(prayerCommitmentsTable.userId, dbUserId));

      const myCommittedRequestCount = Number(committedResult[0]?.count ?? 0);

      const currentUserEmail = req.dbUserEmail;
      const pendingInvitationsResult = currentUserEmail
        ? await db
            .select({ count: count() })
            .from(groupInvitesTable)
            .where(
              and(
                eq(groupInvitesTable.status, "pending"),
                eq(groupInvitesTable.invitedEmail, currentUserEmail),
              ),
            )
        : [{ count: 0 }];

      const pendingInvitationCount = Number(pendingInvitationsResult[0]?.count ?? 0);

      res.json({
        groupCount,
        activeRequestCount,
        closedRequestCount,
        answeredPrayerCount,
        myCommittedRequestCount,
        pendingInvitationCount,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to get dashboard summary");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
