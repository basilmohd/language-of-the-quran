// SM-2 Spaced Repetition Algorithm — pure TypeScript, zero dependencies
// Shared between web (offline capable), mobile, and API

export interface SrsItem {
  easinessFactor: number;  // default 2.5, floor 1.3
  intervalDays: number;    // default 1
  repetitions: number;     // 0 = never reviewed
}

export interface SrsResult {
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: Date;
}

/**
 * Calculate the next review schedule using the SM-2 algorithm.
 *
 * @param item  Current SRS state for the item
 * @param quality  0–5 (0–2 = failed recall, 3–5 = successful recall)
 * @param now  Reference date for scheduling (defaults to Date.now())
 */
export function calculateNextReview(
  item: SrsItem,
  quality: number,
  now: Date = new Date()
): SrsResult {
  if (quality < 0 || quality > 5) {
    throw new RangeError(`quality must be 0–5, got ${quality}`);
  }

  let { easinessFactor, intervalDays, repetitions } = item;

  if (quality >= 3) {
    // Successful recall
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easinessFactor);
    }
    repetitions += 1;
  } else {
    // Failed recall — reset interval, keep EF update
    repetitions = 0;
    intervalDays = 1;
  }

  // Update easiness factor (SM-2 formula)
  easinessFactor = Math.max(
    1.3,
    easinessFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return { easinessFactor, intervalDays, repetitions, nextReviewAt };
}
