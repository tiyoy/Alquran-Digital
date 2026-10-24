const OFFLINE_SURAH_ID_KEY = 'aq:offline-surahs';
const VERSE_CACHE_PATTERN = /^aq:verses:(\d+)$/;

function parseJson(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

export function normalizeOfflineSurahIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter((id) => Number.isInteger(id) && id >= 1 && id <= 114))]
    .sort((a, b) => a - b);
}

function byteLength(value) {
  const text = String(value || '');
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text).length;
  if (typeof Blob !== 'undefined') return new Blob([text]).size;
  return text.length * 2;
}

/** Inspect local surah data without modifying it. Safe to call only in the browser. */
export function inspectOfflineStorage(storage) {
  const cachedSurahBytes = {};
  const cachedVerseCounts = {};
  const cachedSurahIds = [];
  let cachedVerseBytes = 0;

  if (!storage) {
    return {
      cachedSurahIds,
      cachedVerseCounts,
      cachedSurahBytes,
      cachedVerseBytes,
      pinnedSurahIds: [],
      pinnedBytes: 0,
      missingPinnedSurahIds: []
    };
  }

  const pinnedSurahIds = normalizeOfflineSurahIds(parseJson(storage.getItem(OFFLINE_SURAH_ID_KEY), []));
  const keys = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && VERSE_CACHE_PATTERN.test(key)) keys.push(key);
  }

  keys.forEach((key) => {
    const match = VERSE_CACHE_PATTERN.exec(key);
    const surahId = Number(match?.[1]);
    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) return;
    const raw = storage.getItem(key);
    const rows = parseJson(raw, null);
    if (!Array.isArray(rows) || rows.length === 0) return;
    const bytes = byteLength(raw);
    cachedSurahIds.push(surahId);
    cachedVerseCounts[surahId] = rows.length;
    cachedSurahBytes[surahId] = bytes;
    cachedVerseBytes += bytes;
  });

  const normalizedCachedIds = [...new Set(cachedSurahIds)].sort((a, b) => a - b);
  const pinnedBytes = pinnedSurahIds.reduce((total, id) => total + (cachedSurahBytes[id] || 0), 0);
  const cachedSet = new Set(normalizedCachedIds);
  return {
    cachedSurahIds: normalizedCachedIds,
    cachedVerseCounts,
    cachedSurahBytes,
    cachedVerseBytes,
    pinnedSurahIds,
    pinnedBytes,
    missingPinnedSurahIds: pinnedSurahIds.filter((id) => !cachedSet.has(id))
  };
}

export function formatStorageBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB`;
}
