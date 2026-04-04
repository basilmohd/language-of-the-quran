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

// Middleware: verify Clerk JWT, then resolve AppUser from DB
export const requireAuth = [
  clerkRequireAuth(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const clerkId = getAuth(req).userId;
    if (!clerkId) {
      fail(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }
    const user = await prisma.appUser.findUnique({
      where: { clerkId },
      select: { id: true, clerkId: true, timezone: true },
    });
    if (!user) {
      fail(res, 'USER_NOT_FOUND', 'User record not found — try signing out and back in', 404);
      return;
    }
    req.appUser = user;
    next();
  },
];
