import type { Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { groupMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import type { AuthenticatedRequest } from "./auth";

export interface GroupAuthRequest extends AuthenticatedRequest {
  groupId?: string;
  memberRole?: "admin" | "moderator" | "member";
  memberId?: string;
}

export const requireGroupMember = async (
  req: GroupAuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const dbUserId = req.dbUserId;
  if (!dbUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const groupId = String(req.params.groupId);
  if (!groupId) {
    res.status(400).json({ error: "Missing groupId" });
    return;
  }

  const membership = await db
    .select({ role: groupMembersTable.role, id: groupMembersTable.id })
    .from(groupMembersTable)
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, dbUserId),
        eq(groupMembersTable.status, "active"),
      ),
    )
    .limit(1);

  if (membership.length === 0) {
    res.status(403).json({ error: "You are not a member of this group" });
    return;
  }

  req.groupId = groupId;
  req.memberRole = membership[0].role as "admin" | "moderator" | "member";
  req.memberId = membership[0].id;
  next();
};

export const requireGroupRole = (requiredRole: "admin" | "moderator") => {
  return (req: GroupAuthRequest, res: Response, next: NextFunction) => {
    const role = req.memberRole;
    if (!role) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (requiredRole === "admin" && role !== "admin") {
      res.status(403).json({ error: "Admin role required" });
      return;
    }

    if (
      requiredRole === "moderator" &&
      role !== "admin" &&
      role !== "moderator"
    ) {
      res.status(403).json({ error: "Moderator or admin role required" });
      return;
    }

    next();
  };
};
