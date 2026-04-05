import type { LearnCard as LearnCardType } from '@org/api-types';
import { AyahCard } from '@/components/AyahCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, BookOpen, Sparkles } from 'lucide-react';

interface LearnCardProps {
  card: LearnCardType;
  onNext: () => void;
  onWordTap?: (wordId: string) => void;
}

export function LearnCard({ card, onNext, onWordTap }: LearnCardProps) {
  return (
    <div className="space-y-5">
      {/* Word headline */}
      <div className="text-center space-y-2 py-4">
        <p
          dir="rtl"
          lang="ar"
          className="text-5xl font-bold text-foreground leading-normal"
          style={{ fontFamily: 'var(--font-arabic)' }}
        >
          {card.arabic}
        </p>
        <p className="text-sm text-muted-foreground italic">{card.transliteration}</p>
        <p className="text-xl font-semibold text-foreground">{card.meaning}</p>
      </div>

      {/* Metadata chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {card.rootArabic && (
          <Badge variant="outline" className="text-xs gap-1 border-teal-200 text-teal-700 bg-teal-50">
            <span dir="rtl" lang="ar" style={{ fontFamily: 'var(--font-arabic)' }}>{card.rootArabic}</span>
            {card.rootMeaning && <span>· {card.rootMeaning}</span>}
          </Badge>
        )}
        {card.frequencyInQuran && (
          <Badge variant="outline" className="text-xs gap-1 border-amber-200 text-amber-700 bg-amber-50">
            <BookOpen className="h-3 w-3" />
            {card.frequencyInQuran}× in Quran
          </Badge>
        )}
      </div>

      {/* Special note */}
      {card.specialNote && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
          <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">{card.specialNote}</p>
        </div>
      )}

      {/* Ayah cards */}
      {card.ayahCards.map((ayah, i) => (
        <AyahCard
          key={i}
          card={ayah}
          onWordTap={() => onWordTap?.(card.wordId)}
        />
      ))}

      {/* Next button */}
      <Button className="w-full" size="lg" onClick={onNext}>
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
