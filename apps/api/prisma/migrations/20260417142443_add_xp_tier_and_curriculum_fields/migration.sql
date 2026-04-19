-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "estimatedMinutes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "lessonType" TEXT NOT NULL DEFAULT 'concept',
ADD COLUMN     "unlockedBy" TEXT;

-- AlterTable
ALTER TABLE "levels" ADD COLUMN     "icon" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "milestone" JSONB,
ADD COLUMN     "tagline" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "badge" JSONB,
ADD COLUMN     "tagline" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "unlockedBy" TEXT,
ADD COLUMN     "xpBonus" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "xp_tiers" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "xpRequired" INTEGER NOT NULL,

    CONSTRAINT "xp_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "xp_tiers_level_key" ON "xp_tiers"("level");
