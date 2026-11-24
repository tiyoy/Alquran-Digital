'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  Bookmark,
  BookOpen,
  X,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
  StickyNote,
  Layers,
  List,
} from 'lucide-react';
import { cleanArabicText } from '@/lib/arabic';
import { JUZ_LIST } from '@/lib/juzData';
import KhatamTrackerCard from '@/components/KhatamTrackerCard';

const FILTER_OPTIONS = [
  { id: 'semua', label: 'Semua Surah' },
  { id: 'makkiyah', label: 'Makkiyah' },
  { id: 'madaniyah', label: 'Madaniyah' },
  { id: 'bookmark', label: 'Bookmark' },
  { id: 'catatan', label: 'Catatan' },
];

export default function SurahListView({
  surahs,
  loading,
  error,
  onRetry,
  onSelectSurah,
  surahBookmarks,
  verseBookmarks,
  verseNotes,
  readingStats,
  onChangeDailyTarget,
  onResetReadingStats,
  onToggleSurahBookmark,
  onRemoveVerseBookmark,
  onDeleteVerseNote,
  lastRead,
}) {
  const [browseMode, setBrowseMode] = useState('surah'); // 'surah' | 'juz'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('semua');

  const bookmarkedSurahSet = useMemo(() => new Set(surahBookmarks), [surahBookmarks]);

  const surahsWithBookmarkedVerses = useMemo(() => {
    const set = new Set();
    for (const vb of verseBookmarks) {
      set.add(vb.surahNumber);
    }
    return set;
  }, [verseBookmarks]);

  const notesList = useMemo(
    () =>
      Object.values(verseNotes || {}).sort(
        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
      ),
    [verseNotes]
  );

  const surahsWithNotes = useMemo(() => {
    const set = new Set();
    for (const n of notesList) {
      set.add(n.surahNumber);
    }
    return set;
  }, [notesList]);

  const filteredSurahs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return surahs.filter((surah) => {
      if (activeFilter === 'makkiyah' && surah.tempatTurun?.toLowerCase() !== 'mekah') {
        return false;
      }
      if (activeFilter === 'madaniyah' && surah.tempatTurun?.toLowerCase() !== 'madinah') {
        return false;
      }
      if (
        activeFilter === 'bookmark' &&
        !bookmarkedSurahSet.has(surah.nomor) &&
        !surahsWithBookmarkedVerses.has(surah.nomor)
      ) {
        return false;
      }
      if (activeFilter === 'catatan' && !surahsWithNotes.has(surah.nomor)) {
        return false;
      }

      if (!q) return true;
      const nomorStr = String(surah.nomor);
      const latin = (surah.namaLatin || '').toLowerCase();
      const latinNormalized = latin.replace(/[-'\s]/g, '');
      const qNormalized = q.replace(/[-'\s]/g, '');
      const arti = (surah.arti || '').toLowerCase();
      const nama = surah.nama || '';

      return (
        nomorStr === q ||
        nomorStr.includes(q) ||
        latin.includes(q) ||
        latinNormalized.includes(qNormalized) ||
        arti.includes(q) ||
        nama.includes(searchQuery.trim())
      );
    });
  }, [
    surahs,
    searchQuery,
    activeFilter,
    bookmarkedSurahSet,
    surahsWithBookmarkedVerses,
    surahsWithNotes,
  ]);

  const filteredJuz = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return JUZ_LIST;
    return JUZ_LIST.filter(
      (j) =>
        String(j.juz) === q ||
        `juz ${j.juz}`.includes(q) ||
        j.startName.toLowerCase().includes(q) ||
        j.endName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const totalBookmarksCount = surahBookmarks.length + verseBookmarks.length;
  const totalNotesCount = notesList.length;

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-5 sm:p-7 text-white shadow-soft dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-950">
        <div className="islamic-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold-400/20 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-50 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
              <span>Terjemahan &amp; Tafsir Kemenag RI • Tajwid • 5 Qari Offline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Al-Qur&apos;an Digital Indonesia
            </h1>
            <p className="text-sm sm:text-base text-emerald-50/90 leading-relaxed">
              Baca 114 surah &amp; 30 Juz dengan mushaf Uthmani HD, Warna Tajwid Digital, Mode Hafalan (Hifz), catatan tadabbur, serta audio murottal offline.
            </p>
          </div>

          {lastRead ? (
            <button
              type="button"
              onClick={() => onSelectSurah(lastRead.surahNumber, lastRead.verseNumber)}
              className="group flex min-h-[60px] items-center justify-between gap-3 rounded-xl border border-gold-300/40 bg-white/15 px-4 py-3 text-left backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 cursor-pointer md:min-w-[260px]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-500/90 text-white shadow-sm">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-200">
                    Terakhir Dibaca
                  </p>
                  <p className="truncate text-sm font-bold text-white">
                    {lastRead.surahName}
                  </p>
                  <p className="text-xs text-emerald-100">
                    QS. {lastRead.surahNumber} : Ayat {lastRead.verseNumber}
                  </p>
                </div>
              </div>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-gold-200 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectSurah(1)}
              className="group inline-flex min-h-[48px] items-center justify-center gap-2 self-start rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-200 cursor-pointer md:self-center"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>Mulai Baca Al-Fatihah</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {/* Daily Verse & Khatam Tracker Widget */}
      <KhatamTrackerCard
        readingStats={readingStats}
        onChangeDailyTarget={onChangeDailyTarget}
        onResetReadingStats={onResetReadingStats}
        onOpenSurahVerse={(surahNum, verseNum) => onSelectSurah(surahNum, verseNum)}
      />

      {/* Mode Switcher (114 Surah vs 30 Juz) + Search */}
      <section className="space-y-3" aria-label="Pencarian dan filter surah atau juz">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* 114 Surah / 30 Juz Toggle */}
          <div
            role="tablist"
            aria-label="Mode tampilan daftar"
            className="inline-flex shrink-0 rounded-xl border border-emerald-200/80 bg-white p-1 shadow-sm dark:border-emerald-900/70 dark:bg-surface-dark"
          >
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'surah'}
              onClick={() => setBrowseMode('surah')}
              className={`inline-flex min-h-[40px] flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg px-3.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                browseMode === 'surah'
                  ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950'
                  : 'text-slate-600 hover:text-emerald-700 dark:text-slate-300'
              }`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
              <span>114 Surah</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'juz'}
              onClick={() => setBrowseMode('juz')}
              className={`inline-flex min-h-[40px] flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg px-3.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                browseMode === 'juz'
                  ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950'
                  : 'text-slate-600 hover:text-emerald-700 dark:text-slate-300'
              }`}
            >
              <Layers className="h-4 w-4" aria-hidden="true" />
              <span>30 Juz</span>
            </button>
          </div>

          {/* Search input */}
          <div className="relative flex-1">
            <label htmlFor="surah-search-input" className="sr-only">
              {browseMode === 'surah'
                ? 'Cari surah berdasarkan nama, latin, nomor, atau arti'
                : 'Cari Juz 1 sampai 30 atau nama surah'}
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
            <input
              id="surah-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                browseMode === 'surah'
                  ? 'Cari surah (contoh: Yasin, 36, Pembukaan, الكهف)...'
                  : 'Cari Juz (contoh: Juz 30, Al-Mulk, Yasin)...'
              }
              className="w-full min-h-[48px] rounded-xl border border-emerald-200/80 bg-white pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-900/70 dark:bg-surface-dark dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus pencarian"
                className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-emerald-950 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips (only in Surah mode) */}
        {browseMode === 'surah' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5" role="tablist" aria-label="Filter kategori surah">
            {FILTER_OPTIONS.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950'
                      : 'border border-emerald-200/70 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-emerald-900/70 dark:bg-surface-dark dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:text-emerald-300'
                  }`}
                >
                  {filter.id === 'bookmark' && (
                    <Bookmark className="h-4 w-4" aria-hidden="true" />
                  )}
                  {filter.id === 'catatan' && (
                    <StickyNote className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{filter.label}</span>
                  {filter.id === 'bookmark' && totalBookmarksCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                        isActive
                          ? 'bg-white/25 text-white dark:bg-emerald-950/25 dark:text-emerald-950'
                          : 'bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300'
                      }`}
                    >
                      {totalBookmarksCount}
                    </span>
                  )}
                  {filter.id === 'catatan' && totalNotesCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                        isActive
                          ? 'bg-white/25 text-white dark:bg-emerald-950/25 dark:text-emerald-950'
                          : 'bg-amber-100 text-amber-800 dark:bg-[#241A0B] dark:text-amber-300'
                      }`}
                    >
                      {totalNotesCount}
                    </span>
                  )}
                </button>
              );
            })}
            {!loading && (
              <span className="ml-auto hidden lg:inline-block shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                Menampilkan {filteredSurahs.length} dari {surahs.length} surah
              </span>
            )}
          </div>
        )}
      </section>

      {/* 30 Juz Directory View */}
      {browseMode === 'juz' && (
        <section aria-label="Daftar 30 Juz Al-Qur'an">
          {filteredJuz.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/80 p-10 text-center dark:border-emerald-900/60 dark:bg-surface-dark/60">
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                Juz tidak ditemukan
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white cursor-pointer"
              >
                Tampilkan Semua 30 Juz
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredJuz.map((item) => (
                <button
                  key={item.juz}
                  type="button"
                  onClick={() => onSelectSurah(item.startSurah, item.startAyat)}
                  className="group flex min-h-[82px] items-center justify-between gap-3 rounded-2xl border border-emerald-100/90 bg-white p-4 text-left shadow-sm transition-all hover:border-emerald-400 hover:shadow-soft dark:border-emerald-900/60 dark:bg-surface-dark dark:hover:border-emerald-600 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800">
                      <span className="text-[10px] font-bold uppercase leading-none opacity-80">Juz</span>
                      <span className="text-base font-extrabold leading-tight">{item.juz}</span>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
                        Mulai: {item.startName} : {item.startAyat}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Sampai: {item.endName} : {item.endAyat}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Surah Browse Content */}
      {browseMode === 'surah' && (
        <>
          {/* Bookmarked Verses Section when in Bookmark filter */}
          {activeFilter === 'bookmark' && verseBookmarks.length > 0 && (
            <section className="rounded-2xl border border-gold-200/80 bg-gold-50/70 p-4 dark:border-gold-800/50 dark:bg-gold-950/30">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-gold-800 dark:text-gold-300">
                  <Bookmark className="h-4 w-4 fill-current" aria-hidden="true" />
                  <span>Ayat Tersimpan ({verseBookmarks.length})</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {verseBookmarks.map((vb) => (
                  <div
                    key={`${vb.surahNumber}:${vb.verseNumber}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-gold-200/80 bg-white p-3 shadow-sm dark:border-gold-900/40 dark:bg-surface-dark"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectSurah(vb.surahNumber, vb.verseNumber)}
                      className="min-w-0 flex-1 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
                    >
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                        {vb.surahName} • Ayat {vb.verseNumber}
                      </p>
                      {vb.snippet && (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {vb.snippet}
                        </p>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveVerseBookmark(vb.surahNumber, vb.verseNumber)}
                      aria-label={`Hapus bookmark ${vb.surahName} ayat ${vb.verseNumber}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 cursor-pointer"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Personal Verse Notes Section when in Catatan filter */}
          {activeFilter === 'catatan' && notesList.length > 0 && (
            <section className="rounded-2xl border border-amber-300/80 bg-amber-50/70 p-4 dark:border-amber-700/50 dark:bg-[#241A0B]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-300">
                  <StickyNote className="h-4 w-4" aria-hidden="true" />
                  <span>Catatan &amp; Tadabbur Pribadi ({notesList.length})</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {notesList.map((note) => (
                  <div
                    key={`${note.surahNumber}:${note.verseNumber}`}
                    className="flex items-start justify-between gap-2 rounded-xl border border-amber-200/80 bg-white p-3.5 shadow-sm dark:border-amber-800/40 dark:bg-surface-dark"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectSurah(note.surahNumber, note.verseNumber)}
                      className="min-w-0 flex-1 text-left cursor-pointer space-y-1"
                    >
                      <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
                        QS. {note.surahName} : Ayat {note.verseNumber}
                      </p>
                      <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line line-clamp-3">
                        {note.text}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteVerseNote(note.surahNumber, note.verseNumber)}
                      aria-label={`Hapus catatan ${note.surahName} ayat ${note.verseNumber}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Error State */}
          {error && !loading && (
            <div
              role="alert"
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/60 dark:bg-red-950/20"
            >
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-800 dark:text-red-300">
                  Gagal Memuat Daftar Surah
                </p>
                <p className="text-xs text-red-700/80 dark:text-red-300/80">{error}</p>
              </div>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}

          {/* Skeleton Loading State */}
          {loading && (
            <div
              className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 md:gap-4"
              aria-busy="true"
              aria-label="Memuat 114 surah"
            >
              {Array.from({ length: 12 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white p-4 dark:border-emerald-900/50 dark:bg-surface-dark animate-pulse"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950" />
                    <div className="space-y-2">
                      <div className="h-4 w-28 rounded bg-slate-200 dark:bg-emerald-900/60" />
                      <div className="h-3 w-36 rounded bg-slate-100 dark:bg-emerald-950/80" />
                    </div>
                  </div>
                  <div className="h-7 w-16 rounded bg-emerald-100 dark:bg-emerald-950" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredSurahs.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-white/80 p-10 text-center dark:border-emerald-900/60 dark:bg-surface-dark/60">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                {activeFilter === 'bookmark' ? (
                  <Bookmark className="h-6 w-6" aria-hidden="true" />
                ) : activeFilter === 'catatan' ? (
                  <StickyNote className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Search className="h-6 w-6" aria-hidden="true" />
                )}
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                {activeFilter === 'bookmark'
                  ? 'Belum ada surah atau ayat yang di-bookmark'
                  : activeFilter === 'catatan'
                  ? 'Belum ada catatan tadabbur pribadi'
                  : 'Surah tidak ditemukan'}
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {activeFilter === 'bookmark'
                  ? 'Tekan ikon bookmark pada kartu surah atau ayat saat membaca untuk menyimpannya di sini.'
                  : activeFilter === 'catatan'
                  ? 'Tekan ikon catatan pada ayat saat membaca Al-Qur\'an untuk menyimpan refleksi pribadi Anda.'
                  : `Tidak ada hasil yang cocok untuk "${searchQuery}". Coba kata kunci atau nomor surah lain.`}
              </p>
              {(searchQuery || activeFilter !== 'semua') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('semua');
                  }}
                  className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  Tampilkan Semua 114 Surah
                </button>
              )}
            </div>
          )}

          {/* Mobile Compact List (<768px) & Desktop/Tablet Grid Cards (>=768px) */}
          {!loading && !error && filteredSurahs.length > 0 && (
            <>
              <div className="divide-y divide-emerald-100 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm dark:divide-emerald-900/50 dark:border-emerald-900/60 dark:bg-surface-dark md:hidden">
                {filteredSurahs.map((surah) => {
                  const isBookmarked = bookmarkedSurahSet.has(surah.nomor);
                  const isMakkiyah = surah.tempatTurun?.toLowerCase() === 'mekah';
                  return (
                    <div
                      key={surah.nomor}
                      className="flex w-full min-w-0 items-center gap-1.5 px-2.5 py-2.5 transition-colors hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectSurah(surah.nomor)}
                        className="flex min-h-[56px] min-w-0 flex-1 items-center justify-between gap-2 overflow-hidden text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl px-1"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800/70">
                            {surah.nomor}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                              {surah.namaLatin}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {surah.arti}
                            </p>
                            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {surah.jumlahAyat} ayat •{' '}
                              <span
                                className={
                                  isMakkiyah
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-gold-700 dark:text-gold-400'
                                }
                              >
                                {isMakkiyah ? 'Makkiyah' : 'Madaniyah'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <span
                          className="arabic-heading shrink-0 pl-1 text-lg font-normal text-emerald-800 dark:text-emerald-300"
                          lang="ar"
                          dir="rtl"
                        >
                          {cleanArabicText(surah.nama)}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleSurahBookmark(surah.nomor)}
                        aria-label={
                          isBookmarked
                            ? `Hapus bookmark Surah ${surah.namaLatin}`
                            : `Simpan bookmark Surah ${surah.namaLatin}`
                        }
                        aria-pressed={isBookmarked}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          isBookmarked
                            ? 'bg-gold-50 text-gold-600 dark:bg-gold-950/50 dark:text-gold-400'
                            : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-300'
                        }`}
                      >
                        <Bookmark
                          className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSurahs.map((surah) => {
                  const isBookmarked = bookmarkedSurahSet.has(surah.nomor);
                  const isMakkiyah = surah.tempatTurun?.toLowerCase() === 'mekah';
                  return (
                    <article
                      key={surah.nomor}
                      className="group relative flex flex-col justify-between rounded-2xl border border-emerald-100/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-emerald-400 hover:shadow-soft dark:border-emerald-900/60 dark:bg-surface-dark dark:hover:border-emerald-600 dark:hover:shadow-soft-dark"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onSelectSurah(surah.nomor)}
                          className="flex min-w-0 flex-1 items-start gap-3.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
                        >
                          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-extrabold text-emerald-700 ring-1 ring-emerald-200/80 transition-colors group-hover:bg-emerald-600 group-hover:text-white group-hover:ring-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800/80 dark:group-hover:bg-emerald-500 dark:group-hover:text-emerald-950">
                            {surah.nomor}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h2 className="truncate text-base font-bold text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
                              {surah.namaLatin}
                            </h2>
                            <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                              {surah.arti}
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleSurahBookmark(surah.nomor)}
                          aria-label={
                            isBookmarked
                              ? `Hapus bookmark Surah ${surah.namaLatin}`
                              : `Simpan bookmark Surah ${surah.namaLatin}`
                          }
                          aria-pressed={isBookmarked}
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                            isBookmarked
                              ? 'bg-gold-50 text-gold-600 dark:bg-gold-950/50 dark:text-gold-400'
                              : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-300'
                          }`}
                        >
                          <Bookmark
                            className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`}
                            aria-hidden="true"
                          />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectSurah(surah.nomor)}
                        className="mt-4 flex items-end justify-between border-t border-emerald-50 pt-3 text-left cursor-pointer dark:border-emerald-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              isMakkiyah
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-gold-50 text-gold-700 dark:bg-gold-950/60 dark:text-gold-300'
                            }`}
                          >
                            {isMakkiyah ? 'Makkiyah' : 'Madaniyah'}
                          </span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {surah.jumlahAyat} Ayat
                          </span>
                        </div>

                        <span
                          className="arabic-heading text-2xl font-normal text-emerald-800 dark:text-emerald-300"
                          lang="ar"
                          dir="rtl"
                        >
                          {cleanArabicText(surah.nama)}
                        </span>
                      </button>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
