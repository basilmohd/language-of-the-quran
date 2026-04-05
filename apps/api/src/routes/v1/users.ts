import { Router, Request, Response } from 'express';
import { prisma } from '@org/db';
import { requireAuth } from '../../middleware/requireAuth.js';
import { ok } from '../../lib/respond.js';
import { cacheGet, cacheSet } from '../../lib/redis.js';
import type { UserStats } from '@org/api-types';

const router = Router();

// GET /api/v1/users/me/stats
router.get('/me/stats', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.appUser!.id;
  const cacheKey = `user:${userId}:stats`;

  const cached = await cacheGet<UserStats>(cacheKey);
  if (cached) { ok(res, cached); return; }

  const [streak, wordsLearned, learnedTopRanks] = await Promise.all([
    prisma.userStreak.findUnique({ where: { userId } }),
    prisma.userWordReview.count({ where: { userId, repetitions: { gte: 2 } } }),
    prisma.userWordReview.count({
      where: {
        userId,
        repetitions: { gte: 2 },
        word: { frequencyRank: { lte: 300, not: null } },
      },
    }),
  ]);

  // Quran coverage: % of top-300 frequency words the user has learned
  const quranCoverage = Math.round((learnedTopRanks / 300) * 100);

  const stats: UserStats = {
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    totalXp: streak?.totalXp ?? 0,
    wordsLearned,
    quranCoverage,
  };

  await cacheSet(cacheKey, stats, 24 * 3600);
  ok(res, stats);
});

// GET /api/v1/users/me/progress — completed lessons map
router.get('/me/progress', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.appUser!.id;
  const progress = await prisma.userLessonProgress.findMany({
    where: { userId },
    select: { lessonId: true, status: true, xpEarned: true, completedAt: true },
  });
  ok(res, progress);
});

// GET /api/v1/users/me/badges — earned badges
router.get('/me/badges', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.appUser!.id;
  const badges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' },
  });
  ok(res, badges.map((ub) => ({
    id: ub.badge.id,
    name: ub.badge.name,
    description: ub.badge.description,
    iconSlug: ub.badge.iconSlug,
    earnedAt: ub.earnedAt.toISOString(),
  })));
});

// GET /api/v1/users/me/word-bank — learned words (paginated)
router.get('/me/word-bank', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.appUser!.id;
  const limit = Math.min(Number(req.query['limit']) || 20, 50);
  const cursor = req.query['cursor'] as string | undefined;

  const reviews = await prisma.userWordReview.findMany({
    where: { userId, repetitions: { gte: 1 } },
    include: { word: { include: { root: true } } },
    orderBy: { lastReviewedAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = reviews.length > limit;
  const items = hasMore ? reviews.slice(0, limit) : reviews;

  ok(res, {
    items: items.map((r) => ({
      reviewId: r.id,
      wordId: r.wordId,
      arabic: r.word.arabic,
      transliteration: r.word.transliteration,
      meaning: r.word.meaning,
      wordType: r.word.wordType,
      root: r.word.root
        ? { arabic: r.word.root.arabic, primaryMeaning: r.word.root.primaryMeaning }
        : null,
      repetitions: r.repetitions,
      nextReviewAt: r.nextReviewAt.toISOString(),
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
});

export default router;
