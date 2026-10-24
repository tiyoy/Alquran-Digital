import { normalizeVerse, unwrapPayload } from './api';

const QURAN_BASE = process.env.NEXT_PUBLIC_QURAN_API || 'https://equran.id/api/v2';

function extractVerseRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  for (const key of ['ayat', 'ayatSurat', 'verses', 'surah', 'items', 'list']) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  // Some API responses wrap the list one level deeper than `data` or `result`.
  for (const key of ['data', 'result']) {
    const nested = payload[key];
    if (Array.isArray(nested)) return nested;
    if (nested && typeof nested === 'object') {
      for (const nestedKey of ['ayat', 'ayatSurat', 'verses', 'surah', 'items', 'list']) {
        if (Array.isArray(nested[nestedKey])) return nested[nestedKey];
      }
    }
  }
  return [];
}

/**
 * Fetch verse data on the server so direct ayah URLs contain the actual Quran
 * text in their initial HTML. Successful responses are cached by Next.js for
 * one day; if the upstream API is temporarily unavailable, the interactive
 * client reader can fall back to its existing network/cache behavior.
 */
export async function getSurahVerseRows(surahNumber) {
  const number = Number(surahNumber);
  if (!Number.isInteger(number) || number < 1 || number > 114) return [];

  try {
    const response = await fetch(`${QURAN_BASE}/surat/${number}`, {
      next: { revalidate: 86400, tags: [`quran-surah-${number}`] },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return [];

    const payload = unwrapPayload(await response.json());
    return extractVerseRows(payload)
      .map((verse, index) => normalizeVerse(verse, index))
      .filter((verse) => verse.teksArab || verse.teksLatin || verse.teksIndonesia);
  } catch {
    return [];
  }
}
