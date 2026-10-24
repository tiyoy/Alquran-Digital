export const QURAN_SEARCH_MODES = {
  all: { label: 'Semua', fields: ['arabic', 'translation', 'latin'] },
  arabic: { label: 'Teks Arab', fields: ['arabic'] },
  translation: { label: 'Terjemahan Indonesia', fields: ['translation'] },
  latin: { label: 'Transliterasi Latin', fields: ['latin'] }
};

export const QURAN_SEARCH_FIELD_LABELS = {
  arabic: 'Teks Arab',
  translation: 'Terjemahan Indonesia',
  latin: 'Transliterasi Latin'
};

/** Normalize Arabic without stripping meaningful letters, or Latin text for case/accent-insensitive matching. */
export function normalizeSearchText(value, field = 'translation') {
  let text = String(value ?? '').normalize('NFKC').replace(/[\u200B-\u200F\uFEFF\u2060]/g, '').replace(/\u0640/g, '');
  if (field === 'arabic') {
    text = text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
  } else {
    text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('id-ID');
  }
  return text.replace(/\s+/g, ' ').trim();
}

function getPayloadMatches(payload) {
  if (Array.isArray(payload?.data?.matches)) return payload.data.matches;
  if (Array.isArray(payload?.matches)) return payload.matches;
  return [];
}

/** Merge different text-edition search responses into unique surah:ayah results. */
export function mergeQuranSearchResponses(sourceResponses, surahMetadata = []) {
  const resultMap = new Map();
  for (const source of sourceResponses || []) {
    if (!source || !source.field) continue;
    for (const match of getPayloadMatches(source.payload).slice(0, 25)) {
      const surahNumber = Number(match?.surah?.number ?? match?.surah?.nomor ?? 0);
      const verseNumber = Number(match?.numberInSurah ?? match?.ayahNumber ?? 0);
      if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114 || !Number.isInteger(verseNumber) || verseNumber < 1 || !String(match?.text || '').trim()) continue;
      if (source.surahFilter && source.surahFilter !== 'all' && Number(source.surahFilter) !== surahNumber) continue;
      const key = `${surahNumber}:${verseNumber}`;
      const surah = surahMetadata[surahNumber - 1] || {};
      let result = resultMap.get(key);
      if (!result) {
        result = {
          key,
          surahNumber,
          verseNumber,
          globalVerseNumber: Number(match.number) || null,
          surahName: surah.namaLatin || match?.surah?.englishName || match?.surah?.name || `Surah ${surahNumber}`,
          surahArabicName: surah.nama || match?.surah?.nameArabic || '',
          matches: []
        };
        resultMap.set(key, result);
      }
      if (!result.matches.some((item) => item.field === source.field)) {
        result.matches.push({ field: source.field, label: QURAN_SEARCH_FIELD_LABELS[source.field] || source.field, text: String(match.text).trim() });
      }
    }
  }
  return [...resultMap.values()]
    .sort((a, b) => a.surahNumber - b.surahNumber || a.verseNumber - b.verseNumber)
    .slice(0, 60);
}

/** Offline fallback searches only verse data the user has already saved on this device. */
export function findCachedVerseSearchResults(query, mode, storage, surahMetadata = [], surahFilter = 'all') {
  const selectedFields = QURAN_SEARCH_MODES[mode]?.fields || QURAN_SEARCH_MODES.all.fields;
  const normalizedQueryByField = Object.fromEntries(selectedFields.map((field) => [field, normalizeSearchText(query, field)]));
  if (!selectedFields.some((field) => normalizedQueryByField[field])) return [];
  const results = [];
  const start = surahFilter === 'all' ? 1 : Number(surahFilter);
  const end = surahFilter === 'all' ? 114 : Number(surahFilter);
  if (!Number.isInteger(start) || start < 1 || start > 114 || !Number.isInteger(end) || end < start || end > 114) return [];

  for (let surahNumber = start; surahNumber <= end; surahNumber += 1) {
    let rows = [];
    try {
      const raw = storage?.getItem(`aq:verses:${surahNumber}`);
      const parsed = raw ? JSON.parse(raw) : [];
      rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.ayat) ? parsed.ayat : [];
    } catch { rows = []; }
    const surah = surahMetadata[surahNumber - 1] || {};
    for (const [index, row] of rows.entries()) {
      const verseNumber = Number(row?.nomorAyat ?? row?.nomor_ayat ?? row?.ayat ?? row?.number ?? index + 1);
      if (!Number.isInteger(verseNumber) || verseNumber < 1 || verseNumber > 286) continue;
      const values = {
        arabic: row?.teksArab ?? row?.teks_arab ?? row?.arabic ?? row?.arab ?? '',
        translation: row?.teksIndonesia ?? row?.teks_indonesia ?? row?.indonesia ?? row?.terjemahan ?? row?.translation ?? '',
        latin: row?.teksLatin ?? row?.teks_latin ?? row?.latin ?? row?.transliterasi ?? row?.transliteration ?? ''
      };
      const matches = [];
      for (const field of selectedFields) {
        const text = String(values[field] || '').trim();
        const needle = normalizedQueryByField[field];
        if (!text || !needle) continue;
        if (normalizeSearchText(text, field).includes(needle)) matches.push({ field, label: QURAN_SEARCH_FIELD_LABELS[field], text });
      }
      if (matches.length) results.push({ key: `${surahNumber}:${verseNumber}`, surahNumber, verseNumber, globalVerseNumber: null, surahName: surah.namaLatin || `Surah ${surahNumber}`, surahArabicName: surah.nama || '', matches, offline: true });
    }
  }
  return results.sort((a, b) => a.surahNumber - b.surahNumber || a.verseNumber - b.verseNumber).slice(0, 60);
}
