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

export function getSurahFromSlug(slug) {
  const value = String(slug || '').toLowerCase();
  const match = value.match(/^(\d+)-([a-z0-9-]+)$/);
  if (!match) return null;
  const number = Number(match[1]);
  const surah = fallbackSurahs[number - 1];
  return surah && getSurahSlug(surah) === value ? surah : null;
}

export function getSurahNumberFromPathname(pathname) {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';
  const match = path.match(/^\/quran\/([^/]+)$/);
  if (!match) return null;
  const surah = getSurahFromSlug(match[1]);
  return surah ? Number(surah.nomor) : null;
}
