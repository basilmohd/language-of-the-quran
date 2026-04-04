import type { AyahCard as AyahCardType } from '@org/api-types';
import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AyahCardProps {
  card: AyahCardType;
  onWordTap?: (wordArabic: string) => void;
  className?: string;
}

/** Renders a Quranic verse card. The highlighted word is styled in teal. */
export function AyahCard({ card, onWordTap, className }: AyahCardProps) {
  // Split the arabic text to highlight the target word
  const highlighted = card.highlightedWordArabic;
  const parts = card.arabicText.split(highlighted);

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 space-y-3', className)}>
      {/* Surah ref */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">{card.surahName} · {card.surahNumber}:{card.ayahNumber}</span>
      </div>

      {/* Arabic verse */}
      <p
        dir="rtl"
        lang="ar"
        className="text-xl leading-loose text-foreground text-right"
        style={{ fontFamily: 'var(--font-arabic)' }}
      >
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <button
                type="button"
                onClick={() => onWordTap?.(highlighted)}
                className="inline bg-teal-100 border-b-2 border-teal-600 text-teal-800 rounded px-0.5 mx-0.5 cursor-pointer hover:bg-teal-200 transition-colors"
              >
                {highlighted}
              </button>
            )}
          </span>
        ))}
      </p>

      {/* Translation */}
      <p className="text-sm text-muted-foreground leading-relaxed italic">
        "{card.translation}"
      </p>

      {/* Audio stub */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50 select-none">
        <Volume2 className="h-3.5 w-3.5" />
        <span>Audio coming soon</span>
      </div>
    </div>
  );
}
