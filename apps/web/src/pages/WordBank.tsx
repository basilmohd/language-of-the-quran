import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import { ChevronLeft, BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { WordDrawer } from '@/components/WordDrawer';
import { fetchWordBank } from '@/lib/api';
import { ApiErrorBanner } from '@/components/ApiErrorBanner';
import type { WordBankItem } from '@/lib/api';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'ISM' | 'FIL' | 'HARF';

const WORD_TYPE_LABELS: Record<string, string> = {
  ISM: 'Noun (Ism)',
  FIL: "Verb (Fi'l)",
  HARF: 'Particle (Harf)',
};

const MASTERY_LABEL = (reps: number) => {
  if (reps >= 5) return { label: 'Mastered', color: 'text-green-600 bg-green-50 border-green-200' };
  if (reps >= 3) return { label: 'Learning', color: 'text-teal-600 bg-teal-50 border-teal-200' };
  return { label: 'New', color: 'text-amber-600 bg-amber-50 border-amber-200' };
};

export function WordBank() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<WordBankItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [drawerWordId, setDrawerWordId] = useState<string | null>(null);

  const loadWords = useCallback(async (cursor?: string) => {
    const token = await getToken();
    if (!token) return;

    try {
      const page = await fetchWordBank(token, cursor);
      setItems((prev) => cursor ? [...prev, ...page.items] : page.items);
      setNextCursor(page.nextCursor);
    } catch {
      // silently handle
    }
  }, [getToken]);

  useEffect(() => {
    setLoading(true);
    loadWords().finally(() => setLoading(false));
  }, [loadWords]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    await loadWords(nextCursor);
    setLoadingMore(false);
  }

  const filtered = items.filter((item) => {
    if (filter !== 'all' && item.wordType !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.arabic.includes(search) ||
        item.meaning.toLowerCase().includes(q) ||
        item.transliteration.toLowerCase().includes(q) ||
        item.root?.arabic.includes(search) ||
        false
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/dashboard">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Link>
          </Button>
          <span className="font-semibold text-foreground text-sm">Word Bank</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <ApiErrorBanner />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search Arabic, meaning, or root..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'ISM', 'FIL', 'HARF'] as FilterType[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {f === 'all' ? 'All' : WORD_TYPE_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Stats */}
        <p className="text-xs text-muted-foreground">
          {filtered.length} word{filtered.length !== 1 ? 's' : ''}
          {filter !== 'all' ? ` · ${WORD_TYPE_LABELS[filter]}` : ''}
          {search ? ` matching "${search}"` : ''}
        </p>

        {/* Loading */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? 'Complete lessons to build your word bank.'
                : 'No words match your search.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((item) => {
              const mastery = MASTERY_LABEL(item.repetitions);
              return (
                <Card
                  key={item.reviewId}
                  className="border-border bg-card cursor-pointer hover:border-primary/50 transition-colors shadow-none"
                  onClick={() => setDrawerWordId(item.wordId)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={cn(
                          'text-xs font-medium px-1.5 py-0.5 rounded border',
                          mastery.color,
                        )}
                      >
                        {mastery.label}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0 border-muted text-muted-foreground">
                        {item.wordType}
                      </Badge>
                    </div>
                    <div>
                      <p
                        dir="rtl"
                        lang="ar"
                        className="text-2xl font-bold text-foreground"
                        style={{ fontFamily: 'var(--font-arabic)' }}
                      >
                        {item.arabic}
                      </p>
                      <p className="text-xs text-muted-foreground italic">{item.transliteration}</p>
                      <p className="text-xs text-foreground font-medium mt-0.5">{item.meaning}</p>
                    </div>
                    {item.root && (
                      <p className="text-xs text-muted-foreground">
                        Root:{' '}
                        <span
                          dir="rtl"
                          lang="ar"
                          className="font-medium text-teal-700"
                          style={{ fontFamily: 'var(--font-arabic)' }}
                        >
                          {item.root.arabic}
                        </span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {nextCursor && !loading && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        )}
      </main>

      <WordDrawer wordId={drawerWordId} onClose={() => setDrawerWordId(null)} />
    </div>
  );
}

export default WordBank;
