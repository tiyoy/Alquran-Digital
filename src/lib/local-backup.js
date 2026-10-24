import { validateReminderList } from './local-reminders';

export const LOCAL_BACKUP_FORMAT = 'nurani-local-backup';
export const LOCAL_BACKUP_SCHEMA_VERSION = 1;
export const LOCAL_BACKUP_MAX_BYTES = 5 * 1024 * 1024;

// Only personal settings and reading progress are included. Large API catalogues
// (aq:surahs and aq:duas) are intentionally excluded because they can be fetched again.
export const LOCAL_BACKUP_KEYS = Object.freeze([
  'aq:theme',
  'aq:bookmarked-surahs',
  'aq:bookmarked-verses',
  'aq:verse-notes',
  'aq:last-read',
  'aq:read-verse-keys',
  'aq:reading-days',
  'aq:khatam-days',
  'aq:daily-verse-target',
  'aq:reminders',
  'aq:audio-repeat',
  'aq:audio-speed',
  'aq:favorite-asma',
  'aq:reader-prefs'
]);

export const LOCAL_BACKUP_LABELS = Object.freeze({
  'aq:theme': 'Tema aplikasi',
  'aq:bookmarked-surahs': 'Bookmark surah',
  'aq:bookmarked-verses': 'Bookmark ayat',
  'aq:verse-notes': 'Catatan tadabbur',
  'aq:last-read': 'Posisi bacaan terakhir',
  'aq:read-verse-keys': 'Progres ayat yang dibaca',
  'aq:reading-days': 'Riwayat bacaan harian',
  'aq:khatam-days': 'Target khatam',
  'aq:daily-verse-target': 'Target ayat harian',
  'aq:reminders': 'Pengingat tilawah dan doa',
  'aq:audio-repeat': 'Pengulangan audio',
  'aq:audio-speed': 'Kecepatan audio',
  'aq:favorite-asma': 'Favorit Asmaul Husna',
  'aq:reader-prefs': 'Pengaturan pembaca'
});

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isIntegerIn = (value, min, max) => Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
const uniqueIntegers = (value, min, max, limit = 6236) => {
  if (!Array.isArray(value) || value.some((item) => !isIntegerIn(item, min, max))) return null;
  return [...new Set(value.map(Number))].slice(0, limit);
};
const validVerseKey = (value) => {
  const match = /^(\d{1,3}):(\d{1,3})$/.exec(String(value));
  return Boolean(match && isIntegerIn(Number(match[1]), 1, 114) && isIntegerIn(Number(match[2]), 1, 286));
};
const cleanVerseKeys = (value, limit = 6236) => {
  if (!Array.isArray(value) || value.some((item) => !validVerseKey(item))) return null;
  return [...new Set(value.map(String))].slice(-limit);
};

function normalizeVerseNotes(value) {
  if (!isRecord(value)) return null;
  const notes = Object.entries(value).flatMap(([key, item]) => {
    const match = /^(\d{1,3}):(\d{1,3})$/.exec(String(key));
    if (!match || !isRecord(item)) return [];
    const surahId = Number(match[1]);
    const verseNumber = Number(match[2]);
    const text = typeof item.text === 'string' ? item.text.trim().slice(0, 2000) : '';
    if (!isIntegerIn(surahId, 1, 114) || !isIntegerIn(verseNumber, 1, 286) || !text) return [];
    return [[`${surahId}:${verseNumber}`, {
      surahId,
      verseNumber,
      surahName: String(item.surahName || `Surah ${surahId}`).slice(0, 80),
      text,
      updatedAt: Number.isFinite(Number(item.updatedAt)) ? Math.max(0, Number(item.updatedAt)) : 0
    }]];
  });
  notes.sort((left, right) => right[1].updatedAt - left[1].updatedAt);
  return Object.fromEntries(notes.slice(0, 500));
}

function normalizeReadingDays(value) {
  if (!isRecord(value)) return null;
  const entries = Object.entries(value).flatMap(([date, keys]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
    const cleanKeys = cleanVerseKeys(keys, 6236);
    return cleanKeys ? [[date, cleanKeys]] : [];
  }).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
  return Object.fromEntries(entries.slice(-90));
}

function normalizeReaderPrefs(value) {
  if (!isRecord(value)) return null;
  const size = (candidate, min, max, fallback) => {
    const numeric = Number(candidate);
    return Number.isFinite(numeric) ? Math.min(max, Math.max(min, Math.round(numeric))) : fallback;
  };
  return {
    arabicVisible: value.arabicVisible !== false,
    latinVisible: value.latinVisible !== false,
    translationVisible: value.translationVisible !== false,
    tajweedEnabled: value.tajweedEnabled === true || value.tajweedLearningMode === true,
    tajweedLearningMode: value.tajweedLearningMode === true,
    arabicSize: size(value.arabicSize, 20, 52, 32),
    latinSize: size(value.latinSize, 12, 30, 18),
    translationSize: size(value.translationSize, 12, 24, 15),
    qariIndex: size(value.qariIndex, 0, 4, 0)
  };
}

function normalizeBackupValue(key, value) {
  switch (key) {
    case 'aq:theme':
      return value === 'light' || value === 'dark' ? { valid: true, value } : { valid: false };
    case 'aq:bookmarked-surahs': {
      const rows = uniqueIntegers(value, 1, 114, 114);
      return rows ? { valid: true, value: rows } : { valid: false };
    }
    case 'aq:bookmarked-verses':
    case 'aq:read-verse-keys': {
      const rows = cleanVerseKeys(value, 6236);
      return rows ? { valid: true, value: rows } : { valid: false };
    }
    case 'aq:verse-notes': {
      const notes = normalizeVerseNotes(value);
      return notes ? { valid: true, value: notes } : { valid: false };
    }
    case 'aq:last-read': {
      if (value === null) return { valid: true, value: null };
      if (!isRecord(value) || !isIntegerIn(value.surahId, 1, 114) || !isIntegerIn(value.verse, 1, 286)) return { valid: false };
      return { valid: true, value: {
        surahId: Number(value.surahId),
        surahName: String(value.surahName || `Surah ${value.surahId}`).slice(0, 80),
        verse: Number(value.verse),
        updatedAt: Number.isFinite(Number(value.updatedAt)) ? Math.max(0, Number(value.updatedAt)) : 0
      } };
    }
    case 'aq:reading-days': {
      const days = normalizeReadingDays(value);
      return days ? { valid: true, value: days } : { valid: false };
    }
    case 'aq:khatam-days': {
      const days = Number(value);
      return [30, 60, 90].includes(days) ? { valid: true, value: days } : { valid: false };
    }
    case 'aq:daily-verse-target': {
      const target = Number(value);
      return Number.isInteger(target) && target >= 1 && target <= 200 ? { valid: true, value: target } : { valid: false };
    }
    case 'aq:reminders': {
      const reminders = validateReminderList(value);
      return reminders ? { valid: true, value: reminders } : { valid: false };
    }
    case 'aq:audio-repeat':
      return ['off', '3', '5', '10', 'infinite'].includes(value) ? { valid: true, value } : { valid: false };
    case 'aq:audio-speed': {
      const speed = Number(value);
      return [0.75, 0.9, 1, 1.1, 1.25, 1.5].includes(speed) ? { valid: true, value: speed } : { valid: false };
    }
    case 'aq:favorite-asma': {
      const rows = uniqueIntegers(value, 1, 99, 99);
      return rows ? { valid: true, value: rows } : { valid: false };
    }
    case 'aq:reader-prefs': {
      const prefs = normalizeReaderPrefs(value);
      return prefs ? { valid: true, value: prefs } : { valid: false };
    }
    default:
      return { valid: false };
  }
}

export function createLocalBackup(storage, appVersion = '1.20.0', exportedAt = new Date().toISOString()) {
  const data = {};
  LOCAL_BACKUP_KEYS.forEach((key) => {
    const raw = storage.getItem(key);
    if (raw === null) return;
    try {
      const parsed = JSON.parse(raw);
      const result = normalizeBackupValue(key, parsed);
      if (result.valid) data[key] = result.value;
    } catch {
      // Skip a corrupted local record rather than failing the whole export.
    }
  });
  return {
    format: LOCAL_BACKUP_FORMAT,
    schemaVersion: LOCAL_BACKUP_SCHEMA_VERSION,
    appVersion,
    exportedAt,
    data
  };
}

export function validateLocalBackupPayload(payload) {
  if (!isRecord(payload) || payload.format !== LOCAL_BACKUP_FORMAT) {
    return { valid: false, error: 'Format file bukan cadangan Nurani yang dikenal.' };
  }
  if (payload.schemaVersion !== LOCAL_BACKUP_SCHEMA_VERSION) {
    return { valid: false, error: `Versi format cadangan (${String(payload.schemaVersion)}) belum didukung aplikasi ini.` };
  }
  if (!isRecord(payload.data)) return { valid: false, error: 'Bagian data pada file cadangan tidak valid.' };

  const data = {};
  let rejectedEntries = 0;
  Object.entries(payload.data).forEach(([key, value]) => {
    if (!LOCAL_BACKUP_KEYS.includes(key)) {
      rejectedEntries += 1;
      return;
    }
    const result = normalizeBackupValue(key, value);
    if (result.valid) data[key] = result.value;
    else rejectedEntries += 1;
  });
  if (!Object.keys(data).length) {
    return { valid: false, error: 'Tidak ada kategori data Nurani yang valid pada file ini.' };
  }
  return {
    valid: true,
    data,
    rejectedEntries,
    exportedAt: typeof payload.exportedAt === 'string' ? payload.exportedAt : '',
    appVersion: typeof payload.appVersion === 'string' ? payload.appVersion.slice(0, 32) : 'tidak diketahui'
  };
}

export function describeLocalBackupValue(key, value) {
  if (key === 'aq:verse-notes') return `${Object.keys(value || {}).length} catatan`;
  if (key === 'aq:bookmarked-surahs') return `${(value || []).length} surah`;
  if (key === 'aq:bookmarked-verses') return `${(value || []).length} ayat`;
  if (key === 'aq:read-verse-keys') return `${(value || []).length} ayat ditandai dibaca`;
  if (key === 'aq:reading-days') return `${Object.keys(value || {}).length} hari`;
  if (key === 'aq:favorite-asma') return `${(value || []).length} nama`;
  if (key === 'aq:last-read') return value ? `${value.surahName}, ayat ${value.verse}` : 'belum ada';
  if (key === 'aq:khatam-days') return `${value} hari`;
  if (key === 'aq:daily-verse-target') return `${value} ayat per hari`;
  if (key === 'aq:reminders') return `${(value || []).length} jadwal`;
  if (key === 'aq:audio-repeat') return value === 'off' ? 'mati' : value === 'infinite' ? 'tanpa batas' : `${value}×`;
  if (key === 'aq:audio-speed') return `${Number(value).toLocaleString('id-ID')}×`;
  if (key === 'aq:theme') return value === 'dark' ? 'gelap' : 'terang';
  if (key === 'aq:reader-prefs') return 'tersimpan';
  return '';
}
