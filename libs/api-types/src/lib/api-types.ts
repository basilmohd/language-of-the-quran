// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiMeta {
  version: string;
  requestId: string;
}

export type ApiResponse<T> =
  | { data: T; meta: ApiMeta; error: null }
  | { data: null; meta: ApiMeta; error: { code: string; message: string } };

// ─── Exercise Types ───────────────────────────────────────────────────────────

export type ExerciseType =
  | 'word_translation'
  | 'grammar_role'
  | 'fill_blank'
  | 'root_recognition'
  | 'word_reorder';

interface BaseExercise {
  id: string;
  type: ExerciseType;
  audioUri?: string; // "audio://quran/{reciter}/{surah}/{ayah}"
}

/** Show Arabic word → pick correct meaning (4 choices) */
export interface WordTranslationExercise extends BaseExercise {
  type: 'word_translation';
  arabic: string;
  transliteration: string;
  choices: string[];      // 4 options, one correct
  correctIndex: number;
  wordId: string;
}

/** Identify: is this ism/fi'l/harf? What case? */
export interface GrammarRoleExercise extends BaseExercise {
  type: 'grammar_role';
  arabic: string;
  verseContext: string;
  question: string;       // e.g. "What type of word is كِتَاب?"
  choices: string[];
  correctIndex: number;
  wordId: string;
}

/** Ayah with one word blanked → pick correct word */
export interface FillBlankExercise extends BaseExercise {
  type: 'fill_blank';
  verseArabic: string;    // full verse with ___ for blank
  verseTranslation: string;
  surahName: string;
  verseRef: string;       // e.g. "24:35"
  choices: string[];
  correctIndex: number;
  wordId: string;
}

/** Given a word → identify its 3-letter root */
export interface RootRecognitionExercise extends BaseExercise {
  type: 'root_recognition';
  arabic: string;
  transliteration: string;
  choices: string[];      // roots as "ك ت ب" format
  correctIndex: number;
  wordId: string;
  rootId: string;
}

/** @dnd-kit: drag Arabic words into correct order */
export interface WordReorderExercise extends BaseExercise {
  type: 'word_reorder';
  verseTranslation: string;
  surahName: string;
  verseRef: string;
  words: Array<{ id: string; arabic: string }>;
  correctOrder: string[]; // word IDs in correct order
}

export type ExerciseDefinition =
  | WordTranslationExercise
  | GrammarRoleExercise
  | FillBlankExercise
  | RootRecognitionExercise
  | WordReorderExercise;

// ─── Learn Mode Card (non-exercise) ─────────────────────────────────────────

export interface LearnCard {
  type: 'learn';
  wordId: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  rootArabic?: string;
  rootMeaning?: string;
  frequencyInQuran?: number;
  specialNote?: string;
  ayahCards: AyahCard[];
}

export interface AyahCard {
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translation: string;
  highlightedWordArabic: string;
  audioUri?: string;
}

export type LessonStep = LearnCard | ExerciseDefinition;

// ─── Lesson Content JSON (stored in libs/content + CDN) ─────────────────────

export interface LessonContent {
  lessonId: string;
  version: number;
  title: string;
  steps: LessonStep[];
}

// ─── API Response Shapes ─────────────────────────────────────────────────────

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  wordsLearned: number;    // UserWordReview rows where repetitions >= 2
  quranCoverage: number;   // percentage (0–100) based on frequency ranks
}

export interface LevelWithUnits {
  id: string;
  number: number;
  title: string;
  description: string;
  isUnlocked: boolean;
  units: UnitSummary[];
}

export interface UnitSummary {
  id: string;
  number: number;
  title: string;
  lessons: LessonSummary[];
}

export interface LessonSummary {
  id: string;
  number: number;
  title: string;
  xpReward: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  isUnlocked: boolean;
}

export interface CompleteLessonRequest {
  lessonId: string;
  xpEarned: number;
  attemptsTotal: number;
  firstAttemptScore: number;
  timeSpentMs: number;
  reviewItems: ReviewSubmitItem[];
}

export interface ReviewSubmitItem {
  wordId: string;
  quality: number;        // 0–5
  responseTimeMs?: number;
}

export interface CompleteLessonResponse {
  xpEarned: number;
  newStreak: number;
  badgesEarned: BadgeSummary[];
  nextLessonId?: string;
}

export interface BadgeSummary {
  id: string;
  name: string;
  description: string;
  iconSlug: string;
  earnedAt: string;
}

export interface WordDetail {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  wordType: 'ISM' | 'FIL' | 'HARF';
  gender?: 'MASCULINE' | 'FEMININE';
  number?: 'SINGULAR' | 'DUAL' | 'PLURAL';
  frequencyRank?: number;
  root?: {
    id: string;
    arabic: string;
    transliteration: string;
    primaryMeaning: string;
    relatedWords: Array<{ arabic: string; meaning: string }>;
  };
  verseOccurrences: AyahCard[];
}
