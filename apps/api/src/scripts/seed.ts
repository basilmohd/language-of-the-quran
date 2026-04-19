/**
 * Seed script — run with: npm run seed
 * Seeds: roots, words (Level 1), badges, XpTiers, curriculum (levels/units/lessons)
 *
 * Prerequisites:
 *   1. DATABASE_URL set in apps/api/.env
 *   2. `npm run prisma:migrate` has been run
 *   3. `npm run prisma:generate` has been run
 */

import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { PrismaClient } from '@org/db';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..', '..', '..');

function readJson<T>(relPath: string): T {
  return JSON.parse(readFileSync(join(repoRoot, relPath), 'utf-8')) as T;
}

interface RootSeed {
  id: string;
  arabic: string;
  transliteration: string;
  primaryMeaning: string;
}

interface WordSeed {
  id: string;
  rootId: string | null;
  arabic: string;
  transliteration: string;
  meaning: string;
  wordType: 'ISM' | 'FIL' | 'HARF';
  gender?: 'MASCULINE' | 'FEMININE';
  number?: 'SINGULAR' | 'DUAL' | 'PLURAL';
  frequencyRank?: number;
}

interface BadgeSeed {
  id: string;
  name: string;
  description: string;
  iconSlug: string;
  condition: object;
}

interface XpLevelSeed {
  level: number;
  title: string;
  xpRequired: number;
}

interface CourseSeed {
  xpLevels: XpLevelSeed[];
}

interface LessonManifest {
  id: string;
  number: number;
  title: string;
  type?: string;
  xpReward: number;
  estimatedMinutes?: number;
  unlockedBy?: string | null;
  contentHash: string;
}

interface UnitManifest {
  id: string;
  number: number;
  title: string;
  tagline?: string;
  xpBonus?: number;
  badge?: { title: string; icon: string };
  unlockedBy?: string | null;
  lessons: LessonManifest[];
}

interface LevelManifest {
  id: string;
  number: number;
  title: string;
  tagline?: string;
  icon?: string;
  description: string;
  milestone?: {
    badge: string;
    badgeIcon: string;
    message: string;
    unlocksLevel: string | null;
    surahUnlock?: string;
  };
  units: UnitManifest[];
}

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log('🌱 Seeding database...');

  const roots    = readJson<RootSeed[]>('libs/quran-data/src/data/roots.json');
  const words    = readJson<WordSeed[]>('libs/quran-data/src/data/words.json');
  const badges   = readJson<BadgeSeed[]>('libs/quran-data/src/data/badges.json');
  const course   = readJson<CourseSeed>('Content/course.json');

  // Load level files from levels/ directory in sorted order
  const levelsDir = join(repoRoot, 'libs/quran-data/src/data/levels');
  const levelFiles = readdirSync(levelsDir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  const levels = levelFiles.map((f) =>
    JSON.parse(readFileSync(join(levelsDir, f), 'utf-8')) as LevelManifest
  );

  // Lesson content files — keyed by lesson ID.
  // World 2 (Ism) lessons map to the level-1 content folder (content files pre-date the World 1 insertion).
  // Lessons not in this map fall back to { steps: [] } and are seeded as unpublished.
  const lessonContentMap: Record<string, object> = {
    // World 1 — Unit 1 (The Map of Arabic)
    'l1-u1-l1': readJson('libs/content/src/curriculum/world-1/unit-1/lesson-1.json'),
    'l1-u1-l2': readJson('libs/content/src/curriculum/world-1/unit-1/lesson-2.json'),
    'l1-u1-l3': readJson('libs/content/src/curriculum/world-1/unit-1/lesson-3.json'),
    // World 2 — Unit 1 (What is an Ism?) — was level-1/unit-1
    'l2-u1-l1': readJson('libs/content/src/curriculum/level-1/unit-1/lesson-1.json'),
    'l2-u1-l2': readJson('libs/content/src/curriculum/level-1/unit-1/lesson-2.json'),
    'l2-u1-l3': readJson('libs/content/src/curriculum/level-1/unit-1/lesson-3.json'),
    // World 2 — Unit 2 (Definite & Indefinite) — was level-1/unit-3
    'l2-u2-l1': readJson('libs/content/src/curriculum/level-1/unit-3/lesson-1.json'),
    'l2-u2-l2': readJson('libs/content/src/curriculum/level-1/unit-3/lesson-2.json'),
    'l2-u2-l3': readJson('libs/content/src/curriculum/level-1/unit-3/lesson-3.json'),
    // World 2 — Unit 3 (Masculine & Feminine) — was level-1/unit-2/lesson-1
    'l2-u3-l1': readJson('libs/content/src/curriculum/level-1/unit-2/lesson-1.json'),
    // World 2 — Unit 4 (Singular, Dual & Plural) — was level-1/unit-2/lesson-2,3
    'l2-u4-l1': readJson('libs/content/src/curriculum/level-1/unit-2/lesson-2.json'),
    'l2-u4-l2': readJson('libs/content/src/curriculum/level-1/unit-2/lesson-3.json'),
    // World 2 — Unit 5 (Grammatical Case) — was level-1/unit-4
    'l2-u5-l1': readJson('libs/content/src/curriculum/level-1/unit-4/lesson-1.json'),
    'l2-u5-l2': readJson('libs/content/src/curriculum/level-1/unit-4/lesson-2.json'),
    'l2-u5-l3': readJson('libs/content/src/curriculum/level-1/unit-4/lesson-3.json'),
    // World 2 — Unit 6 (Idaafa) — was level-1/unit-5
    'l2-u6-l1': readJson('libs/content/src/curriculum/level-1/unit-5/lesson-1.json'),
    'l2-u6-l2': readJson('libs/content/src/curriculum/level-1/unit-5/lesson-2.json'),
  };

  // ── Roots ────────────────────────────────────────────────────────────────
  console.log('  → Seeding roots...');
  for (const root of roots) {
    await prisma.root.upsert({
      where: { id: root.id },
      update: {},
      create: root,
    });
  }

  // ── Words ────────────────────────────────────────────────────────────────
  console.log('  → Seeding words...');
  for (const word of words) {
    await prisma.word.upsert({
      where: { id: word.id },
      update: {},
      create: word,
    });
  }

  // ── Badges ───────────────────────────────────────────────────────────────
  console.log('  → Seeding badges...');
  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { id: badge.id },
      update: {},
      create: badge,
    });
  }

  // ── XP Tiers ─────────────────────────────────────────────────────────────
  console.log('  → Seeding XP tiers...');
  for (const tier of course.xpLevels) {
    await prisma.xpTier.upsert({
      where: { level: tier.level },
      update: { title: tier.title, xpRequired: tier.xpRequired },
      create: { level: tier.level, title: tier.title, xpRequired: tier.xpRequired },
    });
  }

  // ── Curriculum ───────────────────────────────────────────────────────────
  console.log('  → Seeding curriculum...');
  for (const level of levels) {
    await prisma.level.upsert({
      where: { id: level.id },
      update: {
        title: level.title,
        description: level.description,
        tagline: level.tagline ?? '',
        icon: level.icon ?? '',
        milestone: level.milestone ?? null,
      },
      create: {
        id: level.id,
        number: level.number,
        title: level.title,
        description: level.description,
        tagline: level.tagline ?? '',
        icon: level.icon ?? '',
        milestone: level.milestone ?? null,
      },
    });

    for (const unit of level.units) {
      await prisma.unit.upsert({
        where: { id: unit.id },
        update: {
          title: unit.title,
          tagline: unit.tagline ?? '',
          xpBonus: unit.xpBonus ?? 0,
          badge: unit.badge ?? null,
          unlockedBy: unit.unlockedBy ?? null,
        },
        create: {
          id: unit.id,
          levelId: level.id,
          number: unit.number,
          title: unit.title,
          tagline: unit.tagline ?? '',
          xpBonus: unit.xpBonus ?? 0,
          badge: unit.badge ?? null,
          unlockedBy: unit.unlockedBy ?? null,
        },
      });

      for (const lesson of unit.lessons) {
        const content = lessonContentMap[lesson.id] ?? { steps: [] };
        const isPublished = lesson.id in lessonContentMap;
        await prisma.lesson.upsert({
          where: { id: lesson.id },
          update: {
            title: lesson.title,
            xpReward: lesson.xpReward,
            exercises: content,
            isPublished,
            lessonType: lesson.type ?? 'concept',
            estimatedMinutes: lesson.estimatedMinutes ?? 10,
            unlockedBy: lesson.unlockedBy ?? null,
          },
          create: {
            id: lesson.id,
            unitId: unit.id,
            number: lesson.number,
            title: lesson.title,
            xpReward: lesson.xpReward,
            contentHash: lesson.contentHash,
            exercises: content,
            isPublished,
            lessonType: lesson.type ?? 'concept',
            estimatedMinutes: lesson.estimatedMinutes ?? 10,
            unlockedBy: lesson.unlockedBy ?? null,
          },
        });
      }
    }
  }

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
