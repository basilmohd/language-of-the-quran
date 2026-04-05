import { prisma } from '@org/db';
import type { BadgeSummary } from '@org/api-types';

interface BadgeCondition {
  type: 'lessons_completed' | 'words_learned' | 'streak' | 'level_completed';
  threshold?: number;
  levelNumber?: number;
}

interface UserStats {
  lessonsCompleted: number;
  wordsLearned: number;
  currentStreak: number;
  completedLevelNumbers?: number[];
}

export async function checkAndAwardBadges(
  userId: string,
  stats: UserStats,
): Promise<BadgeSummary[]> {
  const existingIds = (
    await prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } })
  ).map((b) => b.badgeId);

  const candidates = await prisma.badge.findMany({
    where: { id: { notIn: existingIds } },
  });

  const earned: BadgeSummary[] = [];

  for (const badge of candidates) {
    const cond = badge.condition as unknown as BadgeCondition;
    let qualifies = false;

    if (cond.type === 'lessons_completed' && cond.threshold !== undefined) {
      qualifies = stats.lessonsCompleted >= cond.threshold;
    } else if (cond.type === 'words_learned' && cond.threshold !== undefined) {
      qualifies = stats.wordsLearned >= cond.threshold;
    } else if (cond.type === 'streak' && cond.threshold !== undefined) {
      qualifies = stats.currentStreak >= cond.threshold;
    } else if (cond.type === 'level_completed' && cond.levelNumber !== undefined) {
      qualifies = (stats.completedLevelNumbers ?? []).includes(cond.levelNumber);
    }

    if (qualifies) {
      const ub = await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
      earned.push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        iconSlug: badge.iconSlug,
        earnedAt: ub.earnedAt.toISOString(),
      });
    }
  }

  return earned;
}
