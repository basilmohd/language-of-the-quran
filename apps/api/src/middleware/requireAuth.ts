import { requireAuth as clerkRequireAuth, getAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@org/db';
import { fail } from '../lib/respond.js';

// Augment Express Request with resolved AppUser
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      appUser?: { id: string; clerkId: string; timezone: string };
    }
  }
}

// In-memory user cache — avoids a DB round-trip on every authenticated request.
// TTL: 5 minutes. Invalidated automatically on expiry (no manual invalidation needed
// since timezone is the only mutable field and changes are infrequent).
const USER_CACHE_TTL_MS = 5 * 60 * 1000;
const userCache = new Map<string, { user: { id: string; clerkId: string; timezone: string }; expiresAt: number }>();

function getCachedUser(clerkId: string) {
  const entry = userCache.get(clerkId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    userCache.delete(clerkId);
    return null;
  }
  return entry.user;
}

function setCachedUser(clerkId: string, user: { id: string; clerkId: string; timezone: string }) {
  userCache.set(clerkId, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
}

// Middleware: verify Clerk JWT, then resolve AppUser from DB
export const requireAuth = [
  clerkRequireAuth(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const clerkId = getAuth(req).userId;
    if (!clerkId) {
      fail(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    const cached = getCachedUser(clerkId);
    if (cached) {
      req.appUser = cached;
      next();
      return;
    }

    const user = await prisma.appUser.upsert({
      where: { clerkId },
      create: { clerkId },
      update: {},
      select: { id: true, clerkId: true, timezone: true },
    });

    setCachedUser(clerkId, user);
    req.appUser = user;
    next();
  },
];
