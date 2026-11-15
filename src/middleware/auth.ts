import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { adminAuth } from '../lib/firebase-admin.ts';

export type UserRole = 'admin' | 'editor' | 'researcher';

export interface DbUserRecord {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  role: string;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: DbUserRecord;
}

const BOOTSTRAP_ADMIN_EMAIL = 'naveed.akbar.main@gmail.com';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string | null,
): Promise<DbUserRecord> {
  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(users)
        .set({
          email,
          displayName: displayName ?? existing[0].displayName,
          updatedAt: new Date(),
        })
        .where(eq(users.uid, uid))
        .returning();
      return updated[0];
    }

    const adminCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, 'admin'));

    const hasAdmin = (adminCountResult[0]?.count ?? 0) > 0;
    const assignedRole: UserRole =
      email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL || !hasAdmin
        ? 'admin'
        : 'researcher';

    const inserted = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName ?? null,
        role: assignedRole,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database user upsert failed:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    const dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email ?? 'unknown@pakpolitico.pk',
      decodedToken.name ?? null,
    );
    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = (req.dbUser?.role ?? 'researcher') as UserRole;
    if (!allowedRoles.includes(role)) {
      res.status(403).json({
        error: `Forbidden: This action requires ${allowedRoles.join(' or ')} permissions.`,
      });
      return;
    }
    next();
  };
};
