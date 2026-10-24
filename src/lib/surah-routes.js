import { fallbackSurahs } from '@/lib/data';

/** Stable, readable slugs derived from the bundled mushaf metadata. */
export function slugifySurahName(name) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’‘'`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getSurahSlug(surahOrNumber) {
  const number = typeof surahOrNumber === 'object' ? Number(surahOrNumber?.nomor) : Number(surahOrNumber);
  const surah = fallbackSurahs[number - 1];
  if (!surah || Number(surah.nomor) !== number) return '';
  return `${number}-${slugifySurahName(surah.namaLatin)}`;
}

export function getSurahPath(surahOrNumber) {
  const slug = getSurahSlug(surahOrNumber);
  return slug ? `/quran/${slug}` : '/quran';
}

/** Stable share URL for one ayah, e.g. /quran/1-al-fatihah/1. */
export function getVersePath(surahOrNumber, verseNumber) {
  const number = typeof surahOrNumber === 'object' ? Number(surahOrNumber?.nomor) : Number(surahOrNumber);
  const surah = fallbackSurahs[number - 1];
  const verse = Number(verseNumber);
  const surahPath = getSurahPath(number);
  if (!surah || !Number.isInteger(verse) || verse < 1 || verse > Number(surah.jumlahAyat)) return surahPath;
  return `${surahPath}/${verse}`;
}

export function getSurahFromSlug(slug) {
  const value = String(slug || '').toLowerCase();
  const match = value.match(/^(\d+)-([a-z0-9-]+)$/);
  if (!match) return null;
  const number = Number(match[1]);
  const surah = fallbackSurahs[number - 1];
  return surah && getSurahSlug(surah) === value ? surah : null;
}

export function getQuranRouteFromPathname(pathname) {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';
  const match = path.match(/^\/quran\/([^/]+)(?:\/(\d+))?$/);
  if (!match) return null;
  const surah = getSurahFromSlug(match[1]);
  if (!surah) return null;
  const verseNumber = match[2] ? Number(match[2]) : null;
  if (match[2] && (!Number.isInteger(verseNumber) || verseNumber < 1 || verseNumber > Number(surah.jumlahAyat))) return null;
  return { surahNumber: Number(surah.nomor), verseNumber, slug: match[1] };
}

export function getSurahNumberFromPathname(pathname) {
  return getQuranRouteFromPathname(pathname)?.surahNumber ?? null;
}

export function getVerseNumberFromPathname(pathname) {
  return getQuranRouteFromPathname(pathname)?.verseNumber ?? null;
}
