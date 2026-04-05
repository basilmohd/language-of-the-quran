import { useState } from 'react';
import type { WordReorderExercise } from '@org/api-types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WordReorderProps {
  exercise: WordReorderExercise;
  onSubmit: (orderedIds: string[]) => void;
  disabled?: boolean;
}

interface SortableWordProps {
  id: string;
  arabic: string;
  disabled?: boolean;
}

function SortableWord({ id, arabic, disabled }: SortableWordProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-xl border-2 border-border bg-card px-4 py-3 cursor-grab active:cursor-grabbing touch-none select-none transition-all',
        isDragging ? 'opacity-50 border-primary shadow-lg scale-105' : 'hover:border-primary/50 hover:bg-muted',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <span
        dir="rtl"
        lang="ar"
        className="text-xl text-foreground font-medium"
        style={{ fontFamily: 'var(--font-arabic)' }}
      >
        {arabic}
      </span>
    </div>
  );
}

export function WordReorder({ exercise, onSubmit, disabled }: WordReorderProps) {
  const [items, setItems] = useState(exercise.words.map((w) => w.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIdx = prev.indexOf(String(active.id));
        const newIdx = prev.indexOf(String(over.id));
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }

  const wordMap = Object.fromEntries(exercise.words.map((w) => [w.id, w.arabic]));

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 py-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Put the words in the correct order
        </p>
        <p className="text-sm font-medium text-foreground">"{exercise.verseTranslation}"</p>
        <p className="text-xs text-muted-foreground">{exercise.surahName} · {exercise.verseRef}</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-wrap gap-2 justify-center min-h-[60px] p-4 rounded-xl border-2 border-dashed border-border bg-muted/30" dir="rtl">
            {items.map((id) => (
              <SortableWord key={id} id={id} arabic={wordMap[id] ?? ''} disabled={disabled} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        className="w-full"
        size="lg"
        disabled={disabled}
        onClick={() => onSubmit(items)}
      >
        Check Order
      </Button>
    </div>
  );
}
