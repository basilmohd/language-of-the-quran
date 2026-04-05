import { useState } from 'react';
import type { RootRecognitionExercise } from '@org/api-types';
import { Button } from '@/components/ui/button';
import { AudioButton } from '@/components/AudioButton';
import { cn } from '@/lib/utils';

interface RootRecognitionProps {
  exercise: RootRecognitionExercise;
  onSubmit: (choiceIndex: number) => void;
  disabled?: boolean;
}

export function RootRecognition({ exercise, onSubmit, disabled }: RootRecognitionProps) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 py-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Identify the root
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
        <p className="text-sm text-muted-foreground">What are the 3 root letters?</p>
      </div>

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
              className="text-xl text-foreground font-semibold"
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
        onClick={() => { if (selected !== null) onSubmit(selected); }}
      >
        Check
      </Button>
    </div>
  );
}
