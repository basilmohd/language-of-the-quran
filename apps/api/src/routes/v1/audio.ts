import { Router, Request, Response } from 'express';
import { fail } from '../../lib/respond.js';

const router = Router();

// Ayah counts per surah (114 surahs, 6236 total ayahs)
const AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53,
  89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12,
  12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 37, 21, 26, 18, 32, 27, 27, 32, 31, 32, 34, 34, 28,
  34, 31, 34, 34, 30, 30, 26, 29, 30, 33, 30, 31, 30, 27, 26, 27, 28, 27, 33, 31, 29, 32, 44,
  31, 34, 34, 23, 35, 38, 47, 38, 71, 69, 52, 47, 56, 76, 89, 64, 46, 59, 67, 40, 53, 59, 42,
  35, 37, 36, 47,
];

function getAbsoluteAyahNumber(surah: number, ayah: number): number {
  if (surah < 1 || surah > 114 || ayah < 1) return -1;
  if (ayah > AYAH_COUNTS[surah - 1]) return -1;

  let position = 0;
  for (let i = 0; i < surah - 1; i++) {
    position += AYAH_COUNTS[i];
  }
  return position + ayah;
}

// GET /api/v1/audio/:reciter/:surah/:ayah
// Proxies audio files with proper CORS headers
// MVP1: sources from alquran.cloud (free, no key required)
router.get('/:reciter/:surah/:ayah', async (req: Request, res: Response): Promise<void> => {
  const { reciter, surah, ayah } = req.params as { reciter: string; surah: string; ayah: string };

  const surahNum = Number(surah);
  const ayahNum = Number(ayah);

  if (isNaN(surahNum) || isNaN(ayahNum) || surahNum < 1 || surahNum > 114) {
    fail(res, 'BAD_REQUEST', 'Invalid surah or ayah number', 400);
    return;
  }

  const absoluteAyahNum = getAbsoluteAyahNumber(surahNum, ayahNum);
  if (absoluteAyahNum < 0) {
    fail(res, 'BAD_REQUEST', 'Invalid ayah number for this surah', 400);
    return;
  }

  // Map reciter slugs to alquran.cloud edition identifiers
  const reciterMap: Record<string, string> = {
    'mishary': 'ar.alafasy',
    'husary': 'ar.husary',
    'sudais': 'ar.abdurrahmaansudais',
    'default': 'ar.alafasy',
  };

  const edition = reciterMap[reciter] ?? reciterMap['default'];
  const paddedAyah = String(absoluteAyahNum).padStart(3, '0');

  // alquran.cloud audio CDN URL format: absolute ayah position (1-6236)
  const cdnUrl = `https://cdn.islamic.network/quran/audio/128/${edition}/${paddedAyah}.mp3`;
  console.log(`[audio] Surah ${surahNum}, Ayah ${ayahNum} → absolute position ${absoluteAyahNum} → ${cdnUrl}`);

  try {
    const audioRes = await fetch(cdnUrl);

    if (!audioRes.ok) {
      console.error(`[audio] CDN returned ${audioRes.status} for ${cdnUrl}`);
      if (audioRes.status === 403 || audioRes.status === 404) {
        fail(res, 'NOT_FOUND', 'Audio not available for this ayah', 404);
        return;
      }
      fail(res, 'UPSTREAM_ERROR', `Failed to fetch audio (CDN ${audioRes.status})`, 502);
      return;
    }

    // Set CORS-friendly headers so browsers can play the audio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Stream the audio response body
    if (audioRes.body) {
      const reader = audioRes.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } finally {
        reader.releaseLock();
      }
    }
  } catch {
    fail(res, 'UPSTREAM_ERROR', 'Failed to fetch audio', 502);
  }
});

export default router;
