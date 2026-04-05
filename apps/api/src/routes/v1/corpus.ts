import { Router, Request, Response } from 'express';
import { prisma } from '@org/db';
import { requireAuth } from '../../middleware/requireAuth.js';
import { ok, fail } from '../../lib/respond.js';

const router = Router();

// GET /api/v1/words/:id — word detail + root siblings
router.get('/words/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const word = await prisma.word.findUnique({
    where: { id: req.params['id'] },
    include: {
      root: { include: { words: { take: 10 } } },
      verseWords: {
        take: 5,
        include: { verse: { include: { surah: true } } },
      },
    },
  });

  if (!word) {
    fail(res, 'NOT_FOUND', 'Word not found', 404);
    return;
  }

  ok(res, {
    id: word.id,
    arabic: word.arabic,
    transliteration: word.transliteration,
    meaning: word.meaning,
    wordType: word.wordType,
    gender: word.gender,
    number: word.number,
    frequencyRank: word.frequencyRank,
    root: word.root
      ? {
          id: word.root.id,
          arabic: word.root.arabic,
          transliteration: word.root.transliteration,
          primaryMeaning: word.root.primaryMeaning,
          relatedWords: word.root.words
            .filter((w) => w.id !== word.id)
            .map((w) => ({ id: w.id, arabic: w.arabic, meaning: w.meaning })),
        }
      : null,
    verseOccurrences: word.verseWords.map((vw) => ({
      surahName: vw.verse.surah.nameEnglish,
      surahNumber: vw.verse.surah.number,
      ayahNumber: vw.verse.ayahNumber,
      arabicText: vw.verse.arabicText,
      translation: vw.verse.translation,
      highlightedWordArabic: word.arabic,
    })),
  });
});

// GET /api/v1/roots/:id — root + full word family tree
router.get('/roots/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const root = await prisma.root.findUnique({
    where: { id: req.params['id'] },
    include: { words: true },
  });

  if (!root) {
    fail(res, 'NOT_FOUND', 'Root not found', 404);
    return;
  }

  ok(res, {
    id: root.id,
    arabic: root.arabic,
    transliteration: root.transliteration,
    primaryMeaning: root.primaryMeaning,
    words: root.words.map((w) => ({
      id: w.id,
      arabic: w.arabic,
      transliteration: w.transliteration,
      meaning: w.meaning,
      wordType: w.wordType,
      frequencyRank: w.frequencyRank,
    })),
  });
});

// GET /api/v1/verses/:surah/:ayah — verse with word-by-word breakdown
router.get('/verses/:surah/:ayah', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const surahNum = Number(req.params['surah']);
  const ayahNum = Number(req.params['ayah']);

  if (isNaN(surahNum) || isNaN(ayahNum)) {
    fail(res, 'BAD_REQUEST', 'Surah and ayah must be numbers', 400);
    return;
  }

  const verse = await prisma.quranVerse.findFirst({
    where: { surah: { number: surahNum }, ayahNumber: ayahNum },
    include: {
      surah: true,
      verseWords: {
        orderBy: { position: 'asc' },
        include: { word: { include: { root: true } } },
      },
    },
  });

  if (!verse) {
    fail(res, 'NOT_FOUND', 'Verse not found', 404);
    return;
  }

  ok(res, {
    id: verse.id,
    surahNumber: verse.surah.number,
    surahName: verse.surah.nameEnglish,
    ayahNumber: verse.ayahNumber,
    arabicText: verse.arabicText,
    translation: verse.translation,
    words: verse.verseWords.map((vw) => ({
      position: vw.position,
      grammaticalRole: vw.grammaticalRole,
      word: {
        id: vw.word.id,
        arabic: vw.word.arabic,
        transliteration: vw.word.transliteration,
        meaning: vw.word.meaning,
        wordType: vw.word.wordType,
        root: vw.word.root
          ? { arabic: vw.word.root.arabic, primaryMeaning: vw.word.root.primaryMeaning }
          : null,
      },
    })),
  });
});

export default router;
