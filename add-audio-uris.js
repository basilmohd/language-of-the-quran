/**
 * Script to add audioUri to AyahCard objects in lesson JSON files
 * Usage: node add-audio-uris.js
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const lessonFiles = [
  'libs/content/src/curriculum/level-1/unit-1/lesson-1.json',
  'libs/content/src/curriculum/level-1/unit-1/lesson-2.json',
  'libs/content/src/curriculum/level-1/unit-1/lesson-3.json',
  'libs/content/src/curriculum/level-1/unit-2/lesson-1.json',
  'libs/content/src/curriculum/level-1/unit-2/lesson-2.json',
];

function processLesson(filePath) {
  console.log(`📖 Processing: ${filePath}`);

  const content = readFileSync(filePath, 'utf-8');
  let lesson = JSON.parse(content);

  let updatedCount = 0;

  // Process each step in the lesson
  lesson.steps = lesson.steps.map(step => {
    // Handle 'learn' type steps which contain ayahCards
    if (step.type === 'learn' && step.ayahCards && Array.isArray(step.ayahCards)) {
      step.ayahCards = step.ayahCards.map(ayahCard => {
        if (!ayahCard.audioUri) {
          ayahCard.audioUri = `audio://quran/default/${ayahCard.surahNumber}/${ayahCard.ayahNumber}`;
          updatedCount++;
        }
        return ayahCard;
      });
    }

    // Handle exercise steps that might have audioUri field
    if (step.audioUri === undefined && (step.type === 'word_translation' || step.type === 'grammar_role' || step.type === 'fill_blank' || step.type === 'root_recognition' || step.type === 'word_reorder')) {
      // Exercises don't have surah/ayah info, so we skip them for now
      // In the future, exercises might have their own audio based on the word being tested
    }

    return step;
  });

  // Write back with nice formatting
  writeFileSync(filePath, JSON.stringify(lesson, null, 2) + '\n', 'utf-8');
  console.log(`✅ Added audioUri to ${updatedCount} ayah cards\n`);

  return updatedCount;
}

async function main() {
  console.log('🎵 Adding audioUri to AyahCards...\n');

  let totalUpdated = 0;

  for (const file of lessonFiles) {
    const updated = processLesson(file);
    totalUpdated += updated;
  }

  console.log(`\n✨ Complete! Updated ${totalUpdated} total audioUri fields across ${lessonFiles.length} lessons`);
}

main().catch(console.error);
