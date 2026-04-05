/**
 * Resolve custom audio URI scheme to HTTP API endpoint
 * Input:  "audio://quran/mishary/2/255"
 * Output: "http://localhost:3001/api/v1/audio/mishary/2/255"
 */

const API_BASE = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3001';

export function resolveAudioUri(audioUri: string | undefined | null): string | null {
  if (!audioUri) return null;
  const match = audioUri.match(/^audio:\/\/quran\/(.+)$/);
  if (!match) return null;
  return `${API_BASE}/api/v1/audio/${match[1]}`;
}
