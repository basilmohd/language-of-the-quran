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
  const urlRef = useRef<string | null>(null);

  const resolvedUrl = resolveAudioUri(audioUri);

  // Setup event listeners once on mount
  useEffect(() => {
    // If no valid URL, bail early
    if (!resolvedUrl) {
      return;
    }

    // Create new Audio instance (once)
    const audio = new Audio();
    audio.preload = 'none';
    audio.crossOrigin = 'anonymous'; // CORS for remote audio

    // Event listeners
    const handleLoadStart = () => {
      console.log('[useAudio] loadstart event');
      setStatus('loading');
    };
    const handlePlaying = () => {
      console.log('[useAudio] playing event');
      setStatus('playing');
    };
    const handleEnded = () => {
      console.log('[useAudio] ended event');
      setStatus('idle');
    };
    const handlePause = () => {
      console.log('[useAudio] pause event');
      setStatus('idle');
    };
    const handleError = (e: Event) => {
      console.error('[useAudio] error event:', (e.target as HTMLAudioElement)?.error);
      setStatus('error');
      setError('Failed to load audio');
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    audioRef.current = audio;
    urlRef.current = resolvedUrl;

    // Cleanup on unmount
    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
      urlRef.current = null;
      setStatus('idle');
      setError(null);
    };
  }, [resolvedUrl]);

  // Play button callback: toggle playback
  const play = useCallback(() => {
    console.log('[useAudio] play() called, current status:', status);
    if (!audioRef.current) {
      console.warn('[useAudio] No audio ref available');
      return;
    }

    if (status === 'playing') {
      console.log('[useAudio] Pausing audio');
      audioRef.current.pause();
    } else {
      console.log('[useAudio] Starting playback with src:', urlRef.current);
      // Set src only on first play
      if (!audioRef.current.src && urlRef.current) {
        audioRef.current.src = urlRef.current;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn('[useAudio] Play error:', err);
      });
    }
  }, [status]);

  return { play, status, error };
}
