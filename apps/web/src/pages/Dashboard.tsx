import { Link } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Star, BookOpen, Lock, ChevronRight, Play } from 'lucide-react';

// Mock data — will be driven by API + Clerk auth in production
const MOCK_USER = {
  name: 'Learner',
  xp: 0,
  xpToNextLevel: 100,
  streak: 0,
  wordsLearned: 0,
};

const LEVELS = [
  {
    number: 1,
    title: 'The Building Blocks',
    subtitle: 'Ism (Nouns)',
    locked: false,
    units: [
      { number: 1, title: 'Nouns & Gender', lessons: [
        { number: 1, title: 'What is an Ism?', unlocked: true },
        { number: 2, title: 'Masculine & Feminine', unlocked: false },
        { number: 3, title: 'Singular & Plural', unlocked: false },
      ]},
      { number: 2, title: 'Definiteness', lessons: [
        { number: 1, title: 'The Definite Article ال', unlocked: false },
        { number: 2, title: 'Definite vs. Indefinite', unlocked: false },
        { number: 3, title: 'Tanwin (Nunation)', unlocked: false },
      ]},
      { number: 3, title: 'Idhafah', lessons: [
        { number: 1, title: 'Possessive Constructions', unlocked: false },
        { number: 2, title: 'Two-Word Idhafah', unlocked: false },
        { number: 3, title: 'Chained Idhafah', unlocked: false },
      ]},
      { number: 4, title: 'Cases', lessons: [
        { number: 1, title: 'Raf\' — Subject Case', unlocked: false },
        { number: 2, title: 'Nasb — Object Case', unlocked: false },
        { number: 3, title: 'Jarr — Genitive Case', unlocked: false },
      ]},
      { number: 5, title: 'Review', lessons: [
        { number: 1, title: 'Ism Review I', unlocked: false },
        { number: 2, title: 'Ism Review II', unlocked: false },
        { number: 3, title: 'Level 1 Checkpoint', unlocked: false },
      ]},
    ],
  },
  { number: 2, title: 'The Engine', subtitle: "Fi'l (Verbs)", locked: true, units: [] },
  { number: 3, title: 'The Connectors', subtitle: 'Harf (Particles)', locked: true, units: [] },
  { number: 4, title: 'The Root System', subtitle: 'Sarf', locked: true, units: [] },
  { number: 5, title: 'Sentence Anatomy', subtitle: 'Nahw', locked: true, units: [] },
  { number: 6, title: 'Contextual Reading', subtitle: 'Full Passages', locked: true, units: [] },
];

const QURAN_COVERAGE_PCT = Math.round((MOCK_USER.wordsLearned / 350) * 85);

export function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="font-semibold text-foreground text-sm shrink-0">
            The Language of the Quran
          </Link>

          {/* Stats bar */}
          <div className="flex items-center gap-4 text-sm">
            {/* Streak */}
            <div className="flex items-center gap-1 text-foreground font-semibold">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>{MOCK_USER.streak}</span>
            </div>

            {/* XP bar */}
            <div className="hidden sm:flex items-center gap-2">
              <Star className="h-4 w-4 text-secondary shrink-0" />
              <div className="w-28 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-secondary transition-all"
                  style={{ width: `${(MOCK_USER.xp / MOCK_USER.xpToNextLevel) * 100}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs">{MOCK_USER.xp} XP</span>
            </div>

            {/* Words learned */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span className="font-semibold text-foreground">{MOCK_USER.wordsLearned}</span>
              <span className="hidden sm:inline text-xs">words</span>
            </div>
          </div>

          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Progress summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="border-border bg-card shadow-none">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-foreground">{MOCK_USER.wordsLearned}</p>
              <p className="text-xs text-muted-foreground mt-0.5">words learned</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-none">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-foreground">{QURAN_COVERAGE_PCT}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Quran comprehension</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-none col-span-2 sm:col-span-1">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-foreground">{MOCK_USER.streak}</p>
              <p className="text-xs text-muted-foreground mt-0.5">day streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Continue CTA */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-primary/30 bg-primary/5">
          <div>
            <p className="text-sm font-semibold text-foreground">Level 1 · Unit 1 · Lesson 1</p>
            <p className="text-xs text-muted-foreground mt-0.5">What is an Ism?</p>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link to="/lesson/1-1-1">
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Level path */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Your Path
          </h2>

          {/* Level 1 — expanded */}
          {(() => {
            const level = LEVELS[0];
            return (
              <div key={level.number} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Level header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
                    {level.number}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{level.title}</p>
                    <p className="text-xs text-primary font-medium">{level.subtitle}</p>
                  </div>
                </div>

                {/* Units */}
                <div className="divide-y divide-border">
                  {level.units.map((unit) => (
                    <div key={unit.number} className="px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Unit {unit.number} — {unit.title}
                      </p>
                      <div className="flex items-center gap-2">
                        {unit.lessons.map((lesson) => {
                          const isActive = unit.number === 1 && lesson.number === 1;
                          const isUnlocked = lesson.unlocked;

                          if (isActive) {
                            return (
                              <Link
                                key={lesson.number}
                                to="/lesson/1-1-1"
                                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm ring-4 ring-primary/30 animate-pulse hover:ring-primary/50 transition-all"
                                title={lesson.title}
                              >
                                <Play className="h-4 w-4" />
                              </Link>
                            );
                          }

                          if (isUnlocked) {
                            return (
                              <Link
                                key={lesson.number}
                                to={`/lesson/${level.number}-${unit.number}-${lesson.number}`}
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
                                title={lesson.title}
                              >
                                {lesson.number}
                              </Link>
                            );
                          }

                          return (
                            <div
                              key={lesson.number}
                              className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground border border-border"
                              title={`${lesson.title} — locked`}
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </div>
                          );
                        })}
                        <span className="ml-2 text-xs text-muted-foreground hidden sm:block">
                          {unit.lessons.find(l => l.unlocked && unit.number === 1 && l.number === 1)
                            ? unit.lessons[0].title
                            : `${unit.lessons.filter(l => !l.unlocked).length} lessons locked`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Levels 2–6 — locked */}
          {LEVELS.slice(1).map((level) => (
            <div
              key={level.number}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card opacity-50"
            >
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-bold flex items-center justify-center shrink-0 border border-border">
                {level.number}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{level.title}</p>
                <p className="text-xs text-muted-foreground font-medium">{level.subtitle}</p>
              </div>
              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>

        {/* Motivation note */}
        <div className="text-center py-4">
          <Badge variant="outline" className="text-xs text-muted-foreground border-border">
            Master 350 words → understand ~85% of the Quran
          </Badge>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
