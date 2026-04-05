import { useReducer, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FeedbackBanner } from '@/components/FeedbackBanner';
import { WordTranslation } from '@/components/ExerciseCard/WordTranslation';
import { fetchReviewQueue, submitReviews } from '@/lib/api';
import type { ReviewQueueItem } from '@/lib/api';
import type { WordTranslationExercise } from '@org/api-types';
import { validateAnswer } from '@org/srs';

// Build a 4-choice MCQ from a review queue item + distractors from the queue
function buildExercise(
  item: ReviewQueueItem,
  allItems: ReviewQueueItem[],
): WordTranslationExercise {
  const distractors = allItems
    .filter((x) => x.wordId !== item.wordId)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((x) => x.meaning);

  // Pad with generic distractors if queue is small
  const fallbacks = ['path', 'prayer', 'knowledge', 'blessing', 'mercy', 'light', 'book'];
  while (distractors.length < 3) {
    const fb = fallbacks.find((f) => !distractors.includes(f) && f !== item.meaning);
    if (fb) distractors.push(fb);
    else distractors.push('—');
  }

  const choices = [item.meaning, ...distractors].sort(() => Math.random() - 0.5);
  const correctIndex = choices.indexOf(item.meaning);

  return {
    id: item.reviewId,
    type: 'word_translation',
    arabic: item.arabic,
    transliteration: item.transliteration,
    choices,
    correctIndex,
    wordId: item.wordId,
  };
}

// ── State machine ─────────────────────────────────────────────────────────────

type Phase =
  | { tag: 'loading' }
  | { tag: 'empty' }
  | {
      tag: 'running';
      queue: ReviewQueueItem[];
      exercises: WordTranslationExercise[];
      index: number;
      feedback: null | { isCorrect: boolean; correctAnswer: string };
      log: Array<{ wordId: string; quality: number; responseTimeMs: number }>;
    }
  | { tag: 'submitting'; log: Array<{ wordId: string; quality: number; responseTimeMs: number }>; total: number }
  | { tag: 'done'; total: number; correct: number };

type Action =
  | { type: 'LOADED'; queue: ReviewQueueItem[] }
  | { type: 'SUBMIT'; answer: number; responseTimeMs: number }
  | { type: 'CONTINUE' }
  | { type: 'SUBMIT_DONE'; total: number; correct: number };

function reducer(state: Phase, action: Action): Phase {
  switch (action.type) {
    case 'LOADED': {
      if (action.queue.length === 0) return { tag: 'empty' };
      const exercises = action.queue.map((item) => buildExercise(item, action.queue));
      return { tag: 'running', queue: action.queue, exercises, index: 0, feedback: null, log: [] };
    }

    case 'SUBMIT': {
      if (state.tag !== 'running') return state;
      const exercise = state.exercises[state.index];
      if (!exercise) return state;
      const result = validateAnswer(exercise, action.answer);
      const quality = result.correct ? 5 : 1;
      return {
        ...state,
        feedback: { isCorrect: result.correct, correctAnswer: result.correctAnswer },
        log: [...state.log, { wordId: exercise.wordId, quality, responseTimeMs: action.responseTimeMs }],
      };
    }

    case 'CONTINUE': {
      if (state.tag !== 'running') return state;
      const nextIndex = state.index + 1;
      if (nextIndex >= state.exercises.length) {
        return { tag: 'submitting', log: state.log, total: state.exercises.length };
      }
      return { ...state, index: nextIndex, feedback: null };
    }

    case 'SUBMIT_DONE':
      return { tag: 'done', total: action.total, correct: action.correct };

    default:
      return state;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Review() {
  const { getToken } = useAuth();
  const [state, dispatch] = useReducer(reducer, { tag: 'loading' });
  const stepStartRef = useRef<number>(Date.now());

  // Load queue
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const queue = await fetchReviewQueue(token);
        if (!cancelled) dispatch({ type: 'LOADED', queue });
      } catch {
        if (!cancelled) dispatch({ type: 'LOADED', queue: [] });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [getToken]);

  // Submit when done
  useEffect(() => {
    if (state.tag !== 'submitting') return;
    let cancelled = false;
    async function submit() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        await submitReviews(token, state.log);
      } catch {
        // best-effort
      } finally {
        if (!cancelled) {
          dispatch({
            type: 'SUBMIT_DONE',
            total: state.total,
            correct: state.log.filter((r) => r.quality >= 3).length,
          });
        }
      }
    }
    submit();
    return () => { cancelled = true; };
  }, [state.tag, getToken]);

  // Reset step timer
  useEffect(() => {
    stepStartRef.current = Date.now();
  }, [state.tag === 'running' && (state as { index?: number }).index]);

  const handleSubmit = useCallback((choiceIndex: number) => {
    dispatch({ type: 'SUBMIT', answer: choiceIndex, responseTimeMs: Date.now() - stepStartRef.current });
  }, []);

  const handleContinue = useCallback(() => {
    dispatch({ type: 'CONTINUE' });
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (state.tag === 'loading' || state.tag === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────

  if (state.tag === 'empty') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h1 className="text-xl font-bold text-foreground">All caught up!</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          No words are due for review right now. Come back tomorrow to keep your SRS streak going.
        </p>
        <Button asChild variant="outline">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────────

  if (state.tag === 'done') {
    const pct = Math.round((state.correct / state.total) * 100);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center space-y-5">
        <CheckCircle2 className="h-14 w-14 text-green-500" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Review Complete!</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {state.correct} / {state.total} correct ({pct}%)
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // ── Running ────────────────────────────────────────────────────────────────

  const total = state.exercises.length;
  const progress = Math.round((state.index / total) * 100);
  const exercise = state.exercises[state.index];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button asChild variant="ghost" size="sm" className="-ml-2 shrink-0">
            <Link to="/dashboard">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Exit
            </Link>
          </Button>
          <Progress value={progress} className="flex-1" />
          <span className="text-xs text-muted-foreground shrink-0">
            {state.index + 1}/{total}
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-8">
        <p className="text-xs text-muted-foreground text-center mb-6 uppercase tracking-wide font-medium">
          Daily Review
        </p>
        {exercise && (
          <WordTranslation
            key={state.index}
            exercise={exercise}
            onSubmit={handleSubmit}
            disabled={state.feedback !== null}
          />
        )}
      </div>

      {state.feedback && (
        <div className="sticky bottom-0">
          <FeedbackBanner
            isCorrect={state.feedback.isCorrect}
            correctAnswer={state.feedback.correctAnswer}
            onContinue={handleContinue}
          />
        </div>
      )}
    </div>
  );
}

export default Review;
