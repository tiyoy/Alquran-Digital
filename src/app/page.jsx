'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Clock,
  HeartHandshake,
  Sparkles,
  CircleDot,
  Sun,
  Moon,
  SlidersHorizontal,
  Download,
  CheckCircle2,
} from 'lucide-react';
import SurahListView from '@/components/SurahListView';
import QuranReaderView from '@/components/QuranReaderView';
import AudioPlayerBar from '@/components/AudioPlayerBar';
import TafsirModal from '@/components/TafsirModal';
import ReaderSettingsModal from '@/components/ReaderSettingsModal';
import PrayerTimesView from '@/components/PrayerTimesView';
import DoaHarianView from '@/components/DoaHarianView';
import AsmaulHusnaView from '@/components/AsmaulHusnaView';
import TasbihView from '@/components/TasbihView';
import { OfflineBanner, PwaInstallModal, usePwa } from '@/components/PwaManager';
import VerseNoteModal from '@/components/VerseNoteModal';
import ShareVerseModal from '@/components/ShareVerseModal';
import SplashScreen from '@/components/SplashScreen';
import { fetchSurahDetail, fetchSurahList } from '@/lib/api';
import { COLOR_THEMES, DEFAULT_SETTINGS, STORAGE_KEYS } from '@/lib/constants';
import { DEFAULT_PRAYER_CITY } from '@/lib/regions';
import { getDownloadedAudioIndex } from '@/lib/offlineAudio';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

const DEFAULT_READING_STATS = {
  dailyTarget: 20,
  todayKey: '',
  todayVerses: 0,
  lastReadDateKey: '',
  streak: 0,
  readSurahs: [],
};

const TAB_ITEMS = [
  { id: 'quran', label: "Al-Qur'an", mobileLabel: "Qur'an", icon: BookOpen },
  { id: 'sholat', label: 'Jadwal Shalat', mobileLabel: 'Shalat', icon: Clock },
  { id: 'tasbih', label: 'Tasbih', mobileLabel: 'Tasbih', icon: CircleDot },
  { id: 'doa', label: 'Doa Harian', mobileLabel: 'Doa', icon: HeartHandshake },
  { id: 'asmaul-husna', label: 'Asmaul Husna', mobileLabel: 'Asmaul', icon: Sparkles },
];

const INITIAL_AUDIO_STATE = {
  active: false,
  isPlaying: false,
  mode: 'verse', // 'verse' | 'full'
  surahNumber: null,
  surahName: '',
  verseNumber: null,
  totalVerses: 0,
  url: '',
  surahData: null,
  playNonce: 0,
};

function safeReadLocalStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('quran');
  const [hydrated, setHydrated] = useState(false);

  // Theme & Color Palette (colorTheme diatur dari modal Pengaturan)
  const [isDark, setIsDark] = useState(false);
  const [colorTheme, setColorTheme] = useState('emerald');

  // Reader settings & preferences (persisted)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [surahBookmarks, setSurahBookmarks] = useState([]);
  const [verseBookmarks, setVerseBookmarks] = useState([]);
  const [verseNotes, setVerseNotes] = useState({});
  const [readingStats, setReadingStats] = useState(() => ({
    ...DEFAULT_READING_STATS,
    todayKey: getTodayKey(),
  }));
  const [offlineAudioIndex, setOfflineAudioIndex] = useState({});
  const [lastRead, setLastRead] = useState(null);
  const [selectedCity, setSelectedCity] = useState(DEFAULT_PRAYER_CITY);

  // Surah list state
  const [surahs, setSurahs] = useState([]);
  const [surahsLoading, setSurahsLoading] = useState(true);
  const [surahsError, setSurahsError] = useState('');

  // Reader state
  const [selectedSurahNumber, setSelectedSurahNumber] = useState(null);
  const [currentSurah, setCurrentSurah] = useState(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState('');
  const [jumpTargetVerse, setJumpTargetVerse] = useState(null);

  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tafsirModal, setTafsirModal] = useState({
    open: false,
    surah: null,
    initialVerse: null,
  });
  const [noteModal, setNoteModal] = useState({
    open: false,
    surah: null,
    ayat: null,
  });
  const [shareModal, setShareModal] = useState({
    open: false,
    surah: null,
    ayat: null,
  });

  // Audio player state
  const [audioState, setAudioState] = useState(INITIAL_AUDIO_STATE);

  // Toast notification
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef(null);
  const audioStateRef = useRef(INITIAL_AUDIO_STATE);
  const settingsRef = useRef(DEFAULT_SETTINGS);
  const surahBookmarksRef = useRef([]);
  const verseBookmarksRef = useRef([]);

  useEffect(() => {
    audioStateRef.current = audioState;
  }, [audioState]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    surahBookmarksRef.current = surahBookmarks;
  }, [surahBookmarks]);

  useEffect(() => {
    verseBookmarksRef.current = verseBookmarks;
  }, [verseBookmarks]);

  const notify = useCallback((message) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 2600);
  }, []);

  // Sinkronisasi Dark/Light Mode & Tema Warna sebelum browser paint (tanpa tag <script> di React)
  useIsomorphicLayoutEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(STORAGE_KEYS.THEME);
      const prefersDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldDark = savedTheme ? savedTheme === 'dark' : prefersDark;
      document.documentElement.classList.toggle('dark', shouldDark);
      setIsDark(shouldDark);

      const savedColorTheme =
        window.localStorage.getItem(STORAGE_KEYS.COLOR_THEME) || 'emerald';
      const validTheme = COLOR_THEMES.some((t) => t.id === savedColorTheme)
        ? savedColorTheme
        : 'emerald';
      document.documentElement.setAttribute('data-color-theme', validTheme);
      setColorTheme(validTheme);
    } catch {}
  }, []);

  // Hydrate persisted state from localStorage on client mount
  useEffect(() => {
    const savedSettings = safeReadLocalStorage(STORAGE_KEYS.SETTINGS, null);
    if (savedSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
    }

    const savedSurahBm = safeReadLocalStorage(STORAGE_KEYS.SURAH_BOOKMARKS, []);
    if (Array.isArray(savedSurahBm)) setSurahBookmarks(savedSurahBm);

    const savedVerseBm = safeReadLocalStorage(STORAGE_KEYS.VERSE_BOOKMARKS, []);
    if (Array.isArray(savedVerseBm)) setVerseBookmarks(savedVerseBm);

    const savedNotes = safeReadLocalStorage(STORAGE_KEYS.VERSE_NOTES, {});
    if (savedNotes && typeof savedNotes === 'object') setVerseNotes(savedNotes);

    const savedStats = safeReadLocalStorage(STORAGE_KEYS.READING_STATS, null);
    const today = getTodayKey();
    const yesterday = getYesterdayKey();
    if (savedStats && typeof savedStats === 'object') {
      const sameDay = savedStats.todayKey === today;
      const validStreak =
        savedStats.lastReadDateKey === today || savedStats.lastReadDateKey === yesterday
          ? Number(savedStats.streak) || 0
          : 0;
      setReadingStats({
        ...DEFAULT_READING_STATS,
        ...savedStats,
        todayKey: today,
        todayVerses: sameDay ? Number(savedStats.todayVerses) || 0 : 0,
        streak: validStreak,
        readSurahs: Array.isArray(savedStats.readSurahs) ? savedStats.readSurahs : [],
      });
    }

    setOfflineAudioIndex(getDownloadedAudioIndex());

    const savedLastRead = safeReadLocalStorage(STORAGE_KEYS.LAST_READ, null);
    if (savedLastRead?.surahNumber) setLastRead(savedLastRead);

    const savedCity = safeReadLocalStorage(STORAGE_KEYS.PRAYER_CITY, null);
    if (savedCity?.id) setSelectedCity(savedCity);

    setHydrated(true);
  }, []);

  // Persist changes to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.SURAH_BOOKMARKS,
        JSON.stringify(surahBookmarks)
      );
    } catch {}
  }, [surahBookmarks, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.VERSE_BOOKMARKS,
        JSON.stringify(verseBookmarks)
      );
    } catch {}
  }, [verseBookmarks, hydrated]);

  useEffect(() => {
    if (!hydrated || !lastRead) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.LAST_READ, JSON.stringify(lastRead));
    } catch {}
  }, [lastRead, hydrated]);

  useEffect(() => {
    if (!hydrated || !selectedCity) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.PRAYER_CITY,
        JSON.stringify(selectedCity)
      );
    } catch {}
  }, [selectedCity, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.VERSE_NOTES,
        JSON.stringify(verseNotes)
      );
    } catch {}
  }, [verseNotes, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.READING_STATS,
        JSON.stringify(readingStats)
      );
    } catch {}
  }, [readingStats, hydrated]);

  const handleChangeColorTheme = useCallback(
    (themeId) => {
      const target = COLOR_THEMES.find((t) => t.id === themeId);
      if (!target) return;
      setColorTheme(target.id);
      document.documentElement.setAttribute('data-color-theme', target.id);
      try {
        window.localStorage.setItem(STORAGE_KEYS.COLOR_THEME, target.id);
      } catch {}
      notify(`Tema warna diubah ke ${target.name}`);
    },
    [notify]
  );

  const pwa = usePwa(notify);

  // Toggle Dark / Light Mode
  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        window.localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        window.localStorage.setItem(STORAGE_KEYS.THEME, 'light');
      }
      return next;
    });
  };

  // Load 114 Surahs
  const loadSurahList = useCallback(async () => {
    setSurahsLoading(true);
    setSurahsError('');
    try {
      const data = await fetchSurahList();
      setSurahs(data);
    } catch (err) {
      setSurahsError(err.message || 'Gagal memuat daftar 114 surah');
    } finally {
      setSurahsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSurahList();
  }, [loadSurahList]);

  // Load selected Surah detail
  const loadSurahDetail = useCallback(async (nomor, targetVerse = null) => {
    setSelectedSurahNumber(nomor);
    setActiveTab('quran');
    setReaderLoading(true);
    setReaderError('');
    setJumpTargetVerse(targetVerse);

    if (typeof window !== 'undefined' && !targetVerse) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    try {
      const data = await fetchSurahDetail(nomor);
      setCurrentSurah(data);
      setLastRead({
        surahNumber: data.nomor,
        surahName: data.namaLatin,
        verseNumber: targetVerse || 1,
        timestamp: Date.now(),
      });
    } catch (err) {
      setReaderError(err.message || 'Gagal memuat isi surah');
    } finally {
      setReaderLoading(false);
    }
  }, []);

  const handleUpdateSettings = useCallback((patch) => {
    const prevQari = settingsRef.current.qariId;
    setSettings((prev) => ({ ...prev, ...patch }));

    // If Qari changed while audio is active, switch audio source immediately
    if (patch.qariId && patch.qariId !== prevQari) {
      setAudioState((curr) => {
        if (!curr.active || !curr.surahData) return curr;
        let newUrl = curr.url;
        if (curr.mode === 'full') {
          newUrl = curr.surahData.audioFull?.[patch.qariId] || curr.url;
        } else if (curr.mode === 'verse') {
          const ayatObj = curr.surahData.ayat?.find(
            (a) => a.nomorAyat === curr.verseNumber
          );
          newUrl = ayatObj?.audio?.[patch.qariId] || curr.url;
        }
        return {
          ...curr,
          url: newUrl,
          playNonce: curr.playNonce + 1,
        };
      });
    }
  }, []);

  // Bookmark handlers
  const handleToggleSurahBookmark = useCallback(
    (surahNomor) => {
      const exists = surahBookmarksRef.current.includes(surahNomor);
      setSurahBookmarks((prev) =>
        exists ? prev.filter((n) => n !== surahNomor) : [surahNomor, ...prev]
      );
      notify(exists ? 'Bookmark surah dihapus' : 'Surah disimpan ke Bookmark');
    },
    [notify]
  );

  const handleToggleVerseBookmark = useCallback(
    (entry) => {
      const exists = verseBookmarksRef.current.some(
        (v) =>
          v.surahNumber === entry.surahNumber &&
          v.verseNumber === entry.verseNumber
      );
      setVerseBookmarks((prev) =>
        exists
          ? prev.filter(
              (v) =>
                !(
                  v.surahNumber === entry.surahNumber &&
                  v.verseNumber === entry.verseNumber
                )
            )
          : [entry, ...prev]
      );
      if (exists) {
        notify(`Bookmark ${entry.surahName}:${entry.verseNumber} dihapus`);
      } else {
        notify(`${entry.surahName}:${entry.verseNumber} disimpan ke Bookmark`);
        setLastRead({
          surahNumber: entry.surahNumber,
          surahName: entry.surahName,
          verseNumber: entry.verseNumber,
          timestamp: Date.now(),
        });
      }
    },
    [notify]
  );

  const handleRemoveVerseBookmark = useCallback(
    (surahNumber, verseNumber) => {
      setVerseBookmarks((prev) =>
        prev.filter(
          (v) => !(v.surahNumber === surahNumber && v.verseNumber === verseNumber)
        )
      );
      notify('Bookmark ayat dihapus');
    },
    [notify]
  );

  const handleMarkLastRead = useCallback((surahObj, verseNumber) => {
    setLastRead({
      surahNumber: surahObj.nomor,
      surahName: surahObj.namaLatin,
      verseNumber,
      timestamp: Date.now(),
    });
  }, []);

  // Verse Notes handlers (PRD Roadmap 7.4)
  const handleSaveVerseNote = useCallback(
    (noteEntry) => {
      const key = `${noteEntry.surahNumber}:${noteEntry.verseNumber}`;
      setVerseNotes((prev) => ({ ...prev, [key]: noteEntry }));
      notify(`Catatan QS. ${noteEntry.surahName}:${noteEntry.verseNumber} disimpan`);
    },
    [notify]
  );

  const handleDeleteVerseNote = useCallback(
    (surahNumber, verseNumber) => {
      const key = `${surahNumber}:${verseNumber}`;
      setVerseNotes((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      notify('Catatan ayat dihapus');
    },
    [notify]
  );

  // Khatam & Daily Reading Stats handlers
  const handleChangeDailyTarget = useCallback(
    (targetNum) => {
      setReadingStats((prev) => ({ ...prev, dailyTarget: targetNum }));
      notify(`Target bacaan harian diubah ke ${targetNum} ayat`);
    },
    [notify]
  );

  const handleResetReadingStats = useCallback(() => {
    setReadingStats((prev) => ({
      ...DEFAULT_READING_STATS,
      dailyTarget: prev.dailyTarget,
      todayKey: getTodayKey(),
    }));
    notify('Progres target bacaan harian berhasil direset');
  }, [notify]);

  const handleMarkSurahCompleted = useCallback(
    (surahObj) => {
      const today = getTodayKey();
      const yesterday = getYesterdayKey();
      setReadingStats((prev) => {
        const baseToday = prev.todayKey === today ? prev.todayVerses : 0;
        let nextStreak = prev.streak || 0;
        if (prev.lastReadDateKey !== today) {
          nextStreak = prev.lastReadDateKey === yesterday ? nextStreak + 1 : 1;
        }
        const readSet = new Set(prev.readSurahs || []);
        readSet.add(surahObj.nomor);
        return {
          ...prev,
          todayKey: today,
          todayVerses: baseToday + (surahObj.jumlahAyat || 1),
          lastReadDateKey: today,
          streak: nextStreak,
          readSurahs: [...readSet],
        };
      });
      notify(
        `Alhamdulillah! +${surahObj.jumlahAyat} ayat (${surahObj.namaLatin}) dicatat ke Target Khatam`
      );
    },
    [notify]
  );

  const handleRefreshOfflineAudio = useCallback(() => {
    setOfflineAudioIndex(getDownloadedAudioIndex());
  }, []);

  // Audio playback handlers
  const handlePlayFullSurah = useCallback(
    (surahData) => {
      const url = surahData.audioFull?.[settings.qariId];
      if (!url) {
        notify('Audio surah ini belum tersedia untuk Qari terpilih');
        return;
      }
      setAudioState((prev) => ({
        active: true,
        isPlaying: true,
        mode: 'full',
        surahNumber: surahData.nomor,
        surahName: surahData.namaLatin,
        verseNumber: null,
        totalVerses: surahData.jumlahAyat,
        url,
        surahData,
        playNonce: prev.playNonce + 1,
      }));
    },
    [settings.qariId, notify]
  );

  const handlePlayVerse = useCallback(
    (surahData, verseNumber) => {
      const ayatObj = surahData.ayat?.find((a) => a.nomorAyat === verseNumber);
      const url = ayatObj?.audio?.[settings.qariId];
      if (!url) {
        notify('Audio ayat ini belum tersedia untuk Qari terpilih');
        return;
      }
      setLastRead({
        surahNumber: surahData.nomor,
        surahName: surahData.namaLatin,
        verseNumber,
        timestamp: Date.now(),
      });
      setAudioState((prev) => ({
        active: true,
        isPlaying: true,
        mode: 'verse',
        surahNumber: surahData.nomor,
        surahName: surahData.namaLatin,
        verseNumber,
        totalVerses: surahData.jumlahAyat,
        url,
        surahData,
        playNonce: prev.playNonce + 1,
      }));
    },
    [settings.qariId, notify]
  );

  const handleTogglePlayPause = useCallback(() => {
    setAudioState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const handleSyncPlayState = useCallback((playing) => {
    setAudioState((prev) =>
      prev.isPlaying === playing ? prev : { ...prev, isPlaying: playing }
    );
  }, []);

  const handleStepVerse = useCallback(
    (delta) => {
      const curr = audioStateRef.current;
      if (!curr.active || curr.mode !== 'verse' || !curr.surahData) return;
      const nextVerse = curr.verseNumber + delta;
      if (nextVerse < 1 || nextVerse > curr.totalVerses) {
        setAudioState((prev) => ({ ...prev, isPlaying: false }));
        return;
      }
      const ayatObj = curr.surahData.ayat?.find(
        (a) => a.nomorAyat === nextVerse
      );
      const url = ayatObj?.audio?.[settingsRef.current.qariId];
      if (!url) {
        setAudioState((prev) => ({ ...prev, isPlaying: false }));
        return;
      }
      setLastRead({
        surahNumber: curr.surahNumber,
        surahName: curr.surahName,
        verseNumber: nextVerse,
        timestamp: Date.now(),
      });
      setAudioState((prev) => ({
        ...prev,
        verseNumber: nextVerse,
        url,
        isPlaying: true,
        playNonce: prev.playNonce + 1,
      }));
    },
    []
  );

  // Auto-Next Verse when verse audio finishes
  const handleAudioEnded = useCallback(() => {
    const curr = audioStateRef.current;
    if (!curr.active) return;
    if (curr.mode === 'verse' && curr.surahData && curr.verseNumber < curr.totalVerses) {
      const nextVerse = curr.verseNumber + 1;
      const ayatObj = curr.surahData.ayat?.find(
        (a) => a.nomorAyat === nextVerse
      );
      const url = ayatObj?.audio?.[settingsRef.current.qariId];
      if (url) {
        setLastRead({
          surahNumber: curr.surahNumber,
          surahName: curr.surahName,
          verseNumber: nextVerse,
          timestamp: Date.now(),
        });
        setAudioState((prev) => ({
          ...prev,
          verseNumber: nextVerse,
          url,
          isPlaying: true,
          playNonce: prev.playNonce + 1,
        }));
        return;
      }
    }
    setAudioState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const handleJumpToPlaying = useCallback(
    (surahNum, verseNum) => {
      if (!surahNum) return;
      setActiveTab('quran');
      if (selectedSurahNumber === surahNum) {
        if (verseNum) setJumpTargetVerse(verseNum);
      } else {
        loadSurahDetail(surahNum, verseNum || null);
      }
    },
    [selectedSurahNumber, loadSurahDetail]
  );

  const handleCloseAudio = useCallback(() => {
    setAudioState(INITIAL_AUDIO_STATE);
  }, []);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'quran' && activeTab === 'quran' && selectedSurahNumber !== null) {
      setSelectedSurahNumber(null);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Dynamic bottom padding so fixed Bottom Nav & Sticky Audio Player NEVER hide content
  const mainBottomPadding = audioState.active
    ? 'pb-48 md:pb-36'
    : 'pb-24 md:pb-12';

  return (
    <div className="min-h-screen bg-canvas text-slate-900 transition-colors duration-200 dark:bg-canvas-dark dark:text-slate-100">
      {/* Intuitive Animated Splash / Loading Screen */}
      <SplashScreen isReady={hydrated && !surahsLoading} />

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-emerald-100/90 bg-white/90 backdrop-blur-md dark:border-emerald-900/60 dark:bg-canvas-dark/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Brand Logo (adapts to active color theme) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('quran');
              setSelectedSurahNumber(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm ring-1 ring-gold-400/50 dark:bg-emerald-500 dark:text-emerald-950"
              aria-hidden="true"
            >
              <BookOpen className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <span className="block text-sm sm:text-base font-extrabold tracking-tight text-emerald-800 dark:text-emerald-300">
                Al-Qur&apos;an Digital
              </span>
              <span className="block text-[11px] font-semibold text-gold-700 dark:text-gold-400">
                Indonesia • Kemenag RI
              </span>
            </div>
          </button>

          {/* Desktop Navigation Tabs (>=768px) */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-1 rounded-2xl bg-emerald-50/70 p-1 ring-1 ring-emerald-100 dark:bg-surface-dark dark:ring-emerald-900/60"
          >
            {TAB_ITEMS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3.5 text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950'
                      : 'text-slate-600 hover:bg-white/80 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls (Sticky Install PWA + Settings + Dark/Light Mode) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={pwa.handleInstallClick}
              aria-label={
                pwa.isInstalled
                  ? "Aplikasi Al-Qur'an Digital sudah terpasang"
                  : "Install aplikasi Al-Qur'an Digital (PWA)"
              }
              title={pwa.isInstalled ? 'PWA Terpasang' : 'Install Aplikasi (PWA)'}
              className={`relative flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-xl border px-2.5 sm:px-3 text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                pwa.isInstalled
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                  : pwa.canPromptInstall
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400'
                  : 'border-emerald-200/80 bg-white text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-900/70 dark:bg-surface-dark dark:text-emerald-300 dark:hover:border-emerald-600'
              }`}
            >
              {pwa.isInstalled ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {pwa.isInstalled ? 'Terpasang' : 'Install PWA'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Pengaturan font, Tema Warna, Mode Hafalan, dan Qari"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200/80 bg-white text-slate-700 transition-colors hover:border-emerald-400 hover:text-emerald-700 dark:border-emerald-900/70 dark:bg-surface-dark dark:text-slate-200 dark:hover:border-emerald-600 cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200/80 bg-white text-gold-600 transition-colors hover:border-gold-400 hover:bg-gold-50 dark:border-emerald-900/70 dark:bg-surface-dark dark:text-gold-400 dark:hover:border-gold-600 dark:hover:bg-gold-950/30 cursor-pointer"
            >
              {isDark ? (
                <Sun className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* PWA Offline Banner */}
      <OfflineBanner isOffline={pwa.isOffline} />

      {/* Main Content Container */}
      <main className={`mx-auto max-w-6xl px-4 pt-5 sm:px-6 ${mainBottomPadding}`}>
        {activeTab === 'quran' && selectedSurahNumber === null && (
          <SurahListView
            surahs={surahs}
            loading={surahsLoading}
            error={surahsError}
            onRetry={loadSurahList}
            onSelectSurah={(nomor, verseNum) => loadSurahDetail(nomor, verseNum)}
            surahBookmarks={surahBookmarks}
            verseBookmarks={verseBookmarks}
            verseNotes={verseNotes}
            readingStats={readingStats}
            onChangeDailyTarget={handleChangeDailyTarget}
            onResetReadingStats={handleResetReadingStats}
            onToggleSurahBookmark={handleToggleSurahBookmark}
            onRemoveVerseBookmark={handleRemoveVerseBookmark}
            onDeleteVerseNote={handleDeleteVerseNote}
            lastRead={lastRead}
          />
        )}

        {activeTab === 'quran' && selectedSurahNumber !== null && (
          <QuranReaderView
            surah={currentSurah}
            loading={readerLoading}
            error={readerError}
            onRetry={() => loadSurahDetail(selectedSurahNumber)}
            onBack={() => setSelectedSurahNumber(null)}
            onNavigateSurah={(nomor) => loadSurahDetail(nomor)}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenTafsir={(surahObj, verseNum) =>
              setTafsirModal({ open: true, surah: surahObj, initialVerse: verseNum })
            }
            onOpenNote={(surahObj, ayatObj) =>
              setNoteModal({ open: true, surah: surahObj, ayat: ayatObj })
            }
            onOpenShare={(surahObj, ayatObj) =>
              setShareModal({ open: true, surah: surahObj, ayat: ayatObj })
            }
            isSurahBookmarked={surahBookmarks.includes(selectedSurahNumber)}
            onToggleSurahBookmark={handleToggleSurahBookmark}
            verseBookmarks={verseBookmarks}
            onToggleVerseBookmark={handleToggleVerseBookmark}
            verseNotes={verseNotes}
            offlineAudioIndex={offlineAudioIndex}
            onRefreshOfflineAudio={handleRefreshOfflineAudio}
            onMarkSurahCompleted={handleMarkSurahCompleted}
            isSurahCompleted={Boolean(
              readingStats.readSurahs?.includes(selectedSurahNumber)
            )}
            audioState={audioState}
            onPlayFullSurah={handlePlayFullSurah}
            onPlayVerse={handlePlayVerse}
            onTogglePlayPause={handleTogglePlayPause}
            jumpTargetVerse={jumpTargetVerse}
            onJumpHandled={() => setJumpTargetVerse(null)}
            onMarkLastRead={handleMarkLastRead}
            onNotify={notify}
          />
        )}

        {activeTab === 'sholat' && (
          <PrayerTimesView
            selectedCity={selectedCity}
            onSelectCity={(city) => {
              setSelectedCity(city);
              notify(`Wilayah jadwal shalat diubah ke ${city.displayName}`);
            }}
            onNotify={notify}
          />
        )}

        {activeTab === 'doa' && (
          <DoaHarianView
            arabicSize={settings.arabicSize}
            latinSize={settings.latinSize}
            translationSize={settings.translationSize}
            onNotify={notify}
          />
        )}

        {activeTab === 'asmaul-husna' && (
          <AsmaulHusnaView onNotify={notify} />
        )}

        {activeTab === 'tasbih' && <TasbihView onNotify={notify} />}

        {/* Footer */}
        <footer className="mt-10 border-t border-emerald-100/90 pt-6 pb-2 text-center text-xs sm:text-sm text-slate-500 dark:border-emerald-900/60 dark:text-slate-400">
          <p>
            &copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> - Dibuat
            dengan niat baik dan secangkir kopi oleh{' '}
            <a
              href="https://www.instagram.com/cecep.maulana_/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--yellow)' }}
              className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
            >
              Cecep Maulanaツ
            </a>
          </p>
        </footer>
      </main>

      {/* Sticky Audio Player Bar (floats cleanly above mobile Bottom Nav) */}
      <AudioPlayerBar
        audioState={audioState}
        qariId={settings.qariId}
        onChangeQari={(qariId) => handleUpdateSettings({ qariId })}
        onTogglePlayPause={handleTogglePlayPause}
        onPrevVerse={() => handleStepVerse(-1)}
        onNextVerse={() => handleStepVerse(1)}
        onAudioEnded={handleAudioEnded}
        onClose={handleCloseAudio}
        onSyncPlayState={handleSyncPlayState}
        onJumpToPlaying={handleJumpToPlaying}
        onNotify={notify}
      />

      {/* Mobile-First Bottom Navigation Bar (<768px only) */}
      <nav
        aria-label="Navigasi Bawah Seluler"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-emerald-100 bg-white/95 backdrop-blur-md pb-safe dark:border-emerald-900/70 dark:bg-canvas-dark/95 md:hidden"
      >
        <div className="grid grid-cols-5 px-1 py-1">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute top-0.5 h-1 w-8 rounded-full bg-emerald-600 dark:bg-emerald-400"
                    aria-hidden="true"
                  />
                )}
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="truncate max-w-full">{tab.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tafsir Kemenag RI Modal */}
      <TafsirModal
        isOpen={tafsirModal.open}
        surah={tafsirModal.surah}
        initialVerse={tafsirModal.initialVerse}
        onClose={() => setTafsirModal({ open: false, surah: null, initialVerse: null })}
      />

      {/* Reader Settings, Theme, Hifz Mode & Qari Modal */}
      <ReaderSettingsModal
        isOpen={settingsOpen}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        colorTheme={colorTheme}
        onChangeColorTheme={handleChangeColorTheme}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Personal Verse Notes (Tadabbur) Modal */}
      <VerseNoteModal
        isOpen={noteModal.open}
        surah={noteModal.surah}
        ayat={noteModal.ayat}
        existingNote={
          noteModal.surah && noteModal.ayat
            ? verseNotes[`${noteModal.surah.nomor}:${noteModal.ayat.nomorAyat}`] || null
            : null
        }
        onSave={handleSaveVerseNote}
        onDelete={handleDeleteVerseNote}
        onClose={() => setNoteModal({ open: false, surah: null, ayat: null })}
      />

      {/* Shareable Verse Card (PNG Export) Modal */}
      <ShareVerseModal
        isOpen={shareModal.open}
        surah={shareModal.surah}
        ayat={shareModal.ayat}
        onClose={() => setShareModal({ open: false, surah: null, ayat: null })}
        onNotify={notify}
      />

      {/* PWA Install Guide Modal (fallback untuk iOS / Firefox / browser tanpa native prompt) */}
      <PwaInstallModal
        isOpen={pwa.installGuideOpen}
        isIos={pwa.isIos}
        isInstalled={pwa.isInstalled}
        canPromptInstall={pwa.canPromptInstall}
        onTriggerNativeInstall={pwa.handleInstallClick}
        onClose={() => pwa.setInstallGuideOpen(false)}
      />

      {/* Accessible Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 z-50 -translate-x-1/2 rounded-xl border border-emerald-500/30 bg-slate-900/95 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xl backdrop-blur-md dark:bg-emerald-950/95 dark:text-emerald-50 ${
            audioState.active ? 'bottom-44 md:bottom-28' : 'bottom-20 md:bottom-6'
          }`}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
