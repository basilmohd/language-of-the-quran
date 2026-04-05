// Answer validation — pure TypeScript, zero dependencies
// Runs identically on web, mobile (offline), and API (server-side verification)

import type { ExerciseDefinition } from '@org/api-types';

export interface ValidationResult {
  correct: boolean;
  correctAnswer: string;
  explanation?: string;
}

export function validateAnswer(
  exercise: ExerciseDefinition,
  answer: unknown
): ValidationResult {
  switch (exercise.type) {
    case 'word_translation':
    case 'grammar_role':
    case 'fill_blank':
    case 'root_recognition': {
      const choiceIndex = answer as number;
      const correct = choiceIndex === exercise.correctIndex;
      return {
        correct,
        correctAnswer: exercise.choices[exercise.correctIndex] ?? '',
      };
    }

    case 'word_reorder': {
      const submittedOrder = answer as string[];
      const correct =
        submittedOrder.length === exercise.correctOrder.length &&
        submittedOrder.every((id, i) => id === exercise.correctOrder[i]);
      return {
        correct,
        correctAnswer: exercise.correctOrder
          .map((id) => exercise.words.find((w) => w.id === id)?.arabic ?? '')
          .join(' '),
      };
    }
  }
}
