import { Router, Request, Response } from 'express';
import { prisma } from '@org/db';
import { requireAuth } from '../../middleware/requireAuth.js';
import { ok } from '../../lib/respond.js';
import { cacheGet, cacheSet, cacheDel } from '../../lib/redis.js';

const router = Router();

// GET /api/v1/reviews/queue — today's due review items (Redis-cached)
router.get('/queue', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.appUser!.id;
  const cacheKey = `user:${userId}:review_queue`;

  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) { ok(res, cached); return; }

  const due = await prisma.userWordReview.findMany({
    where: { userId, nextReviewAt: { lte: new Date() } },
    include: { word: { include: { root: true } } },
    orderBy: { nextReviewAt: 'asc' },
    take: 20,
  });

  const queue = due.map((r) => ({
    reviewId: r.id,
    wordId: r.wordId,
    arabic: r.word.arabic,
    transliteration: r.word.transliteration,
    meaning: r.word.meaning,
    wordType: r.word.wordType,
    root: r.word.root
      ? { arabic: r.word.root.arabic, primaryMeaning: r.word.root.primaryMeaning }
      : null,
    intervalDays: r.intervalDays,
    repetitions: r.repetitions,
  }));

  await cacheSet(cacheKey, queue, 3600);
  ok(res, queue);
});

// POST /api/v1/reviews/submit — submit batch review results
router.post('/submit', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.appUser!.id;
  const { items } = req.body as {
    items: Array<{ wordId: string; quality: number; responseTimeMs?: number }>;
  };

  if (!Array.isArray(items) || items.length === 0) {
    ok(res, { processed: 0 });
    return;
  }

  const session = await prisma.reviewSession.create({
    data: {
      userId,
      itemsReviewed: items.length,
      itemsCorrect: items.filter((i) => i.quality >= 3).length,
      completedAt: new Date(),
    },
  });

  for (const item of items) {
    const existing = await prisma.userWordReview.findUnique({
      where: { userId_wordId: { userId, wordId: item.wordId } },
    });
    if (!existing) continue;

    const q = Math.min(5, Math.max(0, item.quality));
    const ef = Number(existing.easinessFactor);
    const newEf = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    let newInterval: number;
    let newReps: number;

    if (q < 3) {
      newInterval = 1;
      newReps = 0;
    } else {
      newReps = existing.repetitions + 1;
      if (newReps === 1) newInterval = 1;
      else if (newReps === 2) newInterval = 6;
      else newInterval = Math.round(existing.intervalDays * newEf);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    await prisma.userWordReview.update({
      where: { id: existing.id },
      data: {
        easinessFactor: newEf,
        intervalDays: newInterval,
        repetitions: newReps,
        nextReviewAt: nextReview,
        lastReviewedAt: new Date(),
        lastQuality: q,
        totalReviews: { increment: 1 },
        totalCorrect: q >= 3 ? { increment: 1 } : undefined,
      },
    });

    await prisma.reviewLog.create({
      data: {
        reviewId: existing.id,
        userId,
        quality: q,
        responseTimeMs: item.responseTimeMs ?? null,
        intervalBefore: existing.intervalDays,
        intervalAfter: newInterval,
        efBefore: ef,
        efAfter: newEf,
        sessionId: session.id,
      },
    });
  }

  // Invalidate queue cache
  await cacheDel(`user:${userId}:review_queue`);

  ok(res, { processed: items.length, sessionId: session.id });
});

export default router;
