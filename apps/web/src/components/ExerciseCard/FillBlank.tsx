import { useState } from 'react';
import type { FillBlankExercise } from '@org/api-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FillBlankProps {
  exercise: FillBlankExercise;
  onSubmit: (choiceIndex: number) => void;
  disabled?: boolean;
}

export function FillBlank({ exercise, onSubmit, disabled }: FillBlankProps) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleSubmit() {
    if (selected === null) return;
    onSubmit(selected);
  }

  // Replace ___ with the selected word or a styled blank
  const selectedWord = selected !== null ? exercise.choices[selected] : null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide text-xs text-center">
        Fill in the blank
      </p>

      {/* Surah reference */}
      <p className="text-xs text-muted-foreground text-center">
        {exercise.surahName} · {exercise.verseRef}
      </p>

      {/* Arabic verse with blank */}
      <div className="rounded-xl border border-border bg-card px-4 py-5 text-center">
        <p
          dir="rtl"
          lang="ar"
          className="text-2xl leading-loose text-foreground"
          style={{ fontFamily: 'var(--font-arabic)' }}
        >
          {exercise.verseArabic.replace('___', selectedWord ? `[${selectedWord}]` : '___')}
        </p>
        <p className="text-sm text-muted-foreground mt-3 italic">
          {exercise.verseTranslation.replace('___', selectedWord ? `"${selectedWord}"` : '___')}
        </p>
      </div>

      {/* Choices (Arabic words) */}
      <div className="grid grid-cols-2 gap-2">
        {exercise.choices.map((choice, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setSelected(i)}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-center transition-all',
              selected === i
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/50 hover:bg-muted',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            <span
              dir="rtl"
              lang="ar"
              className="text-2xl text-foreground"
              style={{ fontFamily: 'var(--font-arabic)' }}
            >
              {choice}
            </span>
          </button>
        ))}
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={selected === null || disabled}
        onClick={handleSubmit}
      >
        Check
      </Button>
    </div>
  );
}
