-- CreateEnum
CREATE TYPE "WordType" AS ENUM ('ISM', 'FIL', 'HARF');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINE', 'FEMININE');

-- CreateEnum
CREATE TYPE "WordNumber" AS ENUM ('SINGULAR', 'DUAL', 'PLURAL');

-- CreateEnum
CREATE TYPE "GramCase" AS ENUM ('MARFU', 'MANSOOB', 'MAJROOR');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "quran_surahs" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "nameArabic" TEXT NOT NULL,
    "nameEnglish" TEXT NOT NULL,

    CONSTRAINT "quran_surahs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quran_verses" (
    "id" TEXT NOT NULL,
    "surahId" TEXT NOT NULL,
    "ayahNumber" INTEGER NOT NULL,
    "arabicText" TEXT NOT NULL,
    "translation" TEXT NOT NULL,

    CONSTRAINT "quran_verses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roots" (
    "id" TEXT NOT NULL,
    "arabic" TEXT NOT NULL,
    "transliteration" TEXT NOT NULL,
    "primaryMeaning" TEXT NOT NULL,

    CONSTRAINT "roots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "words" (
    "id" TEXT NOT NULL,
    "rootId" TEXT,
    "arabic" TEXT NOT NULL,
    "transliteration" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "wordType" "WordType" NOT NULL,
    "gender" "Gender",
    "number" "WordNumber",
    "grammaticalCase" "GramCase",
    "frequencyRank" INTEGER,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verse_words" (
    "id" TEXT NOT NULL,
    "verseId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "grammaticalRole" TEXT NOT NULL,

    CONSTRAINT "verse_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" TEXT NOT NULL,
    "versionHash" TEXT NOT NULL,
    "cdnUrl" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "contentHash" TEXT NOT NULL,
    "exercises" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "onboardingCompletedAt" TIMESTAMPTZ,
    "lastActiveAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_lesson_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "attemptsTotal" INTEGER NOT NULL DEFAULT 0,
    "firstAttemptScore" INTEGER,
    "timeSpentMs" BIGINT NOT NULL DEFAULT 0,
    "lessonVersion" INTEGER NOT NULL DEFAULT 1,
    "firstStartedAt" TIMESTAMPTZ,
    "lastAttemptedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "user_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconSlug" TEXT NOT NULL,
    "condition" JSONB NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("userId","badgeId")
);

-- CreateTable
CREATE TABLE "user_word_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "easinessFactor" DECIMAL(65,30) NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMPTZ NOT NULL,
    "lastReviewedAt" TIMESTAMPTZ,
    "lastQuality" INTEGER,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_word_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_logs" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quality" INTEGER NOT NULL,
    "responseTimeMs" INTEGER,
    "intervalBefore" INTEGER NOT NULL,
    "intervalAfter" INTEGER NOT NULL,
    "efBefore" DECIMAL(65,30) NOT NULL,
    "efAfter" DECIMAL(65,30) NOT NULL,
    "lessonId" TEXT,
    "sessionId" TEXT,
    "reviewedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,
    "itemsReviewed" INTEGER NOT NULL DEFAULT 0,
    "itemsCorrect" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "review_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "enabledFor" TEXT[],
    "rolloutPct" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "user_push_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMPTZ,

    CONSTRAINT "user_push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "feedbackType" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quran_surahs_number_key" ON "quran_surahs"("number");

-- CreateIndex
CREATE UNIQUE INDEX "quran_verses_surahId_ayahNumber_key" ON "quran_verses"("surahId", "ayahNumber");

-- CreateIndex
CREATE UNIQUE INDEX "roots_arabic_key" ON "roots"("arabic");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_versionHash_key" ON "content_versions"("versionHash");

-- CreateIndex
CREATE UNIQUE INDEX "levels_number_key" ON "levels"("number");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_clerkId_key" ON "app_users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "user_streaks_userId_key" ON "user_streaks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_lesson_progress_userId_lessonId_key" ON "user_lesson_progress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "badges_name_key" ON "badges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_word_reviews_userId_wordId_key" ON "user_word_reviews"("userId", "wordId");

-- CreateIndex
CREATE UNIQUE INDEX "user_push_tokens_token_key" ON "user_push_tokens"("token");

-- AddForeignKey
ALTER TABLE "quran_verses" ADD CONSTRAINT "quran_verses_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "quran_surahs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "roots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verse_words" ADD CONSTRAINT "verse_words_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "quran_verses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verse_words" ADD CONSTRAINT "verse_words_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_word_reviews" ADD CONSTRAINT "user_word_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_word_reviews" ADD CONSTRAINT "user_word_reviews_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "user_word_reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_sessions" ADD CONSTRAINT "review_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_push_tokens" ADD CONSTRAINT "user_push_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
