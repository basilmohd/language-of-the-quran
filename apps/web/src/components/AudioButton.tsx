import { Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';
import { cn } from '@/lib/utils';

interface AudioButtonProps {
  audioUri?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Audio playback button with loading and error states
 * Returns null when audioUri is absent
 */
export function AudioButton({ audioUri, size = 'md', className }: AudioButtonProps) {
  const { play, status, error } = useAudio(audioUri);

  if (!audioUri) {
    return null;
  }

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', iconSize)} />
        );
      case 'playing':
        return <VolumeX className={iconSize} />;
      case 'error':
        return <Volume2 className={cn(iconSize, 'text-destructive')} />;
      case 'idle':
      default:
        return <Volume2 className={iconSize} />;
    }
  };

  const getAriaLabel = () => {
    switch (status) {
      case 'loading':
        return 'Loading audio';
      case 'playing':
        return 'Stop audio';
      case 'error':
        return 'Audio unavailable';
      case 'idle':
      default:
        return 'Play pronunciation';
    }
  };

  return (
    <button
      type="button"
      onClick={play}
      disabled={status === 'loading'}
      aria-label={getAriaLabel()}
      aria-describedby={error ? 'audio-error' : undefined}
      className={cn(
        'inline-flex items-center justify-center p-0.5 rounded-md',
        'hover:bg-muted/50 transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'text-muted-foreground hover:text-foreground',
        className,
      )}
      title={error || undefined}
    >
      {getIcon()}
    </button>
  );
}
