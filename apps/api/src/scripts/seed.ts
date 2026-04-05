/**
 * Seed script — run with: npm run seed
 * Seeds: roots, words (Level 1), badges, curriculum (levels/units/lessons)
 *
 * Prerequisites:
 *   1. DATABASE_URL set in apps/api/.env
 *   2. `npm run prisma:migrate` has been run
 *   3. `npm run prisma:generate` has been run
 */

import 'dotenv/config';
import { readFileSync } from 'node:fs';
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

interface LessonManifest {
  id: string;
  number: number;
  title: string;
  xpReward: number;
  contentHash: string;
}

interface UnitManifest {
  id: string;
  number: number;
  title: string;
  lessons: LessonManifest[];
}

interface LevelManifest {
  id: string;
  number: number;
  title: string;
  description: string;
  units: UnitManifest[];
}

interface CurriculumSeed {
  levels: LevelManifest[];
}

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log('🌱 Seeding database...');

  const roots    = readJson<RootSeed[]>('libs/quran-data/src/data/roots.json');
  const words    = readJson<WordSeed[]>('libs/quran-data/src/data/words.json');
  const badges   = readJson<BadgeSeed[]>('libs/quran-data/src/data/badges.json');
  const curriculum = readJson<CurriculumSeed>('libs/quran-data/src/data/curriculum.json');

  // Load all 15 Level-1 lesson JSON files
  const lessonContentMap: Record<string, object> = {
    'l1-u1-l1': readJson('libs/content/src/curriculum/level-1/unit-1/lesson-1.json'),
    'l1-u1-l2': readJson('libs/content/src/curriculum/level-1/unit-1/lesson-2.json'),
    'l1-u1-l3': readJson('libs/content/src/curriculum/level-1/unit-1/lesson-3.json'),
    'l1-u2-l1': readJson('libs/content/src/curriculum/level-1/unit-2/lesson-1.json'),
    'l1-u2-l2': readJson('libs/content/src/curriculum/level-1/unit-2/lesson-2.json'),
    'l1-u2-l3': readJson('libs/content/src/curriculum/level-1/unit-2/lesson-3.json'),
    'l1-u3-l1': readJson('libs/content/src/curriculum/level-1/unit-3/lesson-1.json'),
    'l1-u3-l2': readJson('libs/content/src/curriculum/level-1/unit-3/lesson-2.json'),
    'l1-u3-l3': readJson('libs/content/src/curriculum/level-1/unit-3/lesson-3.json'),
    'l1-u4-l1': readJson('libs/content/src/curriculum/level-1/unit-4/lesson-1.json'),
    'l1-u4-l2': readJson('libs/content/src/curriculum/level-1/unit-4/lesson-2.json'),
    'l1-u4-l3': readJson('libs/content/src/curriculum/level-1/unit-4/lesson-3.json'),
    'l1-u5-l1': readJson('libs/content/src/curriculum/level-1/unit-5/lesson-1.json'),
    'l1-u5-l2': readJson('libs/content/src/curriculum/level-1/unit-5/lesson-2.json'),
    'l1-u5-l3': readJson('libs/content/src/curriculum/level-1/unit-5/lesson-3.json'),
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

  // ── Curriculum ───────────────────────────────────────────────────────────
  console.log('  → Seeding curriculum...');
  for (const level of curriculum.levels) {
    await prisma.level.upsert({
      where: { id: level.id },
      update: { title: level.title, description: level.description },
      create: {
        id: level.id,
        number: level.number,
        title: level.title,
        description: level.description,
      },
    });

    for (const unit of level.units) {
      await prisma.unit.upsert({
        where: { id: unit.id },
        update: { title: unit.title },
        create: {
          id: unit.id,
          levelId: level.id,
          number: unit.number,
          title: unit.title,
        },
      });

      for (const lesson of unit.lessons) {
        const content = lessonContentMap[lesson.id] ?? { steps: [] };
        await prisma.lesson.upsert({
          where: { id: lesson.id },
          update: {
            title: lesson.title,
            xpReward: lesson.xpReward,
            exercises: content,
            isPublished: lesson.id.startsWith('l1-'),
          },
          create: {
            id: lesson.id,
            unitId: unit.id,
            number: lesson.number,
            title: lesson.title,
            xpReward: lesson.xpReward,
            contentHash: lesson.contentHash,
            exercises: content,
            isPublished: lesson.id.startsWith('l1-'),
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
