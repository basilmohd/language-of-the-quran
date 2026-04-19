// Typed API client — all requests attach the Clerk JWT and unwrap the envelope
import type {
  ApiResponse,
  LevelSummary,
  LevelDetail,
  UserStats,
  LessonSummary,
  BadgeSummary,
  WordDetail,
  CompleteLessonResponse,
} from '@org/api-types';
import { apiErrorBus } from './apiErrorBus';

const API_BASE = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3001';

async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    const message = 'Unable to reach the server. Please check your connection.';
    apiErrorBus.emit(message);
    throw new Error(message);
  }

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    const message = `Server error (${res.status})`;
    apiErrorBus.emit(message);
    throw new Error(message);
  }

  if (!res.ok || body.error) {
    const message = body.error?.message ?? `Request failed (${res.status})`;
    apiErrorBus.emit(message);
    throw new Error(message);
  }

  return body.data as T;
}

// ── Curriculum ────────────────────────────────────────────────────────────────

export async function fetchLevels(token: string): Promise<LevelSummary[]> {
  return apiFetch<LevelSummary[]>('/api/v1/levels', token);
}

export async function fetchLevel(token: string, levelId: string): Promise<LevelDetail> {
  return apiFetch<LevelDetail>(`/api/v1/levels/${encodeURIComponent(levelId)}`, token);
}

export interface LessonDetail {
  id: string;
  number: number;
  title: string;
  xpReward: number;
  contentHash: string;
  exercises: unknown; // LessonContent JSON (steps array)
  unit: { id: string; title: string };
  level: { id: string; number: number; title: string };
}

export async function fetchLesson(token: string, id: string): Promise<LessonDetail> {
  return apiFetch<LessonDetail>(`/api/v1/lessons/${encodeURIComponent(id)}`, token);
}

export interface CompleteLessonPayload {
  xpEarned: number;
  attemptsTotal: number;
  firstAttemptScore: number;
  timeSpentMs: number;
  reviewItems: Array<{ wordId: string; quality: number; responseTimeMs?: number }>;
}

export async function completeLesson(
  token: string,
  lessonId: string,
  payload: CompleteLessonPayload,
): Promise<CompleteLessonResponse> {
  return apiFetch<CompleteLessonResponse>(`/api/v1/lessons/${encodeURIComponent(lessonId)}/complete`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── User ──────────────────────────────────────────────────────────────────────

export async function fetchUserStats(token: string): Promise<UserStats> {
  return apiFetch<UserStats>('/api/v1/users/me/stats', token);
}

export interface ProgressEntry {
  lessonId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  xpEarned: number;
  completedAt: string | null;
}

export async function fetchUserProgress(token: string): Promise<ProgressEntry[]> {
  return apiFetch<ProgressEntry[]>('/api/v1/users/me/progress', token);
}

export async function fetchUserBadges(token: string): Promise<BadgeSummary[]> {
  return apiFetch<BadgeSummary[]>('/api/v1/users/me/badges', token);
}

export interface WordBankItem {
  reviewId: string;
  wordId: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  wordType: 'ISM' | 'FIL' | 'HARF';
  root: { arabic: string; primaryMeaning: string } | null;
  repetitions: number;
  nextReviewAt: string;
}

export interface WordBankPage {
  items: WordBankItem[];
  nextCursor: string | null;
}

export async function fetchWordBank(token: string, cursor?: string, limit = 20): Promise<WordBankPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return apiFetch<WordBankPage>(`/api/v1/users/me/word-bank?${params.toString()}`, token);
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export interface ReviewQueueItem {
  reviewId: string;
  wordId: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  wordType: 'ISM' | 'FIL' | 'HARF';
  root: { arabic: string; primaryMeaning: string } | null;
  intervalDays: number;
  repetitions: number;
}

export async function fetchReviewQueue(token: string): Promise<ReviewQueueItem[]> {
  return apiFetch<ReviewQueueItem[]>('/api/v1/reviews/queue', token);
}

export interface ReviewSubmitResult {
  processed: number;
  sessionId: string;
}

export async function submitReviews(
  token: string,
  items: Array<{ wordId: string; quality: number; responseTimeMs?: number }>,
): Promise<ReviewSubmitResult> {
  return apiFetch<ReviewSubmitResult>('/api/v1/reviews/submit', token, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

// ── Corpus ────────────────────────────────────────────────────────────────────

export async function fetchWordDetail(token: string, wordId: string): Promise<WordDetail> {
  return apiFetch<WordDetail>(`/api/v1/words/${encodeURIComponent(wordId)}`, token);
}

// ── Feedback ──────────────────────────────────────────────────────────────────

export async function submitFeedback(
  token: string,
  payload: { itemType: string; itemId: string; feedbackType: string; body: string },
): Promise<void> {
  await apiFetch<unknown>('/api/v1/feedback', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
