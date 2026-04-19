import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import { ChevronLeft, Star, Trophy, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FeedbackBanner } from '@/components/FeedbackBanner';
import { WordDrawer } from '@/components/WordDrawer';
import { LearnCard } from '@/components/ExerciseCard/LearnCard';
import { WordTranslation } from '@/components/ExerciseCard/WordTranslation';
import { FillBlank } from '@/components/ExerciseCard/FillBlank';
import { GrammarRole } from '@/components/ExerciseCard/GrammarRole';
import { RootRecognition } from '@/components/ExerciseCard/RootRecognition';
import { WordReorder } from '@/components/ExerciseCard/WordReorder';
import { fetchLesson, completeLesson } from '@/lib/api';
import { ApiErrorBanner } from '@/components/ApiErrorBanner';
import type { LessonDetail } from '@/lib/api';
import { validateAnswer } from '@org/srs';
import type { LessonStep, ExerciseDefinition, BadgeSummary, CompleteLessonResponse } from '@org/api-types';

// ── State machine ─────────────────────────────────────────────────────────────

type Phase =
  | { tag: 'loading' }
  | { tag: 'error'; message: string }
  | { tag: 'intro'; lesson: LessonDetail; steps: LessonStep[] }
  | {
      tag: 'running';
      lesson: LessonDetail;
      steps: LessonStep[];
      stepIndex: number;
      feedback: null | { isCorrect: boolean; correctAnswer: string; explanation?: string };
      reviewLog: Array<{ wordId: string; quality: number; responseTimeMs: number; firstAttempt: boolean }>;
      xpEarned: number;
      attemptsOnStep: number;
    }
  | {
      tag: 'submitting';
    }
  | {
      tag: 'complete';
      xpEarned: number;
      newTotalXp: number;
      newStreak: number;
      badgesEarned: BadgeSummary[];
      nextLessonId?: string;
      wordsLearned: string[]; // arabic words covered
      levelUp: CompleteLessonResponse['levelUp'];
      unitCompleted: CompleteLessonResponse['unitCompleted'];
      levelCompleted: CompleteLessonResponse['levelCompleted'];
    };

type Action =
  | { type: 'LOADED'; lesson: LessonDetail; steps: LessonStep[] }
  | { type: 'ERROR'; message: string }
  | { type: 'BEGIN' }
  | { type: 'SUBMIT_ANSWER'; answer: unknown; responseTimeMs: number }
  | { type: 'CONTINUE' }
  | { type: 'COMPLETE_DONE'; result: CompleteLessonResponse };

function getExerciseSteps(steps: LessonStep[]): ExerciseDefinition[] {
  return steps.filter((s): s is ExerciseDefinition => s.type !== 'learn');
}

function reducer(state: Phase, action: Action): Phase {
  switch (action.type) {
    case 'LOADED':
      return { tag: 'intro', lesson: action.lesson, steps: action.steps };

    case 'ERROR':
      return { tag: 'error', message: action.message };

    case 'BEGIN': {
      if (state.tag !== 'intro') return state;
      return {
        tag: 'running',
        lesson: state.lesson,
        steps: state.steps,
        stepIndex: 0,
        feedback: null,
        reviewLog: [],
        xpEarned: 0,
        attemptsOnStep: 0,
      };
    }

    case 'SUBMIT_ANSWER': {
      if (state.tag !== 'running') return state;
      const step = state.steps[state.stepIndex];
      if (!step || step.type === 'learn') return state;

      const result = validateAnswer(step as ExerciseDefinition, action.answer);
      const firstAttempt = state.attemptsOnStep === 0;
      const quality = result.correct ? 5 : 1;
      const xpDelta = result.correct ? (firstAttempt ? 10 : 5) : 0;

      // Build review log entry
      const newLog = [...state.reviewLog];
      const wordId = (step as ExerciseDefinition & { wordId?: string }).wordId;
      if (wordId) {
        // Replace any existing entry for this word with better quality if correct
        const existingIdx = newLog.findIndex((r) => r.wordId === wordId);
        if (existingIdx >= 0) {
          newLog[existingIdx] = {
            ...newLog[existingIdx],
            quality: Math.max(newLog[existingIdx].quality, quality),
          };
        } else {
          newLog.push({ wordId, quality, responseTimeMs: action.responseTimeMs, firstAttempt });
        }
      }

      // For word_reorder exercises, correctAnswer is already a string
      let correctAnswer = result.correctAnswer;
      if (step.type === 'word_reorder') {
        correctAnswer = (step as ExerciseDefinition).type === 'word_reorder'
          ? (step as { words: Array<{ id: string; arabic: string }>; correctOrder: string[] }).correctOrder
              .map((id) => (step as { words: Array<{ id: string; arabic: string }> }).words.find((w) => w.id === id)?.arabic ?? '')
              .join(' ')
          : correctAnswer;
      }

      return {
        ...state,
        feedback: {
          isCorrect: result.correct,
          correctAnswer,
        },
        reviewLog: newLog,
        xpEarned: state.xpEarned + xpDelta,
        attemptsOnStep: state.attemptsOnStep + 1,
      };
    }

    case 'CONTINUE': {
      if (state.tag !== 'running') return state;
      const currentStep = state.steps[state.stepIndex];
      const isExercise = currentStep?.type !== 'learn';
      const wasCorrect = state.feedback?.isCorrect ?? true;

      // If wrong on exercise, retry (don't advance)
      if (isExercise && !wasCorrect) {
        return { ...state, feedback: null };
      }

      const nextIndex = state.stepIndex + 1;
      if (nextIndex >= state.steps.length) {
        // All steps done — move to submitting
        return { tag: 'submitting' };
      }

      return {
        ...state,
        stepIndex: nextIndex,
        feedback: null,
        attemptsOnStep: 0,
      };
    }

    case 'COMPLETE_DONE': {
      if (state.tag !== 'submitting' && state.tag !== 'running') return state;
      // Gather arabic words for summary
      const steps = 'steps' in state ? state.steps : [];
      const wordsLearned = steps
        .filter((s) => s.type === 'learn')
        .map((s) => (s as { arabic: string }).arabic);

      const r = action.result;
      // Derive nextLessonId from newly unlocked lessons
      const nextLessonId = r.newlyUnlocked.lessons[0];

      return {
        tag: 'complete',
        xpEarned: r.xpAwarded,
        newTotalXp: r.newTotalXp,
        newStreak: r.newStreak,
        badgesEarned: r.badgesEarned,
        nextLessonId,
        wordsLearned,
        levelUp: r.levelUp,
        unitCompleted: r.unitCompleted,
        levelCompleted: r.levelCompleted,
      };
    }

    default:
      return state;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Lesson() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, { tag: 'loading' });
  const [drawerWordId, setDrawerWordId] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const stepStartRef = useRef<number>(Date.now());
  // Snapshot of running state so we can access it in the submit effect
  const runningRef = useRef<{
    reviewLog: Phase extends { tag: 'running'; reviewLog: infer R } ? R : never;
    xpEarned: number;
    attemptsTotal: number;
  } | null>(null);

  // Load lesson
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    startTimeRef.current = Date.now();

    async function load() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const lesson = await fetchLesson(token, id!);
        if (cancelled) return;
        // exercises field contains the LessonContent JSON
        const content = lesson.exercises as { steps?: LessonStep[] };
        const steps: LessonStep[] = content?.steps ?? [];
        dispatch({ type: 'LOADED', lesson, steps });
      } catch (err) {
        if (!cancelled) {
          dispatch({ type: 'ERROR', message: (err as Error).message ?? 'Failed to load lesson' });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, getToken]);

  // When entering submitting state, call the API
  useEffect(() => {
    if (state.tag !== 'submitting') return;
    let cancelled = false;

    async function submit() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;

        const log = runningRef.current;
        const timeSpentMs = Date.now() - startTimeRef.current;

        const result = await completeLesson(token, id!, {
          xpEarned: log?.xpEarned ?? 5,
          attemptsTotal: log?.attemptsTotal ?? 1,
          firstAttemptScore: 0,
          timeSpentMs,
          reviewItems: (log?.reviewLog ?? []).map((r) => ({
            wordId: r.wordId,
            quality: r.quality,
            responseTimeMs: r.responseTimeMs,
          })),
        });

        if (!cancelled) {
          dispatch({ type: 'COMPLETE_DONE', result });
        }
      } catch {
        // Even on error, show complete screen with best-effort data
        if (!cancelled) {
          dispatch({
            type: 'COMPLETE_DONE',
            result: {
              lessonId: id ?? '',
              xpAwarded: 5,
              newTotalXp: 0,
              newStreak: 0,
              badgesEarned: [],
              levelUp: null,
              newlyUnlocked: { lessons: [], units: [], levels: [] },
              unitCompleted: null,
              levelCompleted: null,
              updatedProgress: {},
            },
          });
        }
      }
    }

    submit();
    return () => { cancelled = true; };
  }, [state.tag, getToken, id]);

  // Keep running state snapshot for the submit effect
  useEffect(() => {
    if (state.tag === 'running') {
      runningRef.current = {
        reviewLog: state.reviewLog as never,
        xpEarned: state.xpEarned,
        attemptsTotal: state.reviewLog.length,
      };
    }
  });

  // Track step start time for responseTimeMs
  useEffect(() => {
    stepStartRef.current = Date.now();
  }, [state.tag === 'running' && state.stepIndex]);

  const handleSubmitAnswer = useCallback((answer: unknown) => {
    const responseTimeMs = Date.now() - stepStartRef.current;
    dispatch({ type: 'SUBMIT_ANSWER', answer, responseTimeMs });
  }, []);

  const handleContinue = useCallback(() => {
    dispatch({ type: 'CONTINUE' });
  }, []);

  // ── Render helpers ───────────────────────────────────────────────────────

  function renderStep(step: LessonStep) {
    const hasFeedback = state.tag === 'running' && state.feedback !== null;

    if (step.type === 'learn') {
      return (
        <LearnCard
          card={step}
          onNext={handleContinue}
          onWordTap={(wordId) => setDrawerWordId(wordId)}
        />
      );
    }

    switch (step.type) {
      case 'word_translation':
        return (
          <WordTranslation
            key={state.tag === 'running' ? state.stepIndex : 0}
            exercise={step}
            onSubmit={handleSubmitAnswer}
            disabled={hasFeedback}
          />
        );
      case 'fill_blank':
        return (
          <FillBlank
            key={state.tag === 'running' ? state.stepIndex : 0}
            exercise={step}
            onSubmit={handleSubmitAnswer}
            disabled={hasFeedback}
          />
        );
      case 'grammar_role':
        return (
          <GrammarRole
            key={state.tag === 'running' ? state.stepIndex : 0}
            exercise={step}
            onSubmit={handleSubmitAnswer}
            disabled={hasFeedback}
          />
        );
      case 'root_recognition':
        return (
          <RootRecognition
            key={state.tag === 'running' ? state.stepIndex : 0}
            exercise={step}
            onSubmit={handleSubmitAnswer}
            disabled={hasFeedback}
          />
        );
      case 'word_reorder':
        return (
          <WordReorder
            key={state.tag === 'running' ? state.stepIndex : 0}
            exercise={step}
            onSubmit={handleSubmitAnswer}
            disabled={hasFeedback}
          />
        );
    }
  }

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (state.tag === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (state.tag === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground text-sm">{state.message}</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // ── Submitting ─────────────────────────────────────────────────────────────

  if (state.tag === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Saving progress...</p>
        </div>
      </div>
    );
  }

  // ── Complete screen ────────────────────────────────────────────────────────

  if (state.tag === 'complete') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="max-w-sm mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 border-4 border-green-300 flex items-center justify-center">
            <Trophy className="h-9 w-9 text-green-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Lesson Complete!</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {state.newStreak > 0
                ? state.newStreak === 1
                  ? 'Day 1! Come back tomorrow to build your streak.'
                  : `${state.newStreak}-day streak — keep it up!`
                : 'Great work!'}
            </p>
          </div>

          {/* XP burst */}
          <div className="flex items-center justify-center gap-2 py-2">
            <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
            <span className="text-3xl font-bold text-amber-600">+{state.xpEarned} XP</span>
            <span className="text-sm text-muted-foreground">({state.newTotalXp} total)</span>
          </div>

          {/* XP level-up banner */}
          {state.levelUp && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-2xl">⬆️</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-purple-800">
                  Level Up! {state.levelUp.from.title} → {state.levelUp.to.title}
                </p>
                <p className="text-xs text-purple-600">You've reached a new rank</p>
              </div>
            </div>
          )}

          {/* Unit completed banner */}
          {state.unitCompleted && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-2xl">{state.unitCompleted.badge?.icon ?? '🏆'}</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-blue-800">
                  Unit Complete! {state.unitCompleted.badge?.title ?? ''}
                </p>
                <p className="text-xs text-blue-600">{state.unitCompleted.message}</p>
                {state.unitCompleted.xpBonus > 0 && (
                  <p className="text-xs text-blue-500 font-semibold">+{state.unitCompleted.xpBonus} bonus XP</p>
                )}
              </div>
            </div>
          )}

          {/* Level completed banner */}
          {state.levelCompleted && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-2xl">{state.levelCompleted.badge?.icon ?? '🌟'}</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-amber-800">
                  {state.levelCompleted.badge?.title ?? 'Level Complete!'}
                </p>
                <p className="text-xs text-amber-600">{state.levelCompleted.message}</p>
                {state.levelCompleted.surahUnlock && (
                  <p className="text-xs text-amber-500 font-semibold mt-0.5">
                    Unlocked: {state.levelCompleted.surahUnlock}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Words learned */}
          {state.wordsLearned.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Words learned</p>
              <div className="flex flex-wrap justify-center gap-2">
                {state.wordsLearned.map((arabic, i) => (
                  <span
                    key={i}
                    dir="rtl"
                    lang="ar"
                    className="rounded-lg bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1.5 text-lg font-semibold"
                    style={{ fontFamily: 'var(--font-arabic)' }}
                  >
                    {arabic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Badges earned */}
          {state.badgesEarned.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Badge earned</p>
              {state.badgesEarned.map((badge) => (
                <div key={badge.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-2xl">🏅</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-amber-800">{badge.name}</p>
                    <p className="text-xs text-amber-600">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 space-y-2">
            {state.nextLessonId ? (
              <Button className="w-full" size="lg" onClick={() => navigate(`/lesson/${state.nextLessonId}`)}>
                Next Lesson
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : null}
            <Button variant="outline" className="w-full" asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Intro screen ───────────────────────────────────────────────────────────

  if (state.tag === 'intro') {
    const learnSteps = state.steps.filter((s) => s.type === 'learn') as Array<{
      arabic: string;
      meaning: string;
      frequencyInQuran?: number;
    }>;

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link to="/dashboard">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <ApiErrorBanner />
        <main className="max-w-sm mx-auto px-4 py-12 space-y-8 text-center">
          <div className="space-y-2">
            <Badge variant="outline" className="text-xs">
              {state.lesson.level.title} · {state.lesson.unit.title}
            </Badge>
            <h1 className="text-2xl font-bold text-foreground">{state.lesson.title}</h1>
            <p className="text-sm text-muted-foreground">
              {getExerciseSteps(state.steps).length} exercises · ~{Math.ceil(state.steps.length * 0.7)} min
            </p>
          </div>

          {learnSteps.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                In this lesson you'll learn
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {learnSteps.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-center"
                  >
                    <p
                      dir="rtl"
                      lang="ar"
                      className="text-2xl font-bold text-teal-800"
                      style={{ fontFamily: 'var(--font-arabic)' }}
                    >
                      {s.arabic}
                    </p>
                    <p className="text-xs text-teal-600 mt-0.5">{s.meaning}</p>
                    {s.frequencyInQuran && (
                      <p className="text-xs text-muted-foreground mt-0.5">{s.frequencyInQuran}× in Quran</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button size="lg" className="w-full" onClick={() => dispatch({ type: 'BEGIN' })}>
            Begin
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </main>
      </div>
    );
  }

  // ── Running ────────────────────────────────────────────────────────────────

  const totalSteps = state.steps.length;
  const progress = Math.round((state.stepIndex / totalSteps) * 100);
  const currentStep = state.steps[state.stepIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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
            {state.stepIndex + 1}/{totalSteps}
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <ApiErrorBanner />
      {/* Content */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8">
        {currentStep && renderStep(currentStep)}
      </main>

      {/* Feedback banner — pinned to bottom */}
      {state.feedback && (
        <div className="sticky bottom-0">
          <FeedbackBanner
            isCorrect={state.feedback.isCorrect}
            correctAnswer={state.feedback.correctAnswer}
            explanation={state.feedback.explanation}
            onContinue={handleContinue}
          />
        </div>
      )}

      {/* Word drawer */}
      <WordDrawer wordId={drawerWordId} onClose={() => setDrawerWordId(null)} />
    </div>
  );
}

export default Lesson;
