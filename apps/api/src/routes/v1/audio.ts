import { Router, Request, Response } from 'express';
import { fail } from '../../lib/respond.js';

const router = Router();

// GET /api/v1/audio/:reciter/:surah/:ayah
// Resolves audio://quran/{reciter}/{surah}/{ayah} URIs to CDN URLs
// MVP1: proxies to alquran.cloud (free, no key required)
router.get('/:reciter/:surah/:ayah', async (req: Request, res: Response): Promise<void> => {
  const { reciter, surah, ayah } = req.params as { reciter: string; surah: string; ayah: string };

  const surahNum = Number(surah);
  const ayahNum = Number(ayah);

  if (isNaN(surahNum) || isNaN(ayahNum) || surahNum < 1 || surahNum > 114) {
    fail(res, 'BAD_REQUEST', 'Invalid surah or ayah number', 400);
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
  const paddedSurah = String(surahNum).padStart(3, '0');
  const paddedAyah = String(ayahNum).padStart(3, '0');

  // alquran.cloud audio CDN URL format
  const cdnUrl = `https://cdn.islamic.network/quran/audio/128/${edition}/${surahNum * 1000 + ayahNum}.mp3`;

  res.redirect(302, cdnUrl);
  void paddedSurah; void paddedAyah; // used in future self-hosted format
});

export default router;
