import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeedbackBannerProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  onContinue: () => void;
}

/** Bottom-anchored feedback banner — green for correct, amber for wrong. */
export function FeedbackBanner({ isCorrect, correctAnswer, explanation, onContinue }: FeedbackBannerProps) {
  // Auto-advance after 1.5 s on correct
  useEffect(() => {
    if (isCorrect) {
      const timer = setTimeout(onContinue, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, onContinue]);

  return (
    <div
      className={cn(
        'border-t-2 px-4 py-5 transition-all',
        isCorrect
          ? 'bg-green-50 border-green-300'
          : 'bg-amber-50 border-amber-300',
      )}
    >
      <div className="max-w-xl mx-auto">
        {isCorrect ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800 text-sm">Correct!</p>
              <p className="text-green-700 text-xs mt-0.5">Great job — moving on...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-800 text-sm">Not quite</p>
                <p className="text-amber-700 text-xs mt-0.5">
                  Correct answer:{' '}
                  <span
                    dir="rtl"
                    lang="ar"
                    className="font-semibold"
                    style={{ fontFamily: 'var(--font-arabic)' }}
                  >
                    {correctAnswer}
                  </span>
                </p>
                {explanation && (
                  <p className="text-amber-600 text-xs mt-1 leading-relaxed">{explanation}</p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={onContinue}
              className="bg-amber-500 hover:bg-amber-600 text-white border-0 w-full sm:w-auto"
            >
              Got it
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
