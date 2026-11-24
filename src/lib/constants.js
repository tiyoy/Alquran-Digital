export const QARIS = [
  {
    id: '05',
    name: 'Sheikh Misyari Rasyid Al-Afasi',
    shortName: 'Misyari Al-Afasi',
    origin: 'Kuwait',
  },
  {
    id: '03',
    name: 'Sheikh Abdurrahman As-Sudais',
    shortName: 'As-Sudais',
    origin: 'Makkah',
  },
  {
    id: '01',
    name: 'Sheikh Abdullah Al-Juhany',
    shortName: 'Al-Juhany',
    origin: 'Makkah',
  },
  {
    id: '02',
    name: 'Sheikh Abdul Muhsin Al-Qasim',
    shortName: 'Al-Qasim',
    origin: 'Madinah',
  },
  {
    id: '04',
    name: 'Sheikh Ibrahim Al-Dossari',
    shortName: 'Al-Dossari',
    origin: 'Arab Saudi',
  },
];

export const COLOR_THEMES = [
  {
    id: 'emerald',
    name: 'Hijau Zamrud',
    shortName: 'Zamrud',
    swatch: '#059669',
    accent: '#D97706',
    desc: 'Klasik Al-Qur\'an hijau emerald',
  },
  {
    id: 'sapphire',
    name: 'Biru Safir',
    shortName: 'Safir',
    swatch: '#0284C7',
    accent: '#F59E0B',
    desc: 'Sejuk seperti kubah masjid biru',
  },
  {
    id: 'indigo',
    name: 'Nila Malam',
    shortName: 'Nila',
    swatch: '#4F46E5',
    accent: '#F59E0B',
    desc: 'Elegan dan fokus untuk tadabbur',
  },
  {
    id: 'amber',
    name: 'Cokelat Mushaf',
    shortName: 'Mushaf',
    swatch: '#B45309',
    accent: '#D97706',
    desc: 'Nuansa kertas mushaf klasik hangat',
  },
  {
    id: 'rose',
    name: 'Merah Delima',
    shortName: 'Delima',
    swatch: '#BE123C',
    accent: '#F59E0B',
    desc: 'Anggun bernuansa rubi lembut',
  },
];

export const STORAGE_KEYS = {
  THEME: 'aqdi_theme',
  COLOR_THEME: 'aqdi_color_theme',
  SETTINGS: 'aqdi_reader_settings',
  SURAH_BOOKMARKS: 'aqdi_surah_bookmarks',
  VERSE_BOOKMARKS: 'aqdi_verse_bookmarks',
  LAST_READ: 'aqdi_last_read',
  PRAYER_CITY: 'aqdi_prayer_city',
  TASBIH: 'aqdi_tasbih_state_v1',
  VERSE_NOTES: 'aqdi_verse_notes_v1',
  OFFLINE_AUDIO_INDEX: 'aqdi_offline_audio_v1',
  READING_STATS: 'aqdi_reading_stats_v1',
  CACHE_SURAH_LIST: 'aqdi_cache_surah_list_v1',
  CACHE_SURAH_DETAIL_PREFIX: 'aqdi_cache_surah_',
  CACHE_PRAYER_PREFIX: 'aqdi_cache_prayer_',
  CACHE_CITIES: 'aqdi_cache_cities_v1',
  CACHE_DUAS: 'aqdi_cache_duas_v1',
};

export const DEFAULT_SETTINGS = {
  arabicSize: 32,
  latinSize: 14,
  translationSize: 15,
  showArabic: true,
  showLatin: true,
  showTranslation: true,
  showTajwid: false,
  qariId: '05',
};

export const ARABIC_SIZE_RANGE = { min: 20, max: 52 };
export const LATIN_SIZE_RANGE = { min: 12, max: 26 };
export const TRANSLATION_SIZE_RANGE = { min: 12, max: 24 };

export const NAV_TABS = [
  { id: 'quran', label: "Al-Qur'an" },
  { id: 'sholat', label: 'Shalat' },
  { id: 'tasbih', label: 'Tasbih' },
  { id: 'doa', label: 'Doa Harian' },
  { id: 'asmaul-husna', label: 'Asmaul Husna' },
];
