import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  dbUserId?: string;
  dbUserEmail?: string;
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

  const user = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);

  if (user[0]) {
    req.dbUserId = user[0].id;
    req.dbUserEmail = user[0].email;
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

  const sessionClaims = auth?.sessionClaims as Record<string, unknown> | undefined;
  const email =
    (sessionClaims?.email as string) ||
    (sessionClaims?.primaryEmailAddress as string) ||
    `${clerkUserId}@unknown.local`;
  const fullName =
    (sessionClaims?.fullName as string) ||
    (sessionClaims?.name as string) ||
    null;
  const emailVerified = (sessionClaims?.email_verified as boolean) || false;
  const authProvider =
    (sessionClaims?.primaryAuthProvider as string) || "email";

  // Upsert: look up by clerkId OR email so we attach the clerkId to an
  // existing email row rather than inserting a duplicate and hitting
  // the unique constraint on email.
  const existing = await db
    .select({ id: usersTable.id, clerkId: usersTable.clerkId })
    .from(usersTable)
    .where(or(eq(usersTable.clerkId, clerkUserId), eq(usersTable.email, email)))
    .limit(1);

  if (existing.length === 0) {
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

    if (!newUser) {
      req.log?.error("Failed to insert new user during Clerk sync");
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    req.dbUserId = newUser.id;
    req.dbUserEmail = email;
  } else {
    const existingRow = existing[0];

    // If found by email but clerkId is different/missing, attach the new clerkId.
    const updateFields: Record<string, unknown> = {
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    };
    if (existingRow.clerkId !== clerkUserId) {
      updateFields.clerkId = clerkUserId;
    }

    await db
      .update(usersTable)
      .set(updateFields)
      .where(eq(usersTable.id, existingRow.id));

    req.dbUserId = existingRow.id;
    req.dbUserEmail = email;
  }

  req.userId = clerkUserId;
  next();
};
