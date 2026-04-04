import { Router, Request, Response } from 'express';
import { prisma } from '@org/db';
import { requireAuth } from '../../middleware/requireAuth.js';
import { ok, fail } from '../../lib/respond.js';
import type { LevelWithUnits } from '@org/api-types';

const router = Router();

// GET /api/v1/levels — all levels + units + lock status
router.get('/levels', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.appUser!.id;

  const [levels, completedLessons] = await Promise.all([
    prisma.level.findMany({
      orderBy: { number: 'asc' },
      include: {
        units: {
          orderBy: { number: 'asc' },
          include: { lessons: { orderBy: { number: 'asc' }, where: { isPublished: true } } },
        },
      },
    }),
    prisma.userLessonProgress.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { lessonId: true },
    }),
  ]);

  const completedSet = new Set(completedLessons.map((p) => p.lessonId));

  // Level 1 is always unlocked; level N+1 unlocks when all level N lessons are completed
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

  const result: LevelWithUnits[] = levels.map((level, idx) => {
    const isUnlocked = idx === 0 || completedByLevel[idx] === totalByLevel[idx];

    return {
      id: level.id,
      number: level.number,
      title: level.title,
      description: level.description,
      isUnlocked,
      units: level.units.map((unit) => ({
        id: unit.id,
        number: unit.number,
        title: unit.title,
        lessons: unit.lessons.map((lesson, lessonIdx) => {
          const prevLessonInUnit = lessonIdx === 0
            ? (unit.number === 1 && isUnlocked) // first lesson of first unit
              ? true
              : unit.lessons[lessonIdx - 1] !== undefined
                ? completedSet.has(unit.lessons[lessonIdx - 1].id)
                : false
            : completedSet.has(unit.lessons[lessonIdx - 1].id);

          const isLessonUnlocked = isUnlocked && (lessonIdx === 0 || prevLessonInUnit);

          return {
            id: lesson.id,
            number: lesson.number,
            title: lesson.title,
            xpReward: lesson.xpReward,
            status: completedSet.has(lesson.id)
              ? 'COMPLETED'
              : 'NOT_STARTED',
            isUnlocked: isLessonUnlocked,
          };
        }),
      })),
    };
  });

  ok(res, result);
});

// GET /api/v1/units/:id/lessons — lessons in unit (paginated)
router.get('/units/:id/lessons', requireAuth, async (req: Request, res: Response): Promise<void> => {
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
});

// GET /api/v1/lessons/:id — full lesson with exercises JSON
router.get('/lessons/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
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
});

// POST /api/v1/lessons/:id/complete — award XP, update streak, check badges
router.post(
  '/lessons/:id/complete',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
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

    // Update streak
    const { updateStreak } = await import('../../services/streakService.js');
    const streakData = await updateStreak(userId, timezone, safeXp);

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

    // Find next lesson in sequence
    const completedUnit = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { unit: { include: { lessons: { orderBy: { number: 'asc' }, where: { isPublished: true } } } } },
    });

    let nextLessonId: string | undefined;
    if (completedUnit) {
      const lessonIdx = completedUnit.unit.lessons.findIndex((l) => l.id === lessonId);
      const nextInUnit = completedUnit.unit.lessons[lessonIdx + 1];
      if (nextInUnit) {
        nextLessonId = nextInUnit.id;
      }
    }

    ok(res, {
      xpEarned: safeXp,
      newStreak: streakData.currentStreak,
      badgesEarned,
      nextLessonId,
    });
  },
);

export default router;
