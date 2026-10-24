'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, AudioLines, Bookmark, BookMarked, BookOpen, CalendarDays, Check,
  ChevronDown, ChevronLeft, ChevronRight, Clock3, Copy, Download, HandHeart,
  Headphones, Heart, Home, Info, ListFilter, LoaderCircle, MapPin, Minus, Moon,
  MoreHorizontal, Pause, Play, Plus, RefreshCw, Search, Settings2, ShieldCheck,
  Share2, SlidersHorizontal, Sparkles, Sun, Wifi, WifiOff, X, Repeat, Target, StickyNote, PencilLine, Trash2
} from 'lucide-react';
import { asmaulHusna, enforceBeforeMealDua, fallbackDuas, fallbackSurahs, MIN_DUA_CATALOG_SIZE } from '@/lib/data';
import { extractDuaRows, isUsableDua, normalizeDua } from '@/lib/duas';
import { getDuaPath, getDuaSlug, getDuaSlugFromPathname } from '@/lib/dua-routes';
import { PATH_TABS, SECTION_SEO_BY_TAB, TAB_PATHS, VALID_TABS } from '@/lib/section-routes';
import { getSurahNumberFromPathname, getSurahPath, getVerseNumberFromPathname, getVersePath } from '@/lib/surah-routes';
import { siteName, siteUrl } from '@/lib/site-config';
import {
  chooseAudio, cleanArabicText, fetchAllPrayerCities, fetchDuas, fetchPrayerCity, fetchPrayerSchedule,
  fetchQuran, firstArray, normalizeSurah, normalizeVerse, unwrapPayload
} from '@/lib/api';

const QARIS = [
  'Sheikh Misyari Rasyid Al-Afasi',
  'Sheikh Abdurrahman As-Sudais',
  'Sheikh Abdullah Al-Juhany',
  'Sheikh Abdul Muhsin Al-Qasim',
  'Sheikh Ibrahim Al-Dossari'
];
const NAV_ITEMS = [
  { id: 'home', label: 'Beranda', icon: Home },
  { id: 'quran', label: 'Al-Qur’an', icon: BookOpen },
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
const AUDIO_REPEAT_OPTIONS = [
  { value: 'off', label: 'Mati' },
  { value: '3', label: '3×' },
  { value: '5', label: '5×' },
  { value: '10', label: '10×' },
  { value: 'infinite', label: 'Tanpa batas' }
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

  const [surahs, setSurahs] = useState(fallbackSurahs);
  const [surahLoading, setSurahLoading] = useState(true);
  const [surahQuery, setSurahQuery] = useState('');
  const [surahFilter, setSurahFilter] = useState('all');
  const [selectedSurah, setSelectedSurah] = useState(initialSurahMetadata);
  const [sharedVerseTarget] = useState(safeInitialVerseNumber);
  const [verses, setVerses] = useState(safeInitialVerseRows);
  const [verseLoading, setVerseLoading] = useState(Boolean(initialSurahMetadata) && safeInitialVerseRows.length === 0);
  const [verseQuery, setVerseQuery] = useState('');
  const [arabicVisible, setArabicVisible] = useState(true);
  const [latinVisible, setLatinVisible] = useState(true);
  const [translationVisible, setTranslationVisible] = useState(true);
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
  const [offlineSurahs, setOfflineSurahs] = useState([]);
  const [tafsirModal, setTafsirModal] = useState(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [jumpVerse, setJumpVerse] = useState('');

  const [audioInfo, setAudioInfo] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioExpanded, setAudioExpanded] = useState(false);
  const [audioRepeat, setAudioRepeat] = useState('off');
  const audioRef = useRef(null);
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
    const savedOfflineSurahs = readLocal('aq:offline-surahs', []);
    setOfflineSurahs(Array.isArray(savedOfflineSurahs) ? [...new Set(savedOfflineSurahs.map(Number).filter((id) => Number.isInteger(id) && id >= 1 && id <= 114))] : []);
    const savedAudioRepeat = readLocal('aq:audio-repeat', 'off');
    setAudioRepeat(AUDIO_REPEAT_OPTIONS.some((option) => option.value === savedAudioRepeat) ? savedAudioRepeat : 'off');
    setFavoriteAsma(readLocal('aq:favorite-asma', []));
    const prefs = readLocal('aq:reader-prefs', null);
    if (prefs) {
      setArabicVisible(prefs.arabicVisible !== false);
      setLatinVisible(prefs.latinVisible !== false);
      setTranslationVisible(prefs.translationVisible !== false);
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
    writeLocal('aq:offline-surahs', offlineSurahs);
  }, [offlineSurahs]);
  useEffect(() => {
    writeLocal('aq:audio-repeat', audioRepeat);
  }, [audioRepeat]);
  useEffect(() => {
    writeLocal('aq:favorite-asma', favoriteAsma);
  }, [favoriteAsma]);
  useEffect(() => {
    writeLocal('aq:reader-prefs', { arabicVisible, latinVisible, translationVisible, arabicSize, latinSize, translationSize, qariIndex });
  }, [arabicVisible, latinVisible, translationVisible, arabicSize, latinSize, translationSize, qariIndex]);
  useEffect(() => {
    if (!audioInfo || !audioRef.current) return;
    const element = audioRef.current;
    element.load();
    element.play().then(() => setAudioPlaying(true)).catch(() => {
      setAudioPlaying(false);
      showToast('Audio tidak dapat diputar. Periksa koneksi atau sumber audio.');
    });
  }, [audioInfo?.src, showToast]);

  const upcomingPrayer = useMemo(() => getUpcomingPrayer(prayerSchedule, prayerTimezone), [prayerSchedule, prayerTimezone, clockTick]);
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
  const allVerseNotes = useMemo(() => Object.values(verseNotes).sort((a, b) => b.updatedAt - a.updatedAt), [verseNotes]);
  const recentVerseNotes = useMemo(() => allVerseNotes.slice(0, 3), [allVerseNotes]);
  const todayKey = jakartaDateKey();
  const todayReadCount = Array.isArray(readingDays?.[todayKey]) ? readingDays[todayKey].length : 0;
  const completedVerseCount = Math.min(readVerseKeys.length, TOTAL_QURAN_VERSES);
  const overallReadingPercent = Math.min(100, Math.round((completedVerseCount / TOTAL_QURAN_VERSES) * 100));
  const dailyVerseTarget = Math.ceil(TOTAL_QURAN_VERSES / khatamDays);
  const dailyReadingPercent = Math.min(100, Math.round((todayReadCount / dailyVerseTarget) * 100));

  const openSurah = useCallback(async (surahValue, verseNumber = 1) => {
    const surah = typeof surahValue === 'number'
      ? surahs.find((item) => Number(item.nomor) === surahValue) || fallbackSurahs[surahValue - 1]
      : surahValue;
    if (!surah) return;
    const canUseServerRows = Number(surah.nomor) === safeInitialSurahNumber && safeInitialVerseRows.length > 0;
    setActiveTab('quran'); setSelectedSurah(surah); setVerses(canUseServerRows ? safeInitialVerseRows : []); setVerseLoading(!canUseServerRows); setReaderSettingsOpen(false);
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
  const toggleVerseBookmark = (number) => {
    if (!selectedSurah) return;
    const key = `${selectedSurah.nomor}:${number}`;
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
  const playVerse = (verse, index) => {
    const src = chooseAudio(verse.audio, qariIndex);
    if (!src) { showToast('Audio per ayat belum disediakan oleh sumber untuk pilihan ini.'); return; }
    repeatCountRef.current = 0;
    setAudioInfo({ src, title: `${selectedSurah?.namaLatin || 'Al-Qur’an'} · Ayat ${verse.nomorAyat}`, subtitle: QARIS[qariIndex], trackType: 'verse', verseIndex: index, surahNumber: selectedSurah?.nomor });
    markVerseRead(Number(selectedSurah?.nomor), Number(verse.nomorAyat));
    window.setTimeout(() => document.getElementById(`verse-${selectedSurah?.nomor}-${verse.nomorAyat}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };
  const playFullSurah = () => {
    if (!selectedSurah) return;
    const src = chooseAudio(selectedSurah.audioFull, qariIndex);
    if (!src) { showToast('Audio penuh surah belum tersedia pada data yang diterima.'); return; }
    setAudioInfo({ src, title: selectedSurah.namaLatin, subtitle: `Murottal · ${QARIS[qariIndex]}`, trackType: 'full', surahNumber: selectedSurah.nomor, verseIndex: 0 });
  };
  const saveCurrentSurahOffline = () => {
    if (!selectedSurah || !verses.length) {
      showToast('Buka surah dan tunggu ayatnya termuat sebelum menyimpan offline.');
      return;
    }
    const id = Number(selectedSurah.nomor);
    // Explicitly pin the currently loaded surah and metadata for offline access.
    // API responses are also cached by the service worker when available.
    const verseSaved = writeLocal(`aq:verses:${id}`, verses);
    const metadataSaved = writeLocal('aq:surahs', surahs);
    if (!verseSaved || !metadataSaved) {
      showToast('Penyimpanan perangkat penuh atau tidak tersedia. Kosongkan ruang lalu coba lagi.');
      return;
    }
    setOfflineSurahs((previous) => previous.includes(id) ? previous : [...previous, id].sort((a, b) => a - b));
    showToast(`${selectedSurah.namaLatin} disimpan untuk akses offline di perangkat ini.`);
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
  const resetReaderSettings = () => {
    setArabicVisible(true); setLatinVisible(true); setTranslationVisible(true); setArabicSize(32); setLatinSize(18); setTranslationSize(15);
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
          <div className="khatam-reset-row"><span>Mulai ulang perhitungan progres membaca tanpa menghapus bookmark atau posisi bacaan terakhir.</span><button type="button" className="button button-glass khatam-reset-button" onClick={() => { if (window.confirm('Reset progres khatam? Progres keseluruhan dan catatan bacaan harian akan dihapus, target kembali ke 30 hari. Bookmark dan posisi bacaan terakhir tetap tersimpan.')) { setReadVerseKeys([]); setReadingDays({}); setKhatamDays(30); showToast('Progres khatam berhasil direset.'); } }}><RefreshCw size={14} /> Reset khatam</button></div>
          <div className="daily-target-heading"><div><strong>{todayReadCount.toLocaleString('id-ID')} / {dailyVerseTarget.toLocaleString('id-ID')} ayat hari ini</strong><small>Target harian untuk khatam dalam {khatamDays} hari</small></div><span>{dailyReadingPercent}%</span></div>
          <div className="progress-track progress-track-daily" role="progressbar" aria-label="Progres target membaca hari ini" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dailyReadingPercent}><span style={{ width: `${dailyReadingPercent}%` }} /></div>
          <p className="progress-footnote">Progres berdasarkan ayat yang terlihat saat membaca. Data disimpan lokal dan tidak memerlukan akun.</p>
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

  const renderSurahList = () => (
    <div className="page-stack quran-list-page">
      <section className="page-title-row"><div><p className="eyebrow">KITAB SUCI UMAT ISLAM</p><h1>Al-Qur’an</h1><p className="muted">Baca dan pahami ayat demi ayat.</p></div><div className="quran-count-pill"><BookOpen size={16} /><strong>114</strong><span>Surah</span></div></section>
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

  const renderReader = () => (
    <div className="reader-page">
      <div className="reader-topbar"><button className="back-button" onClick={() => { setSelectedSurah(null); setActiveTab('quran'); }}><ChevronLeft size={19} /> <span>Daftar surah</span></button><button className={`icon-button ${bookmarkedSurahs.includes(Number(selectedSurah?.nomor)) ? 'is-saved' : ''}`} aria-label="Bookmark surah" onClick={() => toggleSurahBookmark(Number(selectedSurah?.nomor))}><Bookmark size={18} fill={bookmarkedSurahs.includes(Number(selectedSurah?.nomor)) ? 'currentColor' : 'none'} /></button></div>
      <section className="reader-surah-hero">
        <div className="reader-surah-heading"><div><p className="eyebrow">SURAH KE-{selectedSurah?.nomor || '—'}</p><h1>{selectedSurah?.namaLatin}</h1><p>{selectedSurah?.arti} <span>·</span> {selectedSurah?.tempatTurun || 'Al-Qur’an'} <span>·</span> {selectedSurah?.jumlahAyat || verses.length} ayat</p></div><div className="reader-surah-arabic" dir="rtl">{selectedSurah?.nama || ''}</div></div>
        <div className="bismillah" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <div className="reader-actions"><button className="button button-gold" onClick={playFullSurah}><Play size={16} fill="currentColor" /> Putar satu surah</button><button className="button button-glass" onClick={() => openTafsir()}><BookOpen size={16} /> Tafsir</button><button className={`button button-glass ${offlineSurahs.includes(Number(selectedSurah?.nomor)) ? 'selected' : ''}`} onClick={saveCurrentSurahOffline} disabled={!verses.length || offlineSurahs.includes(Number(selectedSurah?.nomor))}>{offlineSurahs.includes(Number(selectedSurah?.nomor)) ? <Check size={16} /> : <Download size={16} />} {offlineSurahs.includes(Number(selectedSurah?.nomor)) ? 'Tersimpan offline' : 'Simpan offline'}</button><button className={`button button-glass ${readerSettingsOpen ? 'selected' : ''}`} onClick={() => setReaderSettingsOpen((value) => !value)}><SlidersHorizontal size={16} /> Tampilan</button></div>
      </section>
      {readerSettingsOpen && <section className="reader-settings card-surface">
        <div className="settings-panel-heading"><div><strong>Pengaturan bacaan</strong><span>Atur sesuai kenyamananmu</span></div><button className="icon-button small" onClick={() => setReaderSettingsOpen(false)} aria-label="Tutup pengaturan"><X size={17} /></button></div>
        <div className="visibility-toggles">
          <label className="toggle-setting"><span><strong>Teks Arab</strong><small>Ayat Uthmani</small></span><input type="checkbox" checked={arabicVisible} onChange={(event) => setArabicVisible(event.target.checked)} /><span className="toggle-ui" /></label>
          <label className="toggle-setting"><span><strong>Latin</strong><small>Transliterasi</small></span><input type="checkbox" checked={latinVisible} onChange={(event) => setLatinVisible(event.target.checked)} /><span className="toggle-ui" /></label>
          <label className="toggle-setting"><span><strong>Terjemahan</strong><small>Bahasa Indonesia</small></span><input type="checkbox" checked={translationVisible} onChange={(event) => setTranslationVisible(event.target.checked)} /><span className="toggle-ui" /></label>
        </div>
        <div className="font-settings-row"><div><div className="range-label"><span>Ukuran teks Arab</span><strong>{arabicSize}px</strong></div><input type="range" min="20" max="52" value={arabicSize} onChange={(event) => setArabicSize(Number(event.target.value))} aria-label="Ukuran teks Arab" /></div><div><div className="range-label"><span>Ukuran teks Latin</span><strong>{latinSize}px</strong></div><input type="range" min="12" max="30" value={latinSize} onChange={(event) => setLatinSize(Number(event.target.value))} aria-label="Ukuran teks Latin" /></div><div><div className="range-label"><span>Ukuran terjemahan</span><strong>{translationSize}px</strong></div><input type="range" min="12" max="24" value={translationSize} onChange={(event) => setTranslationSize(Number(event.target.value))} aria-label="Ukuran terjemahan" /></div></div>
        <button className="text-link reset-reader" onClick={resetReaderSettings}>Kembalikan pengaturan awal <RefreshCw size={14} /></button>
      </section>}
      <div className="reader-tool-row">
        <div className="reciter-control"><Headphones size={16} /><select value={qariIndex} onChange={(event) => setQariIndex(Number(event.target.value))} aria-label="Pilih qari">{QARIS.map((qari, index) => <option value={index} key={qari}>{qari}</option>)}</select><ChevronDown size={15} /></div>
        <label className="repeat-control"><Repeat size={16} /><span>Ulang ayat</span><select value={audioRepeat} onChange={(event) => { setAudioRepeat(event.target.value); repeatCountRef.current = 0; }} aria-label="Atur pengulangan ayat">{AUDIO_REPEAT_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
        <form className="jump-form" onSubmit={(event) => { event.preventDefault(); const n = Math.min(Math.max(Number(jumpVerse) || 1, 1), verses.length || Number(selectedSurah?.jumlahAyat) || 1); pendingJumpRef.current = n; document.getElementById(`verse-${selectedSurah?.nomor}-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}><label htmlFor="jump-verse">Ayat</label><input id="jump-verse" type="number" min="1" max={selectedSurah?.jumlahAyat || 999} value={jumpVerse} onChange={(event) => setJumpVerse(event.target.value)} /><button type="submit" aria-label="Lompat ke ayat"><ArrowRight size={16} /></button></form>
      </div>
      {verseLoading && !verses.length && <div className="verse-skeletons">{[0,1,2].map((item) => <div className="verse-skeleton card-surface" key={item}><div /><div /><div /></div>)}</div>}
      {!verseLoading && !verses.length && <div className="empty-state card-surface"><div className="empty-icon"><WifiOff size={22} /></div><strong>Ayat belum tersedia offline</strong><p>Hubungkan perangkat ke internet untuk memuat surah ini sekali. Data yang berhasil dibuka akan disimpan di perangkat.</p><button className="button button-secondary" onClick={() => openSurah(selectedSurah, Number(jumpVerse) || 1)}><RefreshCw size={16} /> Coba lagi</button></div>}
      <div className="verses-list">
        {verses.map((verse, index) => {
          const verseKey = `${selectedSurah?.nomor}:${verse.nomorAyat}`;
          const isPlayingVerse = audioInfo?.trackType === 'verse' && audioInfo?.surahNumber === selectedSurah?.nomor && Number(audioInfo?.verseIndex) === index;
          const isSharedVerseTarget = Number(selectedSurah?.nomor) === safeInitialSurahNumber
            && Number(sharedVerseTarget) === Number(verse.nomorAyat);
          return <article id={`verse-${selectedSurah?.nomor}-${verse.nomorAyat}`} className={`verse-card card-surface ${isPlayingVerse ? 'is-playing' : ''} ${isSharedVerseTarget ? 'is-shared-target' : ''}`} key={`${selectedSurah?.nomor}-${verse.nomorAyat}`}>
            <div className="verse-card-top"><div className="verse-number"><span>{verse.nomorAyat}</span></div><div className="verse-meta"><span>{selectedSurah?.namaLatin} · Ayat {verse.nomorAyat}</span>{isPlayingVerse && <span className="now-playing"><AudioLines size={13} /> Sedang diputar</span>}</div><div className="verse-quick-actions"><button className="icon-button small" aria-label="Putar ayat" onClick={() => playVerse(verse, index)}>{isPlayingVerse && audioPlaying ? <AudioLines size={16} /> : <Play size={16} />}</button><button className={`icon-button small ${bookmarkedVerses.includes(verseKey) ? 'is-saved' : ''}`} aria-label="Bookmark ayat" onClick={() => toggleVerseBookmark(verse.nomorAyat)}><Bookmark size={16} fill={bookmarkedVerses.includes(verseKey) ? 'currentColor' : 'none'} /></button><button className="icon-button small" aria-label="Salin teks ayat" title="Salin teks ayat" onClick={() => copyVerse(verse)}><Copy size={15} /></button><button className={`icon-button small ${verseNotes[verseKey] ? 'has-verse-note' : ''}`} aria-label={verseNotes[verseKey] ? "Edit catatan tadabbur" : "Tambah catatan tadabbur"} title={verseNotes[verseKey] ? "Edit catatan tadabbur" : "Tambah catatan tadabbur"} onClick={() => openVerseNoteEditor(selectedSurah, verse)}><PencilLine size={15} /></button><button className="icon-button small" aria-label="Bagikan ayat" title="Bagikan ayat" onClick={() => shareVerse(verse)}><Share2 size={15} /></button><button className="icon-button small tafsir-action" aria-label="Buka tafsir ayat" title="Buka tafsir ayat" onClick={() => openTafsir(verse)}><MoreHorizontal size={17} /></button></div></div>
            {arabicVisible && <p className="verse-arabic" dir="rtl" lang="ar" style={{ fontSize: `${arabicSize}px` }}>{cleanArabicText(verse.teksArab) || '—'}</p>}
            {latinVisible && verse.teksLatin && <p className="verse-latin" style={{ fontSize: `${latinSize}px` }}>{verse.teksLatin}</p>}
            {translationVisible && verse.teksIndonesia && <p className="verse-translation" style={{ fontSize: `${translationSize}px` }}>{verse.teksIndonesia}</p>}
            {!arabicVisible && !latinVisible && !translationVisible && <div className="hifz-hidden-note"><EyeOffIcon /> Mode hafalan aktif — semua teks disembunyikan.</div>}
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
        {activeTab === 'prayer' && renderPrayer()}
        {activeTab === 'duas' && (activeDuaSlug ? renderDuaDetail() : renderDuas())}
        {activeTab === 'asma' && renderAsma()}
      </main>

      <footer className="app-footer">
        <span>&copy; {new Date().getFullYear()} - Dibuat dengan niat baik dan secangkir kopi oleh</span>{' '}
        <a href="https://www.instagram.com/cecep.maulana_/" target="_blank" rel="noopener noreferrer">Cecep Maulanaツ</a>
      </footer>

      {audioInfo && <div className={`sticky-audio ${audioExpanded ? 'audio-expanded' : ''}`}>
        <audio ref={audioRef} src={audioInfo.src} onEnded={handleAudioEnded} onPause={() => setAudioPlaying(false)} onPlay={() => setAudioPlaying(true)} preload="none" />
        {audioExpanded && <div className="audio-expanded-body"><div className="audio-equalizer"><AudioLines size={20} /></div><div><strong>{audioInfo.title}</strong><span>{audioInfo.subtitle}</span></div><button className="icon-button" onClick={() => setAudioExpanded(false)} aria-label="Ciutkan pemutar"><ChevronDown size={18} /></button></div>}
        <div className="audio-track-art"><AudioLines size={19} /></div><div className="audio-track-info"><strong>{audioInfo.title}</strong><span>{audioInfo.subtitle}</span></div><button className="icon-button audio-dismiss" aria-label="Tutup pemutar" onClick={() => { audioRef.current?.pause(); setAudioInfo(null); setAudioPlaying(false); }}><X size={17} /></button><button className="audio-play-button" aria-label={audioPlaying ? 'Jeda audio' : 'Putar audio'} onClick={toggleAudioPlayback}>{audioPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button><button className="icon-button audio-more" aria-label="Besarkan pemutar" onClick={() => setAudioExpanded((value) => !value)}>{audioExpanded ? <ChevronDown size={17} /> : <MoreHorizontal size={17} />}</button>
      </div>}

      <nav className="bottom-nav" aria-label="Navigasi utama">{NAV_ITEMS.map((item) => { const Icon = item.icon; const isActive = activeTab === item.id; return <a key={item.id} href={TAB_PATHS[item.id]} className={`nav-item ${isActive ? 'active' : ''}`} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); setActiveDuaSlug(null); setActiveTab(item.id); if (item.id !== 'quran') setSelectedSurah(null); }} aria-current={isActive ? 'page' : undefined}><span className="nav-icon-wrap"><Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} /></span><span>{item.label}</span></a>; })}</nav>

      {settingsOpen && <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}><section className="modal-card settings-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">PENGATURAN</p><h2>Preferensi aplikasi</h2></div><button className="icon-button" onClick={() => setSettingsOpen(false)} aria-label="Tutup pengaturan"><X size={19} /></button></div><button className="settings-row" onClick={() => setTheme((value) => value === 'light' ? 'dark' : 'light')}><span className="settings-row-icon">{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</span><span><strong>Tampilan</strong><small>{theme === 'light' ? 'Mode terang' : 'Mode gelap'}</small></span><ChevronRight size={17} /></button><button className="settings-row" onClick={installApp}><span className="settings-row-icon"><Download size={18} /></span><span><strong>Pasang aplikasi</strong><small>Tambahkan Nurani ke layar utama</small></span><ChevronRight size={17} /></button><div className="settings-note"><ShieldCheck size={16} /><span>Preferensi, riwayat bacaan, dan bookmark disimpan secara lokal di perangkat ini. Tidak perlu membuat akun.</span></div></section></div>}

      {verseNotesModalOpen && <div className="modal-backdrop" onClick={() => setVerseNotesModalOpen(false)}><section className="modal-card verse-notes-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">CATATAN PRIBADI</p><h2>Semua catatan tadabbur</h2><p className="muted">{allVerseNotes.length} catatan tersimpan di perangkat ini.</p></div><button className="icon-button" onClick={() => setVerseNotesModalOpen(false)} aria-label="Tutup catatan"><X size={19} /></button></div><div className="verse-notes-modal-list">{allVerseNotes.map((note) => <div className="verse-notes-modal-item" key={`${note.surahId}:${note.verseNumber}`}><div className="verse-notes-modal-item-copy"><strong>{note.surahName} · Ayat {note.verseNumber}</strong><p>{note.text}</p><small>{new Date(note.updatedAt || Date.now()).toLocaleString('id-ID')}</small></div><div className="verse-notes-modal-item-actions"><button type="button" className="icon-button small" aria-label={`Buka ${note.surahName} ayat ${note.verseNumber}`} onClick={() => openVerseFromNote(note)}><ArrowRight size={16} /></button><button type="button" className="icon-button small note-delete-action" aria-label={`Hapus catatan ${note.surahName} ayat ${note.verseNumber}`} onClick={() => deleteVerseNote(`${note.surahId}:${note.verseNumber}`)}><Trash2 size={15} /></button></div></div>)}</div><div className="modal-footnote"><ShieldCheck size={15} /><span>Catatan hanya disimpan pada browser/perangkat ini. Catatan tidak diunggah ke server dan tidak tersinkron otomatis ke perangkat lain.</span></div></section></div>}

      {tafsirModal && <div className="modal-backdrop" onClick={() => setTafsirModal(null)}><section className="modal-card tafsir-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">TAFSIR KEMENAG RI</p><h2>{tafsirModal.surah?.namaLatin}{tafsirModal.verse ? ` · Ayat ${tafsirModal.verse.nomorAyat}` : ''}</h2><p className="muted">Membantu memahami pesan ayat.</p></div><button className="icon-button" onClick={() => setTafsirModal(null)} aria-label="Tutup tafsir"><X size={19} /></button></div>{tafsirModal.verse?.teksArab && <p className="tafsir-verse-arabic" dir="rtl">{tafsirModal.verse.teksArab}</p>}{tafsirLoading ? <div className="modal-loading"><LoaderCircle className="spin" size={20} /> Memuat tafsir…</div> : <div className="tafsir-copy">{tafsirModal.text || 'Teks tafsir untuk ayat ini belum tersedia pada respons API. Coba buka tafsir lengkap setelah jaringan tersambung.'}</div>}<div className="modal-footnote"><Info size={15} /><span>Gunakan tafsir sebagai sarana belajar; untuk persoalan khusus, rujuk ulama atau guru yang tepercaya.</span></div></section></div>}

      {toast && <div className="toast-message" role="status"><span className="toast-check"><Check size={14} /></span>{toast}</div>}
    </div>
  );
}

function EyeOffIcon() {
  return <span className="eye-off-mark" aria-hidden="true">◉̸</span>;
}
