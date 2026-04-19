import { useState } from 'react';
import type { WordTranslationExercise } from '@org/api-types';
import { Button } from '@/components/ui/button';
import { AudioButton } from '@/components/AudioButton';
import { cn } from '@/lib/utils';

interface WordTranslationProps {
  exercise: WordTranslationExercise;
  onSubmit: (choiceIndex: number) => void;
  disabled?: boolean;
}

export function WordTranslation({ exercise, onSubmit, disabled }: WordTranslationProps) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleSubmit() {
    if (selected === null) return;
    onSubmit(selected);
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 py-6">
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide text-xs">
          What does this word mean?
        </p>
        <div className="flex items-center justify-center gap-2">
          <p
            dir="rtl"
            lang="ar"
            className="text-5xl font-bold text-foreground leading-normal"
            style={{ fontFamily: 'var(--font-arabic)' }}
          >
            {exercise.arabic}
          </p>
          <AudioButton audioUri={exercise.audioUri} size="md" />
        </div>
        <p className="text-sm text-muted-foreground italic">{exercise.transliteration}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {exercise.choices.map((choice, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setSelected(i)}
            className={cn(
              'rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-all',
              selected === i
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            {choice}
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
