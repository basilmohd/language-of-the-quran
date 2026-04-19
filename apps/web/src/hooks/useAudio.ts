import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveAudioUri } from '@/lib/audio';

type AudioStatus = 'idle' | 'loading' | 'playing' | 'error';

export interface UseAudioResult {
  play: () => void;
  status: AudioStatus;
  error: string | null;
}

/**
 * Hook that manages a single HTML5 Audio instance per audioUri
 * Handles lifecycle, event listeners, and cleanup
 */
export function useAudio(audioUri: string | undefined | null): UseAudioResult {
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const resolvedUrl = resolveAudioUri(audioUri);

  // Create and configure the Audio instance
  useEffect(() => {
    // Clean up previous instance if URL changed
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    setStatus('idle');
    setError(null);

    // If no valid URL, bail early
    if (!resolvedUrl) {
      return;
    }

    // Create new Audio instance
    const audio = new Audio(resolvedUrl);
    audio.preload = 'none'; // Don't prefetch until user clicks

    // Event listeners
    const handleLoadStart = () => setStatus('loading');
    const handlePlaying = () => setStatus('playing');
    const handleEnded = () => setStatus('idle');
    const handlePause = () => setStatus('idle');
    const handleError = () => {
      setStatus('error');
      setError('Failed to load audio');
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    audioRef.current = audio;

    // Cleanup on unmount or URL change
    return () => {
      audio.pause();
      audio.src = ''; // Cancel any in-progress network request
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
      setStatus('idle');
      setError(null);
    };
  }, [resolvedUrl]);

  // Play button callback: toggle playback
  const play = useCallback(() => {
    if (!audioRef.current) return;

    if (status === 'playing') {
      audioRef.current.pause();
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Silently ignore play rejection (e.g., rapid double-click interrupting)
      });
    }
  }, [status]);

  return { play, status, error };
}
