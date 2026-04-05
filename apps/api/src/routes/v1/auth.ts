import { Router, Request, Response } from 'express';
import { Webhook } from 'svix';
import { prisma } from '@org/db';
import { ok, fail } from '../../lib/respond.js';

const router = Router();

// POST /api/v1/auth/webhook — Clerk user.created → insert AppUser
// Clerk sends raw body so we need express.raw() on this route
router.post(
  '/webhook',
  async (req: Request, res: Response): Promise<void> => {
    const secret = process.env['CLERK_WEBHOOK_SECRET'];
    if (!secret) {
      fail(res, 'CONFIG_ERROR', 'Webhook secret not configured', 500);
      return;
    }

    const svixId = req.headers['svix-id'] as string;
    const svixTimestamp = req.headers['svix-timestamp'] as string;
    const svixSignature = req.headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      fail(res, 'INVALID_WEBHOOK', 'Missing svix headers', 400);
      return;
    }

    let payload: { type: string; data: { id: string; email_addresses?: unknown[] } };
    try {
      const wh = new Webhook(secret);
      payload = wh.verify(
        JSON.stringify(req.body),
        { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': svixSignature },
      ) as typeof payload;
    } catch {
      fail(res, 'INVALID_WEBHOOK', 'Webhook signature verification failed', 400);
      return;
    }

    if (payload.type === 'user.created') {
      const clerkId = payload.data.id;
      await prisma.appUser.upsert({
        where: { clerkId },
        update: { lastActiveAt: new Date() },
        create: { clerkId },
      });
    }

    ok(res, { received: true });
  },
);

export default router;
