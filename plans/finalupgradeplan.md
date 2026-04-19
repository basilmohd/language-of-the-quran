# Plan: Curriculum Data Flow + XP Level System Overhaul

## Context

The `curriculum.json` has been significantly expanded (from ~14 lessons in Level 1 to 6 full levels with 60+ lessons). `course.json` introduces an XP-tier title system (Seeker → Companion of the Book) and a "worlds" concept. The current app does not implement XP level titles, returns the entire curriculum in one API call, and the lesson completion response is missing key fields (`levelUp`, `newlyUnlocked`, `unitCompleted`) that the frontend will need for gamification events.

**Goal:** Align the database schema and API with the full curriculum, implement XP-level titles, break curriculum delivery into granular level/unit loads, and bring the completion API response in line with `completion-api-schema.json`.

---

## Scope Assessment

| Area | Change Size | Notes |
|------|-------------|-------|
| DB schema (Prisma) | Medium | Add fields + new XpTier table, 1 migration |
| Curriculum JSON split | Small | 1 file → 6 level files |
| Seed script | Small | Iterate level files instead of one |
| Completion API response | Medium | Add levelUp, unitCompleted, newlyUnlocked |
| Curriculum fetch API | Small | Add lazy-load by level |
| api-types lib | Small | Add new response fields |
| Frontend (Dashboard + Lesson) | Medium | Show XP title, completion events |

**Total deviation from current design:** Moderate. No breaking changes to existing endpoints — all additions/extensions. The DB migration is the only irreversible step.

---

## Terminology Alignment

`curriculum.json` and Prisma use **"Level"**, `course.json` uses **"World"**. Resolution:
- DB models remain `Level`, `Unit`, `Lesson` (already implemented)
- `course.json` `worlds` array maps 1:1 to levels
- No rename needed — keep "Level" internally, display as "World" in UI if desired

---

## Phase 1: Break `curriculum.json` Into Level Files

**File:** `libs/quran-data/src/data/curriculum.json` → split into:
```
libs/quran-data/src/data/levels/
  level-1.json   (level-1 object from curriculum.json)
  level-2.json
  level-3.json
  level-4.json
  level-5.json
  level-6.json
```

Each file is exactly the single level object from the `levels[]` array.  
Keep `curriculum.json` as an index file pointing to the 6 level files (or delete it — seed script will glob `levels/*.json`).

**Seed script update** (`apps/api/src/scripts/seed.ts`):
- Glob `libs/quran-data/src/data/levels/*.json` in sorted order
- Process each file independently (same upsert logic as today)
- This keeps memory usage low when seeding

---

## Phase 2: DB Schema — Add New Curriculum Fields

**File:** `apps/api/prisma/schema.prisma`

### Changes to existing models:

```prisma
model Level {
  // ADD:
  tagline     String   @default("")
  icon        String   @default("")
  milestone   Json?    // { badge, badgeIcon, message, surahUnlock?, unlocksLevel }
}

model Unit {
  // ADD:
  tagline     String   @default("")
  xpBonus     Int      @default(0)
  badge       Json?    // { title, icon }
  unlockedBy  String?  // unit ID or "level-N" string (curriculum unlock chain)
}

model Lesson {
  // ADD:
  lessonType        String   @default("concept")  // concept|grammar|vocabulary|application|review
  estimatedMinutes  Int      @default(10)
  unlockedBy        String?  // lesson ID or unit ID string
}
```

### New model:

```prisma
model XpTier {
  id          String   @id @default(uuid())
  level       Int      @unique   // 1–6
  title       String             // "Seeker", "Reader", etc.
  xpRequired  Int                // XP threshold to reach this tier
}
```

**Migration:** Generate with `npm run prisma:migrate`

---

## Phase 3: Seed `XpTier` from `course.json`

**File:** `apps/api/src/scripts/seed.ts`

Add to seed script:
```typescript
const course = JSON.parse(fs.readFileSync('.../Content/course.json', 'utf8'));
for (const tier of course.xpLevels) {
  await prisma.xpTier.upsert({
    where: { level: tier.level },
    update: { title: tier.title, xpRequired: tier.xpRequired },
    create: { level: tier.level, title: tier.title, xpRequired: tier.xpRequired },
  });
}
```

Also update Level/Unit/Lesson upserts to populate the new fields (`tagline`, `icon`, `milestone`, `badge`, `xpBonus`, `lessonType`, `estimatedMinutes`, `unlockedBy`).

---

## Phase 4: Update Completion API Response

**File:** `apps/api/src/routes/v1/curriculum.ts` — `POST /api/v1/lessons/:id/complete`

Current response: `{ xpEarned, newStreak, badgesEarned, nextLessonId }`

New response (matching `Content/completion-api-schema.json`):
```typescript
{
  lessonId: string,
  xpAwarded: number,
  newTotalXp: number,

  levelUp: null | { from: { level, title }, to: { level, title } },  // XP tier crossed

  newlyUnlocked: {
    lessons: string[],   // lesson IDs newly unlocked
    units: string[],     // unit IDs newly unlocked
    levels: string[],    // level IDs newly unlocked (renamed from "worlds" in schema)
  },

  unitCompleted: null | {
    unitId: string,
    badge: { title, icon },
    xpBonus: number,
    message: string,        // could use unit tagline
    newlyUnlockedUnit: string | null,
  },

  levelCompleted: null | {    // equivalent to worldCompleted in schema
    levelId: string,
    badge: { title, icon },
    message: string,
    surahUnlock: string | null,
    newlyUnlockedLevel: string | null,
  },

  updatedProgress: {
    [lessonId]: { status, score, maxScore, completedAt, xpEarned }
  },

  // Keep backward compat:
  newStreak: number,
  badgesEarned: BadgeSummary[],
}
```

**Logic to add in the completion handler:**
1. After saving progress, query `UserStreak` for `newTotalXp`
2. Compute XP tier before and after → detect `levelUp`
3. Compute newly unlocked lessons/units/levels by re-running the unlock chain
4. Detect if all lessons in a unit are now complete → `unitCompleted`
5. Detect if all units in a level are now complete → `levelCompleted`
6. Award `xpBonus` for unit/level completion via `updateStreak()`

**New helper:** `libs/` or inline — `computeUnlocks(userId, completedLessonId)` returns `{ newlyUnlocked, unitCompleted, levelCompleted }`

---

## Phase 5: Update `GET /api/v1/levels` for Lazy Loading

**File:** `apps/api/src/routes/v1/curriculum.ts`

Current: Returns ALL levels with ALL units and lessons in one call.

Change: Add query param support:
- `GET /api/v1/levels` → returns level summaries only (id, number, title, tagline, icon, isUnlocked, unitCount, lessonCount) — no unit/lesson detail
- `GET /api/v1/levels/:id` → returns single level with its units (unit titles, lesson count, lock state) — NEW endpoint
- Existing `GET /api/v1/units/:id/lessons` already handles paginated lessons per unit — no change needed

This avoids loading all 60+ lessons on dashboard mount.

---

## Phase 6: Update `api-types` Library

**File:** `libs/api-types/src/lib/api-types.ts`

Add/update:
```typescript
export interface XpTier {
  level: number;
  title: string;
  xpRequired: number;
}

export interface UserStats {
  // existing fields...
  xpTier: XpTier;           // current tier
  nextXpTier: XpTier | null; // null if at max
}

export interface LevelSummary {   // replaces LevelWithUnits for list endpoint
  id: string;
  number: number;
  title: string;
  tagline: string;
  icon: string;
  isUnlocked: boolean;
  unitCount: number;
  completedLessonCount: number;
  totalLessonCount: number;
  milestone: { badge: string; badgeIcon: string; message: string } | null;
}

export interface LevelDetail extends LevelSummary {
  units: UnitSummary[];
}

// Update CompleteLessonResponse with new fields above
export interface CompleteLessonResponse {
  lessonId: string;
  xpAwarded: number;
  newTotalXp: number;
  newStreak: number;
  levelUp: { from: XpTier; to: XpTier } | null;
  newlyUnlocked: { lessons: string[]; units: string[]; levels: string[] };
  unitCompleted: UnitCompletedEvent | null;
  levelCompleted: LevelCompletedEvent | null;
  badgesEarned: BadgeSummary[];
  updatedProgress: Record<string, LessonProgressSnapshot>;
}
```

---

## Phase 7: Frontend Updates

### Dashboard (`apps/web/src/pages/Dashboard.tsx`)
- Update `fetchLevels()` call to use summary endpoint (no unit detail on first load)
- Add lazy load: clicking a level fetches `GET /api/v1/levels/:id`
- Display XP tier title (from `userStats.xpTier.title`) in the stats bar
- Show XP progress bar toward next tier (`nextXpTier.xpRequired`)

### Lesson Completion Screen (`apps/web/src/pages/Lesson.tsx`)
- Handle `levelUp` event → show tier-up modal/banner
- Handle `unitCompleted` event → show unit badge award screen
- Handle `levelCompleted` event → show level milestone screen with surah unlock
- Display `newTotalXp` instead of just `xpEarned`

### `apps/web/src/lib/api.ts`
- Update `fetchLevels()` return type to `LevelSummary[]`
- Add `fetchLevel(token, levelId): Promise<LevelDetail>`
- Update `completeLesson()` return type to new `CompleteLessonResponse`

---

## Implementation Order (Recommended)

1. **Split curriculum.json** (no risk, purely structural)
2. **DB schema + migration** (required for all other changes)
3. **Update seed script** (validate new fields populate correctly)
4. **Update api-types** (unblocks all other TS work)
5. **Update completion API** (core gamification logic)
6. **Update levels endpoint** (lazy loading)
7. **Update frontend** (consume new API shapes)

---

## Verification

1. Run `npm run seed` → confirm all 6 levels, 60+ lessons, 6 XpTiers populated
2. `GET /api/v1/levels` → returns summaries only (no exercise data in payload)
3. `GET /api/v1/levels/level-2` → returns Level 2 with 14 units
4. Complete a lesson → verify response has `xpAwarded`, `newTotalXp`, `newlyUnlocked`
5. Complete last lesson in a unit → verify `unitCompleted` not null
6. Complete last lesson in a level → verify `levelCompleted` not null
7. Cross an XP threshold (e.g., earn 100 XP) → verify `levelUp` not null
8. Dashboard shows XP tier title ("Seeker", "Reader", etc.)
9. `npm run prisma:studio` → confirm `XpTier` table has 6 rows
