import { useState } from 'react';
import type { GrammarRoleExercise } from '@org/api-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GrammarRoleProps {
  exercise: GrammarRoleExercise;
  onSubmit: (choiceIndex: number) => void;
  disabled?: boolean;
}

export function GrammarRole({ exercise, onSubmit, disabled }: GrammarRoleProps) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide text-xs text-center">
        Grammar Question
      </p>

      {/* Verse context */}
      {exercise.verseContext && (
        <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
          <p
            dir="rtl"
            lang="ar"
            className="text-xl leading-loose text-foreground"
            style={{ fontFamily: 'var(--font-arabic)' }}
          >
            {exercise.verseContext}
          </p>
        </div>
      )}

      {/* Target word */}
      <div className="text-center space-y-1">
        <p
          dir="rtl"
          lang="ar"
          className="text-4xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-arabic)' }}
        >
          {exercise.arabic}
        </p>
        <p className="text-sm text-foreground font-medium">{exercise.question}</p>
      </div>

      {/* Choices */}
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
        onClick={() => { if (selected !== null) onSubmit(selected); }}
      >
        Check
      </Button>
    </div>
  );
}
