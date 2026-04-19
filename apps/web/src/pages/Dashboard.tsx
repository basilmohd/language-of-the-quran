import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import { Flame, Star, BookOpen, Lock, ChevronRight, Play, RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchLevels, fetchLevel } from '@/lib/api';
import { ApiErrorBanner } from '@/components/ApiErrorBanner';
import { fetchUserStats } from '@/lib/api';
import type { LevelSummary, LevelDetail, UserStats } from '@org/api-types';

export function Dashboard() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [levels, setLevels] = useState<LevelSummary[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  // Lazy-loaded level details keyed by level ID
  const [levelDetails, setLevelDetails] = useState<Record<string, LevelDetail>>({});
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [loadingLevel, setLoadingLevel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const [lvls, st] = await Promise.all([fetchLevels(token), fetchUserStats(token)]);
        if (!cancelled) {
          setLevels(lvls);
          setStats(st);

          // Auto-expand the first unlocked level that has incomplete lessons
          const activeLevel = lvls.find(
            (l) => l.isUnlocked && l.completedLessonCount < l.totalLessonCount
          ) ?? lvls.find((l) => l.isUnlocked);

          if (activeLevel) {
            setExpandedLevels(new Set([activeLevel.id]));
            const detail = await fetchLevel(token, activeLevel.id);
            if (!cancelled) {
              setLevelDetails((prev) => ({ ...prev, [activeLevel.id]: detail }));
            }
          }
        }
      } catch {
        // show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [getToken]);

  async function toggleLevel(levelId: string) {
    if (expandedLevels.has(levelId)) {
      setExpandedLevels((prev) => { const n = new Set(prev); n.delete(levelId); return n; });
      return;
    }
    setExpandedLevels((prev) => new Set([...prev, levelId]));
    if (levelDetails[levelId]) return; // already fetched

    setLoadingLevel(levelId);
    try {
      const token = await getToken();
      if (!token) return;
      const detail = await fetchLevel(token, levelId);
      setLevelDetails((prev) => ({ ...prev, [levelId]: detail }));
    } finally {
      setLoadingLevel(null);
    }
  }

  // Find the next available (unlocked + not completed) lesson from loaded level details
  const nextLesson = (() => {
    for (const level of levels) {
      if (!level.isUnlocked) continue;
      const detail = levelDetails[level.id];
      if (!detail) continue;
      for (const unit of detail.units) {
        for (const lesson of unit.lessons) {
          if (lesson.isUnlocked && lesson.status !== 'COMPLETED') {
            return { levelTitle: level.title, unitTitle: unit.title, lesson, levelId: level.id };
          }
        }
      }
    }
    return null;
  })();

  const totalXp = stats?.totalXp ?? 0;
  const xpTierTitle = stats?.xpTier?.title ?? 'Seeker';
  const nextTierXp = stats?.nextXpTier?.xpRequired ?? null;
  const currentTierXp = stats?.xpTier?.xpRequired ?? 0;
  const xpPct = nextTierXp !== null
    ? Math.min(100, Math.round(((totalXp - currentTierXp) / (nextTierXp - currentTierXp)) * 100))
    : 100;
  const quranCoverage = stats?.quranCoverage ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="font-semibold text-foreground text-sm shrink-0">
            Language of the Quran
          </Link>

          {/* Stats bar */}
          <div className="flex items-center gap-4 text-sm">
            {/* Streak */}
            <div className="flex items-center gap-1 text-foreground font-semibold">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>{stats?.currentStreak ?? 0}</span>
            </div>

            {/* XP tier + progress bar */}
            <div className="hidden sm:flex items-center gap-2">
              <Star className="h-4 w-4 text-secondary shrink-0" />
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-xs font-semibold text-foreground leading-none">{xpTierTitle}</span>
                <div className="w-28 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-secondary transition-all"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
              </div>
              <span className="text-muted-foreground text-xs">{totalXp} XP</span>
            </div>

            {/* Words learned */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span className="font-semibold text-foreground">{stats?.wordsLearned ?? 0}</span>
              <span className="hidden sm:inline text-xs">words</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Link to="/review">
                <RefreshCw className="h-3.5 w-3.5" />
                Review
              </Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <ApiErrorBanner />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Progress summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="border-border bg-card shadow-none">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stats?.wordsLearned ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">words learned</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-none">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-foreground">~{quranCoverage}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Quran comprehension</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-none col-span-2 sm:col-span-1">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-foreground">{xpTierTitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {nextTierXp !== null ? `${totalXp} / ${nextTierXp} XP` : `${totalXp} XP · Max tier`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Continue CTA */}
        {nextLesson && (
          <div className="flex items-center justify-between p-4 rounded-xl border border-primary/30 bg-primary/5">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {nextLesson.levelTitle} · {nextLesson.unitTitle}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{nextLesson.lesson.title}</p>
            </div>
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => navigate(`/lesson/${nextLesson.lesson.id}`)}
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Level path */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Your Path
          </h2>

          {levels.map((level) => {
            const isExpanded = expandedLevels.has(level.id);
            const detail = levelDetails[level.id];
            const isLoading = loadingLevel === level.id;

            return (
              <div key={level.id} className={`rounded-xl border border-border bg-card overflow-hidden ${!level.isUnlocked ? 'opacity-60' : ''}`}>
                {/* Level header — always clickable to expand/collapse */}
                <button
                  onClick={() => toggleLevel(level.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-border text-left hover:bg-muted/30 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center shrink-0 ${level.isUnlocked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border border-border'}`}>
                    {level.icon || level.number}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{level.title}</p>
                    <p className={`text-xs font-medium ${level.isUnlocked ? 'text-primary' : 'text-muted-foreground'}`}>{level.tagline || level.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {level.completedLessonCount}/{level.totalLessonCount}
                    </span>
                    {!level.isUnlocked && !isExpanded
                      ? <Lock className="h-4 w-4 text-muted-foreground" />
                      : isLoading
                        ? <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        : <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    }
                  </div>
                </button>

                {/* Units — only shown when expanded and detail is loaded */}
                {isExpanded && detail && (
                  <div className="divide-y divide-border">
                    {detail.units.map((unit) => (
                      <div key={unit.id} className="px-4 py-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Unit {unit.number} — {unit.title}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {unit.lessons.map((lesson) => {
                            const isCompleted = lesson.status === 'COMPLETED';
                            const isNext =
                              lesson.isUnlocked &&
                              !isCompleted &&
                              nextLesson?.lesson.id === lesson.id;

                            if (isNext) {
                              return (
                                <Link
                                  key={lesson.id}
                                  to={`/lesson/${lesson.id}`}
                                  className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm ring-4 ring-primary/30 animate-pulse hover:ring-primary/50 transition-all"
                                  title={lesson.title}
                                >
                                  <Play className="h-4 w-4" />
                                </Link>
                              );
                            }

                            if (isCompleted) {
                              return (
                                <Link
                                  key={lesson.id}
                                  to={`/lesson/${lesson.id}`}
                                  className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 border border-green-200 font-bold text-sm hover:bg-green-200 transition-colors"
                                  title={`${lesson.title} ✓`}
                                >
                                  ✓
                                </Link>
                              );
                            }

                            if (lesson.isUnlocked) {
                              return (
                                <Link
                                  key={lesson.id}
                                  to={`/lesson/${lesson.id}`}
                                  className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
                                  title={lesson.title}
                                >
                                  {lesson.number}
                                </Link>
                              );
                            }

                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground border border-border"
                                title={`${lesson.title} — locked`}
                              >
                                <Lock className="h-3.5 w-3.5" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Word bank link + motivation note */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between pt-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/word-bank">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              View Word Bank
            </Link>
          </Button>
          <Badge variant="outline" className="text-xs text-muted-foreground border-border">
            Master 350 words → understand ~85% of the Quran
          </Badge>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
