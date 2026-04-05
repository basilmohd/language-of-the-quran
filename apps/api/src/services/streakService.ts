import { prisma } from '@org/db';
import { cacheDel } from '../lib/redis.js';

function getUserLocalDate(timezone: string): string {
  // Returns 'YYYY-MM-DD' in the user's local timezone
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function previousDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function updateStreak(
  userId: string,
  timezone: string,
  xpToAdd: number,
): Promise<{ currentStreak: number; longestStreak: number; totalXp: number }> {
  const today = getUserLocalDate(timezone);

  const streak = await prisma.userStreak.findUnique({ where: { userId } });

  if (!streak) {
    const created = await prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        totalXp: xpToAdd,
        lastActivityDate: new Date(`${today}T00:00:00.000Z`),
      },
    });
    await cacheDel(`user:${userId}:streak`);
    return {
      currentStreak: created.currentStreak,
      longestStreak: created.longestStreak,
      totalXp: created.totalXp,
    };
  }

  const lastDate = streak.lastActivityDate
    ? streak.lastActivityDate.toISOString().slice(0, 10)
    : null;

  let newCurrent = streak.currentStreak;

  if (lastDate === today) {
    // Already counted today — just add XP, no streak change
  } else if (lastDate === previousDate(today)) {
    // Consecutive day
    newCurrent += 1;
  } else {
    // Gap — reset
    newCurrent = 1;
  }

  const newLongest = Math.max(streak.longestStreak, newCurrent);
  const newXp = streak.totalXp + xpToAdd;

  const updated = await prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      totalXp: newXp,
      lastActivityDate: new Date(`${today}T00:00:00.000Z`),
    },
  });

  await cacheDel(`user:${userId}:streak`);

  return {
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    totalXp: updated.totalXp,
  };
}
