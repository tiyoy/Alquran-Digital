'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, AudioLines, BellRing, Bookmark, BookMarked, BookOpen, CalendarDays, Check, Compass, Flame, TrendingUp,
  ChevronDown, ChevronLeft, ChevronRight, Clock3, Copy, Download, HandHeart,
  Headphones, Heart, Home, Info, ListFilter, LoaderCircle, MapPin, Minus, Moon, Gauge,
  MoreHorizontal, Pause, Play, Plus, RefreshCw, Search, Settings2, ShieldCheck,
  Share2, SlidersHorizontal, Sparkles, Sun, Wifi, WifiOff, X, Repeat, Target, StickyNote, PencilLine, Trash2, Upload, Palette
} from 'lucide-react';
import { asmaulHusna, enforceBeforeMealDua, fallbackDuas, fallbackSurahs, MIN_DUA_CATALOG_SIZE } from '@/lib/data';
import { extractDuaRows, isUsableDua, normalizeDua } from '@/lib/duas';
import { QURAN_SEARCH_FIELD_LABELS, QURAN_SEARCH_MODES, findCachedVerseSearchResults } from '@/lib/quran-search';
import { DAILY_VERSE_GOAL_OPTIONS, DEFAULT_DAILY_VERSE_GOAL, getTilawahStats, normalizeDailyVerseGoal } from '@/lib/tilawah-stats';
import { getDuaPath, getDuaSlug, getDuaSlugFromPathname } from '@/lib/dua-routes';
import { PATH_TABS, SECTION_SEO_BY_TAB, TAB_PATHS, VALID_TABS } from '@/lib/section-routes';
import { getSurahNumberFromPathname, getSurahPath, getVerseNumberFromPathname, getVersePath } from '@/lib/surah-routes';
import { siteName, siteUrl } from '@/lib/site-config';
import {
  LOCAL_BACKUP_LABELS, LOCAL_BACKUP_MAX_BYTES,
  createLocalBackup, describeLocalBackupValue, validateLocalBackupPayload
} from '@/lib/local-backup';
import { formatStorageBytes, inspectOfflineStorage, normalizeOfflineSurahIds } from '@/lib/offline-storage';
import { TAJWEED_CACHE_KEY, TAJWEED_RULES, normalizeTajweedAyahs, normalizeTajweedCache, parseTajweedMarkup, rememberTajweedSurah } from '@/lib/tajweed';
import {
  MAX_AUDIO_TRACK_BYTES, MAX_TOTAL_AUDIO_BYTES, OFFLINE_AUDIO_CACHE_NAME, OFFLINE_AUDIO_STORAGE_KEY,
  inspectOfflineAudioCache, normalizeOfflineAudioTracks, totalOfflineAudioBytes, upsertOfflineAudioTrack
} from '@/lib/offline-audio';
import { DEFAULT_REMINDER_DRAFT, normalizeReminderList, REMINDER_DAY_OPTIONS, REMINDER_MAX_COUNT } from '@/lib/local-reminders';
import QiblaFinder from '@/components/QiblaFinder';
import {
  chooseAudio, cleanArabicText, fetchAllPrayerCities, fetchDuas, fetchPrayerCity, fetchPrayerSchedule,
  fetchQuran, firstArray, normalizeSurah, normalizeVerse, unwrapPayload
} from '@/lib/api';

// Keep the familiar default (Misyari) first; api.js maps these display positions
// to EQuran's real IDs: 05, 03, 01, 02, 04, and 06 respectively.
const QARIS = [
  'Sheikh Misyari Rasyid Al-Afasi',
  'Sheikh Abdurrahman As-Sudais',
  'Sheikh Abdullah Al-Juhany',
  'Sheikh Abdul Muhsin Al-Qasim',
  'Sheikh Ibrahim Al-Dossari',
  'Sheikh Yasser Al-Dosari'
];
const QARI_IDS = ['05', '03', '01', '02', '04', '06'];
const NAV_ITEMS = [
  { id: 'home', label: 'Beranda', icon: Home },
  { id: 'quran', label: 'Al-Qur’an', icon: BookOpen },
  { id: 'search', label: 'Cari', icon: Search },
  { id: 'prayer', label: 'Shalat', icon: Clock3 },
  { id: 'duas', label: 'Doa', icon: HandHeart },
  { id: 'asma', label: 'Asmaul', icon: Sparkles }
];
function normalizePathname(pathname) {
  return String(pathname || '/').replace(/\/+$/, '') || '/';
}
const PRAYERS = [
  { key: 'subuh', label: 'Subuh' }, { key: 'dzuhur', label: 'Dzuhur' },
  { key: 'ashar', label: 'Ashar' }, { key: 'maghrib', label: 'Maghrib' },
  { key: 'isya', label: 'Isya' }
];

const EMPTY_INITIAL_VERSES = [];
function TajweedArabicText({ text, interactive = false, onRuleSelect, selectedRuleCode = null, selectedExcerpt = '' }) {
  const parts = useMemo(() => parseTajweedMarkup(text), [text]);
  return <>{parts.map((part, index) => {
    const key = `${part.code || 'plain'}-${index}`;
    const selected = Boolean(part.code && selectedRuleCode === part.code && selectedExcerpt === part.text);
    const title = part.rule ? `${part.rule.label}: ${part.rule.reading}` : undefined;
    if (interactive && part.code && part.rule && typeof onRuleSelect === 'function') {
      return <button type="button" key={key} className={`tajweed-token tajweed-interactive-token tajweed-${part.code}${selected ? ' is-selected' : ''}`} title={title} aria-label={`Pelajari hukum ${part.rule.label}`} aria-pressed={selected} onClick={() => onRuleSelect({ rule: part.rule, excerpt: part.text })}>{part.text}</button>;
    }
    return <span key={key} className={part.code ? `tajweed-token tajweed-${part.code}` : 'tajweed-plain'} title={title}>{part.text}</span>;
  })}</>;
}
function mergeInitialDua(rows, initialDua) {
  if (!initialDua) return rows;
  const normalized = normalizeDua(initialDua);
  const slug = getDuaSlug(normalized);
  const existing = rows.findIndex((row, index) => getDuaSlug(row, index) === slug);
  if (existing >= 0) return rows.map((row, index) => index === existing ? normalized : row);
  return [...rows, normalized];
}
const TOTAL_QURAN_VERSES = 6236;
const KHATAM_OPTIONS = [30, 60, 90];
const REMINDER_KIND_LABELS = { tilawah: 'Tilawah', doa: 'Doa harian', both: 'Tilawah & doa' };
const AUDIO_REPEAT_OPTIONS = [
  { value: 'off', label: 'Mati' },
  { value: '3', label: '3×' },
  { value: '5', label: '5×' },
  { value: '10', label: '10×' },
  { value: 'infinite', label: 'Tanpa batas' }
];
const AUDIO_SPEED_OPTIONS = [
  { value: 0.75, label: '0,75×' },
  { value: 0.9, label: '0,9×' },
  { value: 1, label: 'Normal (1×)' },
  { value: 1.1, label: '1,1×' },
  { value: 1.25, label: '1,25×' },
  { value: 1.5, label: '1,5×' }
];
function jakartaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function readLocal(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; /* Storage can be disabled or full. */ }
}
function postToOfflineWorker(message) {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then((registration) => {
      const worker = registration.active || navigator.serviceWorker.controller;
      worker?.postMessage(message);
    }).catch(() => {});
  } catch { /* Offline caching is an enhancement; local verse data remains available. */ }
}
function normalizeVerseNotes(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const valid = Object.entries(value).flatMap(([key, item]) => {
    const match = /^(\d{1,3}):(\d{1,3})$/.exec(String(key));
    if (!match || !item || typeof item !== 'object') return [];
    const surahId = Number(match[1]);
    const verseNumber = Number(match[2]);
    const text = typeof item.text === 'string' ? item.text.trim().slice(0, 2000) : '';
    if (surahId < 1 || surahId > 114 || verseNumber < 1 || verseNumber > 286 || !text) return [];
    return [[`${surahId}:${verseNumber}`, {
      surahId,
      verseNumber,
      surahName: String(item.surahName || `Surah ${surahId}`).slice(0, 80),
      text,
      updatedAt: Number.isFinite(Number(item.updatedAt)) ? Number(item.updatedAt) : 0
    }]];
  });
  valid.sort((a, b) => b[1].updatedAt - a[1].updatedAt);
  return Object.fromEntries(valid.slice(0, 500));
}
function toPrayerTimes(raw) {
  const container = raw?.jadwal ?? raw?.schedule ?? raw ?? {};
  const keys = ['imsak', 'subuh', 'terbit', 'dhuha', 'dzuhur', 'ashar', 'maghrib', 'isya'];
  const result = {};
  keys.forEach((key) => { if (container[key]) result[key] = container[key]; });
  return result;
}
function timezoneForLocation(location = '') {
  const name = String(location).toUpperCase();
  if (/PAPUA|JAYAPURA|SORONG|MALUKU|AMBON|TERNATE|HALMAHERA/.test(name)) return 'Asia/Jayapura';
  if (/SULAWESI|MAKASSAR|GORONTALO|MANADO|PALU|KALIMANTAN TIMUR|KALIMANTAN UTARA|BALIKPAPAN|SAMARINDA|BALI|NUSA TENGGARA|MATARAM|KUPANG/.test(name)) return 'Asia/Makassar';
  return 'Asia/Jakarta';
}
function getUpcomingPrayer(schedule, timezone = 'Asia/Jakarta') {
  if (!schedule) return null;
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
  const minutesNow = hour * 60 + minute;
  const order = [
    ['subuh', 'Subuh'], ['dzuhur', 'Dzuhur'], ['ashar', 'Ashar'],
    ['maghrib', 'Maghrib'], ['isya', 'Isya']
  ];
  for (const [key, label] of order) {
    const value = schedule[key];
    if (!value || !/^\d{1,2}:\d{2}$/.test(String(value))) continue;
    const [h, m] = value.split(':').map(Number);
    if (h * 60 + m > minutesNow) return { key, label, time: value };
  }
  return order[0][0] && schedule.subuh ? { key: 'subuh', label: 'Subuh', time: schedule.subuh, tomorrow: true } : null;
}
function formatToday() {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date());
}
function extractVerseRows(payload) {
  if (Array.isArray(payload)) return payload;
  return firstArray(payload, ['ayat', 'ayatSurat', 'verses', 'surah', 'tafsir', 'data', 'items', 'list']);
}
function tafsirRowText(row) {
  const value = row?.teksTafsir ?? row?.teks_tafsir ?? row?.tafsirKemenag ?? row?.tafsir_kemenag ?? row?.tafsir ?? row?.teks ?? row?.content ?? '';
  return typeof value === 'string' ? value : '';
}
function findTafsirText(payload, verseNumber) {
  const rows = extractVerseRows(payload);
  const match = rows.find((row) => Number(row.ayat ?? row.nomorAyat ?? row.nomor_ayat ?? row.verse ?? 0) === Number(verseNumber));
  if (match) return tafsirRowText(match);
  if (typeof payload === 'string') return payload;
  if (rows.length) return rows.map((row) => {
    const number = row.ayat ?? row.nomorAyat ?? row.nomor_ayat ?? row.verse;
    const text = tafsirRowText(row);
    return text ? `${number ? `Ayat ${number}\n` : ''}${text}` : '';
  }).filter(Boolean).join('\n\n');
  const direct = payload?.teksTafsir ?? payload?.teks_tafsir ?? payload?.deskripsi ?? payload?.content ?? payload?.tafsir;
  return typeof direct === 'string' ? direct : '';
}

export default function HomePage({ initialTab = 'home', initialSurahNumber = null, initialVerseNumber = null, initialVerseRows = EMPTY_INITIAL_VERSES, initialDuaSlug = null, initialDua = null }) {
  const safeInitialTab = VALID_TABS.includes(initialTab) ? initialTab : 'home';
  const parsedInitialSurahNumber = Number(initialSurahNumber);
  const safeInitialSurahNumber = Number.isInteger(parsedInitialSurahNumber) && parsedInitialSurahNumber >= 1 && parsedInitialSurahNumber <= 114
    ? parsedInitialSurahNumber
    : null;
  const initialSurahMetadata = safeInitialSurahNumber ? fallbackSurahs[safeInitialSurahNumber - 1] : null;
  const parsedInitialVerseNumber = Number(initialVerseNumber);
  const safeInitialVerseNumber = initialSurahMetadata && Number.isInteger(parsedInitialVerseNumber)
    && parsedInitialVerseNumber >= 1 && parsedInitialVerseNumber <= Number(initialSurahMetadata.jumlahAyat)
    ? parsedInitialVerseNumber
    : null;
  const safeInitialVerseRows = Array.isArray(initialVerseRows) ? initialVerseRows : [];
  const [activeTab, setActiveTab] = useState(safeInitialTab);
  const [theme, setTheme] = useState('light');
  const [dateLabel, setDateLabel] = useState('');
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [toast, setToast] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [remindersLoaded, setRemindersLoaded] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [reminderEditingId, setReminderEditingId] = useState(null);
  const [reminderDraft, setReminderDraft] = useState(() => ({ ...DEFAULT_REMINDER_DRAFT, days: [...DEFAULT_REMINDER_DRAFT.days] }));
  const backupFileInputRef = useRef(null);

  const [surahs, setSurahs] = useState(fallbackSurahs);
  const [surahLoading, setSurahLoading] = useState(true);
  const [surahQuery, setSurahQuery] = useState('');
  const [surahFilter, setSurahFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('all');
  const [searchSurahFilter, setSearchSurahFilter] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState('idle');
  const [searchError, setSearchError] = useState('');
  const [searchRetryCount, setSearchRetryCount] = useState(0);
  const [searchOfflineResults, setSearchOfflineResults] = useState(false);
  const [searchVisibleCount, setSearchVisibleCount] = useState(20);
  const [selectedSurah, setSelectedSurah] = useState(initialSurahMetadata);
  const [sharedVerseTarget] = useState(safeInitialVerseNumber);
  const [verses, setVerses] = useState(safeInitialVerseRows);
  const [verseLoading, setVerseLoading] = useState(Boolean(initialSurahMetadata) && safeInitialVerseRows.length === 0);
  const [verseQuery, setVerseQuery] = useState('');
  const [arabicVisible, setArabicVisible] = useState(true);
  const [latinVisible, setLatinVisible] = useState(true);
  const [translationVisible, setTranslationVisible] = useState(true);
  const [tajweedEnabled, setTajweedEnabled] = useState(false);
  const [tajweedLearningMode, setTajweedLearningMode] = useState(false);
  const [selectedTajweedLesson, setSelectedTajweedLesson] = useState(null);
  const [tajweedCache, setTajweedCache] = useState({});
  const [tajweedLoadingSurah, setTajweedLoadingSurah] = useState(null);
  const [tajweedErrorSurah, setTajweedErrorSurah] = useState(null);
  const [arabicSize, setArabicSize] = useState(32);
  const [latinSize, setLatinSize] = useState(18);
  const [translationSize, setTranslationSize] = useState(15);
  const [readerSettingsOpen, setReaderSettingsOpen] = useState(false);
  const [qariIndex, setQariIndex] = useState(0);
  const [bookmarkedSurahs, setBookmarkedSurahs] = useState([]);
  const [bookmarkedVerses, setBookmarkedVerses] = useState([]);
  const [verseNotes, setVerseNotes] = useState({});
  const [editingVerseNote, setEditingVerseNote] = useState(null);
  const [verseNoteDraft, setVerseNoteDraft] = useState('');
  const [verseNotesModalOpen, setVerseNotesModalOpen] = useState(false);
  const [lastRead, setLastRead] = useState(null);
  const [readVerseKeys, setReadVerseKeys] = useState([]);
  const [readingDays, setReadingDays] = useState({});
  const [khatamDays, setKhatamDays] = useState(30);
  const [dailyVerseGoal, setDailyVerseGoal] = useState(DEFAULT_DAILY_VERSE_GOAL);
  const [dailyGoalDraft, setDailyGoalDraft] = useState(String(DEFAULT_DAILY_VERSE_GOAL));
  const [dailyGoalLoaded, setDailyGoalLoaded] = useState(false);
  const [offlineSurahs, setOfflineSurahs] = useState([]);
  const [offlineStorageStats, setOfflineStorageStats] = useState({ cachedSurahIds: [], cachedVerseCounts: {}, cachedSurahBytes: {}, cachedVerseBytes: 0, pinnedSurahIds: [], pinnedBytes: 0, missingPinnedSurahIds: [], originUsage: null, originQuota: null });
  const [offlineManagerExpanded, setOfflineManagerExpanded] = useState(false);
  const [offlineAudioTracks, setOfflineAudioTracks] = useState([]);
  const [offlineAudioFilter, setOfflineAudioFilter] = useState('all');
  const [offlineAudioStats, setOfflineAudioStats] = useState({ cachedSrcs: [], missingSrcs: [], cachedBytes: 0 });
  const [audioDownloadProgress, setAudioDownloadProgress] = useState(null);
  const audioDownloadInFlightRef = useRef(false);
  const [tafsirModal, setTafsirModal] = useState(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [jumpVerse, setJumpVerse] = useState('');

  const [audioInfo, setAudioInfo] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioExpanded, setAudioExpanded] = useState(false);
  const [audioRepeat, setAudioRepeat] = useState('off');
  const [audioSpeed, setAudioSpeed] = useState(1);
  const audioRef = useRef(null);
  const audioObjectUrlRef = useRef(null);
  const routeSyncInitializedRef = useRef(false);
  const initialSurahOpenedRef = useRef(null);
  const repeatCountRef = useRef(0);
  const pendingJumpRef = useRef(safeInitialVerseNumber || null);

  const [activeDuaSlug, setActiveDuaSlug] = useState(initialDuaSlug || null);
  const [duas, setDuas] = useState(() => {
    const base = enforceBeforeMealDua(fallbackDuas.map(normalizeDua));
    if (!initialDua) return base;
    const normalizedInitial = normalizeDua(initialDua);
    const slug = getDuaSlug(normalizedInitial);
    const withoutDuplicate = base.filter((row, index) => getDuaSlug(row, index) !== slug && String(row.id) !== String(normalizedInitial.id));
    return [...withoutDuplicate, normalizedInitial];
  });
  const [duaQuery, setDuaQuery] = useState('');
  const [expandedDua, setExpandedDua] = useState(initialDua?.id ?? null);
  const activeDua = useMemo(() => {
    if (!activeDuaSlug) return null;
    return duas.find((dua, index) => getDuaSlug(dua, index) === activeDuaSlug)
      || (initialDua && getDuaSlug(initialDua) === activeDuaSlug ? normalizeDua(initialDua) : null);
  }, [activeDuaSlug, duas, initialDua]);
  const [asmaQuery, setAsmaQuery] = useState('');
  const [favoriteAsma, setFavoriteAsma] = useState([]);

  const [cityName, setCityName] = useState('KAB. BOGOR');
  const [cityId, setCityId] = useState('');
  const [cityQuery, setCityQuery] = useState('Kab. Bogor');
  const [cityMatches, setCityMatches] = useState([]);
  const [cityCatalogue, setCityCatalogue] = useState([]);
  const [cityRegion, setCityRegion] = useState('all');
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [prayerSchedule, setPrayerSchedule] = useState(null);
  const [prayerTimezone, setPrayerTimezone] = useState('Asia/Jakarta');
  const [prayerDate, setPrayerDate] = useState('');
  const [prayerLoading, setPrayerLoading] = useState(true);
  const [prayerError, setPrayerError] = useState('');
  const [clockTick, setClockTick] = useState(0);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => setToast(''), 2800);
  }, []);

  const refreshOfflineStorage = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const details = inspectOfflineStorage(window.localStorage);
    let originUsage = null;
    let originQuota = null;
    try {
      const estimate = await navigator.storage?.estimate?.();
      if (Number.isFinite(estimate?.usage)) originUsage = estimate.usage;
      if (Number.isFinite(estimate?.quota)) originQuota = estimate.quota;
    } catch { /* Storage estimates are optional and browser-dependent. */ }
    setOfflineStorageStats({ ...details, originUsage, originQuota });
  }, []);
  const refreshOfflineAudioStats = useCallback(async (tracks = offlineAudioTracks) => {
    const details = await inspectOfflineAudioCache(tracks);
    setOfflineAudioStats(details);
    return details;
  }, [offlineAudioTracks]);

  const releaseAudioObjectUrl = () => {
    const currentUrl = audioObjectUrlRef.current;
    if (!currentUrl) return;
    try { URL.revokeObjectURL(currentUrl); } catch { /* Object URL cleanup is best-effort. */ }
    audioObjectUrlRef.current = null;
  };

  const markVerseRead = useCallback((surahNumber, verseNumber) => {
    const surahId = Number(surahNumber);
    const ayah = Number(verseNumber);
    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114 || !Number.isInteger(ayah) || ayah < 1) return;
    const key = `${surahId}:${ayah}`;
    setReadVerseKeys((previous) => previous.includes(key) ? previous : [...previous, key].slice(-TOTAL_QURAN_VERSES));
    const today = jakartaDateKey();
    setReadingDays((previous) => {
      const todayKeys = Array.isArray(previous?.[today]) ? previous[today] : [];
      if (todayKeys.includes(key)) return previous;
      const next = { ...previous, [today]: [...todayKeys, key] };
      const keepDates = Object.keys(next).sort().slice(-90);
      return Object.fromEntries(keepDates.map((date) => [date, next[date]]));
    });
    const knownSurah = surahs.find((item) => Number(item.nomor) === surahId) || fallbackSurahs[surahId - 1];
    setLastRead((previous) => (Number(previous?.surahId) === surahId && Number(previous?.verse) === ayah)
      ? previous
      : { surahId, surahName: knownSurah?.namaLatin || `Surah ${surahId}`, verse: ayah, updatedAt: Date.now() });
  }, [surahs]);

  useEffect(() => {
    setDateLabel(formatToday());
    const initialPathname = normalizePathname(window.location.pathname);
    const initialDuaRouteSlug = getDuaSlugFromPathname(initialPathname);
    const tabFromPath = PATH_TABS[initialPathname] || (getSurahNumberFromPathname(initialPathname) ? 'quran' : null) || (initialDuaRouteSlug ? 'duas' : null);
    if (tabFromPath) setActiveTab(tabFromPath);
    if (initialDuaRouteSlug) setActiveDuaSlug(initialDuaRouteSlug);
    const tabFromUrl = new URLSearchParams(window.location.search).get('tab');
    if (VALID_TABS.includes(tabFromUrl)) setActiveTab(tabFromUrl);
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onInstallPrompt = (event) => { event.preventDefault(); setInstallPrompt(event); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); showToast('Aplikasi berhasil dipasang.'); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    setTheme(readLocal('aq:theme', 'light'));
    setBookmarkedSurahs(readLocal('aq:bookmarked-surahs', []));
    setBookmarkedVerses(readLocal('aq:bookmarked-verses', []));
    setVerseNotes(normalizeVerseNotes(readLocal('aq:verse-notes', {})));
    setLastRead(readLocal('aq:last-read', null));
    const savedReadVerseKeys = readLocal('aq:read-verse-keys', []);
    setReadVerseKeys(Array.isArray(savedReadVerseKeys) ? [...new Set(savedReadVerseKeys.filter((key) => /^\d{1,3}:\d{1,3}$/.test(String(key))))].slice(-TOTAL_QURAN_VERSES) : []);
    const savedReadingDays = readLocal('aq:reading-days', {});
    setReadingDays(savedReadingDays && typeof savedReadingDays === 'object' && !Array.isArray(savedReadingDays) ? savedReadingDays : {});
    const savedKhatamDays = Number(readLocal('aq:khatam-days', 30));
    setKhatamDays(KHATAM_OPTIONS.includes(savedKhatamDays) ? savedKhatamDays : 30);
    const savedDailyVerseGoal = normalizeDailyVerseGoal(readLocal('aq:daily-verse-target', DEFAULT_DAILY_VERSE_GOAL));
    setDailyVerseGoal(savedDailyVerseGoal);
    setDailyGoalDraft(String(savedDailyVerseGoal));
    setDailyGoalLoaded(true);
    setReminders(normalizeReminderList(readLocal('aq:reminders', [])));
    setRemindersLoaded(true);
    setNotificationPermission(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
    const savedOfflineSurahs = normalizeOfflineSurahIds(readLocal('aq:offline-surahs', []));
    setOfflineSurahs(savedOfflineSurahs);
    const savedOfflineAudioTracks = normalizeOfflineAudioTracks(readLocal(OFFLINE_AUDIO_STORAGE_KEY, []));
    setOfflineAudioTracks(savedOfflineAudioTracks);
    void inspectOfflineAudioCache(savedOfflineAudioTracks).then(setOfflineAudioStats).catch(() => {});
    const savedAudioRepeat = readLocal('aq:audio-repeat', 'off');
    setAudioRepeat(AUDIO_REPEAT_OPTIONS.some((option) => option.value === savedAudioRepeat) ? savedAudioRepeat : 'off');
    const savedAudioSpeed = Number(readLocal('aq:audio-speed', 1));
    setAudioSpeed(AUDIO_SPEED_OPTIONS.some((option) => option.value === savedAudioSpeed) ? savedAudioSpeed : 1);
    setFavoriteAsma(readLocal('aq:favorite-asma', []));
    setTajweedCache(normalizeTajweedCache(readLocal(TAJWEED_CACHE_KEY, {})));
    const prefs = readLocal('aq:reader-prefs', null);
    if (prefs) {
      setArabicVisible(prefs.arabicVisible !== false);
      setLatinVisible(prefs.latinVisible !== false);
      setTranslationVisible(prefs.translationVisible !== false);
      setTajweedLearningMode(prefs.tajweedLearningMode === true);
      setTajweedEnabled(prefs.tajweedEnabled === true || prefs.tajweedLearningMode === true);
      setArabicSize(Number(prefs.arabicSize) || 32);
      setLatinSize(Math.min(30, Math.max(12, Number(prefs.latinSize) || 18)));
      setTranslationSize(Number(prefs.translationSize) || 15);
      setQariIndex(Number(prefs.qariIndex) || 0);
    }
    const savedSurahs = readLocal('aq:surahs', null);
    if (Array.isArray(savedSurahs) && savedSurahs.length) setSurahs(savedSurahs);
    const savedDuas = readLocal('aq:duas', null);
    if (Array.isArray(savedDuas)) {
      const validSavedDuas = enforceBeforeMealDua(savedDuas.map(normalizeDua).filter(isUsableDua));
      const fallbackRows = enforceBeforeMealDua(fallbackDuas.map(normalizeDua));
      // A legacy cache containing only the before-meal prayer is incomplete. Replace it
      // with the bundled list so it cannot make the page look as if every other dua was deleted.
      if (validSavedDuas.length >= MIN_DUA_CATALOG_SIZE) {
        const withInitial = initialDua ? mergeInitialDua(validSavedDuas, initialDua) : validSavedDuas;
        setDuas(withInitial);
        writeLocal('aq:duas', withInitial);
      } else {
        const withInitial = initialDua ? mergeInitialDua(fallbackRows, initialDua) : fallbackRows;
        setDuas(withInitial);
        writeLocal('aq:duas', withInitial);
      }
    }

    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').then(() => {
          if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
        }).catch(() => { /* PWA enhancement is non-blocking. */ });
      } else {
        // A production PWA worker can serve stale Next.js chunks during `next dev`,
        // which may make the browser bundle disagree with freshly rendered HTML.
        // Disable the worker and purge Nurani caches while developing locally.
        navigator.serviceWorker.getRegistrations()
          .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
          .catch(() => {});
        if ('caches' in window) {
          window.caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key.startsWith('nurani-pwa-')).map((key) => window.caches.delete(key))))
            .catch(() => {});
        }
      }
    }
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [showToast, initialDua]);

  // Load explicitly annotated tajweed text only when the user enables the feature.
  // The last three opened surahs are cached locally for repeat/offline reading.
  useEffect(() => {
    if (!tajweedEnabled) return;
    const surahNumber = Number(selectedSurah?.nomor);
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) return;
    if (tajweedCache[surahNumber]?.ayahs?.length) return;

    const storedCache = normalizeTajweedCache(readLocal(TAJWEED_CACHE_KEY, {}));
    if (storedCache[surahNumber]?.ayahs?.length) {
      setTajweedCache((current) => normalizeTajweedCache({ ...storedCache, ...current }));
      setTajweedErrorSurah(null);
      return;
    }
    let cancelled = false;
    setTajweedLoadingSurah(surahNumber);
    setTajweedErrorSurah(null);
    fetch(`/api/tajweed/${surahNumber}`, { headers: { Accept: 'application/json' } })
      .then(async (response) => ({ response, payload: await response.json() }))
      .then(({ response, payload }) => {
        if (!response.ok || payload?.ok !== true || Number(payload?.surahNumber) !== surahNumber) {
          throw new Error(payload?.message || 'Data warna tajwid tidak tersedia.');
        }
        const ayahs = normalizeTajweedAyahs(payload.ayahs);
        if (!ayahs.length) throw new Error('Data warna tajwid tidak memiliki ayat yang dikenali.');
        if (cancelled) return;
        const currentCache = normalizeTajweedCache({
          ...normalizeTajweedCache(readLocal(TAJWEED_CACHE_KEY, {})),
          ...tajweedCache
        });
        const nextCache = rememberTajweedSurah(currentCache, surahNumber, ayahs, Date.now());
        setTajweedCache(nextCache);
        writeLocal(TAJWEED_CACHE_KEY, nextCache);
      })
      .catch(() => {
        if (!cancelled) setTajweedErrorSurah(surahNumber);
      })
      .finally(() => {
        if (!cancelled) setTajweedLoadingSurah(null);
      });

    return () => { cancelled = true; };
  }, [tajweedEnabled, selectedSurah?.nomor, online, tajweedCache]);

  // Keep each main section addressable so search engines and users can open it directly.
  // Use the native History API to preserve the single-page experience between tabs.
  useEffect(() => {
    const queryTab = new URLSearchParams(window.location.search).get('tab');
    const currentPath = normalizePathname(window.location.pathname);
    const currentVerseNumber = getVerseNumberFromPathname(currentPath);
    const currentPathSurahNumber = getSurahNumberFromPathname(currentPath);
    const currentPathDuaSlug = getDuaSlugFromPathname(currentPath);
    const preserveAyahRoute = activeTab === 'quran' && selectedSurah && currentVerseNumber
      && currentPathSurahNumber === Number(selectedSurah.nomor);
    const preserveDuaRoute = activeTab === 'duas' && Boolean(activeDuaSlug) && currentPathDuaSlug === activeDuaSlug;
    const targetPath = activeTab === 'quran' && selectedSurah
      ? (preserveAyahRoute ? currentPath : getSurahPath(selectedSurah))
      : activeTab === 'duas' && activeDuaSlug
        ? (preserveDuaRoute ? currentPath : `/doa/${activeDuaSlug}`)
        : (TAB_PATHS[activeTab] || '/');

    // On first mount, let the boot effect align state with a direct route before
    // changing the URL. Detail routes are valid Quran pages, not unknown paths.
    if (!routeSyncInitializedRef.current) {
      routeSyncInitializedRef.current = true;
      const pathTab = PATH_TABS[currentPath] || (getSurahNumberFromPathname(currentPath) ? 'quran' : null) || (currentPathDuaSlug ? 'duas' : null);
      if ((pathTab && pathTab !== activeTab) || (currentPath === '/' && VALID_TABS.includes(queryTab) && activeTab !== queryTab)) return;
    }
    if (currentPath !== targetPath || VALID_TABS.includes(queryTab)) {
      window.history.pushState(null, '', targetPath);
    }
  }, [activeTab, selectedSurah?.nomor, activeDuaSlug]);

  // Keep browser tab title, descriptions and canonical metadata aligned while navigating client-side.
  useEffect(() => {
    const currentPath = normalizePathname(window.location.pathname);
    const currentPathSurahNumber = getSurahNumberFromPathname(currentPath);
    const currentVerseNumber = getVerseNumberFromPathname(currentPath);
    const isCurrentAyahRoute = activeTab === 'quran' && selectedSurah && currentVerseNumber
      && currentPathSurahNumber === Number(selectedSurah.nomor);
    const seo = activeTab === 'quran' && selectedSurah
      ? {
          title: `Surah ${selectedSurah.namaLatin} (${selectedSurah.arti || 'Al-Qur’an'}) — Baca Al-Qur’an Online`,
          description: `Baca Surah ${selectedSurah.namaLatin}, surah ke-${selectedSurah.nomor} dalam Al-Qur’an, dengan ${selectedSurah.jumlahAyat || 'ayat'} ayat, teks Arab, transliterasi Latin, terjemahan Indonesia, audio murottal, dan bookmark.`,
          path: isCurrentAyahRoute ? getVersePath(selectedSurah, currentVerseNumber) : getSurahPath(selectedSurah),
          ayah: isCurrentAyahRoute ? currentVerseNumber : null
        }
      : activeTab === 'duas' && activeDuaSlug && activeDua
        ? {
            title: `${activeDua.judul} — Doa Harian Arab, Latin, dan Artinya`,
            description: `Baca ${activeDua.judul} dalam bahasa Arab, bacaan Latin, dan terjemahan Indonesia. Bagikan tautan doa ini melalui Nurani.`,
            path: getDuaPath(activeDua),
            ayah: null
          }
        : (SECTION_SEO_BY_TAB[activeTab] || SECTION_SEO_BY_TAB.home);
    const displayTitle = seo.ayah ? `${seo.title} · Ayat ${seo.ayah}` : seo.title;
    const fullTitle = activeTab === 'home' ? siteName : `${displayTitle} | Nurani`;
    document.title = fullTitle;

    const setMeta = (selector, attribute, value) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        const match = selector.match(/\[(name|property)=["']([^"']+)["']\]/);
        if (match) element.setAttribute(match[1], match[2]);
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };
    setMeta('meta[name="description"]', 'content', seo.description);
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', seo.description);
    setMeta('meta[property="og:url"]', 'content', `${siteUrl}${seo.path}`);
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', seo.description);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${siteUrl}${seo.path === '/' ? '/' : seo.path}`);
  }, [activeTab, selectedSurah?.nomor, activeDuaSlug, activeDua?.judul]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSurahLoading(true);
      try {
        const result = await fetchQuran('/surat');
        const rows = firstArray(result, ['surat', 'surah', 'items']).map(normalizeSurah);
        if (!cancelled && rows.length > 50) {
          setSurahs(rows);
          writeLocal('aq:surahs', rows);
        }
      } catch {
        if (!cancelled) showToast('Mode offline: menggunakan data surah yang tersedia di perangkat.');
      } finally {
        if (!cancelled) setSurahLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showToast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = await fetchDuas();
        const rawRows = extractDuaRows(payload).map(normalizeDua).filter(isUsableDua);
        // Validate the API response BEFORE enforceBeforeMealDua, because that helper can
        // add a canonical before-meal entry for non-empty lists that lack it. Otherwise an
        // empty/malformed API payload could be mistakenly saved as a one-item catalogue.
        if (rawRows.length < MIN_DUA_CATALOG_SIZE) return;
        const rows = enforceBeforeMealDua(rawRows);
        if (!cancelled && rows.length >= MIN_DUA_CATALOG_SIZE) {
          const withInitial = initialDua ? mergeInitialDua(rows, initialDua) : rows;
          setDuas(withInitial);
          writeLocal('aq:duas', withInitial);
        }
      } catch { /* Cached or bundled prayer list remains available offline. */ }
    })();
    return () => { cancelled = true; };
  }, [initialDua]);

  useEffect(() => {
    let cancelled = false;
    const loadInitialPrayer = async () => {
      setPrayerLoading(true);
      const saved = readLocal('aq:prayer', null);
      // Upgrade the old bundled default (Kota Bogor) to the requested Kab. Bogor.
      // Keep any other city the user explicitly selected.
      const savedIsOldDefault = /KOTA BOGOR/i.test(saved?.cityName || '') && !/KAB(?:UPATEN)?\.?\s*BOGOR/i.test(saved?.cityName || '');
      const reusableSaved = Boolean(saved?.schedule && !savedIsOldDefault);
      if (reusableSaved) {
        setCityName(saved.cityName || 'KAB. BOGOR');
        setCityId(saved.cityId || '');
        setPrayerTimezone(saved.timezone || timezoneForLocation(saved.cityName || 'KAB. BOGOR'));
        setPrayerSchedule(saved.schedule);
        setPrayerDate(saved.date || '');
        setPrayerLoading(false);
      }
      try {
        const result = await fetchPrayerCity('Bogor');
        const rows = firstArray(result, ['cities', 'kabkota', 'lokasi', 'items']);
        if (!rows.length) throw new Error('Kabupaten Bogor tidak ditemukan');
        const preferred = rows.find((row) => /KAB(?:UPATEN)?\.?\s*BOGOR/i.test(row.lokasi || row.nama || row.name || ''))
          || rows.find((row) => /KOTA BOGOR/i.test(row.lokasi || row.nama || row.name || ''))
          || rows[0];
        const id = preferred.id ?? preferred.city_id;
        if (!id) throw new Error('ID wilayah tidak tersedia');
        const name = preferred.lokasi ?? preferred.nama ?? preferred.name ?? 'KAB. BOGOR';
        const timezone = timezoneForLocation(name);
        const data = await fetchPrayerSchedule(id, 'today', timezone);
        const scheduleObj = data?.jadwal ?? data?.schedule ?? {};
        const schedule = toPrayerTimes(scheduleObj[Object.keys(scheduleObj)[0]] || scheduleObj);
        if (!Object.keys(schedule).length) throw new Error('Jadwal shalat belum tersedia');
        if (!cancelled) {
          setCityName(name); setCityId(String(id)); setPrayerTimezone(timezone); setPrayerSchedule(schedule);
          setPrayerDate(data?.jadwal?.[Object.keys(data.jadwal)[0]]?.tanggal || data?.tanggal || '');
          setPrayerError('');
          writeLocal('aq:prayer', { cityName: name, cityId: String(id), timezone, schedule, date: data?.tanggal || '' });
        }
      } catch {
        if (!cancelled && !reusableSaved) setPrayerError('Jadwal membutuhkan koneksi internet untuk pemuatan pertama.');
      } finally {
        if (!cancelled) setPrayerLoading(false);
      }
    };
    loadInitialPrayer();
    const ticker = window.setInterval(() => setClockTick((n) => n + 1), 60000);
    return () => { cancelled = true; window.clearInterval(ticker); };
  }, []);

  useEffect(() => {
    writeLocal('aq:theme', theme);
  }, [theme]);
  useEffect(() => {
    writeLocal('aq:bookmarked-surahs', bookmarkedSurahs);
  }, [bookmarkedSurahs]);
  useEffect(() => {
    writeLocal('aq:bookmarked-verses', bookmarkedVerses);
  }, [bookmarkedVerses]);
  useEffect(() => {
    writeLocal('aq:verse-notes', verseNotes);
  }, [verseNotes]);
  useEffect(() => {
    writeLocal('aq:last-read', lastRead);
  }, [lastRead]);
  useEffect(() => {
    writeLocal('aq:read-verse-keys', readVerseKeys);
  }, [readVerseKeys]);
  useEffect(() => {
    writeLocal('aq:reading-days', readingDays);
  }, [readingDays]);
  useEffect(() => {
    writeLocal('aq:khatam-days', khatamDays);
  }, [khatamDays]);
  useEffect(() => {
    if (dailyGoalLoaded) writeLocal('aq:daily-verse-target', dailyVerseGoal);
  }, [dailyVerseGoal, dailyGoalLoaded]);
  useEffect(() => {
    if (remindersLoaded) writeLocal('aq:reminders', reminders);
  }, [reminders, remindersLoaded]);

  // Timed reminders are checked while the app page is running. Browser timers can
  // be throttled in background tabs, and no local-only scheduler can guarantee a
  // notification after the browser/PWA has been fully closed.
  useEffect(() => {
    if (!remindersLoaded || !reminders.some((reminder) => reminder.enabled)) return undefined;
    let disposed = false;
    const checkDueReminders = () => {
      if (disposed) return;
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const firedByReminder = readLocal('aq:reminders-last-fired', {});
      const safeFired = firedByReminder && typeof firedByReminder === 'object' && !Array.isArray(firedByReminder) ? firedByReminder : {};
      const due = reminders.filter((reminder) => {
        if (!reminder.enabled || !reminder.days.includes(now.getDay()) || safeFired[reminder.id] === dateKey) return false;
        const [hour, minute] = reminder.time.split(':').map(Number);
        const difference = nowMinutes - (hour * 60 + minute);
        return difference >= 0 && difference <= 4;
      });
      if (!due.length) return;
      const canNotifyInBackground = typeof Notification !== 'undefined'
        && Notification.permission === 'granted'
        && 'serviceWorker' in navigator;
      // If the page is hidden and system notifications are unavailable, leave the
      // reminders pending so a quick return to the app can still show the in-app toast.
      if (document.visibilityState !== 'visible' && !canNotifyInBackground) return;
      const updatedFired = { ...safeFired };
      due.forEach((reminder) => { updatedFired[reminder.id] = dateKey; });
      const firedEntries = Object.entries(updatedFired).slice(-20);
      writeLocal('aq:reminders-last-fired', Object.fromEntries(firedEntries));
      if (document.visibilityState === 'visible') {
        const summary = due.length === 1
          ? `${due[0].title}: ${due[0].kind === 'doa' ? 'Saatnya membaca doa harian.' : due[0].kind === 'both' ? 'Saatnya tilawah dan membaca doa harian.' : 'Luangkan waktu untuk membaca beberapa ayat Al-Qur’an.'}`
          : `${due.length} pengingat Nurani: ${due.map((item) => item.title).join(', ')}`;
        showToast(summary);
        return;
      }
      due.forEach((reminder) => {
        const body = reminder.kind === 'doa'
          ? 'Luangkan waktu untuk membaca doa harian.'
          : reminder.kind === 'both'
            ? 'Saatnya tilawah dan membaca doa harian.'
            : 'Luangkan waktu untuk membaca beberapa ayat Al-Qur’an.';
        const targetUrl = reminder.kind === 'doa' ? '/doa' : reminder.kind === 'both' ? '/' : '/quran';
        navigator.serviceWorker.ready
          .then((registration) => registration.showNotification(`Nurani · ${reminder.title}`, {
            body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: `nurani-reminder-${reminder.id}-${dateKey}`,
            renotify: false,
            data: { url: targetUrl }
          }))
          .catch(() => showToast(`${reminder.title}: ${body}`));
      });
    };
    checkDueReminders();
    const timer = window.setInterval(checkDueReminders, 20000);
    const handleWake = () => checkDueReminders();
    window.addEventListener('focus', handleWake);
    document.addEventListener('visibilitychange', handleWake);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', handleWake);
      document.removeEventListener('visibilitychange', handleWake);
    };
  }, [reminders, remindersLoaded, showToast]);
  useEffect(() => {
    writeLocal('aq:offline-surahs', offlineSurahs);
  }, [offlineSurahs]);
  useEffect(() => {
    if (settingsOpen) {
      void refreshOfflineStorage();
      if (offlineManagerExpanded) void refreshOfflineAudioStats();
    }
  }, [settingsOpen, offlineSurahs, offlineManagerExpanded, offlineAudioTracks, refreshOfflineStorage, refreshOfflineAudioStats]);
  useEffect(() => {
    writeLocal('aq:audio-repeat', audioRepeat);
  }, [audioRepeat]);
  useEffect(() => {
    writeLocal('aq:audio-speed', audioSpeed);
  }, [audioSpeed]);
  useEffect(() => {
    writeLocal('aq:favorite-asma', favoriteAsma);
  }, [favoriteAsma]);
  useEffect(() => {
    writeLocal('aq:reader-prefs', { arabicVisible, latinVisible, translationVisible, tajweedEnabled, tajweedLearningMode, arabicSize, latinSize, translationSize, qariIndex });
  }, [arabicVisible, latinVisible, translationVisible, tajweedEnabled, tajweedLearningMode, arabicSize, latinSize, translationSize, qariIndex]);
  useEffect(() => {
    if (!audioInfo || !audioRef.current) return;
    const element = audioRef.current;
    element.load();
    element.play().then(() => setAudioPlaying(true)).catch(() => {
      setAudioPlaying(false);
      showToast('Audio tidak dapat diputar. Periksa koneksi atau sumber audio.');
    });
  }, [audioInfo?.src, showToast]);
  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;
    // Preserve the reciter's pitch while adjusting the playback rate where supported.
    try {
      element.defaultPlaybackRate = audioSpeed;
      element.playbackRate = audioSpeed;
      if ('preservesPitch' in element) element.preservesPitch = true;
      else if ('mozPreservesPitch' in element) element.mozPreservesPitch = true;
      else if ('webkitPreservesPitch' in element) element.webkitPreservesPitch = true;
    } catch { /* Some embedded browsers may not allow rate changes. */ }
  }, [audioSpeed, audioInfo?.src]);

  useEffect(() => () => {
    const currentUrl = audioObjectUrlRef.current;
    if (currentUrl) {
      try { URL.revokeObjectURL(currentUrl); } catch { /* Best-effort object URL cleanup. */ }
      audioObjectUrlRef.current = null;
    }
  }, []);

  const upcomingPrayer = useMemo(() => getUpcomingPrayer(prayerSchedule, prayerTimezone), [prayerSchedule, prayerTimezone, clockTick]);
  useEffect(() => {
    if (activeTab !== 'search') return undefined;
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchStatus('idle');
      setSearchError('');
      setSearchOfflineResults(false);
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchStatus('loading');
      setSearchError('');
      setSearchOfflineResults(false);
      try {
        if (navigator.onLine === false) throw new Error('offline');
        const params = new URLSearchParams({ q: query, type: searchMode, surah: searchSurahFilter });
        const response = await fetch(`/api/quran-search?${params.toString()}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.ok !== true) throw new Error(payload?.message || 'Pencarian belum berhasil. Coba lagi.');
        if (cancelled) return;
        setSearchResults(Array.isArray(payload.results) ? payload.results : []);
        setSearchError(payload.partial ? 'Sebagian sumber pencarian tidak merespons. Hasil yang tersedia tetap ditampilkan.' : '');
        setSearchOfflineResults(false);
        setSearchStatus('success');
        setSearchVisibleCount(20);
      } catch (error) {
        if (cancelled || error?.name === 'AbortError') return;
        const cachedResults = findCachedVerseSearchResults(query, searchMode, window.localStorage, fallbackSurahs, searchSurahFilter);
        if (cachedResults.length) {
          setSearchResults(cachedResults);
          setSearchOfflineResults(true);
          setSearchError('Koneksi ke sumber pencarian tidak tersedia. Hasil berikut hanya berasal dari surah yang tersimpan di perangkat.');
          setSearchStatus('success');
        } else {
          setSearchResults([]);
          setSearchOfflineResults(false);
          setSearchError(error?.message === 'offline'
            ? 'Sedang offline dan belum ada ayat tersimpan yang cocok dengan pencarian ini.'
            : (error?.message || 'Pencarian gagal. Periksa koneksi lalu coba lagi.'));
          setSearchStatus('error');
        }
        setSearchVisibleCount(20);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeTab, searchQuery, searchMode, searchSurahFilter, searchRetryCount]);

  const filteredSurahs = useMemo(() => {
    return surahs.filter((surah) => {
      const query = surahQuery.trim().toLowerCase();
      const matchesQuery = !query || [surah.namaLatin, surah.arti, surah.nomor, surah.nama].some((value) => String(value || '').toLowerCase().includes(query));
      const place = String(surah.tempatTurun || '').toLowerCase();
      const matchesFilter = surahFilter === 'all'
        || (surahFilter === 'mekah' && (place.includes('mekah') || place.includes('makki')))
        || (surahFilter === 'madinah' && (place.includes('madinah') || place.includes('madani')))
        || (surahFilter === 'bookmarked' && bookmarkedSurahs.includes(Number(surah.nomor)))
        || (surahFilter === 'offline' && offlineSurahs.includes(Number(surah.nomor)));
      return matchesQuery && matchesFilter;
    });
  }, [surahs, surahQuery, surahFilter, bookmarkedSurahs, offlineSurahs]);
  const filteredDuas = useMemo(() => duas.filter((dua) => {
    const q = duaQuery.trim().toLowerCase();
    return !q || [dua.judul, dua.latin, dua.terjemah, dua.grup, ...(dua.tags || [])].join(' ').toLowerCase().includes(q);
  }), [duas, duaQuery]);
  const filteredAsma = useMemo(() => asmaulHusna.filter((name) => {
    const q = asmaQuery.trim().toLowerCase();
    return !q || [name.latin, name.arabic, name.meaning, name.number].join(' ').toLowerCase().includes(q)
      || (q === 'favorit' && favoriteAsma.includes(name.number));
  }), [asmaQuery, favoriteAsma]);
  const selectedSurahWithAudio = useMemo(() => {
    if (!selectedSurah) return null;
    const catalogSurah = surahs.find((item) => Number(item.nomor) === Number(selectedSurah.nomor));
    if (!catalogSurah) return selectedSurah;
    return {
      ...catalogSurah,
      ...selectedSurah,
      audioFull: selectedSurah.audioFull ?? catalogSurah.audioFull ?? null,
      audio: selectedSurah.audio ?? catalogSurah.audio ?? null
    };
  }, [surahs, selectedSurah]);
  const allVerseNotes = useMemo(() => Object.values(verseNotes).sort((a, b) => b.updatedAt - a.updatedAt), [verseNotes]);
  const recentVerseNotes = useMemo(() => allVerseNotes.slice(0, 3), [allVerseNotes]);
  const todayKey = jakartaDateKey();
  const tilawahStats = useMemo(() => getTilawahStats(readingDays, readVerseKeys, dailyVerseGoal, todayKey), [readingDays, readVerseKeys, dailyVerseGoal, todayKey]);
  const todayReadCount = tilawahStats.todayCount;
  const completedVerseCount = tilawahStats.completedVerseCount;
  const overallReadingPercent = tilawahStats.overallPercent;
  const dailyVerseTarget = Math.ceil(TOTAL_QURAN_VERSES / khatamDays);
  const dailyReadingPercent = tilawahStats.dailyGoalPercent;

  const openSurah = useCallback(async (surahValue, verseNumber = 1) => {
    const surah = typeof surahValue === 'number'
      ? surahs.find((item) => Number(item.nomor) === surahValue) || fallbackSurahs[surahValue - 1]
      : surahValue;
    if (!surah) return;
    const canUseServerRows = Number(surah.nomor) === safeInitialSurahNumber && safeInitialVerseRows.length > 0;
    setActiveTab('quran'); setSelectedSurah(surah); setSelectedTajweedLesson(null); setVerses(canUseServerRows ? safeInitialVerseRows : []); setVerseLoading(!canUseServerRows); setReaderSettingsOpen(false);
    setJumpVerse(String(verseNumber || 1));
    pendingJumpRef.current = Number(verseNumber || 1);
    setLastRead({ surahId: Number(surah.nomor), surahName: surah.namaLatin, verse: Number(verseNumber || 1), updatedAt: Date.now() });
    markVerseRead(Number(surah.nomor), Number(verseNumber || 1));
    const cacheKey = `aq:verses:${surah.nomor}`;
    if (canUseServerRows) {
      // Persist the server-provided rows for the same offline behavior as API-loaded surahs.
      writeLocal(cacheKey, safeInitialVerseRows);
      setVerseLoading(false);
      return;
    }
    const cached = readLocal(cacheKey, null);
    if (Array.isArray(cached) && cached.length) setVerses(cached);
    try {
      const payload = await fetchQuran(`/surat/${surah.nomor}`);
      const rows = extractVerseRows(payload).map(normalizeVerse).filter((verse) => verse.teksArab || verse.teksLatin || verse.teksIndonesia);
      if (rows.length) {
        setVerses(rows); writeLocal(cacheKey, rows);
      } else if (!cached?.length) showToast('Data ayat belum tersedia dari sumber saat ini.');
    } catch {
      if (!cached?.length) showToast('Ayat belum tersimpan di perangkat. Hubungkan internet untuk memuat surah ini.');
    } finally {
      setVerseLoading(false);
    }
  }, [surahs, showToast, markVerseRead, safeInitialSurahNumber, safeInitialVerseRows]);

  // Open a surah when a reader URL is loaded directly or refreshed. The ref avoids
  // re-fetching it when the catalogue metadata updates after the first render.
  useEffect(() => {
    if (!safeInitialSurahNumber) return;
    const routeKey = `${safeInitialSurahNumber}:${safeInitialVerseNumber || 1}`;
    if (initialSurahOpenedRef.current === routeKey) return;
    initialSurahOpenedRef.current = routeKey;
    const initialSurah = surahs.find((item) => Number(item.nomor) === safeInitialSurahNumber)
      || fallbackSurahs[safeInitialSurahNumber - 1];
    if (initialSurah) void openSurah(initialSurah, safeInitialVerseNumber || 1);
  }, [safeInitialSurahNumber, safeInitialVerseNumber, surahs, openSurah]);

  useEffect(() => {
    const syncTabFromHistory = () => {
      const pathname = normalizePathname(window.location.pathname);
      const duaSlug = getDuaSlugFromPathname(pathname);
      if (duaSlug) {
        setActiveTab('duas');
        setActiveDuaSlug(duaSlug);
        setSelectedSurah(null);
        return;
      }
      const surahNumber = getSurahNumberFromPathname(pathname);
      if (surahNumber) {
        setActiveTab('quran');
        if (Number(selectedSurah?.nomor) !== surahNumber) void openSurah(surahNumber, 1);
        return;
      }
      const tab = PATH_TABS[pathname];
      if (!tab) return;
      setActiveDuaSlug(null);
      setActiveTab(tab);
      if (tab !== 'quran' || pathname === TAB_PATHS.quran) setSelectedSurah(null);
    };
    window.addEventListener('popstate', syncTabFromHistory);
    return () => window.removeEventListener('popstate', syncTabFromHistory);
  }, [openSurah, selectedSurah?.nomor]);

  useEffect(() => {
    if (!selectedSurah || !verses.length || typeof IntersectionObserver === 'undefined') return undefined;
    let observer;
    // If a specific verse was requested, wait until the jump scroll completes so
    // the initial viewport does not incorrectly count the top of the surah as read.
    const observeDelay = pendingJumpRef.current ? 240 : 0;
    const timer = window.setTimeout(() => {
      observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const verseNumber = Number(visible[0].target.getAttribute('data-verse-number'));
        if (verseNumber) markVerseRead(Number(selectedSurah.nomor), verseNumber);
      }, { rootMargin: '-38% 0px -42% 0px', threshold: [0, 0.15, 0.4] });
      verses.forEach((verse) => {
        const node = document.getElementById(`verse-${selectedSurah.nomor}-${verse.nomorAyat}`);
        if (node) { node.setAttribute('data-verse-number', String(verse.nomorAyat)); observer.observe(node); }
      });
    }, observeDelay);
    return () => { window.clearTimeout(timer); observer?.disconnect(); };
  }, [selectedSurah?.nomor, verses, markVerseRead]);

  useEffect(() => {
    if (!selectedSurah || !verses.length || !pendingJumpRef.current) return;
    const number = pendingJumpRef.current;
    pendingJumpRef.current = null;
    window.setTimeout(() => {
      const target = document.getElementById(`verse-${selectedSurah.nomor}-${number}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 180);
  }, [selectedSurah, verses]);

  const toggleSurahBookmark = (number) => {
    setBookmarkedSurahs((previous) => previous.includes(number) ? previous.filter((id) => id !== number) : [...previous, number]);
    showToast(bookmarkedSurahs.includes(number) ? 'Bookmark surah dihapus.' : 'Surah disimpan ke bookmark.');
  };
  const toggleVerseBookmark = (number, targetSurahNumber = selectedSurah?.nomor) => {
    const surahNumber = Number(targetSurahNumber);
    const verseNumber = Number(number);
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114 || !Number.isInteger(verseNumber) || verseNumber < 1) return;
    const key = `${surahNumber}:${verseNumber}`;
    setBookmarkedVerses((previous) => previous.includes(key) ? previous.filter((id) => id !== key) : [...previous, key]);
    showToast(bookmarkedVerses.includes(key) ? 'Bookmark ayat dihapus.' : 'Ayat disimpan ke bookmark.');
  };
  const openVerseNoteEditor = (surah, verse) => {
    const surahId = Number(surah?.nomor);
    const verseNumber = Number(verse?.nomorAyat);
    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114 || !Number.isInteger(verseNumber) || verseNumber < 1) return;
    const key = `${surahId}:${verseNumber}`;
    setEditingVerseNote({ key, surahId, verseNumber, surahName: surah?.namaLatin || `Surah ${surahId}` });
    setVerseNoteDraft(verseNotes[key]?.text || '');
  };
  const saveVerseNote = () => {
    if (!editingVerseNote) return;
    const text = verseNoteDraft.trim();
    if (!text) { showToast('Tulis catatan terlebih dahulu. Untuk menghapus, gunakan tombol Hapus catatan.'); return; }
    const nextNotes = normalizeVerseNotes({
      ...verseNotes,
      [editingVerseNote.key]: {
        ...editingVerseNote,
        text: text.slice(0, 2000),
        updatedAt: Date.now()
      }
    });
    setVerseNotes(nextNotes);
    const persisted = writeLocal('aq:verse-notes', nextNotes);
    setEditingVerseNote(null);
    setVerseNoteDraft('');
    showToast(persisted ? 'Catatan tadabbur tersimpan di perangkat ini.' : 'Catatan ditampilkan, tetapi penyimpanan browser gagal. Periksa ruang penyimpanan.');
  };
  const deleteVerseNote = (key) => {
    const nextNotes = { ...verseNotes };
    delete nextNotes[key];
    setVerseNotes(nextNotes);
    const persisted = writeLocal('aq:verse-notes', nextNotes);
    if (editingVerseNote?.key === key) {
      setEditingVerseNote(null);
      setVerseNoteDraft('');
    }
    showToast(persisted ? 'Catatan tadabbur dihapus.' : 'Catatan dihapus dari tampilan, tetapi perubahan gagal disimpan di browser.');
  };
  const openVerseFromNote = (note) => {
    setVerseNotesModalOpen(false);
    setEditingVerseNote(null);
    setVerseNoteDraft('');
    void openSurah(note.surahId, note.verseNumber);
  };
  const playVerse = async (verse, index) => {
    const reciterId = QARI_IDS[qariIndex] || '05';
    const savedTrack = offlineAudioTracks.find((track) => Number(track.surahId) === Number(selectedSurah?.nomor)
      && track.type === 'verse'
      && Number(track.verseNumber) === Number(verse?.nomorAyat)
      && track.reciterId === reciterId);
    const src = chooseAudio(verse.audio, qariIndex) || savedTrack?.src || '';
    if (!src) { showToast('Audio ayat belum termuat. Hubungkan internet lalu gunakan tombol Unduh audio ayat untuk memuat ulang sumbernya.'); return; }
    audioRef.current?.pause();
    releaseAudioObjectUrl();
    repeatCountRef.current = 0;
    let playableSrc = src;
    if (!navigator.onLine) {
      try {
        const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
        const cached = await cache.match(src);
        if (!cached) {
          showToast(`Audio ayat ${verse.nomorAyat} belum diunduh. Saat online, tekan ikon unduh pada kartu ayat ini.`);
          return;
        }
        const blob = await cached.blob();
        if (!blob.size) throw new Error('Cache audio ayat kosong.');
        playableSrc = URL.createObjectURL(blob);
        audioObjectUrlRef.current = playableSrc;
      } catch {
        showToast('Audio ayat offline tidak dapat dibuka. Coba unduh ulang saat online.');
        return;
      }
    }
    setAudioInfo({ src: playableSrc, originalSrc: src, title: `${selectedSurah?.namaLatin || 'Al-Qur’an'} · Ayat ${verse.nomorAyat}`, subtitle: QARIS[qariIndex], trackType: 'verse', verseIndex: index, surahNumber: selectedSurah?.nomor });
    markVerseRead(Number(selectedSurah?.nomor), Number(verse.nomorAyat));
    window.setTimeout(() => document.getElementById(`verse-${selectedSurah?.nomor}-${verse.nomorAyat}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const downloadVerseAudio = async (verse) => {
    const surahId = Number(selectedSurah?.nomor);
    const verseNumber = Number(verse?.nomorAyat);
    const surahName = String(selectedSurah?.namaLatin || `Surah ${surahId}`);
    let src = chooseAudio(verse?.audio, qariIndex);
    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114 || !Number.isInteger(verseNumber) || verseNumber < 1) {
      showToast('Surah atau nomor ayat tidak valid untuk unduhan.');
      return;
    }
    if (!navigator.onLine) { showToast('Sambungkan internet untuk mengunduh audio ayat ini.'); return; }
    if (audioDownloadInFlightRef.current) { showToast('Tunggu unduhan audio yang sedang berjalan selesai.'); return; }

    // Older local verse caches and some initial server payloads can contain the
    // text but omit the per-Qari `audio` map. Keep the download control usable:
    // refresh the official surah payload once, update local cache, then resolve it.
    if (!src) {
      audioDownloadInFlightRef.current = true;
      try {
        const payload = await fetchQuran(`/surat/${surahId}`);
        const freshRows = extractVerseRows(payload)
          .map(normalizeVerse)
          .filter((row) => row.teksArab || row.teksLatin || row.teksIndonesia);
        if (freshRows.length) {
          setVerses(freshRows);
          writeLocal(`aq:verses:${surahId}`, freshRows);
          const freshVerse = freshRows.find((row) => Number(row.nomorAyat) === verseNumber);
          src = chooseAudio(freshVerse?.audio, qariIndex);
        }
      } catch {
        // Report a single actionable message below instead of hiding the button.
      } finally {
        audioDownloadInFlightRef.current = false;
      }
    }
    if (!src) {
      showToast('Alamat audio ayat belum tersedia dari EQuran. Muat ulang surah saat online, lalu coba lagi.');
      return;
    }

    let parsedSource;
    try { parsedSource = new URL(src); } catch { showToast('Alamat audio ayat tidak valid.'); return; }
    if (parsedSource.protocol !== 'https:' || parsedSource.hostname.toLowerCase() !== 'cdn.equran.id') {
      showToast('Sumber audio ayat tidak termasuk CDN resmi yang diizinkan.');
      return;
    }
    if (typeof caches === 'undefined' || typeof caches.open !== 'function') {
      showToast('Browser ini belum mendukung penyimpanan audio offline.');
      return;
    }

    audioDownloadInFlightRef.current = true;
    const reciterId = QARI_IDS[qariIndex] || '05';
    const title = `${surahName} · Ayat ${verseNumber}`;
    setAudioDownloadProgress({ trackType: 'verse', surahId, verseNumber, reciterId, reciter: QARIS[qariIndex], loaded: 0, total: 0, title });
    try {
      const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
      const existing = await cache.match(src);
      const isSameVerseTrack = (track) => track.surahId === surahId
        && track.type === 'verse'
        && Number(track.verseNumber) === verseNumber
        && track.reciterId === reciterId;
      if (existing) {
        const existingBytes = Number(existing.headers.get('content-length')) || offlineAudioTracks.find(isSameVerseTrack)?.bytes || 0;
        const nextTracks = upsertOfflineAudioTrack(offlineAudioTracks, {
          surahId, verseNumber, type: 'verse', src, reciterId, title,
          reciter: QARIS[qariIndex], bytes: existingBytes, savedAt: Date.now()
        });
        if (!writeLocal(OFFLINE_AUDIO_STORAGE_KEY, nextTracks)) throw new Error('Metadata audio tidak bisa disimpan. Periksa ruang penyimpanan browser.');
        setOfflineAudioTracks(nextTracks);
        await refreshOfflineAudioStats(nextTracks);
        showToast(`Audio ${title} sudah tersedia offline.`);
        return;
      }

      const proxyUrl = `/api/audio-proxy?src=${encodeURIComponent(src)}`;
      const totalWithoutThisTrack = totalOfflineAudioBytes(offlineAudioTracks.filter((track) => !isSameVerseTrack(track) && track.src !== src));
      const response = await fetch(proxyUrl, { method: 'GET', cache: 'no-store' });
      if (!response.ok || response.status !== 200) {
        let detail = '';
        try { detail = String((await response.json())?.error || '').trim(); } catch { /* HTTP status fallback */ }
        throw new Error(detail || `Permintaan unduhan gagal (HTTP ${response.status}).`);
      }
      const contentTypeHeader = response.headers.get('content-type') || 'audio/mpeg';
      if (!/^audio\//i.test(contentTypeHeader) && !/application\/octet-stream/i.test(contentTypeHeader)) {
        await response.body?.cancel().catch(() => {});
        throw new Error('Sumber tidak mengembalikan file audio yang valid.');
      }
      const declaredLength = Number(response.headers.get('content-length')) || 0;
      if (declaredLength > MAX_AUDIO_TRACK_BYTES) {
        await response.body?.cancel().catch(() => {});
        throw new Error('Ukuran audio ayat melebihi batas 80 MB.');
      }
      if (declaredLength && totalWithoutThisTrack + declaredLength > MAX_TOTAL_AUDIO_BYTES) {
        await response.body?.cancel().catch(() => {});
        throw new Error('Batas total audio offline 200 MB akan terlampaui. Hapus audio lain terlebih dahulu.');
      }

      let estimate = null;
      try {
        if (navigator.storage?.estimate) estimate = await navigator.storage.estimate();
      } catch { /* Storage estimates are optional and browser-dependent. */ }
      const available = Number(estimate?.quota) - Number(estimate?.usage);
      if (declaredLength && Number.isFinite(available) && available > 0 && available < declaredLength + 2 * 1024 * 1024) {
        await response.body?.cancel().catch(() => {});
        throw new Error('Ruang penyimpanan perangkat tidak cukup untuk audio ayat ini.');
      }

      let blob;
      if (response.body?.getReader) {
        const reader = response.body.getReader();
        const chunks = [];
        let loaded = 0;
        let lastReported = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            loaded += value.byteLength;
            if (loaded > MAX_AUDIO_TRACK_BYTES) {
              await reader.cancel();
              throw new Error('Ukuran audio ayat melebihi batas 80 MB.');
            }
            if (totalWithoutThisTrack + loaded > MAX_TOTAL_AUDIO_BYTES) {
              await reader.cancel();
              throw new Error('Batas total audio offline 200 MB akan terlampaui. Hapus audio lain terlebih dahulu.');
            }
            chunks.push(value);
            if (loaded - lastReported >= 64 * 1024 || (declaredLength && loaded === declaredLength)) {
              setAudioDownloadProgress({ trackType: 'verse', surahId, verseNumber, reciterId, reciter: QARIS[qariIndex], loaded, total: declaredLength, title });
              lastReported = loaded;
            }
          }
        } finally {
          reader.releaseLock?.();
        }
        const verseAudioMimeType = /^audio\//i.test(contentTypeHeader) ? contentTypeHeader.split(';')[0] : 'audio/mpeg';
        blob = new Blob(chunks, { type: verseAudioMimeType });
      } else {
        blob = await response.blob();
      }
      if (!blob.size) throw new Error('Sumber audio mengembalikan file kosong.');
      if (blob.size > MAX_AUDIO_TRACK_BYTES) throw new Error('Ukuran audio ayat melebihi batas 80 MB.');
      if (totalWithoutThisTrack + blob.size > MAX_TOTAL_AUDIO_BYTES) throw new Error('Batas total audio offline 200 MB akan terlampaui. Hapus audio lain terlebih dahulu.');
      setAudioDownloadProgress({ trackType: 'verse', surahId, verseNumber, reciterId, reciter: QARIS[qariIndex], loaded: blob.size, total: blob.size, title });
      await cache.put(src, new Response(blob, {
        status: 200,
        headers: {
          'Content-Type': blob.type || contentTypeHeader,
          'Content-Length': String(blob.size),
          'Cache-Control': 'public, max-age=31536000'
        }
      }));
      const nextTracks = upsertOfflineAudioTrack(offlineAudioTracks, {
        surahId, verseNumber, type: 'verse', src, reciterId, title,
        reciter: QARIS[qariIndex], bytes: blob.size, savedAt: Date.now()
      });
      if (!writeLocal(OFFLINE_AUDIO_STORAGE_KEY, nextTracks)) {
        await cache.delete(src);
        throw new Error('Metadata audio tidak bisa disimpan. Periksa ruang penyimpanan browser.');
      }
      setOfflineAudioTracks(nextTracks);
      await refreshOfflineAudioStats(nextTracks);
      showToast(`Audio ${title} tersimpan offline (${formatStorageBytes(blob.size)}).`);
    } catch (error) {
      showToast(String(error?.message || 'Unduhan audio ayat gagal. Periksa koneksi lalu coba lagi.'));
    } finally {
      audioDownloadInFlightRef.current = false;
      setAudioDownloadProgress(null);
    }
  };
  const playFullSurah = async () => {
    if (!selectedSurahWithAudio) return;
    const audioSurah = selectedSurahWithAudio;
    const src = chooseAudio(audioSurah.audioFull, qariIndex);
    if (!src) { showToast('Audio penuh surah belum tersedia pada data yang diterima.'); return; }
    audioRef.current?.pause();
    releaseAudioObjectUrl();
    let playableSrc = src;
    if (!navigator.onLine) {
      try {
        const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
        const cachedResponse = await cache.match(src);
        if (!cachedResponse) {
          showToast('Audio surah ini belum diunduh. Hubungkan internet untuk menyimpannya terlebih dahulu.');
          return;
        }
        const blob = await cachedResponse.blob();
        if (!blob.size) throw new Error('Cache audio kosong.');
        playableSrc = URL.createObjectURL(blob);
        audioObjectUrlRef.current = playableSrc;
      } catch {
        showToast('Audio offline tidak dapat dibuka. Coba unduh ulang saat online.');
        return;
      }
    }
    setAudioInfo({ src: playableSrc, originalSrc: src, title: audioSurah.namaLatin, subtitle: `Murottal · ${QARIS[qariIndex]}`, trackType: 'full', surahNumber: audioSurah.nomor, verseIndex: 0 });
  };

  const downloadCurrentSurahAudio = async () => {
    if (!selectedSurahWithAudio) return;
    let audioSurah = selectedSurahWithAudio;
    if (!navigator.onLine) { showToast('Sambungkan internet sebelum mengunduh audio murottal.'); return; }
    if (audioDownloadInFlightRef.current) { showToast('Tunggu unduhan audio yang sedang berjalan selesai.'); return; }
    const surahId = Number(audioSurah.nomor);
    let src = chooseAudio(audioSurah.audioFull, qariIndex);
    if (!src) {
      // Direct reader routes and older localStorage catalogues may lack audioFull.
      // Refresh just this surah's metadata on demand before giving up on download.
      try {
        const payload = await fetchQuran(`/surat/${surahId}`);
        const refreshedSurah = normalizeSurah(payload, surahId - 1);
        src = chooseAudio(refreshedSurah.audioFull, qariIndex);
        if (src) {
          setSurahs((current) => current.map((item) => Number(item.nomor) === surahId
            ? { ...item, ...refreshedSurah, audioFull: refreshedSurah.audioFull ?? item.audioFull }
            : item));
          setSelectedSurah((current) => current && Number(current.nomor) === surahId
            ? { ...current, ...refreshedSurah, audioFull: refreshedSurah.audioFull ?? current.audioFull }
            : current);
          audioSurah = { ...audioSurah, ...refreshedSurah, audioFull: refreshedSurah.audioFull ?? audioSurah.audioFull };
        }
      } catch {
        // The actionable message below explains the required network/API fallback.
      }
    }
    if (!src) { showToast('Sumber audio untuk qari ini belum tersedia. Periksa internet lalu coba buka ulang surah.'); return; }
    let parsedSource;
    try { parsedSource = new URL(src); } catch { showToast('Alamat sumber audio tidak valid.'); return; }
    if (parsedSource.protocol !== 'https:') { showToast('Unduhan hanya diizinkan dari sumber audio HTTPS.'); return; }
    if (typeof caches === 'undefined' || typeof caches.open !== 'function') {
      showToast('Browser ini belum mendukung penyimpanan audio offline.');
      return;
    }
    audioDownloadInFlightRef.current = true;
    setAudioDownloadProgress({ surahId, reciterId: QARI_IDS[qariIndex] || '05', reciter: QARIS[qariIndex], loaded: 0, total: 0, title: audioSurah.namaLatin });
    try {
      const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
      const existing = await cache.match(src);
      if (existing) {
        const existingBytes = Number(existing.headers.get('content-length')) || offlineAudioTracks.find((track) => track.src === src)?.bytes || 0;
        const reciterId = QARI_IDS[qariIndex] || '05';
        const priorTrack = offlineAudioTracks.find((track) => track.surahId === surahId && track.reciterId === reciterId && track.type !== 'verse');
        const nextTracks = upsertOfflineAudioTrack(offlineAudioTracks, { surahId, src, reciterId, title: audioSurah.namaLatin, reciter: QARIS[qariIndex], bytes: existingBytes, savedAt: Date.now() });
        if (!writeLocal(OFFLINE_AUDIO_STORAGE_KEY, nextTracks)) throw new Error('Penyimpanan metadata penuh.');
        if (priorTrack?.src && priorTrack.src !== src) await cache.delete(priorTrack.src);
        setOfflineAudioTracks(nextTracks);
        await refreshOfflineAudioStats(nextTracks);
        showToast(`Audio ${audioSurah.namaLatin} sudah tersedia offline.`);
        return;
      }

      // Use Nurani's same-origin streaming proxy for the download only. Some audio
      // CDN responses can play in <audio> but reject browser fetch because of CORS.
      const proxyUrl = `/api/audio-proxy?src=${encodeURIComponent(src)}`;
      const reciterId = QARI_IDS[qariIndex] || '05';
      const priorTrack = offlineAudioTracks.find((track) => track.surahId === surahId && track.reciterId === reciterId && track.type !== 'verse');
      const totalWithoutThisTrack = totalOfflineAudioBytes(offlineAudioTracks.filter((track) => !(track.surahId === surahId && track.reciterId === reciterId && track.type !== 'verse') && track.src !== src));
      const ensureDeclaredAudioFits = async (byteLength) => {
        if (byteLength > MAX_AUDIO_TRACK_BYTES) throw new Error('Ukuran audio melebihi batas 80 MB per surah.');
        if (byteLength && totalWithoutThisTrack + byteLength > MAX_TOTAL_AUDIO_BYTES) {
          throw new Error('Batas total audio offline 200 MB akan terlampaui. Hapus audio lain terlebih dahulu.');
        }
        try {
          const estimate = await navigator.storage?.estimate?.();
          const available = Number(estimate?.quota) - Number(estimate?.usage);
          if (byteLength && Number.isFinite(available) && available > 0 && available < byteLength + 8 * 1024 * 1024) {
            throw new Error('Ruang penyimpanan perangkat tidak cukup untuk audio ini.');
          }
        } catch (storageError) {
          if (storageError instanceof Error && storageError.message.includes('Ruang penyimpanan')) throw storageError;
        }
      };
      const throwProxyResponseError = async (failedResponse) => {
        let detail = '';
        try {
          const payload = await failedResponse.json();
          detail = String(payload?.error || '').trim();
        } catch { /* Use HTTP status when the proxy did not return JSON. */ }
        throw new Error(`Audio proxy: ${detail || `Permintaan unduhan gagal (HTTP ${failedResponse.status}).`}`);
      };

      let blob;
      let declaredLength = 0;
      let audioMimeType = 'audio/mpeg';
      const chunks = [];
      // Use byte-range chunks when the CDN supports them. This keeps each Vercel
      // response small and avoids timing out on long surahs; fallback is a streamed
      // full response when the upstream ignores Range requests.
      const probe = await fetch(proxyUrl, { method: 'GET', headers: { Range: 'bytes=0-0' }, cache: 'no-store' });
      const contentRange = probe.headers.get('content-range') || '';
      const rangeMatch = /^bytes\s+(\d+)-(\d+)\/(\d+)$/i.exec(contentRange);
      if (probe.status !== 200 && probe.status !== 206) await throwProxyResponseError(probe);

      if (probe.status === 206 && rangeMatch && Number(rangeMatch[1]) === 0 && Number(rangeMatch[2]) === 0) {
        declaredLength = Number(rangeMatch[3]);
        audioMimeType = probe.headers.get('content-type') || 'audio/mpeg';
        if (!Number.isSafeInteger(declaredLength) || declaredLength < 1) {
          await probe.body?.cancel().catch(() => {});
          throw new Error('Sumber audio mengirim ukuran file yang tidak valid.');
        }
        await ensureDeclaredAudioFits(declaredLength);
        const firstByte = new Uint8Array(await probe.arrayBuffer());
        if (firstByte.byteLength !== 1) throw new Error('Sumber audio mengirim potongan pertama yang tidak lengkap.');
        chunks.push(firstByte);
        let loaded = firstByte.byteLength;
        setAudioDownloadProgress({ surahId, loaded, total: declaredLength, title: audioSurah.namaLatin });

        const chunkBytes = 4 * 1024 * 1024; // Below Vercel's 4.5 MB non-streamed payload limit.
        for (let startByte = 1; startByte < declaredLength; startByte += chunkBytes) {
          const endByte = Math.min(declaredLength - 1, startByte + chunkBytes - 1);
          const partResponse = await fetch(proxyUrl, {
            method: 'GET',
            headers: { Range: `bytes=${startByte}-${endByte}` },
            cache: 'no-store'
          });
          if (partResponse.status !== 206) {
            if (!partResponse.ok) await throwProxyResponseError(partResponse);
            await partResponse.body?.cancel().catch(() => {});
            throw new Error('Audio proxy: CDN tidak konsisten mengirim potongan audio. Coba unduh ulang.');
          }
          const partRange = /^bytes\s+(\d+)-(\d+)\/(\d+)$/i.exec(partResponse.headers.get('content-range') || '');
          if (!partRange || Number(partRange[1]) !== startByte || Number(partRange[2]) !== endByte || Number(partRange[3]) !== declaredLength) {
            await partResponse.body?.cancel().catch(() => {});
            throw new Error('Audio proxy: respons potongan audio tidak cocok. Coba unduh ulang.');
          }
          const partBytes = new Uint8Array(await partResponse.arrayBuffer());
          if (partBytes.byteLength !== endByte - startByte + 1) throw new Error('Audio proxy: potongan audio tidak lengkap. Coba unduh ulang.');
          loaded += partBytes.byteLength;
          if (totalWithoutThisTrack + loaded > MAX_TOTAL_AUDIO_BYTES) throw new Error('Batas total audio offline 200 MB akan terlampaui. Hapus audio lain terlebih dahulu.');
          chunks.push(partBytes);
          setAudioDownloadProgress({ surahId, loaded, total: declaredLength, title: audioSurah.namaLatin });
        }
        blob = new Blob(chunks, { type: audioMimeType.startsWith('audio/') ? audioMimeType.split(';')[0] : 'audio/mpeg' });
      } else {
        // The host may ignore Range. Cancel the probe, then make one normal streaming
        // request instead of accidentally buffering an entire file for the probe.
        await probe.body?.cancel().catch(() => {});
        const response = await fetch(proxyUrl, { method: 'GET', cache: 'no-store' });
        if (!response.ok || response.status !== 200) await throwProxyResponseError(response);
        declaredLength = Number(response.headers.get('content-length')) || 0;
        audioMimeType = response.headers.get('content-type') || 'audio/mpeg';
        await ensureDeclaredAudioFits(declaredLength);

        if (response.body?.getReader) {
          const reader = response.body.getReader();
          let loaded = 0;
          let lastReported = 0;
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              loaded += value.byteLength;
              if (loaded > MAX_AUDIO_TRACK_BYTES) {
                await reader.cancel();
                throw new Error('Ukuran audio melebihi batas 80 MB per surah.');
              }
              if (totalWithoutThisTrack + loaded > MAX_TOTAL_AUDIO_BYTES) {
                await reader.cancel();
                throw new Error('Batas total audio offline 200 MB akan terlampaui. Hapus audio lain terlebih dahulu.');
              }
              chunks.push(value);
              if (loaded - lastReported >= 512 * 1024 || loaded === declaredLength) {
                setAudioDownloadProgress({ surahId, loaded, total: declaredLength, title: audioSurah.namaLatin });
                lastReported = loaded;
              }
            }
          } finally {
            reader.releaseLock?.();
          }
          blob = new Blob(chunks, { type: audioMimeType.startsWith('audio/') ? audioMimeType.split(';')[0] : 'audio/mpeg' });
        } else {
          blob = await response.blob();
        }
      }
      if (!blob.size) throw new Error('Sumber audio mengembalikan file kosong.');
      if (blob.size > MAX_AUDIO_TRACK_BYTES) throw new Error('Ukuran audio melebihi batas 80 MB per surah.');
      if (totalWithoutThisTrack + blob.size > MAX_TOTAL_AUDIO_BYTES) throw new Error('Batas total audio offline 200 MB akan terlampaui. Hapus audio lain terlebih dahulu.');
      setAudioDownloadProgress({ surahId, loaded: blob.size, total: blob.size, title: audioSurah.namaLatin });
      const contentType = blob.type || audioMimeType || 'audio/mpeg';
      const cacheResponse = new Response(blob, { status: 200, headers: { 'Content-Type': contentType, 'Content-Length': String(blob.size), 'Cache-Control': 'public, max-age=31536000' } });
      await cache.put(src, cacheResponse);
      const track = { surahId, type: 'full', verseNumber: 0, src, reciterId, title: audioSurah.namaLatin, reciter: QARIS[qariIndex], bytes: blob.size, savedAt: Date.now() };
      const nextTracks = upsertOfflineAudioTrack(offlineAudioTracks, track);
      if (!writeLocal(OFFLINE_AUDIO_STORAGE_KEY, nextTracks)) {
        await cache.delete(src);
        throw new Error('Metadata audio tidak bisa disimpan. Periksa ruang penyimpanan browser.');
      }
      if (priorTrack?.src && priorTrack.src !== src) await cache.delete(priorTrack.src);
      setOfflineAudioTracks(nextTracks);
      await refreshOfflineAudioStats(nextTracks);
      showToast(`Audio ${audioSurah.namaLatin} tersimpan offline (${formatStorageBytes(blob.size)}).`);
    } catch (error) {
      const message = String(error?.message || '');
      if (/^Audio proxy:/i.test(message)) showToast(message.replace(/^Audio proxy:\s*/i, ''));
      else if (/Batas total|melebihi batas|Ruang penyimpanan|Metadata audio|metadata penuh|file kosong/i.test(message)) showToast(message);
      else showToast('Unduhan audio gagal. Periksa Network pada browser untuk melihat apakah server proxy audio merespons, lalu coba lagi.');
    } finally {
      audioDownloadInFlightRef.current = false;
      setAudioDownloadProgress(null);
    }
  };

  const removeOfflineAudioTrack = async (track) => {
    if (!track?.src || !window.confirm(`Hapus audio murottal ${track.title} dari penyimpanan offline? Data ayat, bookmark, catatan, dan progres tidak akan dihapus.`)) return;
    try {
      const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
      await cache.delete(track.src);
      const nextTracks = offlineAudioTracks.filter((item) => item.src !== track.src);
      const metadataSaved = writeLocal(OFFLINE_AUDIO_STORAGE_KEY, nextTracks);
      setOfflineAudioTracks(nextTracks);
      if (audioInfo?.originalSrc === track.src || audioInfo?.src === track.src) {
        audioRef.current?.pause();
        releaseAudioObjectUrl();
        setAudioInfo(null);
        setAudioPlaying(false);
      }
      await refreshOfflineAudioStats(nextTracks);
      showToast(metadataSaved ? `Audio ${track.title} dihapus dari penyimpanan offline.` : 'Audio dihapus dari cache, tetapi daftar lokal gagal diperbarui. Buka ulang pengaturan untuk memeriksa status.');
    } catch {
      showToast('Audio belum dapat dihapus. Periksa dukungan penyimpanan browser.');
    }
  };

  const clearOfflineAudioForReciter = async (reciterId) => {
    const tracksToRemove = offlineAudioTracks.filter((track) => track.reciterId === reciterId);
    if (!tracksToRemove.length) return;
    const reciterName = QARIS[QARI_IDS.indexOf(reciterId)] || tracksToRemove[0]?.reciter || 'Qari pilihan';
    const bytesToRemove = tracksToRemove.reduce((sum, track) => sum + track.bytes, 0);
    if (!window.confirm(`Hapus ${tracksToRemove.length} audio milik ${reciterName} (${formatStorageBytes(bytesToRemove)})? Audio qari lain, cache ayat, bookmark, catatan, dan progres tetap dipertahankan.`)) return;
    try {
      const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
      await Promise.all(tracksToRemove.map((track) => cache.delete(track.src)));
      const removedSources = new Set(tracksToRemove.map((track) => track.src));
      const nextTracks = offlineAudioTracks.filter((track) => !removedSources.has(track.src));
      const metadataSaved = writeLocal(OFFLINE_AUDIO_STORAGE_KEY, nextTracks);
      setOfflineAudioTracks(nextTracks);
      if (audioInfo?.originalSrc && removedSources.has(audioInfo.originalSrc)) {
        audioRef.current?.pause();
        releaseAudioObjectUrl();
        setAudioInfo(null);
        setAudioPlaying(false);
      }
      await refreshOfflineAudioStats(nextTracks);
      showToast(metadataSaved ? `Audio ${reciterName} berhasil dihapus.` : 'Audio dihapus dari cache, tetapi daftar lokal gagal diperbarui. Periksa ulang pengaturan.');
    } catch {
      showToast('Audio qari ini belum dapat dihapus. Periksa penyimpanan browser.');
    }
  };

  const clearOfflineAudioTracks = async () => {
    if (!offlineAudioTracks.length && !offlineAudioStats.cachedSrcs.length) return;
    if (!window.confirm(`Hapus semua audio murottal offline (${formatStorageBytes(offlineAudioStats.cachedBytes)})? Cache ayat, bookmark, catatan, dan progres membaca tetap dipertahankan.`)) return;
    try {
      await caches.delete(OFFLINE_AUDIO_CACHE_NAME);
      window.localStorage.setItem(OFFLINE_AUDIO_STORAGE_KEY, JSON.stringify([]));
      setOfflineAudioTracks([]);
      setOfflineAudioStats({ cachedSrcs: [], missingSrcs: [], cachedBytes: 0 });
      if (audioInfo?.originalSrc && offlineAudioTracks.some((track) => track.src === audioInfo.originalSrc)) {
        audioRef.current?.pause();
        releaseAudioObjectUrl();
        setAudioInfo(null);
        setAudioPlaying(false);
      }
      showToast('Semua audio offline dihapus. Cache ayat dan data pribadi tetap aman.');
    } catch {
      showToast('Audio offline belum dapat dibersihkan. Periksa pengaturan penyimpanan browser.');
    }
  };

  const saveCurrentSurahOffline = () => {
    if (!selectedSurah || !verses.length) {
      showToast('Buka surah dan tunggu ayatnya termuat sebelum menyimpan offline.');
      return;
    }
    const id = Number(selectedSurah.nomor);
    // Pin the verse data and catalogue metadata in local storage so the reader
    // can still open this surah through Nurani when the API is unreachable.
    const verseSaved = writeLocal(`aq:verses:${id}`, verses);
    const metadataSaved = writeLocal('aq:surahs', surahs);
    if (!verseSaved || !metadataSaved) {
      showToast('Penyimpanan perangkat penuh atau tidak tersedia. Kosongkan ruang lalu coba lagi.');
      return;
    }
    setOfflineSurahs((previous) => previous.includes(id) ? previous : [...previous, id].sort((a, b) => a - b));

    // Best-effort precache of the actual reader routes. The local verse data remains
    // the primary offline fallback if a browser does not support route precaching.
    try {
      const currentVerse = getVerseNumberFromPathname(window.location.pathname) || 1;
      const paths = [...new Set([getSurahPath(selectedSurah), getVersePath(selectedSurah, currentVerse)])];
      postToOfflineWorker({ type: 'CACHE_SURAH_ROUTES', surahId: id, paths });
    } catch { /* The local data has been saved even if route precaching is unavailable. */ }
    window.setTimeout(() => { void refreshOfflineStorage(); }, 0);
    showToast(`${selectedSurah.namaLatin} dan data ayatnya disimpan untuk akses offline di perangkat ini.`);
  };

  const removeOfflineSurah = (surahNumber) => {
    const id = Number(surahNumber);
    const surah = surahs.find((item) => Number(item.nomor) === id) || fallbackSurahs[id - 1];
    if (!Number.isInteger(id) || id < 1 || id > 114 || !surah) return;
    if (!window.confirm(`Hapus ${surah.namaLatin} dari konten offline? Bookmark, progres membaca, dan catatan tadabbur tidak akan dihapus.`)) return;
    try {
      window.localStorage.removeItem(`aq:verses:${id}`);
      const next = normalizeOfflineSurahIds(offlineSurahs).filter((item) => item !== id);
      window.localStorage.setItem('aq:offline-surahs', JSON.stringify(next));
      setOfflineSurahs(next);
      postToOfflineWorker({ type: 'REMOVE_SURAH_OFFLINE', surahId: id });
      window.setTimeout(() => { void refreshOfflineStorage(); }, 0);
      showToast(`${surah.namaLatin} dihapus dari data offline. Bookmark, catatan, dan progres tetap aman.`);
    } catch {
      showToast('Data offline belum bisa dihapus. Periksa pengaturan penyimpanan browser.');
    }
  };

  const clearOfflineQuranData = () => {
    const confirmed = window.confirm('Hapus semua cache ayat Al-Qur’an yang tersimpan di perangkat? Bookmark, catatan tadabbur, progres khatam, posisi bacaan, dan pengaturan tidak akan dihapus. Surah perlu dimuat kembali saat perangkat tersambung internet.');
    if (!confirmed) return;
    try {
      const keys = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key && /^aq:verses:\d+$/.test(key)) keys.push(key);
      }
      keys.forEach((key) => window.localStorage.removeItem(key));
      window.localStorage.setItem('aq:offline-surahs', JSON.stringify([]));
      setOfflineSurahs([]);
      postToOfflineWorker({ type: 'CLEAR_QURAN_OFFLINE' });
      window.setTimeout(() => { void refreshOfflineStorage(); }, 0);
      showToast('Cache ayat dihapus. Bookmark, catatan, dan progres tetap dipertahankan.');
    } catch {
      showToast('Sebagian cache tidak dapat dihapus. Periksa ruang penyimpanan browser.');
    }
  };
  const handleAudioEnded = () => {
    setAudioPlaying(false);
    if (audioInfo?.trackType === 'verse' && selectedSurah) {
      const repeatTotal = audioRepeat === 'infinite' ? Number.POSITIVE_INFINITY : (audioRepeat === 'off' ? 1 : Number(audioRepeat));
      if (repeatTotal > 1 && (repeatTotal === Number.POSITIVE_INFINITY || repeatCountRef.current < repeatTotal - 1)) {
        repeatCountRef.current += 1;
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().then(() => setAudioPlaying(true)).catch(() => {
            setAudioPlaying(false);
            showToast('Audio tidak dapat diulang. Periksa koneksi atau sumber audio.');
          });
        }
        return;
      }
      repeatCountRef.current = 0;
      const nextIndex = Number(audioInfo.verseIndex) + 1;
      if (verses[nextIndex]) playVerse(verses[nextIndex], nextIndex);
    }
  };
  const toggleAudioPlayback = async () => {
    if (!audioRef.current || !audioInfo) return;
    if (audioRef.current.paused) {
      try { await audioRef.current.play(); setAudioPlaying(true); } catch { showToast('Audio belum bisa diputar.'); }
    } else { audioRef.current.pause(); setAudioPlaying(false); }
  };
  const shareSearchResult = async (result) => {
    if (!result?.surahNumber || !result?.verseNumber) return;
    const path = getVersePath(result.surahNumber, result.verseNumber);
    const url = new URL(path, window.location.origin).toString();
    const reference = `${result.surahName} · Ayat ${result.verseNumber}`;
    const excerpts = (result.matches || []).slice(0, 3).map((item) => `${item.label}: ${item.text}`);
    const text = [reference, ...excerpts].join('\n\n');
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: `${reference} — Nurani`, text, url });
        return;
      }
      const shareText = `${text}\n\nBaca ayat ini di Nurani: ${url}`;
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(shareText);
      else {
        const field = document.createElement('textarea');
        field.value = shareText;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        document.execCommand('copy');
        field.remove();
      }
      showToast('Tautan dan cuplikan ayat disalin.');
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('Ayat belum dapat dibagikan dari browser ini.');
    }
  };

  const copyVerse = async (verse) => {
    const text = [verse.teksArab, verse.teksLatin, verse.teksIndonesia].filter(Boolean).join('\n\n');
    try { await navigator.clipboard.writeText(text); showToast('Teks ayat disalin.'); }
    catch { showToast('Clipboard tidak tersedia di browser ini.'); }
  };
  const shareVerse = async (verse) => {
    if (!selectedSurah || !verse?.nomorAyat) return;
    const path = getVersePath(selectedSurah, verse.nomorAyat);
    const url = new URL(path, window.location.origin).toString();
    const reference = `${selectedSurah.namaLatin} ${selectedSurah.nomor}:${verse.nomorAyat}`;
    const text = [reference, verse.teksArab, verse.teksLatin, verse.teksIndonesia].filter(Boolean).join('\n\n');
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: `${reference} — Nurani`, text, url });
        return;
      }
      const shareText = `${text}\n\nBaca ayat ini di Nurani: ${url}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const field = document.createElement('textarea');
        field.value = shareText;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Copy command failed');
      }
      showToast('Teks ayat dan tautan berhasil disalin.');
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('Ayat belum bisa dibagikan. Coba salin teks ayat terlebih dahulu.');
    }
  };
  const shareDua = async (dua) => {
    if (!dua) return;
    const path = getDuaPath(dua);
    const url = new URL(path, window.location.origin).toString();
    const sourceLine = dua.sumber ? `Sumber: ${dua.sumber}` : '';
    const text = [dua.judul, dua.arab, dua.latin, dua.terjemah, sourceLine].filter(Boolean).join('\n\n');
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: `${dua.judul} — Nurani`, text, url });
        return;
      }
      const shareText = `${text}\n\nBaca doa ini di Nurani: ${url}`;
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(shareText);
      else {
        const field = document.createElement('textarea');
        field.value = shareText; field.setAttribute('readonly', '');
        field.style.position = 'fixed'; field.style.opacity = '0';
        document.body.appendChild(field); field.select();
        const copied = document.execCommand('copy'); field.remove();
        if (!copied) throw new Error('Copy command failed');
      }
      showToast('Doa dan tautannya berhasil disalin.');
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('Doa belum bisa dibagikan. Coba salin teks doa terlebih dahulu.');
    }
  };
  const copyDua = async (dua) => {
    try {
      await navigator.clipboard.writeText([dua.judul, dua.arab, dua.latin, dua.terjemah, dua.sumber].filter(Boolean).join('\n\n'));
      showToast('Doa berhasil disalin.');
    } catch { showToast('Clipboard tidak tersedia.'); }
  };

  const openTafsir = async (verse = null) => {
    if (!selectedSurah) return;
    setTafsirLoading(true);
    setTafsirModal({ surah: selectedSurah, verse, text: verse?.tafsir || '' });
    try {
      const payload = await fetchQuran(`/tafsir/${selectedSurah.nomor}`);
      const text = (typeof verse?.tafsir === 'string' ? verse.tafsir : '') || findTafsirText(payload, verse ? verse.nomorAyat : -1);
      setTafsirModal({ surah: selectedSurah, verse, text: text || '', payload });
    } catch {
      if (!verse?.tafsir) showToast('Tafsir belum dapat dimuat. Periksa koneksi internet.');
    } finally { setTafsirLoading(false); }
  };
  const searchCities = async (keyword, regionOverride = cityRegion) => {
    const query = String(keyword || '').trim().toLowerCase();
    try {
      let rows = cityCatalogue;
      if (!rows.length) {
        const data = await fetchAllPrayerCities();
        rows = firstArray(data, ['cities', 'kabkota', 'lokasi', 'items']);
        setCityCatalogue(rows);
      }
      const regionPatterns = {
        all: null,
        'jawa-bali': /JAWA|BALI|BANTEN|JAKARTA|YOGYAKARTA/i,
        sumatra: /ACEH|SUMATERA|SUMATRA|RIAU|JAMBI|BENGKULU|LAMPUNG|BANGKA|BELITUNG/i,
        kalimantan: /KALIMANTAN/i,
        'sulawesi-nusa': /SULAWESI|GORONTALO|NUSA TENGGARA/i,
        'maluku-papua': /MALUKU|PAPUA/i
      };
      const pattern = regionPatterns[regionOverride] || null;
      const matches = rows.filter((city) => {
        const haystack = `${city.lokasi ?? city.nama ?? city.name ?? ''} ${city.prov ?? city.provinsi ?? city.province ?? ''}`;
        return (!query || haystack.toLowerCase().includes(query)) && (!pattern || pattern.test(haystack));
      });
      setCityMatches(matches.slice(0, 12));
      setCitySearchOpen(true);
      if (!matches.length) showToast('Tidak ada kota yang cocok. Coba kata kunci lain.');
    } catch {
      try {
        const data = await fetchPrayerCity(keyword.trim());
        const rows = firstArray(data, ['cities', 'lokasi', 'items']);
        setCityMatches(rows.slice(0, 8));
        setCitySearchOpen(true);
      } catch { setCityMatches([]); showToast('Pencarian kota gagal. Coba lagi saat online.'); }
    }
  };
  const selectCity = async (city) => {
    const id = city.id ?? city.city_id;
    if (!id) return;
    const selectedName = city.lokasi ?? city.nama ?? city.name ?? 'Lokasi dipilih';
    const timezone = timezoneForLocation(selectedName);
    setCityName(selectedName);
    setCityId(String(id)); setPrayerTimezone(timezone); setCitySearchOpen(false); setCityMatches([]); setPrayerLoading(true); setPrayerError('');
    try {
      const data = await fetchPrayerSchedule(id, 'today', timezone);
      const root = data?.jadwal ?? data?.schedule ?? {};
      const dayKey = Object.keys(root)[0];
      const schedule = toPrayerTimes(root[dayKey] || root);
      if (!Object.keys(schedule).length) throw new Error('empty');
      const date = root[dayKey]?.tanggal || data?.tanggal || '';
      setPrayerSchedule(schedule); setPrayerDate(date);
      writeLocal('aq:prayer', { cityName: selectedName, cityId: String(id), timezone, schedule, date });
      showToast(`Jadwal ${city.lokasi ?? city.nama ?? 'kota'} diperbarui.`);
    } catch {
      setPrayerError('Jadwal kota ini belum bisa dimuat. Jadwal tersimpan sebelumnya tetap tersedia.');
      const saved = readLocal('aq:prayer', null);
      if (saved?.schedule) { setPrayerSchedule(saved.schedule); setCityName(saved.cityName); setCityId(saved.cityId); setPrayerTimezone(saved.timezone || timezoneForLocation(saved.cityName)); }
    } finally { setPrayerLoading(false); }
  };
  const installApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result?.outcome === 'accepted') setInstalled(true);
      setInstallPrompt(null);
    } else if (installed) showToast('Aplikasi sudah terpasang di perangkat.');
    else showToast('Gunakan menu browser “Instal aplikasi” atau “Tambahkan ke layar utama”.');
  };
  const exportLocalBackup = () => {
    try {
      const backup = createLocalBackup(window.localStorage, '1.20.0');
      const entryCount = Object.keys(backup.data).length;
      if (!entryCount) {
        showToast('Belum ada data Nurani yang bisa dicadangkan.');
        return;
      }
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `nurani-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1500);
      showToast(`Cadangan Nurani berhasil dibuat (${entryCount} kategori data).`);
    } catch {
      showToast('Cadangan gagal dibuat. Pastikan browser mengizinkan akses penyimpanan dan unduhan.');
    }
  };
  const importLocalBackup = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > LOCAL_BACKUP_MAX_BYTES) {
      showToast('Ukuran file cadangan terlalu besar. Batas maksimal 5 MB.');
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      const result = validateLocalBackupPayload(parsed);
      if (!result.valid) {
        showToast(result.error || 'File cadangan tidak valid.');
        return;
      }
      const entries = Object.entries(result.data);
      const preview = entries.map(([key, value]) => `• ${LOCAL_BACKUP_LABELS[key]}: ${describeLocalBackupValue(key, value)}`).join('\n');
      const warning = result.rejectedEntries ? `\n\n${result.rejectedEntries} data yang tidak dikenal atau tidak valid akan dilewati.` : '';
      const confirmed = window.confirm(
        `Cadangan Nurani berhasil divalidasi.\nVersi sumber: ${result.appVersion}\nTanggal: ${result.exportedAt || 'tidak tercatat'}\n\nData yang akan dipulihkan:\n${preview}${warning}\n\nKategori yang ada di file akan menggantikan kategori yang sama di perangkat ini. Kategori yang tidak terdapat dalam file tidak diubah. Lanjutkan?`
      );
      if (!confirmed) return;

      const priorValues = new Map(entries.map(([key]) => [key, window.localStorage.getItem(key)]));
      try {
        entries.forEach(([key, value]) => window.localStorage.setItem(key, JSON.stringify(value)));
      } catch (storageError) {
        priorValues.forEach((_, key) => {
          try { window.localStorage.removeItem(key); } catch { /* Best-effort rollback if storage is unavailable. */ }
        });
        priorValues.forEach((rawValue, key) => {
          if (rawValue === null) return;
          try { window.localStorage.setItem(key, rawValue); } catch { /* Best-effort rollback if storage is unavailable. */ }
        });
        throw storageError;
      }
      showToast('Data berhasil dipulihkan. Nurani akan dimuat ulang.');
      window.setTimeout(() => window.location.reload(), 700);
    } catch {
      showToast('Impor gagal. Pastikan file JSON utuh dan ruang penyimpanan masih tersedia.');
    }
  };
  const requestReminderPermission = async () => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined' || !('serviceWorker' in navigator)) {
      setNotificationPermission('unsupported');
      showToast('Notifikasi sistem tidak didukung browser ini. Pengingat tetap tampil saat Nurani terbuka.');
      return;
    }
    if (Notification.permission === 'denied') {
      setNotificationPermission('denied');
      showToast('Izin notifikasi ditolak. Ubah izin situs melalui pengaturan browser untuk mengaktifkannya.');
      return;
    }
    try {
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      setNotificationPermission(permission);
      showToast(permission === 'granted'
        ? 'Notifikasi diizinkan. Pengingat sistem dapat muncul saat Nurani berjalan di latar belakang.'
        : 'Izin notifikasi belum diberikan. Pengingat tetap tampil saat Nurani terbuka.');
    } catch {
      showToast('Izin notifikasi tidak berhasil diperiksa. Pengingat dalam aplikasi tetap tersedia.');
    }
  };

  const saveReminder = (event) => {
    event.preventDefault();
    const title = String(reminderDraft.title || '').trim().slice(0, 60);
    if (!title) { showToast('Masukkan nama pengingat terlebih dahulu.'); return; }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderDraft.time)) { showToast('Pilih waktu pengingat yang valid.'); return; }
    const days = [...new Set(reminderDraft.days)].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6).sort((a, b) => a - b);
    if (!days.length) { showToast('Pilih minimal satu hari untuk pengingat.'); return; }
    if (!reminderEditingId && reminders.length >= REMINDER_MAX_COUNT) { showToast(`Maksimal ${REMINDER_MAX_COUNT} jadwal pengingat. Hapus salah satu jadwal untuk menambah yang baru.`); return; }
    const existing = reminderEditingId ? reminders.find((item) => item.id === reminderEditingId) : null;
    const nextReminder = {
      id: existing?.id || `rem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      time: reminderDraft.time,
      kind: ['tilawah', 'doa', 'both'].includes(reminderDraft.kind) ? reminderDraft.kind : 'tilawah',
      days,
      enabled: reminderDraft.enabled !== false,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    const nextReminders = normalizeReminderList([...reminders.filter((item) => item.id !== nextReminder.id), nextReminder]);
    if (!nextReminders.some((item) => item.id === nextReminder.id)) { showToast('Jadwal pengingat tidak valid. Periksa kembali isian.'); return; }
    setReminders(nextReminders);
    setReminderEditingId(null);
    setReminderDraft({ ...DEFAULT_REMINDER_DRAFT, days: [...DEFAULT_REMINDER_DRAFT.days] });
    showToast(existing ? 'Pengingat berhasil diperbarui.' : 'Pengingat berhasil ditambahkan.');
  };

  const editReminder = (reminder) => {
    setReminderEditingId(reminder.id);
    setReminderDraft({ title: reminder.title, time: reminder.time, kind: reminder.kind, days: [...reminder.days], enabled: reminder.enabled });
  };

  const deleteReminder = (reminderId) => {
    const reminder = reminders.find((item) => item.id === reminderId);
    if (!reminder) return;
    if (!window.confirm(`Hapus pengingat “${reminder.title}”?`)) return;
    setReminders((current) => current.filter((item) => item.id !== reminderId));
    if (reminderEditingId === reminderId) {
      setReminderEditingId(null);
      setReminderDraft({ ...DEFAULT_REMINDER_DRAFT, days: [...DEFAULT_REMINDER_DRAFT.days] });
    }
    const fired = readLocal('aq:reminders-last-fired', {});
    if (fired && typeof fired === 'object') { delete fired[reminderId]; writeLocal('aq:reminders-last-fired', fired); }
    showToast('Pengingat dihapus.');
  };

  const resetReaderSettings = () => {
    setArabicVisible(true); setLatinVisible(true); setTranslationVisible(true); setTajweedEnabled(false); setTajweedLearningMode(false); setSelectedTajweedLesson(null); setArabicSize(32); setLatinSize(18); setTranslationSize(15);
    showToast('Pengaturan bacaan dikembalikan ke awal.');
  };

  const renderHome = () => (
    <div className="page-stack home-page">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">ASSALAMU’ALAIKUM</p>
          <h1>Temukan tenangmu <span>hari ini.</span></h1>
          <p className="muted welcome-date"><CalendarDays size={14} /> {dateLabel || 'Hari yang penuh berkah'}</p>
        </div>
        <div className="welcome-avatar" aria-hidden="true"><Sparkles size={22} /></div>
      </section>

      <section className="hero-quran">
        <div className="hero-ornament hero-ornament-one" /><div className="hero-ornament hero-ornament-two" />
        <div className="hero-content">
          <span className="hero-kicker"><span className="hero-dot" /> TEMAN IBADAH HARIAN</span>
          <h2>Lebih dekat dengan<br />Al-Qur’an.</h2>
          <p>Luangkan waktu sejenak untuk membaca, memahami, dan menenangkan hati.</p>
          <button className="button button-gold" onClick={() => openSurah(lastRead?.surahId || 1, lastRead?.verse || 1)}>
            <BookOpen size={17} /> {lastRead ? 'Lanjutkan membaca' : 'Mulai membaca'} <ArrowRight size={16} />
          </button>
        </div>
        <div className="hero-calligraphy" aria-label="Wa rattilil Qur'ana tartila">
          <span className="arabic-calligraphy" dir="rtl">وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا</span>
          <span className="calligraphy-caption">Bacalah Al-Qur’an dengan tartil · QS. Al-Muzzammil: 4</span>
        </div>
        <div className="hero-bottom-line"><span>01</span><div /><span>Tilawah • Tadabbur • Doa</span></div>
      </section>

      <section className="section-block khatam-section">
        <div className="section-heading"><div><p className="eyebrow">KONSISTEN BERTILAWAH</p><h2>Target khatam</h2></div><span className="tiny-status"><Target size={13} /> {khatamDays} hari</span></div>
        <div className="khatam-card card-surface">
          <div className="khatam-card-heading"><span className="khatam-icon"><BookMarked size={20} /></span><div><strong>Perjalanan Al-Qur’anmu</strong><p>Setiap ayat yang kamu baca akan dihitung di perangkat ini.</p></div></div>
          <div className="khatam-stats"><div><strong>{completedVerseCount.toLocaleString('id-ID')}</strong><span>ayat ditandai dibaca</span></div><div><strong>{overallReadingPercent}%</strong><span>progres keseluruhan</span></div></div>
          <div className="progress-track" role="progressbar" aria-label="Progres membaca Al-Qur’an" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overallReadingPercent}><span style={{ width: `${overallReadingPercent}%` }} /></div>
          <div className="khatam-target-row"><span>Target khatam</span><div className="goal-options" role="group" aria-label="Pilih target khatam">{KHATAM_OPTIONS.map((days) => <button key={days} type="button" className={khatamDays === days ? 'active' : ''} onClick={() => setKhatamDays(days)} aria-pressed={khatamDays === days}>{days} hari</button>)}</div></div>
          <div className="khatam-reset-row"><span>Mulai ulang perhitungan progres membaca tanpa menghapus bookmark atau posisi bacaan terakhir.</span><button type="button" className="button button-glass khatam-reset-button" onClick={() => { if (window.confirm('Reset progres khatam? Progres keseluruhan dan catatan bacaan harian akan dihapus, rencana khatam kembali ke 30 hari. Target harian pribadi, bookmark, dan posisi bacaan terakhir tetap tersimpan.')) { setReadVerseKeys([]); setReadingDays({}); setKhatamDays(30); showToast('Progres khatam berhasil direset.'); } }}><RefreshCw size={14} /> Reset khatam</button></div>
          <div className="daily-target-heading"><div><strong>{todayReadCount.toLocaleString('id-ID')} / {dailyVerseGoal.toLocaleString('id-ID')} ayat hari ini</strong><small>Target harian pribadimu · {tilawahStats.isGoalComplete ? 'target tercapai, alhamdulillah' : `sisa ${tilawahStats.remainingForToday} ayat untuk mencapai target`}</small></div><span>{dailyReadingPercent}%</span></div>
          <div className="progress-track progress-track-daily" role="progressbar" aria-label="Progres target membaca hari ini" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dailyReadingPercent}><span style={{ width: `${dailyReadingPercent}%` }} /></div>
          <div className="home-daily-goal-picker"><span>Atur target ayat harian</span><div className="goal-options" role="group" aria-label="Pilih target ayat harian">{DAILY_VERSE_GOAL_OPTIONS.map((goal) => <button key={goal} type="button" className={dailyVerseGoal === goal ? 'active' : ''} aria-pressed={dailyVerseGoal === goal} onClick={() => { setDailyVerseGoal(goal); setDailyGoalDraft(String(goal)); }}>{goal} ayat</button>)}</div></div>
          <div className="daily-goal-footer"><p className="progress-footnote">Target khatam {khatamDays} hari membutuhkan sekitar {dailyVerseTarget.toLocaleString('id-ID')} ayat per hari. Data disimpan lokal dan tidak memerlukan akun.</p><button className="text-link" type="button" onClick={() => setActiveTab('stats')}>Lihat statistik lengkap <ArrowRight size={15} /></button></div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">RUTINITAS HARIAN</p><h2>Ringkasan ibadah</h2></div><span className="tiny-status"><span /> {online ? 'Terhubung' : 'Offline'}</span></div>
        <div className="prayer-summary card-surface">
          <div className="prayer-summary-top">
            <div className="prayer-location"><span className="location-icon"><MapPin size={16} /></span><div><strong>{cityName}</strong><span>{prayerDate || 'Jadwal shalat hari ini'}</span></div></div>
            <button className="icon-button small" aria-label="Cari kota jadwal shalat" onClick={() => { setActiveTab('prayer'); setCitySearchOpen(true); }}><ArrowRight size={17} /></button>
          </div>
          <div className="next-prayer-box">
            <div className="next-prayer-symbol"><Clock3 size={21} /></div>
            <div className="next-prayer-copy"><span>WAKTU SHALAT BERIKUTNYA</span><strong>{prayerLoading && !prayerSchedule ? 'Memuat jadwal…' : (upcomingPrayer?.label || 'Jadwal shalat')}</strong><small>{upcomingPrayer?.tomorrow ? `Besok · ${upcomingPrayer.time || '--:--'}` : upcomingPrayer?.time || (prayerError ? 'Belum tersedia' : 'Memuat waktu')}</small></div>
            {upcomingPrayer && <div className="next-prayer-time">{upcomingPrayer.time}</div>}
          </div>
          <div className="prayer-times-row">
            {PRAYERS.map((prayer) => <div className={`prayer-time-item ${upcomingPrayer?.key === prayer.key ? 'is-next' : ''}`} key={prayer.key}><span>{prayer.label}</span><strong>{prayerSchedule?.[prayer.key] || '— —'}</strong></div>)}
          </div>
          <button className="text-link prayer-more" onClick={() => setActiveTab('prayer')}>Lihat jadwal lengkap <ArrowRight size={15} /></button>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">MULAI DARI SINI</p><h2>Akses cepat</h2></div></div>
        <div className="quick-grid">
          <button className="quick-card quick-quran" onClick={() => setActiveTab('quran')}><span className="quick-icon"><BookOpen size={21} /></span><strong>Baca Al-Qur’an</strong><span>114 surah lengkap</span><ArrowRight size={16} className="quick-arrow" /></button>
          <button className="quick-card quick-prayer" onClick={() => setActiveTab('prayer')}><span className="quick-icon"><Clock3 size={21} /></span><strong>Jadwal shalat</strong><span>Waktu di kotamu</span><ArrowRight size={16} className="quick-arrow" /></button>
          <button className="quick-card quick-dua" onClick={() => setActiveTab('duas')}><span className="quick-icon"><HandHeart size={21} /></span><strong>Doa harian</strong><span>Temani aktivitasmu</span><ArrowRight size={16} className="quick-arrow" /></button>
          <button className="quick-card quick-asma" onClick={() => setActiveTab('asma')}><span className="quick-icon"><Sparkles size={21} /></span><strong>Asmaul Husna</strong><span>99 nama Allah</span><ArrowRight size={16} className="quick-arrow" /></button>
        </div>
        <button type="button" className="qibla-home-shortcut card-surface" onClick={() => { setSelectedSurah(null); setActiveDuaSlug(null); setActiveTab('qibla'); }}>
          <span className="qibla-shortcut-icon"><Compass size={23} /></span>
          <span className="qibla-shortcut-copy"><strong>Temukan arah kiblat</strong><small>Gunakan lokasi perangkat dan kompas jika tersedia.</small></span>
          <span className="qibla-shortcut-action">Buka <ArrowRight size={15} /></span>
        </button>
      </section>

      <section className="section-block last-read-section">
        <div className="section-heading"><div><p className="eyebrow">PERJALANAN TILAWAH</p><h2>Terakhir dibaca</h2></div><button className="text-link" onClick={() => { setActiveTab('quran'); setSurahFilter('bookmarked'); }}>Bookmark <Bookmark size={15} /></button></div>
        <div className="last-read-card card-surface">
          <div className="last-read-mark"><BookMarked size={22} /></div>
          <div className="last-read-info"><span>{lastRead ? `Surah ke-${lastRead.surahId}` : 'Mulai perjalananmu'}</span><strong>{lastRead?.surahName || 'Belum ada bacaan tersimpan'}</strong><small>{lastRead ? `Terakhir di ayat ${lastRead.verse}` : 'Bacaan terakhir akan tersimpan di perangkat ini.'}</small></div>
          <button className="round-action" aria-label="Buka bacaan terakhir" onClick={() => openSurah(lastRead?.surahId || 1, lastRead?.verse || 1)}><ArrowRight size={19} /></button>
        </div>
      </section>
      {allVerseNotes.length > 0 && <section className="section-block verse-notes-home-section">
        <div className="section-heading"><div><p className="eyebrow">CATATAN PRIBADI</p><h2>Catatan tadabbur</h2></div><span className="tiny-status"><StickyNote size={13} /> {allVerseNotes.length} catatan</span></div>
        <div className="verse-notes-home-list">
          {recentVerseNotes.map((note) => <button type="button" className="verse-note-home-card card-surface" key={`${note.surahId}:${note.verseNumber}`} onClick={() => openVerseFromNote(note)}>
            <span className="verse-note-home-icon"><StickyNote size={18} /></span>
            <span className="verse-note-home-copy"><strong>{note.surahName} · Ayat {note.verseNumber}</strong><span>{note.text}</span></span>
            <ArrowRight size={17} />
          </button>)}
        </div>
        {allVerseNotes.length > 3 && <button type="button" className="text-link verse-notes-view-all" onClick={() => setVerseNotesModalOpen(true)}>Lihat semua {allVerseNotes.length} catatan <ArrowRight size={14} /></button>}
        <p className="verse-notes-local-note"><ShieldCheck size={13} /> Catatan hanya tersimpan di perangkat/browser ini.</p>
      </section>}

      <section className="offline-summary card-surface">
        <span className="offline-summary-icon">{online ? <Download size={19} /> : <WifiOff size={19} />}</span>
        <div className="offline-summary-copy"><strong>{online ? 'Siap dibaca tanpa internet' : 'Nurani sedang offline'}</strong><p>{offlineSurahs.length > 0 ? `${offlineSurahs.length} surah ditandai untuk akses offline. ` : 'Surah yang sudah dimuat dapat disimpan di perangkat. '}{online ? 'Simpan surah dari halaman baca untuk menandainya sebagai favorit offline.' : 'Surah yang sudah pernah dibuka dan disimpan tetap tersedia di perangkat.'}</p></div>
        <button className="text-link offline-summary-action" onClick={() => { setSelectedSurah(null); setActiveTab('quran'); setSurahFilter(offlineSurahs.length ? 'offline' : 'all'); }}><span>{offlineSurahs.length ? 'Lihat' : 'Jelajahi'}</span><ArrowRight size={15} /></button>
      </section>

      <section className="daily-reminder">
        <div className="reminder-symbol"><Heart size={17} /></div><div><strong>Pelan-pelan, yang penting istiqamah.</strong><p>Satu ayat yang dibaca dengan hati lebih baik daripada terburu-buru tanpa memahami.</p></div>
      </section>
    </div>
  );

  const renderTilawahStats = () => {
    const maxBar = Math.max(1, ...tilawahStats.last7.map((day) => day.count));
    const saveDailyGoal = (event) => {
      event.preventDefault();
      const next = Number(dailyGoalDraft);
      if (!Number.isInteger(next) || next < 1 || next > 200) {
        showToast('Masukkan target antara 1 dan 200 ayat per hari.');
        return;
      }
      setDailyVerseGoal(next);
      setDailyGoalDraft(String(next));
      showToast(`Target harian disimpan: ${next} ayat.`);
    };
    return (
      <div className="page-stack tilawah-stats-page">
        <section className="page-title-row">
          <div><p className="eyebrow">PERJALANAN TILAWAH</p><h1>Statistik tilawah</h1><p className="muted">Pantau kebiasaan membaca dan tentukan target harian yang realistis.</p></div>
          <div className="page-title-icon"><TrendingUp size={24} /></div>
        </section>
        <section className="tilawah-stats-hero card-surface">
          <div className="tilawah-stats-hero-copy"><span className="hero-kicker"><span className="hero-dot" /> CATATAN PERJALANANMU</span><h2>Sedikit demi sedikit,<br />tetap bertilawah.</h2><p>{tilawahStats.todayLabel}</p></div>
          <div className="tilawah-stats-hero-progress"><div className="tilawah-ring" style={{ '--tilawah-progress': `${tilawahStats.dailyGoalPercent}%` }}><div><strong>{tilawahStats.dailyGoalPercent}%</strong><span>target hari ini</span></div></div><small>{tilawahStats.isGoalComplete ? 'Target harian tercapai.' : `Tinggal ${tilawahStats.remainingForToday} ayat lagi.`}</small></div>
        </section>
        <section className="tilawah-metric-grid" aria-label="Ringkasan statistik tilawah">
          <article className="tilawah-metric card-surface"><span className="tilawah-metric-icon"><BookOpen size={18} /></span><strong>{tilawahStats.completedVerseCount.toLocaleString('id-ID')}</strong><span>ayat unik ditandai dibaca</span><small>{tilawahStats.overallPercent}% dari seluruh Al-Qur’an</small></article>
          <article className="tilawah-metric card-surface"><span className="tilawah-metric-icon"><Flame size={18} /></span><strong>{tilawahStats.currentStreak} hari</strong><span>rentetan saat ini</span><small>Rekor terbaik {tilawahStats.bestStreak} hari</small></article>
          <article className="tilawah-metric card-surface"><span className="tilawah-metric-icon"><CalendarDays size={18} /></span><strong>{tilawahStats.activeDaysLast30}/30</strong><span>hari aktif dalam 30 hari</span><small>{tilawahStats.versesReadLast30.toLocaleString('id-ID')} ayat tercatat dalam periode ini</small></article>
          <article className="tilawah-metric card-surface"><span className="tilawah-metric-icon"><TrendingUp size={18} /></span><strong>{tilawahStats.versesReadLast7.toLocaleString('id-ID')}</strong><span>ayat tercatat pekan ini</span><small>Rata-rata {tilawahStats.averagePerActiveDay30} ayat per hari aktif (30 hari)</small></article>
        </section>
        <section className="section-block tilawah-panel">
          <div className="section-heading"><div><p className="eyebrow">KEBIASAAN MINGGU INI</p><h2>Aktivitas 7 hari</h2></div><span className="tiny-status"><CalendarDays size={13} /> {tilawahStats.activeDaysLast7} hari aktif</span></div>
          <div className="tilawah-week-chart" role="img" aria-label="Grafik jumlah ayat yang dibaca per hari selama tujuh hari terakhir">
            {tilawahStats.last7.map((day) => <div className={`tilawah-week-day ${day.isToday ? 'is-today' : ''}`} key={day.date} title={`${day.shortDate}: ${day.count} ayat`}><strong>{day.count ? day.count.toLocaleString('id-ID') : '—'}</strong><div className="tilawah-bar-track"><span style={{ height: `${day.count ? Math.max(8, Math.round((day.count / maxBar) * 100)) : 3}%` }} /></div><span>{day.label}</span><small>{day.shortDate}</small></div>)}
          </div>
          <div className="tilawah-recent-days"><h3>Rincian harian</h3>{[...tilawahStats.last7].reverse().map((day) => <div className={`tilawah-recent-day ${day.isToday ? 'is-today' : ''}`} key={day.date}><div><strong>{day.label}, {day.shortDate}</strong><small>{day.isToday ? 'Hari ini' : day.count > 0 ? 'Ada aktivitas tilawah' : 'Belum ada ayat tercatat'}</small></div><span>{day.count.toLocaleString('id-ID')} ayat</span></div>)}</div>
        </section>
        <section className="section-block tilawah-panel">
          <div className="section-heading"><div><p className="eyebrow">KONSISTENSI</p><h2>Kalender tilawah</h2></div><span className="tiny-status">30 hari terakhir</span></div>
          <div className="tilawah-calendar-legend"><span><i className="tilawah-calendar-dot level-0" /> Tidak ada catatan</span><span><i className="tilawah-calendar-dot level-1" /> 1–9 ayat</span><span><i className="tilawah-calendar-dot level-2" /> 10–29 ayat</span><span><i className="tilawah-calendar-dot level-3" /> 30+ ayat</span></div>
          <div className="tilawah-calendar-grid" role="group" aria-label="Kalender aktivitas tilawah 30 hari terakhir">
            {tilawahStats.last30.map((day) => { const level = day.count >= 30 ? 3 : day.count >= 10 ? 2 : day.count >= 1 ? 1 : 0; return <div className={`tilawah-calendar-cell level-${level} ${day.isToday ? 'is-today' : ''}`} key={day.date} title={`${day.label}: ${day.count} ayat`} aria-label={`${day.label}: ${day.count} ayat`}><span>{Number(day.date.slice(-2))}</span></div>; })}
          </div>
          <p className="tilawah-stats-note"><Info size={14} /> Kalender memperlihatkan aktivitas yang tercatat di perangkat ini. Data harian dipertahankan sampai 90 tanggal terakhir dan tidak disinkronkan ke server.</p>
        </section>
        <section className="section-block tilawah-panel">
          <div className="section-heading"><div><p className="eyebrow">TARGET PRIBADI</p><h2>Atur target harian</h2></div><span className="tiny-status"><Target size={13} /> {dailyVerseGoal} ayat/hari</span></div>
          <div className="daily-goal-settings card-surface">
            <p>Pilih jumlah ayat yang ingin kamu baca setiap hari. Target ini terpisah dari rencana khatam 30, 60, atau 90 hari.</p>
            <div className="goal-options daily-goal-preset-options" role="group" aria-label="Pilih preset target harian">{DAILY_VERSE_GOAL_OPTIONS.map((goal) => <button key={goal} type="button" className={dailyVerseGoal === goal ? 'active' : ''} aria-pressed={dailyVerseGoal === goal} onClick={() => { setDailyVerseGoal(goal); setDailyGoalDraft(String(goal)); showToast(`Target harian disimpan: ${goal} ayat.`); }}>{goal} ayat</button>)}</div>
            <form className="daily-goal-custom-form" onSubmit={saveDailyGoal}><label htmlFor="daily-verse-goal-custom">Target khusus (1–200 ayat)</label><div><input id="daily-verse-goal-custom" type="number" min="1" max="200" step="1" inputMode="numeric" value={dailyGoalDraft} onChange={(event) => setDailyGoalDraft(event.target.value)} required /><button type="submit" className="button button-gold"><Check size={15} /> Simpan target</button></div></form>
            <div className="daily-goal-current-progress"><div className="daily-target-heading"><div><strong>{todayReadCount.toLocaleString('id-ID')} / {dailyVerseGoal.toLocaleString('id-ID')} ayat</strong><small>{tilawahStats.isGoalComplete ? 'Alhamdulillah, target hari ini sudah tercapai.' : `Sisa ${tilawahStats.remainingForToday} ayat untuk mencapai target.`}</small></div><span>{tilawahStats.dailyGoalPercent}%</span></div><div className="progress-track progress-track-daily" role="progressbar" aria-label="Capaian target pribadi harian" aria-valuemin={0} aria-valuemax={100} aria-valuenow={tilawahStats.dailyGoalPercent}><span style={{ width: `${tilawahStats.dailyGoalPercent}%` }} /></div></div>
          </div>
        </section>
        <section className="section-block tilawah-panel">
          <div className="section-heading"><div><p className="eyebrow">RENCANA KHATAM</p><h2>Perkiraan perjalanan</h2></div><span className="tiny-status"><Target size={13} /> {khatamDays} hari</span></div>
          <div className="daily-goal-settings card-surface"><p>Jika dibagi rata, target khatam {khatamDays} hari memerlukan sekitar <strong>{dailyVerseTarget.toLocaleString('id-ID')} ayat per hari</strong>. Target pribadi tetap dapat berbeda sesuai waktu dan kemampuanmu.</p><div className="goal-options" role="group" aria-label="Pilih rencana khatam">{KHATAM_OPTIONS.map((days) => <button key={days} type="button" className={khatamDays === days ? 'active' : ''} aria-pressed={khatamDays === days} onClick={() => setKhatamDays(days)}>{days} hari</button>)}</div><div className="tilawah-estimate-row"><span>Sisa ayat yang belum ditandai</span><strong>{tilawahStats.remainingVerses.toLocaleString('id-ID')}</strong></div><div className="tilawah-estimate-row"><span>Estimasi hari jika mengikuti target pribadi</span><strong>{tilawahStats.estimatedDaysToFinish.toLocaleString('id-ID')} hari</strong></div><p className="tilawah-stats-note"><Info size={14} /> Estimasi berdasarkan jumlah ayat unik yang ditandai dibaca. Ini bukan perkiraan durasi membaca dan bukan penilaian kualitas ibadah.</p></div>
        </section>
        <div className="tilawah-stats-footer"><ShieldCheck size={16} /><span>Statistik dihitung dari ayat yang terlihat saat pembaca mencatat bacaan. Data disimpan lokal di browser/perangkat ini; tidak ada pengukuran durasi membaca.</span></div>
        <button type="button" className="text-link tilawah-back-home" onClick={() => { setSelectedSurah(null); setActiveDuaSlug(null); setActiveTab('home'); }}><ChevronLeft size={16} /> Kembali ke beranda</button>
      </div>
    );
  };

  const renderSearch = () => {
    const visibleResults = searchResults.slice(0, searchVisibleCount);
    const hasQuery = searchQuery.trim().length >= 2;
    return (
      <div className="page-stack quran-search-page">
        <section className="page-title-row"><div><p className="eyebrow">TEMUKAN AYAT</p><h1>Pencarian Al-Qur’an</h1><p className="muted">Cari berdasarkan teks Arab, terjemahan Indonesia, atau transliterasi Latin.</p></div><div className="page-title-icon quran-search-title-icon"><Search size={24} /></div></section>
        <section className="quran-search-panel card-surface">
          <form className="quran-search-form search-box" onSubmit={(event) => { event.preventDefault(); setSearchQuery((value) => value.trim()); setSearchRetryCount((count) => count + 1); setSearchVisibleCount(20); }}>
            <Search size={19} aria-hidden="true" />
            <input type="search" value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setSearchVisibleCount(20); }} placeholder="Contoh: sabar, bismillah, الرَّحْمَٰن…" aria-label="Cari teks ayat Al-Qur’an" autoComplete="off" />
            {searchQuery && <button type="button" aria-label="Hapus kata pencarian" onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchStatus('idle'); setSearchError(''); }}><X size={16} /></button>}
            <button type="submit" className="quran-search-submit" aria-label="Cari ayat"><ArrowRight size={17} /></button>
          </form>
          <div className="filter-chips quran-search-modes" role="group" aria-label="Pilih bahasa pencarian">
            {Object.entries(QURAN_SEARCH_MODES).map(([value, option]) => <button type="button" key={value} className={`filter-chip ${searchMode === value ? 'active' : ''}`} aria-pressed={searchMode === value} onClick={() => { setSearchMode(value); setSearchVisibleCount(20); }}>{option.label}</button>)}
          </div>
          <div className="quran-search-filter-row"><label htmlFor="quran-search-surah">Batasi ke surah</label><select id="quran-search-surah" value={searchSurahFilter} onChange={(event) => { setSearchSurahFilter(event.target.value); setSearchVisibleCount(20); }}><option value="all">Semua surah</option>{fallbackSurahs.map((surah) => <option value={String(surah.nomor)} key={surah.nomor}>{surah.nomor}. {surah.namaLatin}</option>)}</select></div>
          <div className="quran-search-suggestions"><span>Coba kata kunci:</span>{['sabar', 'rahmat', 'Bismi Allahi', 'الرَّحْمَٰن'].map((term) => <button type="button" key={term} onClick={() => { setSearchQuery(term); setSearchRetryCount((count) => count + 1); setSearchVisibleCount(20); }}>{term}</button>)}</div>
        </section>

        <div className="quran-search-status-row" aria-live="polite">
          <span>{searchStatus === 'loading' ? <><LoaderCircle size={14} className="spin" /> Sedang mencari ayat…</> : searchStatus === 'success' ? `${searchResults.length} hasil${searchOfflineResults ? ' · data lokal' : ''}` : searchStatus === 'error' ? 'Pencarian belum berhasil' : hasQuery ? 'Siap mencari' : 'Masukkan kata kunci untuk memulai'}</span>
          {searchStatus === 'success' && searchResults.length > 0 && <span>Diurutkan berdasarkan surah dan ayat</span>}
        </div>
        {searchError && <div className={`inline-notice quran-search-notice ${searchOfflineResults ? 'is-offline' : ''}`}><Info size={16} /><span>{searchError}</span>{searchStatus === 'error' && <button type="button" onClick={() => setSearchRetryCount((count) => count + 1)}><RefreshCw size={14} /> Coba lagi</button>}</div>}
        {searchStatus === 'idle' && <div className="empty-state card-surface"><div className="empty-icon"><Search size={22} /></div><strong>Temukan ayat yang kamu cari</strong><p>Masukkan minimal dua karakter. Pilih jenis pencarian agar hasil lebih sesuai dengan kata kunci.</p></div>}
        {searchStatus === 'loading' && <div className="quran-search-loading card-surface"><LoaderCircle className="spin" size={22} /><span>Mencari pada teks Arab, terjemahan, dan transliterasi…</span></div>}
        {searchStatus === 'success' && searchResults.length === 0 && <div className="empty-state card-surface"><div className="empty-icon"><Search size={22} /></div><strong>Ayat belum ditemukan</strong><p>Coba kata lain, periksa ejaan, atau ganti jenis pencarian.</p><button type="button" className="button button-secondary" onClick={() => { setSearchMode('all'); setSearchSurahFilter('all'); }}>Hapus filter</button></div>}
        {searchStatus === 'success' && visibleResults.length > 0 && <div className="quran-search-results">
          {visibleResults.map((result) => {
            const bookmarkKey = `${result.surahNumber}:${result.verseNumber}`;
            const isBookmarked = bookmarkedVerses.includes(bookmarkKey);
            return <article className="quran-search-result card-surface" key={result.key}>
              <div className="quran-search-result-top"><span className="quran-search-result-number">{result.surahNumber}:{result.verseNumber}</span><div className="quran-search-result-reference"><strong>{result.surahName}</strong><span>{result.surahArabicName}</span></div><button type="button" className={`icon-button small ${isBookmarked ? 'is-saved' : ''}`} aria-label={isBookmarked ? 'Hapus bookmark ayat' : 'Simpan bookmark ayat'} title={isBookmarked ? 'Hapus bookmark' : 'Simpan bookmark'} onClick={() => toggleVerseBookmark(result.verseNumber, result.surahNumber)}><Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} /></button></div>
              <div className="quran-search-match-list">{result.matches.map((match) => <div className={`quran-search-match quran-search-match-${match.field}`} key={`${result.key}:${match.field}`}><span>{QURAN_SEARCH_FIELD_LABELS[match.field] || match.label}</span><p dir={match.field === 'arabic' ? 'rtl' : 'auto'} lang={match.field === 'arabic' ? 'ar' : 'id'}>{match.text}</p></div>)}</div>
              <div className="quran-search-result-actions"><button type="button" className="button button-gold" onClick={() => void openSurah(result.surahNumber, result.verseNumber)}><BookOpen size={15} /> Buka ayat <ArrowRight size={14} /></button><button type="button" className="button button-secondary" onClick={() => void shareSearchResult(result)}><Share2 size={15} /> Bagikan</button></div>
            </article>;
          })}
          {searchVisibleCount < searchResults.length && <button type="button" className="button button-secondary quran-search-more" onClick={() => setSearchVisibleCount((count) => count + 20)}>Tampilkan hasil berikutnya ({Math.min(20, searchResults.length - searchVisibleCount)}) <ChevronDown size={15} /></button>}
        </div>}
        <p className="source-note"><ShieldCheck size={15} /> Pencarian daring memakai teks Arab, terjemahan Bahasa Indonesia, dan transliterasi dari AlQuran.cloud. Saat offline, pencarian hanya mencakup ayat yang telah tersimpan pada perangkat ini.</p>
      </div>
    );
  };

  const renderSurahList = () => (
    <div className="page-stack quran-list-page">
      <section className="page-title-row"><div><p className="eyebrow">KITAB SUCI UMAT ISLAM</p><h1>Al-Qur’an</h1><p className="muted">Baca dan pahami ayat demi ayat.</p></div><div className="quran-list-heading-actions"><button type="button" className="button button-secondary quran-search-shortcut" onClick={() => setActiveTab('search')}><Search size={15} /> Cari ayat</button><div className="quran-count-pill"><BookOpen size={16} /><strong>114</strong><span>Surah</span></div></div></section>
      <div className="quran-search search-box"><Search size={18} /><input value={surahQuery} onChange={(event) => setSurahQuery(event.target.value)} placeholder="Cari nama surah, arti, atau nomor…" aria-label="Cari surah" />{surahQuery && <button aria-label="Hapus pencarian" onClick={() => setSurahQuery('')}><X size={16} /></button>}</div>
      <div className="filter-chips" role="group" aria-label="Filter surah">
        {[['all','Semua'],['mekah','Makkiyah'],['madinah','Madaniyah'],['bookmarked','Bookmark'],['offline','Offline']].map(([value,label]) => <button key={value} className={`filter-chip ${surahFilter === value ? 'active' : ''}`} onClick={() => setSurahFilter(value)}>{value === 'bookmarked' && <Bookmark size={13} />}{value === 'offline' && <Download size={13} />}{label}{value === 'bookmarked' && bookmarkedSurahs.length > 0 ? ` (${bookmarkedSurahs.length})` : ''}{value === 'offline' && offlineSurahs.length > 0 ? ` (${offlineSurahs.length})` : ''}</button>)}
      </div>
      <div className="results-caption"><span>{surahLoading ? 'Memperbarui daftar…' : `${filteredSurahs.length} surah ditemukan`}</span><span><ListFilter size={14} /> Urut sesuai mushaf</span></div>
      <div className="surah-grid">
        {filteredSurahs.map((surah) => <article className="surah-card card-surface" key={surah.nomor}>
          <a className="surah-main" href={getSurahPath(surah)} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); void openSurah(surah, 1); }} aria-label={`Baca ${surah.namaLatin}`}>
            <span className="surah-number"><span>{surah.nomor}</span></span>
            <span className="surah-copy"><strong>{surah.namaLatin}</strong><span>{surah.arti || 'Al-Qur’an'} · {surah.jumlahAyat || '—'} ayat</span><small>{String(surah.tempatTurun || 'Al-Qur’an').replace('Mekah','Makkiyah').replace('Madinah','Madaniyah')}</small></span>
            <span className="surah-arabic" dir="rtl">{surah.nama || ''}</span>
          </a>
          <button className={`surah-bookmark ${bookmarkedSurahs.includes(Number(surah.nomor)) ? 'saved' : ''}`} aria-label={bookmarkedSurahs.includes(Number(surah.nomor)) ? 'Hapus bookmark surah' : 'Simpan bookmark surah'} onClick={() => toggleSurahBookmark(Number(surah.nomor))}><Bookmark size={16} fill={bookmarkedSurahs.includes(Number(surah.nomor)) ? 'currentColor' : 'none'} /></button>
        </article>)}
      </div>
      {!filteredSurahs.length && <div className="empty-state card-surface"><div className="empty-icon"><Search size={22} /></div><strong>Surah tidak ditemukan</strong><p>Coba nama lain, arti surah, atau hapus filter yang aktif.</p><button className="button button-secondary" onClick={() => { setSurahQuery(''); setSurahFilter('all'); }}>Reset pencarian</button></div>}
      <p className="source-note"><ShieldCheck size={15} /> Data teks dan terjemahan dimuat dari EQuran.id. Daftar ringkas tetap dapat ditampilkan saat offline.</p>
    </div>
  );

  const currentFullAudioSrc = selectedSurahWithAudio ? chooseAudio(selectedSurahWithAudio.audioFull, qariIndex) : '';
  const currentAudioTrackSaved = Boolean(currentFullAudioSrc && offlineAudioStats.cachedSrcs.includes(currentFullAudioSrc));
  const currentAudioDownloadProgress = audioDownloadProgress?.surahId === Number(selectedSurah?.nomor) && audioDownloadProgress?.trackType !== 'verse' ? audioDownloadProgress : null;
  const currentAudioDownloadPercent = currentAudioDownloadProgress?.total
    ? Math.min(100, Math.round((currentAudioDownloadProgress.loaded / currentAudioDownloadProgress.total) * 100))
    : null;

  const renderReader = () => (
    <div className="reader-page">
      <div className="reader-topbar"><button className="back-button" onClick={() => { setSelectedSurah(null); setActiveTab('quran'); }}><ChevronLeft size={19} /> <span>Daftar surah</span></button><button className={`icon-button ${bookmarkedSurahs.includes(Number(selectedSurah?.nomor)) ? 'is-saved' : ''}`} aria-label="Bookmark surah" onClick={() => toggleSurahBookmark(Number(selectedSurah?.nomor))}><Bookmark size={18} fill={bookmarkedSurahs.includes(Number(selectedSurah?.nomor)) ? 'currentColor' : 'none'} /></button></div>
      <section className="reader-surah-hero">
        <div className="reader-surah-heading"><div><p className="eyebrow">SURAH KE-{selectedSurah?.nomor || '—'}</p><h1>{selectedSurah?.namaLatin}</h1><p>{selectedSurah?.arti} <span>·</span> {selectedSurah?.tempatTurun || 'Al-Qur’an'} <span>·</span> {selectedSurah?.jumlahAyat || verses.length} ayat</p></div><div className="reader-surah-arabic" dir="rtl">{selectedSurah?.nama || ''}</div></div>
        <div className="bismillah" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <div className="reader-actions"><button className="button button-gold" onClick={playFullSurah}><Play size={16} fill="currentColor" /> Putar satu surah</button><button className="button button-glass" onClick={() => openTafsir()}><BookOpen size={16} /> Tafsir</button><button className={`button button-glass ${currentAudioTrackSaved ? 'selected' : ''}`} onClick={downloadCurrentSurahAudio} disabled={!online || Boolean(audioDownloadProgress) || currentAudioTrackSaved} title={!online ? 'Sambungkan internet untuk mengunduh' : audioDownloadProgress ? 'Tunggu unduhan audio yang sedang berjalan selesai' : currentAudioTrackSaved ? 'Audio qari ini sudah disimpan di perangkat' : !currentFullAudioSrc ? 'Sumber audio belum termuat; klik untuk melihat petunjuk' : 'Unduh audio qari yang dipilih untuk didengarkan offline'}>{currentAudioDownloadProgress ? <><LoaderCircle size={15} className="spin" /> {currentAudioDownloadPercent === null ? formatStorageBytes(currentAudioDownloadProgress.loaded) : `${currentAudioDownloadPercent}%`}</> : currentAudioTrackSaved ? <><Check size={15} /> Audio tersimpan</> : <><Headphones size={15} /> Unduh audio</>}</button><button className={`button button-glass ${offlineSurahs.includes(Number(selectedSurah?.nomor)) ? 'selected' : ''}`} onClick={saveCurrentSurahOffline} disabled={!verses.length || offlineSurahs.includes(Number(selectedSurah?.nomor))}>{offlineSurahs.includes(Number(selectedSurah?.nomor)) ? <Check size={16} /> : <Download size={16} />} {offlineSurahs.includes(Number(selectedSurah?.nomor)) ? 'Tersimpan offline' : 'Simpan offline'}</button><button className={`button button-glass ${readerSettingsOpen ? 'selected' : ''}`} onClick={() => setReaderSettingsOpen((value) => !value)}><SlidersHorizontal size={16} /> Tampilan</button></div>
        {currentAudioDownloadProgress && <div className="audio-download-progress" role="status"><div className="audio-download-progress-copy"><span>Mengunduh audio {currentAudioDownloadProgress.title}</span><strong>{currentAudioDownloadPercent === null ? formatStorageBytes(currentAudioDownloadProgress.loaded) : `${currentAudioDownloadPercent}%`}</strong></div><div className="audio-download-progress-track"><span style={{ width: `${currentAudioDownloadPercent ?? 8}%` }} /></div><small>Jangan tutup halaman sampai unduhan selesai.</small></div>}
      </section>
      <details className="tajweed-guide-card">
        <summary>
          <span className="tajweed-guide-summary-icon"><Palette size={18} /></span>
          <span className="tajweed-guide-summary-copy"><strong>Panduan warna tajwid</strong><small>Kenali jenis hukum dan cara membacanya</small></span>
          <span className="tajweed-guide-count">{TAJWEED_RULES.length} penanda</span>
          <ChevronDown size={17} className="tajweed-guide-chevron" />
        </summary>
        <div className="tajweed-guide-content">
          <p className="tajweed-guide-intro">Tabel ini tersedia di setiap surah, baik mode warna tajwid aktif maupun tidak. Warna mengikuti anotasi edisi <em>quran-tajweed</em> dari AlQuran.cloud; mushaf lain dapat memakai sistem warna berbeda.</p>
          <div className="tajweed-guide-table-scroll" role="region" aria-label={`Tabel panduan tajwid Surah ${selectedSurah?.namaLatin || ''}`} tabIndex="0">
            <table className="tajweed-guide-table">
              <caption>Warna, jenis hukum tajwid, ciri, dan cara membaca</caption>
              <thead><tr><th scope="col">Warna</th><th scope="col">Jenis / hukum</th><th scope="col">Ciri</th><th scope="col">Cara membaca</th></tr></thead>
              <tbody>{TAJWEED_RULES.map((rule) => <tr key={rule.code}>
                <td data-label="Warna"><span className={`tajweed-guide-color tajweed-token tajweed-${rule.code}`} aria-hidden="true">●</span><span className="tajweed-guide-color-name">{rule.colorName}</span></td>
                <td data-label="Jenis / hukum"><strong>{rule.label}</strong>{rule.arabicName && <small className="tajweed-guide-arabic" lang="ar" dir="rtl">{rule.arabicName}</small>}</td>
                <td data-label="Ciri">{rule.recognition}</td>
                <td data-label="Cara membaca">{rule.reading}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <p className="tajweed-guide-footnote">Keterangan merupakan ringkasan belajar. Untuk pasangan huruf atau variasi panjang bacaan yang bergantung pada riwayat, ikuti mushaf dan guru yang Anda gunakan. <a href="https://alquran.cloud/tajweed-guide" target="_blank" rel="noreferrer">Lihat referensi warna tajwid</a>.</p>
        </div>
      </details>
      {readerSettingsOpen && <section className="reader-settings card-surface">
        <div className="settings-panel-heading"><div><strong>Pengaturan bacaan</strong><span>Atur sesuai kenyamananmu</span></div><button className="icon-button small" onClick={() => setReaderSettingsOpen(false)} aria-label="Tutup pengaturan"><X size={17} /></button></div>
        <div className="visibility-toggles">
          <label className="toggle-setting"><span><strong>Teks Arab</strong><small>Ayat Uthmani</small></span><input type="checkbox" checked={arabicVisible} onChange={(event) => setArabicVisible(event.target.checked)} /><span className="toggle-ui" /></label>
          <label className="toggle-setting"><span><strong>Latin</strong><small>Transliterasi</small></span><input type="checkbox" checked={latinVisible} onChange={(event) => setLatinVisible(event.target.checked)} /><span className="toggle-ui" /></label>
          <label className="toggle-setting"><span><strong>Terjemahan</strong><small>Bahasa Indonesia</small></span><input type="checkbox" checked={translationVisible} onChange={(event) => setTranslationVisible(event.target.checked)} /><span className="toggle-ui" /></label>
        </div>
        <label className="toggle-setting tajweed-mode-setting"><span><strong><Palette size={14} /> Warna tajwid</strong><small>Penanda dari edisi quran-tajweed</small></span><input type="checkbox" checked={tajweedEnabled} onChange={(event) => { const enabled = event.target.checked; setTajweedEnabled(enabled); if (!enabled) { setTajweedLearningMode(false); setSelectedTajweedLesson(null); setTajweedErrorSurah(null); setTajweedLoadingSurah(null); } }} /><span className="toggle-ui" /></label>
        <label className="toggle-setting tajweed-mode-setting"><span><strong><BookOpen size={14} /> Mode belajar tajwid</strong><small>Ketuk bagian berwarna untuk melihat ciri hukum dan cara membacanya</small></span><input type="checkbox" checked={tajweedLearningMode} onChange={(event) => { const enabled = event.target.checked; setTajweedLearningMode(enabled); if (enabled) setTajweedEnabled(true); else setSelectedTajweedLesson(null); }} /><span className="toggle-ui" /></label>
        {tajweedLearningMode && <p className="tajweed-learning-hint"><Info size={14} /> Setelah warna tajwid dimuat, ketuk salah satu huruf berwarna pada ayat. Penjelasan akan muncul tepat di bawah ayat tersebut.</p>}
        {tajweedEnabled && <div className="tajweed-mode-info" role="status">
          {tajweedLoadingSurah === Number(selectedSurah?.nomor) && <><LoaderCircle size={14} className="spin" /> Memuat penanda tajwid untuk surah ini. Teks standar tetap ditampilkan selama proses berlangsung.</>}
          {tajweedErrorSurah === Number(selectedSurah?.nomor) && <><Info size={14} /> Data warna tajwid belum berhasil dimuat. Teks standar tetap tersedia. <button type="button" onClick={() => { setTajweedErrorSurah(null); setTajweedCache((current) => ({ ...current })); }}>Coba lagi</button></>}
          {tajweedCache[Number(selectedSurah?.nomor)]?.ayahs?.length > 0 && <><Check size={14} /> Warna tajwid aktif untuk {selectedSurah?.namaLatin}.<span className="tajweed-source-inline">Sumber: <a href="https://alquran.cloud/tajweed-guide" target="_blank" rel="noreferrer">AlQuran.cloud / Islamic Network</a>.</span></>}
          {!online && tajweedLoadingSurah !== Number(selectedSurah?.nomor) && !tajweedCache[Number(selectedSurah?.nomor)]?.ayahs?.length && tajweedErrorSurah !== Number(selectedSurah?.nomor) && <><WifiOff size={14} /> Data tajwid surah ini belum tersimpan di perangkat.</>}
        </div>}
        {tajweedEnabled && <p className="tajweed-legend-hint"><Info size={13} /> Rincian arti setiap warna, jenis hukum, dan cara membaca tersedia di menu <strong>Panduan warna tajwid</strong> pada bagian atas halaman surah.</p>}
        <div className="font-settings-row"><div><div className="range-label"><span>Ukuran teks Arab</span><strong>{arabicSize}px</strong></div><input type="range" min="20" max="52" value={arabicSize} onChange={(event) => setArabicSize(Number(event.target.value))} aria-label="Ukuran teks Arab" /></div><div><div className="range-label"><span>Ukuran teks Latin</span><strong>{latinSize}px</strong></div><input type="range" min="12" max="30" value={latinSize} onChange={(event) => setLatinSize(Number(event.target.value))} aria-label="Ukuran teks Latin" /></div><div><div className="range-label"><span>Ukuran terjemahan</span><strong>{translationSize}px</strong></div><input type="range" min="12" max="24" value={translationSize} onChange={(event) => setTranslationSize(Number(event.target.value))} aria-label="Ukuran terjemahan" /></div></div>
        <button className="text-link reset-reader" onClick={resetReaderSettings}>Kembalikan pengaturan awal <RefreshCw size={14} /></button>
      </section>}
      <div className="reader-tool-row">
        <div className="reciter-control"><Headphones size={16} /><select value={qariIndex} onChange={(event) => setQariIndex(Number(event.target.value))} aria-label="Pilih qari">{QARIS.map((qari, index) => <option value={index} key={qari}>{qari}</option>)}</select><ChevronDown size={15} /></div>
        <label className="repeat-control"><Repeat size={16} /><span>Ulang ayat</span><select value={audioRepeat} onChange={(event) => { setAudioRepeat(event.target.value); repeatCountRef.current = 0; }} aria-label="Atur pengulangan ayat">{AUDIO_REPEAT_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
        <label className="speed-control"><Gauge size={16} /><span>Kecepatan</span><select value={audioSpeed} onChange={(event) => setAudioSpeed(Number(event.target.value))} aria-label="Atur kecepatan audio murottal">{AUDIO_SPEED_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
        <form className="jump-form" onSubmit={(event) => { event.preventDefault(); const n = Math.min(Math.max(Number(jumpVerse) || 1, 1), verses.length || Number(selectedSurah?.jumlahAyat) || 1); pendingJumpRef.current = n; document.getElementById(`verse-${selectedSurah?.nomor}-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}><label htmlFor="jump-verse">Ayat</label><input id="jump-verse" type="number" min="1" max={selectedSurah?.jumlahAyat || 999} value={jumpVerse} onChange={(event) => setJumpVerse(event.target.value)} /><button type="submit" aria-label="Lompat ke ayat"><ArrowRight size={16} /></button></form>
      </div>
      {verses.length > 0 && <p className="verse-audio-download-tip"><Download size={14} /><span><strong>Mode hemat penyimpanan:</strong> gunakan tombol <strong>Unduh audio ayat</strong> yang terlihat pada setiap kartu untuk menyimpan satu ayat saja. Tombol <strong>Unduh audio</strong> di atas menyimpan satu surah penuh.</span></p>}
      {verseLoading && !verses.length && <div className="verse-skeletons">{[0,1,2].map((item) => <div className="verse-skeleton card-surface" key={item}><div /><div /><div /></div>)}</div>}
      {!verseLoading && !verses.length && <div className="empty-state card-surface"><div className="empty-icon"><WifiOff size={22} /></div><strong>Ayat belum tersedia offline</strong><p>Hubungkan perangkat ke internet untuk memuat surah ini sekali. Data yang berhasil dibuka akan disimpan di perangkat.</p><button className="button button-secondary" onClick={() => openSurah(selectedSurah, Number(jumpVerse) || 1)}><RefreshCw size={16} /> Coba lagi</button></div>}
      <div className="verses-list">
        {verses.map((verse, index) => {
          const verseKey = `${selectedSurah?.nomor}:${verse.nomorAyat}`;
          const tajweedVerseText = tajweedCache[Number(selectedSurah?.nomor)]?.ayahs?.find((row) => Number(row.numberInSurah) === Number(verse.nomorAyat))?.text || '';
          const selectedLessonMatchesVerse = tajweedLearningMode
            && Number(selectedTajweedLesson?.surahNumber) === Number(selectedSurah?.nomor)
            && Number(selectedTajweedLesson?.verseNumber) === Number(verse.nomorAyat);
          const selectedTajweedRule = selectedLessonMatchesVerse
            ? TAJWEED_RULES.find((rule) => rule.code === selectedTajweedLesson?.code) || null
            : null;
          const activeReciterId = QARI_IDS[qariIndex] || '05';
          const savedVerseTrack = offlineAudioTracks.find((track) => Number(track.surahId) === Number(selectedSurah?.nomor)
            && track.type === 'verse'
            && Number(track.verseNumber) === Number(verse.nomorAyat)
            && track.reciterId === activeReciterId);
          const verseAudioSrc = chooseAudio(verse.audio, qariIndex) || savedVerseTrack?.src || '';
          const verseAudioSaved = Boolean(verseAudioSrc && offlineAudioStats.cachedSrcs.includes(verseAudioSrc));
          const verseAudioDownloading = audioDownloadProgress?.trackType === 'verse'
            && Number(audioDownloadProgress.surahId) === Number(selectedSurah?.nomor)
            && Number(audioDownloadProgress.verseNumber) === Number(verse.nomorAyat)
            && audioDownloadProgress.reciterId === (QARI_IDS[qariIndex] || '05');
          const isPlayingVerse = audioInfo?.trackType === 'verse' && audioInfo?.surahNumber === selectedSurah?.nomor && Number(audioInfo?.verseIndex) === index;
          const isSharedVerseTarget = Number(selectedSurah?.nomor) === safeInitialSurahNumber
            && Number(sharedVerseTarget) === Number(verse.nomorAyat);
          return <article id={`verse-${selectedSurah?.nomor}-${verse.nomorAyat}`} className={`verse-card card-surface ${isPlayingVerse ? 'is-playing' : ''} ${isSharedVerseTarget ? 'is-shared-target' : ''}`} key={`${selectedSurah?.nomor}-${verse.nomorAyat}`}>
            <div className="verse-card-top"><div className="verse-number"><span>{verse.nomorAyat}</span></div><div className="verse-meta"><span>{selectedSurah?.namaLatin} · Ayat {verse.nomorAyat}</span>{isPlayingVerse && <span className="now-playing"><AudioLines size={13} /> Sedang diputar</span>}</div><div className="verse-quick-actions"><button className="icon-button small" aria-label="Putar ayat" title="Putar ayat" onClick={() => void playVerse(verse, index)}>{isPlayingVerse && audioPlaying ? <AudioLines size={16} /> : <Play size={16} />}</button><button className={`icon-button small ${bookmarkedVerses.includes(verseKey) ? 'is-saved' : ''}`} aria-label="Bookmark ayat" onClick={() => toggleVerseBookmark(verse.nomorAyat)}><Bookmark size={16} fill={bookmarkedVerses.includes(verseKey) ? 'currentColor' : 'none'} /></button><button className="icon-button small" aria-label="Salin teks ayat" title="Salin teks ayat" onClick={() => copyVerse(verse)}><Copy size={15} /></button><button className={`icon-button small ${verseNotes[verseKey] ? 'has-verse-note' : ''}`} aria-label={verseNotes[verseKey] ? "Edit catatan tadabbur" : "Tambah catatan tadabbur"} title={verseNotes[verseKey] ? "Edit catatan tadabbur" : "Tambah catatan tadabbur"} onClick={() => openVerseNoteEditor(selectedSurah, verse)}><PencilLine size={15} /></button><button className="icon-button small" aria-label="Bagikan ayat" title="Bagikan ayat" onClick={() => shareVerse(verse)}><Share2 size={15} /></button><button className="icon-button small tafsir-action" aria-label="Buka tafsir ayat" title="Buka tafsir ayat" onClick={() => openTafsir(verse)}><MoreHorizontal size={17} /></button></div></div>
            {arabicVisible && <p className={`verse-arabic ${tajweedEnabled && tajweedVerseText ? 'has-tajweed-colors' : ''}`} dir="rtl" lang="ar" style={{ fontSize: `${arabicSize}px` }}>{tajweedEnabled && tajweedVerseText ? <TajweedArabicText
              text={tajweedVerseText}
              interactive={tajweedLearningMode}
              selectedRuleCode={selectedLessonMatchesVerse ? selectedTajweedLesson?.code : null}
              selectedExcerpt={selectedLessonMatchesVerse ? selectedTajweedLesson?.excerpt : ''}
              onRuleSelect={({ rule, excerpt }) => setSelectedTajweedLesson({ surahNumber: Number(selectedSurah?.nomor), verseNumber: Number(verse.nomorAyat), code: rule.code, excerpt })}
            /> : (cleanArabicText(verse.teksArab) || '—')}</p>}
            {selectedTajweedRule && <section className="tajweed-lesson-card" aria-live="polite" aria-label={`Penjelasan ${selectedTajweedRule.label}`}>
              <div className="tajweed-lesson-heading">
                <span className={`tajweed-lesson-swatch tajweed-token tajweed-${selectedTajweedRule.code}`} aria-hidden="true">●</span>
                <div className="tajweed-lesson-title"><small>MODE BELAJAR · {selectedSurah?.namaLatin} AYAT {verse.nomorAyat}</small><h3>{selectedTajweedRule.label}</h3>{selectedTajweedRule.arabicName && <span lang="ar" dir="rtl">{selectedTajweedRule.arabicName}</span>}</div>
                <button type="button" className="icon-button small tajweed-lesson-close" onClick={() => setSelectedTajweedLesson(null)} aria-label="Tutup penjelasan tajwid"><X size={16} /></button>
              </div>
              <div className="tajweed-lesson-example"><span>Contoh yang disentuh</span><strong lang="ar" dir="rtl">{selectedTajweedLesson.excerpt}</strong></div>
              <div className="tajweed-lesson-details"><div><strong>Ciri pengenalan</strong><p>{selectedTajweedRule.recognition}</p></div><div><strong>Cara membaca</strong><p>{selectedTajweedRule.reading}</p></div></div>
              <p className="tajweed-lesson-note">Ringkasan ini mengikuti penanda edisi quran-tajweed yang digunakan Nurani. Untuk variasi yang bergantung pada riwayat, ikuti mushaf dan guru yang Anda gunakan.</p>
            </section>}
            {latinVisible && verse.teksLatin && <p className="verse-latin" style={{ fontSize: `${latinSize}px` }}>{verse.teksLatin}</p>}
            {translationVisible && verse.teksIndonesia && <p className="verse-translation" style={{ fontSize: `${translationSize}px` }}>{verse.teksIndonesia}</p>}
            {!arabicVisible && !latinVisible && !translationVisible && <div className="hifz-hidden-note"><EyeOffIcon /> Mode hafalan aktif — semua teks disembunyikan.</div>}
            <div className="verse-download-row">
              <button
                type="button"
                className={`button button-secondary verse-download-button ${verseAudioSaved ? 'selected' : ''}`}
                aria-label={verseAudioSaved ? `Audio ${selectedSurah?.namaLatin} ayat ${verse.nomorAyat} tersimpan offline` : `Unduh audio ${selectedSurah?.namaLatin} ayat ${verse.nomorAyat}`}
                title={verseAudioSaved ? 'Audio ayat tersedia offline untuk qari terpilih' : !online ? 'Sambungkan internet untuk mengunduh audio ayat' : !verseAudioSrc ? 'Klik untuk memuat ulang sumber audio ayat lalu mengunduhnya' : 'Simpan audio ayat ini saja untuk menghemat penyimpanan'}
                onClick={() => void downloadVerseAudio(verse)}
                disabled={!online || verseAudioSaved || Boolean(audioDownloadProgress)}
              >
                {verseAudioDownloading ? <LoaderCircle size={15} className="spin" /> : verseAudioSaved ? <Check size={15} /> : !online ? <WifiOff size={15} /> : audioDownloadProgress ? <LoaderCircle size={15} className="spin" /> : <Download size={15} />}
                {verseAudioSaved ? 'Audio ayat tersimpan' : verseAudioDownloading ? 'Mengunduh ayat…' : !online ? 'Butuh internet untuk unduh' : audioDownloadProgress ? 'Tunggu unduhan selesai' : 'Unduh audio ayat'}
              </button>
              <small className="verse-download-caption">{verseAudioSaved ? `Tersimpan untuk ${QARIS[qariIndex]}` : 'Hanya file ayat ini yang disimpan.'}</small>
            </div>
            {translationVisible && verse.teksIndonesia && <button className="text-link verse-tafsir-link" onClick={() => openTafsir(verse)}>Baca tafsir ayat <ArrowRight size={14} /></button>}
            {verseNotes[verseKey] && editingVerseNote?.key !== verseKey && <div className="verse-note-preview"><div className="verse-note-title"><StickyNote size={14} /><strong>Catatan tadabbur pribadi</strong><span>Diperbarui {new Date(verseNotes[verseKey].updatedAt || Date.now()).toLocaleDateString('id-ID')}</span></div><p>{verseNotes[verseKey].text}</p><button type="button" className="text-link" onClick={() => openVerseNoteEditor(selectedSurah, verse)}>Ubah catatan <PencilLine size={13} /></button></div>}
            {editingVerseNote?.key === verseKey && <div className="verse-note-editor"><div className="verse-note-editor-heading"><div><strong>Catatan tadabbur</strong><small>{selectedSurah?.namaLatin} · Ayat {verse.nomorAyat}</small></div><span>{verseNoteDraft.length}/2000</span></div><textarea value={verseNoteDraft} onChange={(event) => setVerseNoteDraft(event.target.value.slice(0, 2000))} maxLength={2000} rows={4} placeholder="Tulis pemahaman, refleksi, pertanyaan, atau pelajaran dari ayat ini…" aria-label={`Catatan tadabbur ${selectedSurah?.namaLatin} ayat ${verse.nomorAyat}`} /><div className="verse-note-editor-actions"><button type="button" className="button button-secondary" onClick={() => { setEditingVerseNote(null); setVerseNoteDraft(''); }}>Batal</button>{verseNotes[verseKey] && <button type="button" className="button button-danger-ghost" onClick={() => deleteVerseNote(verseKey)}><Trash2 size={14} /> Hapus</button>}<button type="button" className="button button-gold" onClick={saveVerseNote}><Check size={15} /> Simpan catatan</button></div></div>}
          </article>;
        })}
      </div>
      {verses.length > 0 && <div className="reader-end-note"><Sparkles size={17} /><span>Semoga Allah memudahkan tilawah dan pemahamanmu.</span><button className="button button-secondary" onClick={() => { const next = Number(selectedSurah?.nomor) + 1; if (next <= 114) openSurah(next, 1); else showToast('Kamu telah sampai di akhir mushaf.'); }}>Surah berikutnya <ArrowRight size={15} /></button></div>}
    </div>
  );

  const renderPrayer = () => (
    <div className="page-stack prayer-page">
      <section className="page-title-row"><div><p className="eyebrow">WAKTU IBADAH</p><h1>Jadwal shalat</h1><p className="muted">Jadwal berdasarkan kota di Indonesia.</p></div><div className="page-title-icon prayer-title-icon"><Clock3 size={24} /></div></section>
      <div className="city-picker card-surface">
        <div className="city-picker-copy"><span className="location-icon"><MapPin size={17} /></span><div><span>LOKASI JADWAL</span><strong>{cityName}</strong><small>{dateLabel || 'Hari ini'}</small></div></div>
        <button className="button button-secondary city-change" onClick={() => setCitySearchOpen((value) => !value)}><MapPin size={15} /> Ganti kota</button>
        {citySearchOpen && <div className="city-search-panel"><form className="search-box" onSubmit={(event) => { event.preventDefault(); searchCities(cityQuery); }}><Search size={17} /><input value={cityQuery} onChange={(event) => setCityQuery(event.target.value)} placeholder="Cari kota/kabupaten…" aria-label="Cari kota atau kabupaten" /><button type="submit"><ArrowRight size={16} /></button></form><div className="city-region-filter"><label htmlFor="city-region">Filter wilayah</label><select id="city-region" value={cityRegion} onChange={(event) => { setCityRegion(event.target.value); searchCities(cityQuery, event.target.value); }}><option value="all">Seluruh Indonesia</option><option value="jawa-bali">Jawa &amp; Bali</option><option value="sumatra">Sumatra</option><option value="kalimantan">Kalimantan</option><option value="sulawesi-nusa">Sulawesi &amp; Nusa Tenggara</option><option value="maluku-papua">Maluku &amp; Papua</option></select></div>{cityMatches.length > 0 && <div className="city-results">{cityMatches.map((city) => <button key={city.id ?? city.lokasi} onClick={() => selectCity(city)}><MapPin size={14} /><span>{city.lokasi ?? city.nama ?? city.name}</span><ChevronRight size={15} /></button>)}</div>}<div className="popular-cities"><span>Pencarian cepat</span>{['Jakarta','Bogor','Depok','Bekasi','Bandung','Tangerang'].map((city) => <button key={city} onClick={() => { setCityQuery(city); searchCities(city); }}>{city}</button>)}</div></div>}
      </div>
      {prayerError && <div className="inline-notice"><Info size={16} /><span>{prayerError}</span><button onClick={() => { if (cityId) selectCity({ id: cityId, lokasi: cityName }); else searchCities(cityQuery); }}><RefreshCw size={14} /> Coba lagi</button></div>}
      <section className="next-prayer-feature">
        <div className="next-prayer-ambient" /><div className="next-feature-content"><span className="hero-kicker"><span className="hero-dot" /> WAKTU SELANJUTNYA</span><h2>{upcomingPrayer?.label || 'Jadwal shalat'}</h2><p>{upcomingPrayer?.tomorrow ? 'Besok, insyaAllah' : 'Persiapkan diri menyambut waktu shalat.'}</p></div><div className="next-feature-time">{prayerLoading && !prayerSchedule ? <LoaderCircle className="spin" size={28} /> : (upcomingPrayer?.time || '--:--')}<span>WIB / waktu lokal</span></div>
      </section>
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">WAKTU HARI INI</p><h2>Jadwal lengkap</h2></div><span className="tiny-status"><span /> Sumber data Kemenag</span></div>
        <div className="full-prayer-list card-surface">
          {[['imsak','Imsak','Menahan diri'],['subuh','Subuh','Fajar'],['terbit','Terbit','Matahari terbit'],['dhuha','Dhuha','Waktu dhuha'],['dzuhur','Dzuhur','Tengah hari'],['ashar','Ashar','Sore hari'],['maghrib','Maghrib','Matahari terbenam'],['isya','Isya','Malam']].map(([key,label,desc]) => <div className={`full-prayer-row ${upcomingPrayer?.key === key ? 'is-next' : ''}`} key={key}><div className={`prayer-row-icon prayer-${key}`}><Clock3 size={17} /></div><div className="full-prayer-copy"><strong>{label}</strong><span>{desc}</span></div><div className="full-prayer-time">{prayerSchedule?.[key] || (prayerLoading ? '··:··' : '— —')}</div>{upcomingPrayer?.key === key && <span className="upcoming-tag">Berikutnya</span>}</div>)}
        </div>
      </section>
      <div className="source-note"><ShieldCheck size={15} /> Waktu shalat berasal dari API Muslim/myQuran dengan sumber jadwal Kementerian Agama Indonesia. Gunakan lokasi yang sesuai domisili untuk hasil terbaik.</div>
    </div>
  );

  const renderDuas = () => (
    <div className="page-stack duas-page">
      <section className="page-title-row"><div><p className="eyebrow">KUMPULAN DOA</p><h1>Doa harian</h1><p className="muted">Hiasi aktivitas dengan doa dan dzikir.</p></div><div className="page-title-icon dua-title-icon"><HandHeart size={24} /></div></section>
      <div className="dua-hero"><div><span className="hero-kicker"><span className="hero-dot" /> UNTUK SETIAP LANGKAH</span><h2>Awali dengan doa,<br />jalani dengan syukur.</h2><p>Kumpulan doa Arab, latin, dan arti Bahasa Indonesia.</p></div><div className="dua-hero-symbol" dir="rtl">دُعَاءٌ</div></div>
      <div className="quran-search search-box"><Search size={18} /><input value={duaQuery} onChange={(event) => setDuaQuery(event.target.value)} placeholder="Cari doa atau aktivitas…" aria-label="Cari doa" />{duaQuery && <button aria-label="Hapus pencarian doa" onClick={() => setDuaQuery('')}><X size={16} /></button>}</div>
      <div className="results-caption"><span>{filteredDuas.length} doa tersedia</span><span><BookOpen size={14} /> Arab · Latin · Arti</span></div>
      <div className="duas-list">
        {filteredDuas.map((dua, index) => <article className={`dua-card card-surface ${expandedDua === dua.id ? 'expanded' : ''}`} key={`${dua.id}-${index}`}><button className="dua-card-trigger" onClick={() => setExpandedDua((current) => current === dua.id ? null : dua.id)}><span className="dua-number">{String(index + 1).padStart(2, '0')}</span><span className="dua-heading-copy"><strong>{dua.judul}</strong><small>{dua.grup}</small></span><span className="dua-expand-icon">{expandedDua === dua.id ? <Minus size={17} /> : <Plus size={17} />}</span></button><div className="dua-preview"><p className="dua-arabic" dir="rtl" lang="ar">{dua.arab || '—'}</p><p className="dua-translation">{dua.terjemah || 'Terjemahan belum tersedia.'}</p><div className="dua-card-actions"><button className="text-link" onClick={() => shareDua(dua)}><Share2 size={14} /> Bagikan doa</button><Link className="text-link" href={getDuaPath(dua, index)} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); const slug = getDuaSlug(dua, index); setActiveDuaSlug(slug); setExpandedDua(dua.id); window.history.pushState(null, '', getDuaPath(dua, index)); }}><ArrowRight size={14} /> Buka doa</Link></div></div>{expandedDua === dua.id && <div className="dua-expanded"><div className="dua-divider" /><span className="field-label">BACAAN LATIN</span><p className="dua-latin">{dua.latin || 'Transliterasi belum tersedia.'}</p><span className="field-label">ARTI / TERJEMAHAN</span><p>{dua.terjemah || 'Terjemahan belum tersedia.'}</p>{dua.sumber && <div className="dua-source"><ShieldCheck size={14} /> {dua.sumber}</div>}<button className="text-link" onClick={() => copyDua(dua)}><Copy size={14} /> Salin doa</button></div>}</article>)}
      </div>
      {!filteredDuas.length && <div className="empty-state card-surface"><div className="empty-icon"><Search size={22} /></div><strong>Doa tidak ditemukan</strong><p>Coba kata pencarian yang lebih umum.</p><button className="button button-secondary" onClick={() => setDuaQuery('')}>Hapus pencarian</button></div>}
      <p className="source-note"><Info size={15} /> Daftar doa diambil dari EQuran.id. Saat offline, aplikasi menampilkan doa cadangan yang tersedia di perangkat.</p>
    </div>
  );

  const renderDuaDetail = () => {
    if (!activeDua) return <div className="page-stack duas-page"><div className="empty-state card-surface"><strong>Doa tidak ditemukan</strong><p>Daftar doa mungkin belum berhasil dimuat.</p><Link className="button button-secondary" href="/doa">Kembali ke semua doa</Link></div></div>;
    return (
      <div className="page-stack duas-page dua-detail-page">
        <section className="page-title-row"><div><p className="eyebrow">DOA HARIAN · {activeDua.grup || 'DOA SEHARI-HARI'}</p><h1>{activeDua.judul}</h1><p className="muted">Bacaan Arab, Latin, dan terjemahan Indonesia.</p></div><div className="page-title-icon dua-title-icon"><HandHeart size={24} /></div></section>
        <article className="dua-detail-card card-surface">
          <p className="dua-detail-arabic dua-arabic" dir="rtl" lang="ar">{activeDua.arab || '—'}</p>
          <div className="dua-divider" />
          <span className="field-label">BACAAN LATIN</span><p className="dua-latin">{activeDua.latin || 'Transliterasi belum tersedia.'}</p>
          <span className="field-label">ARTI / TERJEMAHAN</span><p className="dua-detail-translation">{activeDua.terjemah || 'Terjemahan belum tersedia.'}</p>
          {activeDua.sumber && <div className="dua-source"><ShieldCheck size={14} /> {activeDua.sumber}</div>}
          <div className="dua-detail-actions"><button className="button button-secondary" onClick={() => copyDua(activeDua)}><Copy size={15} /> Salin doa</button><button className="button button-gold" onClick={() => shareDua(activeDua)}><Share2 size={15} /> Bagikan doa</button></div>
        </article>
        <Link className="text-link dua-back-link" href="/doa"><ChevronLeft size={15} /> Kembali ke kumpulan doa</Link>
        <p className="source-note"><Info size={15} /> Tautan ini mengarah langsung ke doa yang Anda pilih dan dapat dibagikan kepada orang lain.</p>
      </div>
    );
  };

  const renderAsma = () => (
    <div className="page-stack asma-page">
      <section className="page-title-row"><div><p className="eyebrow">MENGENAL NAMA-NAMA ALLAH</p><h1>Asmaul Husna</h1><p className="muted">Renungkan maknanya, hadirkan dalam doa.</p></div><div className="page-title-icon asma-title-icon"><Sparkles size={24} /></div></section>
      <section className="asma-hero"><div className="asma-hero-pattern" /><div className="asma-hero-content"><span className="hero-kicker"><span className="hero-dot" /> 99 NAMA MULIA</span><p className="asma-hero-arabic" dir="rtl">أَسْمَاءُ اللَّهِ الْحُسْنَى</p><h2>Kenali nama-Nya,<br />dekati kasih-Nya.</h2><p>Setiap nama mengajarkan kita mengenal kebesaran dan kasih sayang Allah.</p></div><div className="asma-count"><strong>99</strong><span>Nama indah</span></div></section>
      <div className="quran-search search-box"><Search size={18} /><input value={asmaQuery} onChange={(event) => setAsmaQuery(event.target.value)} placeholder="Cari nama atau makna…" aria-label="Cari Asmaul Husna" />{asmaQuery && <button aria-label="Hapus pencarian Asmaul Husna" onClick={() => setAsmaQuery('')}><X size={16} /></button>}</div>
      <div className="asma-toolbar"><span>{filteredAsma.length} dari 99 nama</span><button className={`filter-chip ${asmaQuery === 'favorit' ? 'active' : ''}`} onClick={() => setAsmaQuery((current) => current === 'favorit' ? '' : 'favorit')}><Heart size={14} /> Favorit {favoriteAsma.length > 0 && `(${favoriteAsma.length})`}</button></div>
      <div className="asma-grid">{filteredAsma.map((name) => <article className="asma-card card-surface" key={name.number}><div className="asma-card-top"><span>{String(name.number).padStart(2, '0')}</span><button className={`icon-button small ${favoriteAsma.includes(name.number) ? 'favorite-active' : ''}`} aria-label={favoriteAsma.includes(name.number) ? 'Hapus dari favorit' : 'Tambah ke favorit'} onClick={() => setFavoriteAsma((prev) => prev.includes(name.number) ? prev.filter((id) => id !== name.number) : [...prev, name.number])}><Heart size={15} fill={favoriteAsma.includes(name.number) ? 'currentColor' : 'none'} /></button></div><p className="asma-arabic" dir="rtl" lang="ar">{name.arabic}</p><strong className="asma-latin">{name.latin}</strong><span className="asma-meaning">{name.meaning}</span></article>)}</div>
      <p className="source-note"><Info size={15} /> Transliterasi dan terjemahan nama dapat bervariasi antar sumber. Gunakan sebagai sarana belajar dan rujuk guru/rujukan tepercaya untuk pendalaman.</p>
    </div>
  );

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''} ${audioInfo ? 'has-audio-global' : ''}`}>
      <header className="app-header">
        <button className="brand-lockup" onClick={() => { setActiveDuaSlug(null); setActiveTab('home'); setSelectedSurah(null); }} aria-label="Kembali ke beranda"><span className="brand-mark"><span className="brand-arch" /><span className="brand-dot" /></span><span className="brand-text"><strong>Nur<span>ani</span></strong><small>AL-QUR’AN DIGITAL</small></span></button>
        <div className="header-actions"><span className={`connection-indicator ${online ? 'online' : 'offline'}`} title={online ? 'Terhubung ke internet' : 'Sedang offline'}>{online ? <Wifi size={15} /> : <WifiOff size={15} />}</span><button className="icon-button" onClick={() => setTheme((value) => value === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Aktifkan tema gelap' : 'Aktifkan tema terang'}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button><button className="icon-button settings-trigger" onClick={() => setSettingsOpen(true)} aria-label="Buka pengaturan"><Settings2 size={17} /></button><button className="install-button" onClick={installApp} aria-label="Pasang aplikasi">{installed ? <Check size={16} /> : <Download size={16} />}<span>{installed ? 'Terpasang' : 'Pasang app'}</span></button></div>
      </header>

      <main className={`main-content ${audioInfo ? 'has-audio' : ''}`}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'quran' && (selectedSurah ? renderReader() : renderSurahList())}
        {activeTab === 'search' && renderSearch()}
        {activeTab === 'stats' && renderTilawahStats()}
        {activeTab === 'prayer' && renderPrayer()}
        {activeTab === 'duas' && (activeDuaSlug ? renderDuaDetail() : renderDuas())}
        {activeTab === 'asma' && renderAsma()}
        {activeTab === 'qibla' && <QiblaFinder onBack={() => { setActiveDuaSlug(null); setSelectedSurah(null); setActiveTab('home'); }} />}
      </main>

      <footer className="app-footer">
        <span>&copy; {new Date().getFullYear()} - Dibuat dengan niat baik dan secangkir kopi oleh</span>{' '}
        <a href="https://www.instagram.com/cecep.maulana_/" target="_blank" rel="noopener noreferrer">Cecep Maulanaツ</a>
      </footer>

      {audioInfo && <div className={`sticky-audio ${audioExpanded ? 'audio-expanded' : ''}`}>
        <audio ref={audioRef} src={audioInfo.src} onEnded={handleAudioEnded} onPause={() => setAudioPlaying(false)} onPlay={() => setAudioPlaying(true)} preload="none" />
        {audioExpanded && <><div className="audio-expanded-body"><div className="audio-equalizer"><AudioLines size={20} /></div><div><strong>{audioInfo.title}</strong><span>{audioInfo.subtitle}</span></div><button className="icon-button" onClick={() => setAudioExpanded(false)} aria-label="Ciutkan pemutar"><ChevronDown size={18} /></button></div><div className="audio-expanded-controls"><label className="speed-control sticky-speed-control"><Gauge size={16} /><span>Kecepatan audio</span><select value={audioSpeed} onChange={(event) => setAudioSpeed(Number(event.target.value))} aria-label="Atur kecepatan audio dari pemutar">{AUDIO_SPEED_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label><small>Kecepatan tersimpan di perangkat ini. Nada suara dipertahankan jika didukung browser.</small></div></>}
        <div className="audio-track-art"><AudioLines size={19} /></div><div className="audio-track-info"><strong>{audioInfo.title}</strong><span>{audioInfo.subtitle}</span></div><button className="icon-button audio-dismiss" aria-label="Tutup pemutar" onClick={() => { audioRef.current?.pause(); releaseAudioObjectUrl(); setAudioInfo(null); setAudioPlaying(false); }}><X size={17} /></button><button className="audio-play-button" aria-label={audioPlaying ? 'Jeda audio' : 'Putar audio'} onClick={toggleAudioPlayback}>{audioPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button><button className="icon-button audio-more" aria-label="Besarkan pemutar" onClick={() => setAudioExpanded((value) => !value)}>{audioExpanded ? <ChevronDown size={17} /> : <MoreHorizontal size={17} />}</button>
      </div>}

      <nav className="bottom-nav" aria-label="Navigasi utama">{NAV_ITEMS.map((item) => { const Icon = item.icon; const isActive = activeTab === item.id || (activeTab === 'stats' && item.id === 'home'); return <a key={item.id} href={TAB_PATHS[item.id]} className={`nav-item ${isActive ? 'active' : ''}`} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); setActiveDuaSlug(null); setActiveTab(item.id); if (item.id !== 'quran') setSelectedSurah(null); }} aria-current={isActive ? 'page' : undefined}><span className="nav-icon-wrap"><Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} /></span><span>{item.label}</span></a>; })}</nav>

      {settingsOpen && <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}><section className="modal-card settings-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">PENGATURAN</p><h2>Preferensi aplikasi</h2><p className="muted">Atur tampilan dan lindungi data tilawahmu.</p></div><button className="icon-button" onClick={() => setSettingsOpen(false)} aria-label="Tutup pengaturan"><X size={19} /></button></div><button className="settings-row" onClick={() => setTheme((value) => value === 'light' ? 'dark' : 'light')}><span className="settings-row-icon">{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</span><span><strong>Tampilan</strong><small>{theme === 'light' ? 'Mode terang' : 'Mode gelap'}</small></span><ChevronRight size={17} /></button><button className="settings-row" onClick={installApp}><span className="settings-row-icon"><Download size={18} /></span><span><strong>Pasang aplikasi</strong><small>Tambahkan Nurani ke layar utama</small></span><ChevronRight size={17} /></button><section className="reminder-settings-section"><div className="reminder-section-heading"><span className="settings-row-icon"><BellRing size={18} /></span><div><strong>Pengingat tilawah dan doa</strong><small>Atur sampai {REMINDER_MAX_COUNT} jadwal sesuai waktu dan hari pilihanmu.</small></div></div><div className="reminder-permission-row"><div className="reminder-permission-copy"><strong>{notificationPermission === 'granted' ? 'Notifikasi sistem diizinkan' : notificationPermission === 'denied' ? 'Notifikasi diblokir browser' : notificationPermission === 'unsupported' ? 'Notifikasi sistem tidak tersedia' : 'Notifikasi sistem belum diaktifkan'}</strong><small>{notificationPermission === 'denied' ? 'Ubah izin melalui pengaturan situs di browser.' : notificationPermission === 'granted' ? 'Pengingat dapat tampil sebagai notifikasi saat halaman berjalan di latar belakang.' : 'Izin hanya diminta setelah tombol di bawah ditekan.'}</small></div><button type="button" className="button button-secondary reminder-permission-button" onClick={requestReminderPermission} disabled={['granted', 'denied', 'unsupported'].includes(notificationPermission)}>{notificationPermission === 'granted' ? 'Diaktifkan' : notificationPermission === 'denied' ? 'Izin diblokir' : notificationPermission === 'unsupported' ? 'Tidak didukung' : 'Aktifkan notifikasi'}</button></div><form className="reminder-form" onSubmit={saveReminder}><label className="reminder-field-label">Nama pengingat<input type="text" maxLength={60} value={reminderDraft.title} onChange={(event) => setReminderDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Contoh: Tilawah setelah Subuh" required /></label><div className="reminder-form-grid"><label className="reminder-field-label">Waktu<input type="time" value={reminderDraft.time} onChange={(event) => setReminderDraft((current) => ({ ...current, time: event.target.value }))} required /></label><label className="reminder-field-label">Jenis pengingat<select value={reminderDraft.kind} onChange={(event) => setReminderDraft((current) => ({ ...current, kind: event.target.value }))}><option value="tilawah">Tilawah</option><option value="doa">Doa harian</option><option value="both">Tilawah & doa</option></select></label></div><div className="reminder-days-field"><span className="reminder-field-title">Ulangi pada</span><div className="reminder-days-options" role="group" aria-label="Pilih hari pengingat">{REMINDER_DAY_OPTIONS.map((day) => <label key={day.value} className={reminderDraft.days.includes(day.value) ? 'is-selected' : ''}><input type="checkbox" checked={reminderDraft.days.includes(day.value)} onChange={(event) => setReminderDraft((current) => ({ ...current, days: event.target.checked ? [...new Set([...current.days, day.value])].sort((a, b) => a - b) : current.days.filter((value) => value !== day.value) }))} /><span>{day.short}</span></label>)}</div></div><label className="reminder-enabled-draft"><input type="checkbox" checked={reminderDraft.enabled !== false} onChange={(event) => setReminderDraft((current) => ({ ...current, enabled: event.target.checked }))} /><span>Aktifkan jadwal ini</span></label><div className="reminder-form-actions"><button type="submit" className="button button-gold"><Check size={15} /> {reminderEditingId ? 'Simpan perubahan' : 'Tambah pengingat'}</button>{reminderEditingId && <button type="button" className="button button-secondary" onClick={() => { setReminderEditingId(null); setReminderDraft({ ...DEFAULT_REMINDER_DRAFT, days: [...DEFAULT_REMINDER_DRAFT.days] }); }}>Batal edit</button>}</div></form><div className="reminder-saved-list-heading"><strong>Jadwal tersimpan</strong><span>{reminders.length}/{REMINDER_MAX_COUNT}</span></div>{reminders.length ? <div className="reminder-saved-list">{reminders.map((reminder) => <article className={`reminder-item${reminder.enabled ? '' : ' is-disabled'}`} key={reminder.id}><div className="reminder-item-time">{reminder.time}</div><div className="reminder-item-copy"><strong>{reminder.title}</strong><small>{REMINDER_KIND_LABELS[reminder.kind]} · {reminder.days.map((day) => REMINDER_DAY_OPTIONS.find((option) => option.value === day)?.short).filter(Boolean).join(', ')}</small><label className="reminder-item-toggle"><input type="checkbox" checked={reminder.enabled} onChange={(event) => setReminders((current) => current.map((item) => item.id === reminder.id ? { ...item, enabled: event.target.checked, updatedAt: Date.now() } : item))} /><span>{reminder.enabled ? 'Aktif' : 'Nonaktif'}</span></label></div><div className="reminder-item-actions"><button type="button" className="icon-button small" aria-label={`Edit pengingat ${reminder.title}`} title="Edit pengingat" onClick={() => editReminder(reminder)}><PencilLine size={14} /></button><button type="button" className="icon-button small offline-remove-button" aria-label={`Hapus pengingat ${reminder.title}`} title="Hapus pengingat" onClick={() => deleteReminder(reminder.id)}><Trash2 size={14} /></button></div></article>)}</div> : <div className="reminder-empty-state"><BellRing size={18} /><span>Belum ada pengingat. Tambahkan jadwal untuk membantu menjaga kebiasaan tilawah atau membaca doa.</span></div>}<p className="reminder-limitation-note">Pengingat diperiksa saat halaman atau PWA Nurani berjalan. Browser dapat membatasi timer di latar belakang; jika aplikasi benar-benar ditutup, jadwal ini tidak dijamin berjalan. Notifikasi latar belakang yang andal memerlukan layanan push di server.</p></section><section className="backup-section"><div className="backup-section-heading"><span className="settings-row-icon"><ShieldCheck size={18} /></span><div><strong>Cadangkan & pulihkan data</strong><small>Bookmark, progres, posisi bacaan, target harian, pengingat, favorit, pengaturan, dan catatan tadabbur.</small></div></div><div className="backup-actions"><button type="button" className="button button-secondary" onClick={exportLocalBackup}><Download size={16} /> Ekspor cadangan</button><button type="button" className="button button-gold" onClick={() => backupFileInputRef.current?.click()}><Upload size={16} /> Impor cadangan</button><input ref={backupFileInputRef} className="backup-file-input" type="file" accept=".json,application/json" onChange={importLocalBackup} aria-label="Pilih file cadangan Nurani" /></div><p className="backup-privacy-note">Cadangan dibuat sebagai file JSON yang tersimpan di perangkat. File ini dapat berisi catatan pribadi—simpan di tempat yang aman dan jangan membagikannya secara publik. Impor hanya memproses key Nurani yang dikenal (maks. 5 MB).</p></section><section className="offline-manager-section"><button type="button" className="offline-manager-toggle" aria-expanded={offlineManagerExpanded} onClick={() => { const next = !offlineManagerExpanded; setOfflineManagerExpanded(next); if (next) void refreshOfflineStorage(); }}><span className="settings-row-icon">{online ? <Download size={18} /> : <WifiOff size={18} />}</span><span className="offline-manager-toggle-copy"><strong>Kelola konten offline</strong><small>{offlineSurahs.length} surah ditandai · {formatStorageBytes(offlineStorageStats.pinnedBytes)} data ayat</small></span>{offlineManagerExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</button>{offlineManagerExpanded && <div className="offline-manager-body"><div className="offline-stats-grid"><div className="offline-stat"><span>Cache ayat lokal</span><strong>{offlineStorageStats.cachedSurahIds.length} surah</strong><small>{formatStorageBytes(offlineStorageStats.cachedVerseBytes)}</small></div><div className="offline-stat"><span>Penyimpanan origin</span><strong>{offlineStorageStats.originUsage === null ? 'Tidak tersedia' : formatStorageBytes(offlineStorageStats.originUsage)}</strong><small>{offlineStorageStats.originQuota === null ? 'Estimasi browser tidak didukung' : `Dari ${formatStorageBytes(offlineStorageStats.originQuota)} yang diizinkan`}</small></div></div>{offlineStorageStats.missingPinnedSurahIds.length > 0 && <p className="offline-manager-warning"><WifiOff size={14} /> {offlineStorageStats.missingPinnedSurahIds.length} surah ditandai offline tetapi data ayatnya tidak ditemukan. Simpan ulang surah saat online.</p>}{offlineSurahs.length > 0 ? <div className="offline-manager-list">{offlineSurahs.map((id) => { const surah = surahs.find((item) => Number(item.nomor) === Number(id)) || fallbackSurahs[Number(id) - 1]; const rows = offlineStorageStats.cachedVerseCounts[Number(id)] || 0; return <div className="offline-manager-item" key={id}><span className="offline-manager-book"><BookOpen size={16} /></span><div className="offline-manager-item-copy"><strong>{surah?.namaLatin || `Surah ${id}`}</strong><small>{rows ? `${rows} ayat tersimpan · ${formatStorageBytes(offlineStorageStats.cachedSurahBytes[Number(id)] || 0)}` : 'Data ayat perlu disimpan ulang'}</small></div><button type="button" className="icon-button small" aria-label={`Buka ${surah?.namaLatin || `Surah ${id}`}`} title="Buka surah" onClick={() => { setSettingsOpen(false); void openSurah(surah, 1); }}><ArrowRight size={15} /></button><button type="button" className="icon-button small offline-remove-button" aria-label={`Hapus ${surah?.namaLatin || `Surah ${id}`} dari data offline`} title="Hapus data offline" onClick={() => removeOfflineSurah(id)}><Trash2 size={14} /></button></div>; })}</div> : <div className="offline-manager-empty"><WifiOff size={18} /><span>Belum ada surah yang ditandai untuk akses offline. Buka surah saat terhubung internet lalu tekan <strong>Simpan offline</strong>.</span></div>}<button type="button" className="button button-danger-ghost offline-clear-button" onClick={clearOfflineQuranData} disabled={offlineStorageStats.cachedSurahIds.length === 0 && offlineSurahs.length === 0}><Trash2 size={14} /> Hapus semua cache ayat</button><p className="offline-manager-note">Estimasi penyimpanan berasal dari browser dan dapat mencakup cache serta data Nurani lain di origin yang sama. Catatan, bookmark, progres, dan file cadangan tidak ikut dihapus saat cache ayat dibersihkan.</p><button type="button" className="text-link offline-refresh-button" onClick={() => void refreshOfflineStorage()}><RefreshCw size={13} /> Perbarui informasi penyimpanan</button><section className="offline-audio-manager"><div className="offline-audio-manager-heading"><span className="settings-row-icon"><Headphones size={18} /></span><div><strong>Audio murottal offline</strong><small>{offlineAudioTracks.length} file · {new Set(offlineAudioTracks.map((track) => track.reciterId || track.reciter)).size} qari · {formatStorageBytes(offlineAudioStats.cachedBytes)} tersimpan</small></div></div><label className="offline-audio-filter"><span>Filter qari</span><select value={offlineAudioFilter} onChange={(event) => setOfflineAudioFilter(event.target.value)} aria-label="Filter audio offline berdasarkan qari"><option value="all">Semua qari</option>{QARIS.map((qari, index) => <option key={QARI_IDS[index]} value={QARI_IDS[index]}>{qari}</option>)}</select></label>{offlineAudioStats.missingSrcs.length > 0 && <p className="offline-manager-warning"><WifiOff size={14} /> {offlineAudioStats.missingSrcs.length} audio tercatat tetapi file cache tidak ditemukan. Hubungkan internet dan unduh ulang.</p>}{offlineAudioTracks.length ? (offlineAudioTracks.filter((track) => offlineAudioFilter === 'all' || track.reciterId === offlineAudioFilter).length ? <div className="offline-manager-list offline-audio-list">{offlineAudioTracks.filter((track) => offlineAudioFilter === 'all' || track.reciterId === offlineAudioFilter).map((track) => { const available = offlineAudioStats.cachedSrcs.includes(track.src); return <div className="offline-manager-item" key={`${track.surahId}:${track.reciterId || track.src}:${track.type || 'full'}:${track.verseNumber || 0}`}><span className="offline-manager-book"><Headphones size={16} /></span><div className="offline-manager-item-copy"><strong>{track.title}</strong><small>{track.reciter} · {available ? formatStorageBytes(track.bytes) : 'File cache tidak ditemukan'}</small></div><button type="button" className="icon-button small offline-remove-button" aria-label={`Hapus audio ${track.title}, ${track.reciter}`} title="Hapus audio offline" onClick={() => void removeOfflineAudioTrack(track)}><Trash2 size={14} /></button></div>; })}</div> : <div className="offline-manager-empty"><Headphones size={18} /><span>Belum ada audio untuk qari ini. Pilih qari pada halaman surah lalu tekan <strong>Unduh audio</strong>.</span></div>) : <div className="offline-manager-empty"><Headphones size={18} /><span>Belum ada audio yang diunduh. Buka surah, pilih qari, lalu tekan <strong>Unduh audio</strong>.</span></div>}{audioDownloadProgress && <p className="offline-audio-downloading"><LoaderCircle size={14} className="spin" /> Mengunduh {audioDownloadProgress.title} · {audioDownloadProgress.reciter}: {audioDownloadProgress.total ? `${Math.min(100, Math.round(audioDownloadProgress.loaded / audioDownloadProgress.total * 100))}%` : formatStorageBytes(audioDownloadProgress.loaded)}</p>}{offlineAudioFilter !== 'all' && offlineAudioTracks.some((track) => track.reciterId === offlineAudioFilter) && <button className="button button-danger-ghost offline-clear-button" onClick={() => void clearOfflineAudioForReciter(offlineAudioFilter)}><Trash2 size={14} /> Hapus semua audio qari ini</button>}<button className="button button-danger-ghost offline-clear-button" onClick={() => void clearOfflineAudioTracks()} disabled={!offlineAudioTracks.length && !offlineAudioStats.cachedSrcs.length}><Trash2 size={14} /> Hapus semua audio offline</button><p className="offline-manager-note">EQuran menyediakan MP3 berkualitas tinggi tanpa pilihan bitrate resmi. Untuk lebih hemat, gunakan ikon unduh pada kartu ayat agar hanya ayat yang diperlukan tersimpan; Anda juga dapat mengunduh satu surah penuh. Maksimal 80 MB per file dan 200 MB total.</p><button className="text-link offline-refresh-button" onClick={() => void refreshOfflineAudioStats()}><RefreshCw size={13} /> Periksa ulang cache audio</button></section></div>}</section><div className="settings-note"><ShieldCheck size={16} /><span>Data utama tetap disimpan lokal di perangkat ini. Katalog surah dan doa yang dapat diambil ulang tidak dimasukkan ke file cadangan.</span></div></section></div>}

      {verseNotesModalOpen && <div className="modal-backdrop" onClick={() => setVerseNotesModalOpen(false)}><section className="modal-card verse-notes-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">CATATAN PRIBADI</p><h2>Semua catatan tadabbur</h2><p className="muted">{allVerseNotes.length} catatan tersimpan di perangkat ini.</p></div><button className="icon-button" onClick={() => setVerseNotesModalOpen(false)} aria-label="Tutup catatan"><X size={19} /></button></div><div className="verse-notes-modal-list">{allVerseNotes.map((note) => <div className="verse-notes-modal-item" key={`${note.surahId}:${note.verseNumber}`}><div className="verse-notes-modal-item-copy"><strong>{note.surahName} · Ayat {note.verseNumber}</strong><p>{note.text}</p><small>{new Date(note.updatedAt || Date.now()).toLocaleString('id-ID')}</small></div><div className="verse-notes-modal-item-actions"><button type="button" className="icon-button small" aria-label={`Buka ${note.surahName} ayat ${note.verseNumber}`} onClick={() => openVerseFromNote(note)}><ArrowRight size={16} /></button><button type="button" className="icon-button small note-delete-action" aria-label={`Hapus catatan ${note.surahName} ayat ${note.verseNumber}`} onClick={() => deleteVerseNote(`${note.surahId}:${note.verseNumber}`)}><Trash2 size={15} /></button></div></div>)}</div><div className="modal-footnote"><ShieldCheck size={15} /><span>Catatan hanya disimpan pada browser/perangkat ini. Catatan tidak diunggah ke server dan tidak tersinkron otomatis ke perangkat lain.</span></div></section></div>}

      {tafsirModal && <div className="modal-backdrop" onClick={() => setTafsirModal(null)}><section className="modal-card tafsir-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">TAFSIR KEMENAG RI</p><h2>{tafsirModal.surah?.namaLatin}{tafsirModal.verse ? ` · Ayat ${tafsirModal.verse.nomorAyat}` : ''}</h2><p className="muted">Membantu memahami pesan ayat.</p></div><button className="icon-button" onClick={() => setTafsirModal(null)} aria-label="Tutup tafsir"><X size={19} /></button></div>{tafsirModal.verse?.teksArab && <p className="tafsir-verse-arabic" dir="rtl">{tafsirModal.verse.teksArab}</p>}{tafsirLoading ? <div className="modal-loading"><LoaderCircle className="spin" size={20} /> Memuat tafsir…</div> : <div className="tafsir-copy">{tafsirModal.text || 'Teks tafsir untuk ayat ini belum tersedia pada respons API. Coba buka tafsir lengkap setelah jaringan tersambung.'}</div>}<div className="modal-footnote"><Info size={15} /><span>Gunakan tafsir sebagai sarana belajar; untuk persoalan khusus, rujuk ulama atau guru yang tepercaya.</span></div></section></div>}

      {toast && <div className="toast-message" role="status"><span className="toast-check"><Check size={14} /></span>{toast}</div>}
    </div>
  );
}

function EyeOffIcon() {
  return <span className="eye-off-mark" aria-hidden="true">◉̸</span>;
}
