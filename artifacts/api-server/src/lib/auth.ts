import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  dbUserId?: string;
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;

  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.userId = clerkUserId;

  try {
    const user = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkUserId))
      .limit(1);

    if (user[0]) {
      req.dbUserId = user[0].id;
    }
  } catch (err) {
    req.log?.error({ err }, "Failed to fetch dbUserId in requireAuth");
  }

  next();
};

export const syncUserFromClerk = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;

  if (!clerkUserId) {
    next();
    return;
  }

  try {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkUserId))
      .limit(1);

    if (existing.length === 0) {
      const sessionClaims = auth?.sessionClaims as Record<string, unknown> | undefined;
      const email =
        (sessionClaims?.email as string) ||
        (sessionClaims?.primaryEmailAddress as string) ||
        `${clerkUserId}@unknown.local`;
      const fullName =
        (sessionClaims?.fullName as string) ||
        (sessionClaims?.name as string) ||
        null;
      const emailVerified =
        (sessionClaims?.email_verified as boolean) || false;
      const authProvider =
        (sessionClaims?.primaryAuthProvider as string) || "email";

      const [newUser] = await db
        .insert(usersTable)
        .values({
          clerkId: clerkUserId,
          email,
          fullName,
          emailVerified,
          primaryAuthProvider: authProvider,
          preferredLanguage: "en",
          lastLoginAt: new Date(),
        })
        .returning({ id: usersTable.id });

      req.dbUserId = newUser?.id;
    } else {
      await db
        .update(usersTable)
        .set({ lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(usersTable.clerkId, clerkUserId));

      req.dbUserId = existing[0].id;
    }

    req.userId = clerkUserId;
  } catch (err) {
    req.log?.error({ err }, "Failed to sync user from Clerk");
  }

  next();
};
