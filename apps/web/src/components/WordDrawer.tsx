import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchWordDetail } from '@/lib/api';
import type { WordDetail } from '@org/api-types';
import { cn } from '@/lib/utils';

interface WordDrawerProps {
  wordId: string | null;
  onClose: () => void;
}

/** Slide-up drawer showing word detail + root tree. */
export function WordDrawer({ wordId, onClose }: WordDrawerProps) {
  const { getToken } = useAuth();
  const [detail, setDetail] = useState<WordDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wordId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setDetail(null);
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const data = await fetchWordDetail(token, wordId!);
        if (!cancelled) setDetail(data);
      } catch {
        // silently fail — drawer just stays loading
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [wordId, getToken]);

  const isOpen = !!wordId;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-40 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl transition-transform duration-300 max-h-[80vh] overflow-y-auto',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Close button */}
        <div className="flex items-center justify-between px-4 pb-2">
          <p className="text-sm font-semibold text-muted-foreground">Word Detail</p>
          <Button variant="ghost" size="sm" onClick={onClose} className="-mr-2">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-4 pb-8 space-y-5">
          {loading && (
            <div className="py-12 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {detail && (
            <>
              {/* Word headline */}
              <div className="text-center space-y-1 py-3">
                <p
                  dir="rtl"
                  lang="ar"
                  className="text-4xl font-bold text-foreground"
                  style={{ fontFamily: 'var(--font-arabic)' }}
                >
                  {detail.arabic}
                </p>
                <p className="text-sm text-muted-foreground italic">{detail.transliteration}</p>
                <p className="text-lg font-semibold text-foreground">{detail.meaning}</p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <Badge variant="outline" className="text-xs">{detail.wordType}</Badge>
                  {detail.gender && <Badge variant="outline" className="text-xs">{detail.gender}</Badge>}
                  {detail.frequencyRank && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <BookOpen className="h-3 w-3" />
                      Rank #{detail.frequencyRank}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Root section */}
              {detail.root && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Root</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      dir="rtl"
                      lang="ar"
                      className="text-2xl font-bold text-teal-700"
                      style={{ fontFamily: 'var(--font-arabic)' }}
                    >
                      {detail.root.arabic}
                    </span>
                    <div>
                      <p className="text-sm italic text-muted-foreground">{detail.root.transliteration}</p>
                      <p className="text-sm font-medium text-foreground">{detail.root.primaryMeaning}</p>
                    </div>
                  </div>

                  {detail.root.relatedWords.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Related words from this root:</p>
                      <div className="flex flex-wrap gap-2">
                        {detail.root.relatedWords.map((w, i) => (
                          <div key={i} className="rounded-lg bg-muted px-3 py-1.5 text-center">
                            <p
                              dir="rtl"
                              lang="ar"
                              className="text-sm font-semibold text-foreground"
                              style={{ fontFamily: 'var(--font-arabic)' }}
                            >
                              {w.arabic}
                            </p>
                            <p className="text-xs text-muted-foreground">{w.meaning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Verse occurrences */}
              {detail.verseOccurrences.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    In the Quran
                  </p>
                  {detail.verseOccurrences.map((occ, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {occ.surahName} · {occ.surahNumber}:{occ.ayahNumber}
                      </p>
                      <p
                        dir="rtl"
                        lang="ar"
                        className="text-lg leading-loose text-foreground"
                        style={{ fontFamily: 'var(--font-arabic)' }}
                      >
                        {occ.arabicText}
                      </p>
                      <p className="text-xs text-muted-foreground italic">"{occ.translation}"</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
