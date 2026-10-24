export const TAJWEED_CACHE_KEY = 'aq:tajweed-cache';
export const TAJWEED_CACHE_LIMIT = 3;

// Colors and rule names follow the quran-tajweed edition exposed by AlQuran.cloud.
// Nurani renders explicit source annotations; it does not infer rules from Arabic text.
export const TAJWEED_RULES = Object.freeze([
  { code: 'h', label: 'Hamzatul wasal', description: 'Hamzah wasal', color: '#AAAAAA' },
  { code: 's', label: 'Huruf sukun/silent', description: 'Huruf berpenanda silent pada edisi tajwid', color: '#AAAAAA' },
  { code: 'l', label: 'Lam syamsiyah', description: 'Lam syamsiyah', color: '#AAAAAA' },
  { code: 'n', label: 'Mad normal', description: 'Mad normal: 2 harakat', color: '#537FFF' },
  { code: 'p', label: 'Mad jaiz', description: 'Mad jaiz: 2, 4, atau 6 harakat', color: '#4050FF' },
  { code: 'm', label: 'Mad lazim', description: 'Mad lazim: 6 harakat', color: '#000EBC' },
  { code: 'q', label: 'Qalqalah', description: 'Qalqalah', color: '#DD0008' },
  { code: 'o', label: 'Mad wajib', description: 'Mad wajib: 4–5 harakat', color: '#2144C1' },
  { code: 'c', label: 'Ikhfa syafawi', description: 'Ikhfa syafawi dengan mim', color: '#D500B7' },
  { code: 'f', label: 'Ikhfa', description: 'Ikhfa', color: '#9400A8' },
  { code: 'w', label: 'Idgham syafawi', description: 'Idgham syafawi dengan mim', color: '#58B800' },
  { code: 'i', label: 'Iqlab', description: 'Iqlab', color: '#26BFFD' },
  { code: 'a', label: 'Idgham dengan ghunnah', description: 'Idgham dengan ghunnah', color: '#169777' },
  { code: 'u', label: 'Idgham tanpa ghunnah', description: 'Idgham tanpa ghunnah', color: '#169200' },
  { code: 'd', label: 'Idgham mutajanisain', description: 'Idgham mutajanisain', color: '#A1A1A1' },
  { code: 'b', label: 'Idgham mutaqaribain', description: 'Idgham mutaqaribain', color: '#A1A1A1' },
  { code: 'g', label: 'Ghunnah', description: 'Ghunnah: 2 harakat', color: '#FF7E1E' }
]);

const TAJWEED_RULE_BY_CODE = Object.freeze(Object.fromEntries(TAJWEED_RULES.map((rule) => [rule.code, rule])));

export function parseTajweedMarkup(value) {
  const text = String(value ?? '');
  if (!text) return [];

  // Example source marker: [h:9421[ٱ]. Parse to text segments and React spans,
  // never inject HTML from a remote source.
  const marker = /\[([a-z]):\d+\[([^\]]*)\]/g;
  const parts = [];
  let cursor = 0;
  let match;

  while ((match = marker.exec(text)) !== null) {
    if (match.index > cursor) parts.push({ text: text.slice(cursor, match.index), code: null, rule: null });
    const rule = TAJWEED_RULE_BY_CODE[match[1]] || null;
    if (rule) parts.push({ text: match[2], code: rule.code, rule });
    else parts.push({ text: match[0], code: null, rule: null });
    cursor = marker.lastIndex;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), code: null, rule: null });
  return parts.filter((part) => part.text.length > 0);
}

export function normalizeTajweedAyahs(value) {
  if (!Array.isArray(value)) return [];
  const rows = value.map((row) => ({
    numberInSurah: Number(row?.numberInSurah ?? row?.number_in_surah ?? row?.nomorAyat ?? row?.nomor_ayat),
    text: typeof row?.text === 'string' ? row.text.slice(0, 6000) : typeof row?.teksArab === 'string' ? row.teksArab.slice(0, 6000) : ''
  })).filter((row) => Number.isInteger(row.numberInSurah) && row.numberInSurah >= 1 && row.numberInSurah <= 286 && row.text.trim());
  const unique = new Map();
  rows.forEach((row) => { if (!unique.has(row.numberInSurah)) unique.set(row.numberInSurah, row); });
  return [...unique.values()].sort((a, b) => a.numberInSurah - b.numberInSurah);
}

export function normalizeTajweedCache(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const rows = Object.entries(value).flatMap(([key, item]) => {
    const surahNumber = Number(key);
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114 || !item || typeof item !== 'object') return [];
    const ayahs = normalizeTajweedAyahs(item.ayahs);
    if (!ayahs.length) return [];
    return [[String(surahNumber), { ayahs, updatedAt: Number.isFinite(Number(item.updatedAt)) ? Number(item.updatedAt) : 0 }]];
  });
  rows.sort((left, right) => right[1].updatedAt - left[1].updatedAt);
  return Object.fromEntries(rows.slice(0, TAJWEED_CACHE_LIMIT));
}

export function rememberTajweedSurah(cache, surahNumber, ayahs, updatedAt = Date.now()) {
  const number = Number(surahNumber);
  const normalizedAyahs = normalizeTajweedAyahs(ayahs);
  if (!Number.isInteger(number) || number < 1 || number > 114 || !normalizedAyahs.length) return normalizeTajweedCache(cache);
  return normalizeTajweedCache({
    ...normalizeTajweedCache(cache),
    [String(number)]: { ayahs: normalizedAyahs, updatedAt: Number(updatedAt) || Date.now() }
  });
}
