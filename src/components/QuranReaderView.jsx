'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  BookOpenText,
  Bookmark,
  Copy,
  Check,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Info,
  CornerDownRight,
  AlertCircle,
  RefreshCw,
  Palette,
  StickyNote,
  Share2,
  Download,
  HardDrive,
  Trash2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { cleanArabicText, stripHtmlToParagraphs, toArabicDigits } from '@/lib/arabic';
import { TAJWID_RULES, parseTajwidSegments } from '@/lib/tajwid';
import { QARIS } from '@/lib/constants';
import {
  downloadSurahAudioOffline,
  formatBytes,
  makeAudioKey,
  removeDownloadedSurahAudio,
  triggerMp3DeviceDownload,
} from '@/lib/offlineAudio';

function ArabicVerseText({ text, showTajwid }) {
  const cleaned = cleanArabicText(text);
  const segments = useMemo(
    () => (showTajwid ? parseTajwidSegments(cleaned) : null),
    [cleaned, showTajwid]
  );

  if (!showTajwid || !segments) return cleaned;

  return segments.map((seg, idx) =>
    seg.rule ? (
      <span key={idx} className={`tajwid-${seg.rule}`}>
        {seg.text}
      </span>
    ) : (
      <span key={idx}>{seg.text}</span>
    )
  );
}

export default function QuranReaderView({
  surah,
  loading,
  error,
  onRetry,
  onBack,
  onNavigateSurah,
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenTafsir,
  onOpenNote,
  onOpenShare,
  isSurahBookmarked,
  onToggleSurahBookmark,
  verseBookmarks,
  onToggleVerseBookmark,
  verseNotes,
  offlineAudioIndex,
  onRefreshOfflineAudio,
  onMarkSurahCompleted,
  isSurahCompleted,
  audioState,
  onPlayFullSurah,
  onPlayVerse,
  onTogglePlayPause,
  jumpTargetVerse,
  onJumpHandled,
  onMarkLastRead,
  onNotify,
}) {
  const [jumpInput, setJumpInput] = useState('');
  const [highlightedJumpVerse, setHighlightedJumpVerse] = useState(null);
  const [copiedVerse, setCopiedVerse] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showTajwidLegend, setShowTajwidLegend] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [savingMp3, setSavingMp3] = useState(false);

  const verseRefs = useRef(new Map());

  const verseBookmarkSet = useMemo(() => {
    const set = new Set();
    if (!surah) return set;
    for (const vb of verseBookmarks) {
      if (vb.surahNumber === surah.nomor) {
        set.add(vb.verseNumber);
      }
    }
    return set;
  }, [verseBookmarks, surah]);

  const descriptionParagraphs = useMemo(
    () => (surah?.deskripsi ? stripHtmlToParagraphs(surah.deskripsi) : []),
    [surah]
  );

  const activeQari = useMemo(
    () => QARIS.find((q) => q.id === settings.qariId) || QARIS[0],
    [settings.qariId]
  );

  const offlineMeta = useMemo(() => {
    if (!surah) return null;
    return offlineAudioIndex?.[makeAudioKey(surah.nomor, settings.qariId)] || null;
  }, [offlineAudioIndex, surah, settings.qariId]);

  const scrollToVerse = (verseNum, flash = false) => {
    const el = verseRefs.current.get(Number(verseNum));
    if (!el) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'center',
    });
    if (flash) {
      setHighlightedJumpVerse(Number(verseNum));
      setTimeout(() => setHighlightedJumpVerse(null), 2200);
    }
  };

  useEffect(() => {
    if (!loading && surah && jumpTargetVerse) {
      const timer = setTimeout(() => {
        scrollToVerse(jumpTargetVerse, true);
        onJumpHandled?.();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [loading, surah, jumpTargetVerse, onJumpHandled]);

  useEffect(() => {
    if (
      surah &&
      audioState.active &&
      audioState.mode === 'verse' &&
      audioState.surahNumber === surah.nomor &&
      audioState.verseNumber
    ) {
      scrollToVerse(audioState.verseNumber, false);
    }
  }, [
    surah,
    audioState.active,
    audioState.mode,
    audioState.surahNumber,
    audioState.verseNumber,
  ]);

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    if (!surah) return;
    const target = parseInt(jumpInput, 10);
    if (Number.isNaN(target) || target < 1 || target > surah.jumlahAyat) {
      onNotify?.(`Masukkan nomor ayat antara 1 sampai ${surah.jumlahAyat}`);
      return;
    }
    scrollToVerse(target, true);
    onMarkLastRead?.(surah, target);
    setJumpInput('');
  };

  const handleCopyVerse = async (ayat) => {
    if (!surah) return;
    const text = [
      `${surah.namaLatin} (QS. ${surah.nomor}:${ayat.nomorAyat})`,
      cleanArabicText(ayat.teksArab),
      ayat.teksLatin?.trim(),
      `"${ayat.teksIndonesia?.trim()}"`,
      "— Al-Qur'an Digital Indonesia (Terjemahan Kemenag RI)",
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedVerse(ayat.nomorAyat);
      onNotify?.(`QS. ${surah.namaLatin}:${ayat.nomorAyat} disalin ke clipboard`);
      setTimeout(() => setCopiedVerse(null), 1800);
    } catch {
      onNotify?.('Gagal menyalin ayat ke clipboard');
    }
  };

  const handleDownloadOfflineAudio = async () => {
    if (!surah) return;
    const url = surah.audioFull?.[settings.qariId];
    if (!url) {
      onNotify?.('URL audio murottal tidak tersedia untuk Qari ini');
      return;
    }
    setDownloadProgress(1);
    try {
      const saved = await downloadSurahAudioOffline({
        url,
        surahNumber: surah.nomor,
        surahName: surah.namaLatin,
        qariId: settings.qariId,
        qariName: activeQari.shortName,
        onProgress: (pct) => setDownloadProgress(pct),
      });
      onRefreshOfflineAudio?.();
      onNotify?.(
        `Audio ${surah.namaLatin} (${activeQari.shortName}, ${formatBytes(saved.sizeBytes)}) tersimpan untuk mode offline`
      );
    } catch (err) {
      onNotify?.(err.message || 'Gagal menyimpan audio offline');
    } finally {
      setDownloadProgress(null);
    }
  };

  const handleDeleteOfflineAudio = async () => {
    if (!surah) return;
    const url = surah.audioFull?.[settings.qariId];
    await removeDownloadedSurahAudio(surah.nomor, settings.qariId, url);
    onRefreshOfflineAudio?.();
    onNotify?.(`Cache audio offline ${surah.namaLatin} dihapus`);
  };

  const handleDownloadMp3File = async () => {
    if (!surah) return;
    const url = surah.audioFull?.[settings.qariId];
    if (!url) return;
    setSavingMp3(true);
    try {
      const safeSurah = surah.namaLatin.replace(/[^a-zA-Z0-9-]/g, '-');
      const safeQari = activeQari.shortName.replace(/[^a-zA-Z0-9-]/g, '-');
      const filename = `${String(surah.nomor).padStart(3, '0')}-${safeSurah}-${safeQari}.mp3`;
      await triggerMp3DeviceDownload(url, filename);
      onNotify?.(`Mengunduh ${filename}`);
    } catch {
      onNotify?.('Gagal mengunduh file MP3. Periksa koneksi internet Anda.');
    } finally {
      setSavingMp3(false);
    }
  };

  const isPlayingThisSurahFull =
    audioState.active &&
    audioState.mode === 'full' &&
    surah &&
    audioState.surahNumber === surah.nomor;

  const isHifzHiddenAny =
    !settings.showArabic || !settings.showLatin || !settings.showTranslation;

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Memuat ayat surah">
        <div className="h-36 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/60 animate-pulse" />
        <div className="h-16 rounded-2xl bg-white dark:bg-surface-dark border border-emerald-100 dark:border-emerald-900/50 animate-pulse" />
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-5 dark:border-emerald-900/50 dark:bg-surface-dark animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-9 w-16 rounded-lg bg-emerald-100 dark:bg-emerald-950" />
              <div className="flex gap-2">
                <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-emerald-950" />
                <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-emerald-950" />
                <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-emerald-950" />
              </div>
            </div>
            <div className="ml-auto h-10 w-4/5 rounded bg-emerald-100/80 dark:bg-emerald-950" />
            <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-emerald-900/40" />
            <div className="h-4 w-full rounded bg-slate-100 dark:bg-emerald-900/40" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !surah) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-surface-dark dark:text-slate-200 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Kembali ke Daftar Surah</span>
        </button>
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/60 dark:bg-red-950/20"
        >
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
          <p className="text-sm font-bold text-red-800 dark:text-red-300">
            {error || 'Surah tidak dapat dimuat'}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>
    );
  }

  const showBismillah = surah.nomor !== 1 && surah.nomor !== 9;
  const isMakkiyah = surah.tempatTurun?.toLowerCase() === 'mekah';

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-200/80 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-emerald-400 hover:text-emerald-700 dark:border-emerald-900/70 dark:bg-surface-dark dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:text-emerald-300 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Daftar Surah</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSurahBookmark(surah.nomor)}
            aria-label={isSurahBookmarked ? 'Hapus bookmark surah' : 'Bookmark surah ini'}
            aria-pressed={isSurahBookmarked}
            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors cursor-pointer ${
              isSurahBookmarked
                ? 'border-gold-400 bg-gold-50 text-gold-700 dark:border-gold-700 dark:bg-gold-950/50 dark:text-gold-300'
                : 'border-emerald-200/80 bg-white text-slate-700 hover:border-emerald-400 dark:border-emerald-900/70 dark:bg-surface-dark dark:text-slate-200'
            }`}
          >
            <Bookmark
              className={`h-4 w-4 ${isSurahBookmarked ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Bookmark</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTafsir(surah, null)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-white px-3.5 text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 dark:border-emerald-800/80 dark:bg-surface-dark dark:text-emerald-300 dark:hover:bg-emerald-950/70 cursor-pointer"
          >
            <BookOpenText className="h-4 w-4" aria-hidden="true" />
            <span>Tafsir Kemenag</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Pengaturan Tampilan, Tajwid & Mode Hafalan"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400 cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Tampilan &amp; Hifz</span>
          </button>
        </div>
      </div>

      {/* Surah Header Hero Card */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-5 sm:p-7 text-white shadow-soft dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-950">
        <div className="islamic-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-50 backdrop-blur-sm">
            <span>Surah ke-{surah.nomor}</span>
            <span aria-hidden="true">•</span>
            <span>{isMakkiyah ? 'Makkiyah' : 'Madaniyah'}</span>
            <span aria-hidden="true">•</span>
            <span>{surah.jumlahAyat} Ayat</span>
          </div>

          <p
            className="arabic-heading mt-3 text-4xl sm:text-5xl font-normal text-white drop-shadow-sm"
            lang="ar"
            dir="rtl"
          >
            {cleanArabicText(surah.nama)}
          </p>

          <h1 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight">
            {surah.namaLatin}
          </h1>
          <p className="text-sm text-emerald-100">{surah.arti}</p>

          {/* Primary Play Full Surah + Offline Audio Download + Info Actions */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isPlayingThisSurahFull) {
                  onTogglePlayPause();
                } else {
                  onPlayFullSurah(surah);
                }
              }}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-gold-500 px-5 text-sm font-bold text-white shadow-md transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-200 cursor-pointer"
            >
              {isPlayingThisSurahFull && audioState.isPlaying ? (
                <>
                  <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
                  <span>Jeda Full Surah</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  <span>Putar Full Surah</span>
                </>
              )}
            </button>

            {/* Offline Cache Audio Controls (PRD Roadmap 7.5) */}
            {offlineMeta ? (
              <div className="inline-flex items-center gap-1 rounded-xl bg-white/15 p-1 backdrop-blur-sm">
                <span className="inline-flex items-center gap-1.5 px-2.5 text-xs font-bold text-gold-200">
                  <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Offline ({formatBytes(offlineMeta.sizeBytes)})</span>
                </span>
                <button
                  type="button"
                  onClick={handleDeleteOfflineAudio}
                  aria-label="Hapus audio offline surah ini"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-red-500/80 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={downloadProgress !== null}
                onClick={handleDownloadOfflineAudio}
                className="inline-flex min-h-[46px] items-center gap-1.5 rounded-xl bg-white/15 px-4 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25 disabled:opacity-75 cursor-pointer"
              >
                {downloadProgress !== null ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Menyimpan {downloadProgress}%</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="h-4 w-4" aria-hidden="true" />
                    <span>Simpan Offline</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              disabled={savingMp3}
              onClick={handleDownloadMp3File}
              aria-label={`Unduh file MP3 Surah ${surah.namaLatin}`}
              className="inline-flex min-h-[46px] items-center gap-1.5 rounded-xl bg-white/15 px-3.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25 disabled:opacity-70 cursor-pointer"
            >
              {savingMp3 ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              <span>MP3</span>
            </button>

            <button
              type="button"
              onClick={() => setShowInfo((prev) => !prev)}
              aria-expanded={showInfo}
              className="inline-flex min-h-[46px] items-center gap-1.5 rounded-xl bg-white/15 px-3.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25 cursor-pointer"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              <span>Info</span>
            </button>
          </div>

          {showInfo && descriptionParagraphs.length > 0 && (
            <div className="mt-4 max-w-2xl rounded-xl bg-black/20 p-4 text-left text-sm leading-relaxed text-emerald-50/95 backdrop-blur-sm space-y-2">
              {descriptionParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick Controls: Mode Hafalan (Hifz) + Warna Tajwid + Jump to Verse */}
      <section
        aria-label="Kontrol Mode Hafalan, Warna Tajwid, dan Lompat Ayat"
        className="space-y-3 rounded-2xl border border-emerald-100 bg-white p-3.5 sm:p-4 shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Hifz & Tajwid Quick Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Tampilan:
            </span>
            {[
              { key: 'showArabic', label: 'Arab' },
              { key: 'showLatin', label: 'Latin' },
              { key: 'showTranslation', label: 'Terjemahan' },
            ].map((item) => {
              const active = settings[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onUpdateSettings({ [item.key]: !active })}
                  aria-pressed={active}
                  className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-700'
                      : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800'
                  }`}
                >
                  {active ? (
                    <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Warna Tajwid Digital Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !settings.showTajwid;
                onUpdateSettings({ showTajwid: next });
                if (next) setShowTajwidLegend(true);
              }}
              aria-pressed={Boolean(settings.showTajwid)}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                settings.showTajwid
                  ? 'bg-gold-100 text-gold-900 ring-1 ring-gold-400 dark:bg-[#241A0B] dark:text-amber-300 dark:ring-amber-500/60'
                  : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-emerald-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800'
              }`}
            >
              <Palette className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tajwid {settings.showTajwid ? 'ON' : 'OFF'}</span>
            </button>

            {isHifzHiddenAny && (
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    showArabic: true,
                    showLatin: true,
                    showTranslation: true,
                  })
                }
                className="inline-flex min-h-[44px] items-center rounded-xl px-2.5 text-xs font-semibold text-gold-700 hover:bg-gold-50 dark:text-gold-400 dark:hover:bg-gold-950/40 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Jump to Verse Form */}
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
            <label htmlFor="jump-verse-input" className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
              Lompat Ayat:
            </label>
            <input
              id="jump-verse-input"
              type="number"
              min={1}
              max={surah.jumlahAyat}
              inputMode="numeric"
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder={`1 - ${surah.jumlahAyat}`}
              className="w-24 min-h-[44px] rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-slate-100 dark:focus:border-emerald-400"
            />
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-emerald-600 px-3.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 cursor-pointer"
            >
              <CornerDownRight className="h-4 w-4" aria-hidden="true" />
              <span>Buka</span>
            </button>
          </form>
        </div>

        {/* Tajwid Legend Strip when Tajwid mode is ON */}
        {settings.showTajwid && (
          <div className="border-t border-emerald-100 pt-3 dark:border-emerald-900/50">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Panduan Warna Tajwid Digital
              </p>
              <button
                type="button"
                onClick={() => setShowTajwidLegend((v) => !v)}
                className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300 cursor-pointer"
              >
                {showTajwidLegend ? 'Sembunyikan Panduan' : 'Lihat Panduan'}
              </button>
            </div>
            {showTajwidLegend && (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
                {TAJWID_RULES.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-2 rounded-xl bg-emerald-50/40 px-2.5 py-1.5 text-xs dark:bg-canvas-dark/60"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: rule.lightColor }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <span className={`font-bold tajwid-${rule.id}`}>{rule.label}</span>
                      <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">
                        {rule.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Bismillah Banner (except Al-Fatihah & At-Taubah) */}
      {showBismillah && settings.showArabic && (
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/70 via-white to-gold-50/50 px-5 py-5 text-center shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-surface-dark dark:to-gold-950/20">
          <p
            className="arabic-text text-emerald-900 dark:text-emerald-100"
            style={{ fontSize: `${Math.min(Math.max(settings.arabicSize, 26), 42)}px` }}
            lang="ar"
            dir="rtl"
          >
            {cleanArabicText('بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ')}
          </p>
        </div>
      )}

      {/* Warning if all 3 visibility toggles are off */}
      {!settings.showArabic && !settings.showLatin && !settings.showTranslation && (
        <div className="rounded-2xl border border-gold-300 bg-gold-50 p-5 text-center dark:border-gold-800/60 dark:bg-gold-950/30">
          <p className="text-sm font-bold text-gold-800 dark:text-gold-300">
            Semua teks sedang disembunyikan (Mode Hafalan Penuh)
          </p>
          <p className="mt-1 text-xs text-gold-700 dark:text-gold-400">
            Aktifkan kembali Teks Arab, Latin, atau Terjemahan di atas untuk memeriksa bacaan Anda.
          </p>
        </div>
      )}

      {/* Verse List */}
      <div className="space-y-4">
        {surah.ayat.map((ayat) => {
          const isBookmarked = verseBookmarkSet.has(ayat.nomorAyat);
          const noteKey = `${surah.nomor}:${ayat.nomorAyat}`;
          const verseNote = verseNotes?.[noteKey] || null;
          const isThisVersePlaying =
            audioState.active &&
            audioState.mode === 'verse' &&
            audioState.surahNumber === surah.nomor &&
            audioState.verseNumber === ayat.nomorAyat;
          const isJumpHighlighted = highlightedJumpVerse === ayat.nomorAyat;
          const isCopied = copiedVerse === ayat.nomorAyat;

          return (
            <article
              key={ayat.nomorAyat}
              id={`ayat-${ayat.nomorAyat}`}
              ref={(el) => {
                if (el) verseRefs.current.set(ayat.nomorAyat, el);
                else verseRefs.current.delete(ayat.nomorAyat);
              }}
              className={`rounded-2xl border p-4 sm:p-6 transition-all duration-300 ${
                isThisVersePlaying
                  ? 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/30 shadow-soft dark:border-emerald-400 dark:bg-emerald-950/70 dark:ring-emerald-400/25'
                  : isJumpHighlighted
                  ? 'border-gold-500 bg-gold-50/70 ring-2 ring-gold-400/40 dark:border-gold-500 dark:bg-gold-950/30'
                  : 'border-emerald-100/90 bg-white shadow-sm hover:border-emerald-200 dark:border-emerald-900/60 dark:bg-surface-dark dark:hover:border-emerald-800'
              }`}
            >
              {/* Verse Action Row */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-50 pb-3 dark:border-emerald-900/50">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex h-10 min-w-[44px] items-center justify-center rounded-xl px-2.5 text-sm font-extrabold ${
                      isThisVersePlaying
                        ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-emerald-950'
                        : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800'
                    }`}
                  >
                    {surah.nomor}:{ayat.nomorAyat}
                  </span>

                  {isThisVersePlaying && audioState.isPlaying && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                      <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
                        <span className="eq-bar h-3 w-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                        <span className="eq-bar eq-bar-2 h-3 w-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                        <span className="eq-bar eq-bar-3 h-3 w-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      </span>
                      <span>Sedang Diputar</span>
                    </span>
                  )}
                </div>

                {/* Verse Action Buttons (all >=44x44px touch targets) */}
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isThisVersePlaying) {
                        onTogglePlayPause();
                      } else {
                        onPlayVerse(surah, ayat.nomorAyat);
                      }
                    }}
                    aria-label={
                      isThisVersePlaying && audioState.isPlaying
                        ? `Jeda audio ayat ${ayat.nomorAyat}`
                        : `Putar audio ayat ${ayat.nomorAyat}`
                    }
                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      isThisVersePlaying
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950'
                        : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300'
                    }`}
                  >
                    {isThisVersePlaying && audioState.isPlaying ? (
                      <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
                    ) : (
                      <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenTafsir(surah, ayat.nomorAyat)}
                    aria-label={`Baca tafsir Kemenag ayat ${ayat.nomorAyat}`}
                    title="Tafsir Kemenag RI"
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <BookOpenText className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenNote?.(surah, ayat)}
                    aria-label={
                      verseNote
                        ? `Edit catatan pribadi ayat ${ayat.nomorAyat}`
                        : `Tambah catatan pribadi ayat ${ayat.nomorAyat}`
                    }
                    title="Catatan Pribadi / Tadabbur"
                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      verseNote
                        ? 'bg-amber-100 text-amber-800 dark:bg-[#241A0B] dark:text-amber-300'
                        : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300'
                    }`}
                  >
                    <StickyNote className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenShare?.(surah, ayat)}
                    aria-label={`Bagikan kartu ayat ${ayat.nomorAyat}`}
                    title="Bagikan Kartu Ayat PNG"
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyVerse(ayat)}
                    aria-label={`Salin teks ayat ${ayat.nomorAyat}`}
                    title="Salin Ayat"
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onToggleVerseBookmark({
                        surahNumber: surah.nomor,
                        surahName: surah.namaLatin,
                        verseNumber: ayat.nomorAyat,
                        snippet: ayat.teksIndonesia?.slice(0, 75),
                      })
                    }
                    aria-label={
                      isBookmarked
                        ? `Hapus bookmark ayat ${ayat.nomorAyat}`
                        : `Bookmark ayat ${ayat.nomorAyat}`
                    }
                    aria-pressed={isBookmarked}
                    title="Bookmark Ayat"
                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      isBookmarked
                        ? 'bg-gold-50 text-gold-600 dark:bg-gold-950/50 dark:text-gold-400'
                        : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300'
                    }`}
                  >
                    <Bookmark
                      className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              {/* HD Uthmani Arabic Text (with optional Warna Tajwid Digital) */}
              {settings.showArabic && (
                <div className="mb-4 text-right" dir="rtl" lang="ar">
                  <p
                    className="arabic-text text-slate-900 dark:text-slate-50"
                    style={{ fontSize: `${settings.arabicSize}px` }}
                  >
                    <ArabicVerseText
                      text={ayat.teksArab}
                      showTajwid={Boolean(settings.showTajwid)}
                    />{' '}
                    <span
                      className="inline-flex items-center justify-center px-1.5 text-[0.72em] text-gold-600 dark:text-gold-400 select-none"
                      aria-hidden="true"
                    >
                      ﴿{toArabicDigits(ayat.nomorAyat)}﴾
                    </span>
                  </p>
                </div>
              )}

              {/* Latin Transliteration */}
              {settings.showLatin && ayat.teksLatin && (
                <p
                  className="mb-2.5 font-medium italic text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed max-w-3xl"
                  style={{ fontSize: `${settings.latinSize ?? 14}px` }}
                >
                  {ayat.teksLatin.trim()}
                </p>
              )}

              {/* Indonesian Translation (Kemenag RI) */}
              {settings.showTranslation && ayat.teksIndonesia && (
                <p
                  className="text-slate-700 dark:text-slate-200 leading-relaxed max-w-3xl"
                  style={{ fontSize: `${settings.translationSize}px` }}
                >
                  {ayat.teksIndonesia.trim()}
                </p>
              )}

              {/* Inline Personal Tadabbur Note Callout if present */}
              {verseNote && (
                <div className="mt-4 rounded-xl border border-amber-300/80 bg-amber-50/80 p-3.5 dark:border-amber-700/50 dark:bg-[#241A0B]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 dark:text-amber-300">
                      <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Catatan Tadabbur Anda</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenNote?.(surah, ayat)}
                      className="text-xs font-bold text-amber-800 hover:underline dark:text-amber-300 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-amber-50/90 whitespace-pre-line">
                    {verseNote.text}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Khatam / Mark Surah Completed Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/40">
        <div className="text-center sm:text-left">
          <p className="text-sm font-extrabold text-emerald-900 dark:text-emerald-100">
            Selesai membaca Surah {surah.namaLatin}?
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Catat {surah.jumlahAyat} ayat ini ke Target Khatam &amp; Streak bacaan harian Anda.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onMarkSurahCompleted?.(surah)}
          className={`inline-flex min-h-[46px] shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold shadow-sm transition-colors cursor-pointer ${
            isSurahCompleted
              ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-900/70 dark:text-emerald-200'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <span>{isSurahCompleted ? 'Sudah Dicatat (Tambah Lagi)' : 'Tandai Selesai Dibaca'}</span>
        </button>
      </div>

      {/* Previous & Next Surah Footer Navigation */}
      <nav
        aria-label="Navigasi antar surah"
        className="flex items-center justify-between gap-3 pt-2"
      >
        {surah.suratSebelumnya ? (
          <button
            type="button"
            onClick={() => onNavigateSurah(surah.suratSebelumnya.nomor)}
            className="flex min-h-[54px] min-w-0 flex-1 sm:flex-initial items-center gap-2.5 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-left shadow-sm transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-emerald-900/70 dark:bg-surface-dark dark:hover:border-emerald-600 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Surah Sebelumnya
              </p>
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                {surah.suratSebelumnya.namaLatin}
              </p>
            </div>
          </button>
        ) : (
          <div />
        )}

        {surah.suratSelanjutnya ? (
          <button
            type="button"
            onClick={() => onNavigateSurah(surah.suratSelanjutnya.nomor)}
            className="flex min-h-[54px] min-w-0 flex-1 sm:flex-initial items-center justify-end gap-2.5 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-right shadow-sm transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-emerald-900/70 dark:bg-surface-dark dark:hover:border-emerald-600 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Surah Selanjutnya
              </p>
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                {surah.suratSelanjutnya.namaLatin}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </button>
        ) : (
          <div />
        )}
      </nav>
    </div>
  );
}
