import { Router, Request, Response } from 'express';
import { prisma } from '@org/db';
import { requireAuth } from '../../middleware/requireAuth.js';
import { ok, fail, asyncHandler } from '../../lib/respond.js';
import { cacheGet, cacheSet, cacheDel } from '../../lib/redis.js';
import type {
  LevelSummary,
  LevelDetail,
  UnitSummary,
  XpTier,
  UnitCompletedEvent,
  LevelCompletedEvent,
  LessonProgressSnapshot,
} from '@org/api-types';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Given a totalXp value and all XpTier rows (sorted by xpRequired asc), return current tier */
function resolveXpTier(totalXp: number, tiers: XpTier[]): XpTier {
  let current = tiers[0];
  for (const tier of tiers) {
    if (totalXp >= tier.xpRequired) current = tier;
  }
  return current;
}

// ── GET /api/v1/levels — level summaries (no unit/lesson detail) ─────────────
router.get('/levels', requireAuth, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.appUser!.id;
  const cacheKey = `user:${userId}:level-summaries`;

  const cached = await cacheGet<LevelSummary[]>(cacheKey);
  if (cached) { ok(res, cached); return; }

  const [levels, completedLessons] = await Promise.all([
    prisma.level.findMany({
      orderBy: { number: 'asc' },
      include: {
        units: {
          include: { lessons: { where: { isPublished: true }, select: { id: true } } },
        },
      },
    }),
    prisma.userLessonProgress.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { lessonId: true },
    }),
  ]);

  const completedSet = new Set(completedLessons.map((p) => p.lessonId));

  const completedByLevel: Record<number, number> = {};
  const totalByLevel: Record<number, number> = {};

  for (const level of levels) {
    let total = 0;
    let done = 0;
    for (const unit of level.units) {
      for (const lesson of unit.lessons) {
        total++;
        if (completedSet.has(lesson.id)) done++;
      }
    }
    completedByLevel[level.number] = done;
    totalByLevel[level.number] = total;
  }

  const result: LevelSummary[] = levels.map((level, idx) => {
    const isUnlocked = idx === 0 || completedByLevel[idx] === totalByLevel[idx];
    const milestone = level.milestone as { badge: string; badgeIcon: string; message: string } | null;

    return {
      id: level.id,
      number: level.number,
      title: level.title,
      tagline: level.tagline,
      icon: level.icon,
      description: level.description,
      isUnlocked,
      unitCount: level.units.length,
      completedLessonCount: completedByLevel[level.number] ?? 0,
      totalLessonCount: totalByLevel[level.number] ?? 0,
      milestone: milestone ? { badge: milestone.badge, badgeIcon: milestone.badgeIcon, message: milestone.message } : null,
    };
  });

  await cacheSet(cacheKey, result, 5 * 60); // 5 min TTL
  ok(res, result);
}));

// ── GET /api/v1/levels/:id — single level with units + lesson status ──────────
router.get('/levels/:id', requireAuth, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.appUser!.id;
  const levelId = req.params['id'];
  const cacheKey = `user:${userId}:level:${levelId}`;

  const cached = await cacheGet<LevelDetail>(cacheKey);
  if (cached) { ok(res, cached); return; }

  const [level, allLevels, completedLessons] = await Promise.all([
    prisma.level.findUnique({
      where: { id: levelId },
      include: {
        units: {
          orderBy: { number: 'asc' },
          include: { lessons: { orderBy: { number: 'asc' }, where: { isPublished: true } } },
        },
      },
    }),
    prisma.level.findMany({
      orderBy: { number: 'asc' },
      include: {
        units: {
          include: { lessons: { where: { isPublished: true }, select: { id: true } } },
        },
      },
    }),
    prisma.userLessonProgress.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { lessonId: true },
    }),
  ]);

  if (!level) { fail(res, 'NOT_FOUND', 'Level not found', 404); return; }

  const completedSet = new Set(completedLessons.map((p) => p.lessonId));

  // Determine if this level is unlocked
  const levelIndex = allLevels.findIndex((l) => l.id === levelId);
  let isUnlocked = levelIndex === 0;
  if (levelIndex > 0) {
    const prevLevel = allLevels[levelIndex - 1];
    const prevTotal = prevLevel.units.reduce((sum, u) => sum + u.lessons.length, 0);
    const prevDone = prevLevel.units.reduce(
      (sum, u) => sum + u.lessons.filter((l) => completedSet.has(l.id)).length,
      0
    );
    isUnlocked = prevDone === prevTotal;
  }

  const totalLessonCount = level.units.reduce((sum, u) => sum + u.lessons.length, 0);
  const completedLessonCount = level.units.reduce(
    (sum, u) => sum + u.lessons.filter((l) => completedSet.has(l.id)).length,
    0
  );
  const milestone = level.milestone as { badge: string; badgeIcon: string; message: string } | null;

  const units: UnitSummary[] = level.units.map((unit, unitIdx) => {
    const prevUnit = level.units[unitIdx - 1];
    const prevUnitLastLesson = prevUnit?.lessons[prevUnit.lessons.length - 1];

    return {
      id: unit.id,
      number: unit.number,
      title: unit.title,
      tagline: unit.tagline,
      xpBonus: unit.xpBonus,
      badge: unit.badge as { title: string; icon: string } | undefined,
      lessons: unit.lessons.map((lesson, lessonIdx) => {
        let isLessonUnlocked: boolean;
        if (!isUnlocked) {
          isLessonUnlocked = false;
        } else if (lessonIdx === 0) {
          isLessonUnlocked = unitIdx === 0 || (prevUnitLastLesson != null && completedSet.has(prevUnitLastLesson.id));
        } else {
          isLessonUnlocked = completedSet.has(unit.lessons[lessonIdx - 1].id);
        }

        return {
          id: lesson.id,
          number: lesson.number,
          title: lesson.title,
          xpReward: lesson.xpReward,
          status: completedSet.has(lesson.id) ? 'COMPLETED' : 'NOT_STARTED',
          isUnlocked: isLessonUnlocked,
        };
      }),
    };
  });

  const result: LevelDetail = {
    id: level.id,
    number: level.number,
    title: level.title,
    tagline: level.tagline,
    icon: level.icon,
    description: level.description,
    isUnlocked,
    unitCount: level.units.length,
    completedLessonCount,
    totalLessonCount,
    milestone: milestone ? { badge: milestone.badge, badgeIcon: milestone.badgeIcon, message: milestone.message } : null,
    units,
  };

  await cacheSet(cacheKey, result, 5 * 60);
  ok(res, result);
}));

// GET /api/v1/units/:id/lessons — lessons in unit (paginated)
router.get('/units/:id/lessons', requireAuth, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const limit = Math.min(Number(req.query['limit']) || 20, 50);
  const cursor = req.query['cursor'] as string | undefined;

  const lessons = await prisma.lesson.findMany({
    where: { unitId: id, isPublished: true },
    orderBy: { number: 'asc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = lessons.length > limit;
  const items = hasMore ? lessons.slice(0, limit) : lessons;

  ok(res, {
    items: items.map((l) => ({ id: l.id, number: l.number, title: l.title, xpReward: l.xpReward })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}));

// GET /api/v1/lessons/:id — full lesson with exercises JSON
router.get('/lessons/:id', requireAuth, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params['id'] },
    include: { unit: { include: { level: true } } },
  });

  if (!lesson || !lesson.isPublished) {
    fail(res, 'NOT_FOUND', 'Lesson not found', 404);
    return;
  }

  ok(res, {
    id: lesson.id,
    number: lesson.number,
    title: lesson.title,
    xpReward: lesson.xpReward,
    contentHash: lesson.contentHash,
    exercises: lesson.exercises,
    unit: { id: lesson.unit.id, title: lesson.unit.title },
    level: { id: lesson.unit.level.id, number: lesson.unit.level.number, title: lesson.unit.level.title },
  });
}));

// POST /api/v1/lessons/:id/complete — award XP, update streak, check badges
router.post(
  '/lessons/:id/complete',
  requireAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.appUser!.id;
    const { timezone } = req.appUser!;
    const lessonId = req.params['id'];

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson || !lesson.isPublished) {
      fail(res, 'NOT_FOUND', 'Lesson not found', 404);
      return;
    }

    const { xpEarned, attemptsTotal, firstAttemptScore, timeSpentMs, reviewItems } = req.body as {
      xpEarned: number;
      attemptsTotal: number;
      firstAttemptScore: number;
      timeSpentMs: number;
      reviewItems: Array<{ wordId: string; quality: number; responseTimeMs?: number }>;
    };

    const safeXp = Math.min(Math.max(xpEarned ?? 5, 5), lesson.xpReward);

    // Upsert lesson progress
    await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        status: 'COMPLETED',
        xpEarned: safeXp,
        attemptsTotal: attemptsTotal ?? 1,
        firstAttemptScore: firstAttemptScore ?? null,
        timeSpentMs: BigInt(timeSpentMs ?? 0),
        lastAttemptedAt: new Date(),
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        status: 'COMPLETED',
        xpEarned: safeXp,
        attemptsTotal: attemptsTotal ?? 1,
        firstAttemptScore: firstAttemptScore ?? null,
        timeSpentMs: BigInt(timeSpentMs ?? 0),
        firstStartedAt: new Date(),
        lastAttemptedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Process SRS review items
    if (reviewItems?.length) {
      const session = await prisma.reviewSession.create({
        data: { userId, itemsReviewed: reviewItems.length, itemsCorrect: reviewItems.filter((r) => r.quality >= 3).length, completedAt: new Date() },
      });

      for (const item of reviewItems) {
        const existing = await prisma.userWordReview.findUnique({
          where: { userId_wordId: { userId, wordId: item.wordId } },
        });

        const ef = existing ? Number(existing.easinessFactor) : 2.5;
        const reps = existing ? existing.repetitions : 0;
        const interval = existing ? existing.intervalDays : 1;

        // SM-2 calculation
        const q = Math.min(5, Math.max(0, item.quality));
        const newEf = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        let newInterval: number;
        let newReps: number;

        if (q < 3) {
          newInterval = 1;
          newReps = 0;
        } else {
          newReps = reps + 1;
          if (newReps === 1) newInterval = 1;
          else if (newReps === 2) newInterval = 6;
          else newInterval = Math.round(interval * newEf);
        }

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newInterval);

        if (existing) {
          await prisma.userWordReview.update({
            where: { userId_wordId: { userId, wordId: item.wordId } },
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
        } else {
          await prisma.userWordReview.create({
            data: {
              userId,
              wordId: item.wordId,
              itemType: 'word',
              easinessFactor: newEf,
              intervalDays: newInterval,
              repetitions: newReps,
              nextReviewAt: nextReview,
              lastReviewedAt: new Date(),
              lastQuality: q,
              totalReviews: 1,
              totalCorrect: q >= 3 ? 1 : 0,
            },
          });
        }

        await prisma.reviewLog.create({
          data: {
            reviewId: existing?.id ?? (await prisma.userWordReview.findUnique({ where: { userId_wordId: { userId, wordId: item.wordId } } }))!.id,
            userId,
            quality: q,
            responseTimeMs: item.responseTimeMs ?? null,
            intervalBefore: interval,
            intervalAfter: newInterval,
            efBefore: ef,
            efAfter: newEf,
            lessonId,
            sessionId: session.id,
          },
        });
      }
    }

    // Invalidate caches so next load reflects the new completion status
    await Promise.all([
      cacheDel(`user:${userId}:level-summaries`),
      cacheDel(`user:${userId}:stats`),
    ]);

    // Update streak and get XP totals before/after
    const { updateStreak } = await import('../../services/streakService.js');

    // Get XP before this lesson (to compute levelUp)
    const streakBefore = await prisma.userStreak.findUnique({ where: { userId } });
    const xpBefore = streakBefore?.totalXp ?? 0;

    const streakData = await updateStreak(userId, timezone, safeXp);
    const newTotalXp = streakData.totalXp ?? xpBefore + safeXp;

    // Fetch all XP tiers for tier comparison
    const allTiers = await prisma.xpTier.findMany({ orderBy: { xpRequired: 'asc' } });
    const tiersAsXpTier: XpTier[] = allTiers.map((t) => ({ level: t.level, title: t.title, xpRequired: t.xpRequired }));

    let levelUp: { from: XpTier; to: XpTier } | null = null;
    if (tiersAsXpTier.length > 0) {
      const tierBefore = resolveXpTier(xpBefore, tiersAsXpTier);
      const tierAfter = resolveXpTier(newTotalXp, tiersAsXpTier);
      if (tierBefore.level !== tierAfter.level) {
        levelUp = { from: tierBefore, to: tierAfter };
      }
    }

    // Check badges
    const [lessonsCompleted, wordsLearned] = await Promise.all([
      prisma.userLessonProgress.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.userWordReview.count({ where: { userId, repetitions: { gte: 2 } } }),
    ]);

    const { checkAndAwardBadges } = await import('../../services/badgeService.js');
    const badgesEarned = await checkAndAwardBadges(userId, {
      lessonsCompleted,
      wordsLearned,
      currentStreak: streakData.currentStreak,
    });

    // Fetch lesson's unit + level structure for unlock computation
    const completedLessonData = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        unit: {
          include: {
            lessons: { orderBy: { number: 'asc' }, where: { isPublished: true } },
            level: {
              include: {
                units: {
                  orderBy: { number: 'asc' },
                  include: { lessons: { orderBy: { number: 'asc' }, where: { isPublished: true } } },
                },
              },
            },
          },
        },
      },
    });

    // Fetch all completed lessons after this completion
    const allCompleted = await prisma.userLessonProgress.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { lessonId: true },
    });
    const completedSet = new Set(allCompleted.map((p) => p.lessonId));

    // Compute newly unlocked lessons and units
    const newlyUnlockedLessons: string[] = [];
    const newlyUnlockedUnits: string[] = [];
    const newlyUnlockedLevels: string[] = [];

    let unitCompleted: UnitCompletedEvent | null = null;
    let levelCompleted: LevelCompletedEvent | null = null;

    if (completedLessonData) {
      const currentUnit = completedLessonData.unit;
      const currentLevel = currentUnit.level;
      const units = currentLevel.units;

      // Check if unit is now complete
      const allUnitLessons = currentUnit.lessons;
      const allUnitDone = allUnitLessons.every((l) => completedSet.has(l.id));

      if (allUnitDone) {
        const unitBadge = currentUnit.badge as { title: string; icon: string } | null;
        const unitIdx = units.findIndex((u) => u.id === currentUnit.id);
        const nextUnit = units[unitIdx + 1];

        unitCompleted = {
          unitId: currentUnit.id,
          badge: unitBadge,
          xpBonus: currentUnit.xpBonus,
          message: currentUnit.tagline,
          newlyUnlockedUnit: nextUnit?.id ?? null,
        };

        // Award xpBonus for unit completion
        if (currentUnit.xpBonus > 0) {
          await updateStreak(userId, timezone, currentUnit.xpBonus);
        }

        if (nextUnit) {
          newlyUnlockedUnits.push(nextUnit.id);
          // First lesson of the next unit is now unlocked
          if (nextUnit.lessons[0]) {
            newlyUnlockedLessons.push(nextUnit.lessons[0].id);
          }
        }

        // Check if entire level is complete
        const allLevelLessons = units.flatMap((u) => u.lessons);
        const allLevelDone = allLevelLessons.every((l) => completedSet.has(l.id));

        if (allLevelDone) {
          const milestone = currentLevel.milestone as {
            badge: string; badgeIcon: string; message: string;
            surahUnlock?: string; unlocksLevel: string | null;
          } | null;

          // Fetch all levels to find the next one
          const allLevels = await prisma.level.findMany({ orderBy: { number: 'asc' } });
          const levelIdx = allLevels.findIndex((l) => l.id === currentLevel.id);
          const nextLevel = allLevels[levelIdx + 1];

          levelCompleted = {
            levelId: currentLevel.id,
            badge: milestone ? { title: milestone.badge, icon: milestone.badgeIcon } : null,
            message: milestone?.message ?? '',
            surahUnlock: milestone?.surahUnlock ?? null,
            newlyUnlockedLevel: nextLevel?.id ?? null,
          };

          if (nextLevel) {
            newlyUnlockedLevels.push(nextLevel.id);
          }
        }
      } else {
        // Unit not complete — check if next lesson in unit is newly unlocked
        const lessonIdx = allUnitLessons.findIndex((l) => l.id === lessonId);
        const nextInUnit = allUnitLessons[lessonIdx + 1];
        if (nextInUnit && !completedSet.has(nextInUnit.id)) {
          newlyUnlockedLessons.push(nextInUnit.id);
        }
      }

      // Invalidate level-detail cache for this level
      await cacheDel(`user:${userId}:level:${currentLevel.id}`);
    }

    // Build updatedProgress snapshot for completed lesson + any newly unlocked
    const updatedProgress: Record<string, LessonProgressSnapshot> = {};

    updatedProgress[lessonId] = {
      status: 'completed',
      score: firstAttemptScore ?? null,
      maxScore: lesson.xpReward,
      completedAt: new Date().toISOString(),
      xpEarned: safeXp,
    };

    for (const unlockedId of newlyUnlockedLessons) {
      updatedProgress[unlockedId] = {
        status: 'available',
        score: null,
        maxScore: null,
        completedAt: null,
        xpEarned: 0,
      };
    }

    ok(res, {
      lessonId,
      xpAwarded: safeXp,
      newTotalXp,
      newStreak: streakData.currentStreak,
      levelUp,
      newlyUnlocked: { lessons: newlyUnlockedLessons, units: newlyUnlockedUnits, levels: newlyUnlockedLevels },
      unitCompleted,
      levelCompleted,
      badgesEarned,
      updatedProgress,
    });
  }),
);

export default router;
