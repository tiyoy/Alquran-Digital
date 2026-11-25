'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Flame,
  Target,
  Sparkles,
  ChevronRight,
  BookCheck,
  RotateCcw,
} from 'lucide-react';
import { cleanArabicText } from '@/lib/arabic';
import { DAILY_VERSES, getDailyVerse } from '@/lib/juzData';

const DAILY_TARGET_OPTIONS = [
  { value: 10, label: '10 ayat' },
  { value: 20, label: '20 ayat' },
  { value: 50, label: '50 ayat' },
  { value: 208, label: '1 Juz (Khatam 30 Hari)' },
];

export default function KhatamTrackerCard({
  readingStats,
  onChangeDailyTarget,
  onResetReadingStats,
  onOpenSurahVerse,
}) {
  const [dailyVerse, setDailyVerse] = useState(DAILY_VERSES[0]);
  const [confirmReset, setConfirmReset] = useState(false);
  const confirmTimerRef = useRef(null);

  useEffect(() => {
    setDailyVerse(getDailyVerse(new Date()));
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const target = readingStats?.dailyTarget || 20;
  const todayVerses = readingStats?.todayVerses || 0;
  const streak = readingStats?.streak || 0;
  const readSurahsCount = readingStats?.readSurahs?.length || 0;
  const hasPartialSurahProgress = Object.keys(
    readingStats?.readVersesBySurah || {}
  ).length > 0;
  const progressPct = Math.min(100, Math.round((todayVerses / target) * 100));
  const isTargetReached = todayVerses >= target;
  const hasProgress =
    todayVerses > 0 || streak > 0 || readSurahsCount > 0 || hasPartialSurahProgress;

  const handleResetClick = () => {
    if (!hasProgress) return;
    if (!confirmReset) {
      setConfirmReset(true);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    setConfirmReset(false);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    onResetReadingStats?.();
  };

  return (
    <section
      aria-label="Target Khatam dan Ayat Pilihan Hari Ini"
      className="grid grid-cols-1 gap-4 lg:grid-cols-12"
    >
      {/* Daily Verse of the Day */}
      <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5 shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-2.5 py-1 text-[11px] font-bold text-gold-700 dark:bg-gold-950/60 dark:text-gold-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ayat Pilihan Hari Ini</span>
          </span>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            QS. {dailyVerse.surahName} : {dailyVerse.verseNumber}
          </span>
        </div>

        <p
          className="arabic-text mt-3 text-right text-2xl sm:text-[26px] text-slate-900 dark:text-slate-50"
          lang="ar"
          dir="rtl"
        >
          {cleanArabicText(dailyVerse.arabic)}
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <p className="flex-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            &ldquo;{dailyVerse.translation}&rdquo;
          </p>
          <button
            type="button"
            onClick={() =>
              onOpenSurahVerse(dailyVerse.surahNumber, dailyVerse.verseNumber)
            }
            className="inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-xl bg-emerald-50 px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900/70 cursor-pointer"
          >
            <span>Buka Ayat</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Khatam & Daily Reading Goal Widget */}
      <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5 shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900 dark:text-slate-100">
            <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Target Bacaan Harian</span>
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-extrabold text-amber-700 dark:bg-[#241A0B] dark:text-amber-300">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{streak} hari</span>
            </span>
            <button
              type="button"
              onClick={handleResetClick}
              disabled={!hasProgress}
              aria-label="Reset progres target bacaan harian"
              title="Reset progres bacaan harian"
              className={`inline-flex min-h-[36px] items-center gap-1 rounded-lg border px-2.5 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                confirmReset
                  ? 'border-red-500 bg-red-600 text-white hover:bg-red-700'
                  : 'border-emerald-200/80 bg-white text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-emerald-900 dark:bg-canvas-dark dark:text-slate-300 dark:hover:border-red-800 dark:hover:text-red-400'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{confirmReset ? 'Yakin?' : 'Reset'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
              {todayVerses} / {target} ayat hari ini
            </span>
            <div className="flex items-center gap-1.5">
              {isTargetReached && (
                <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-extrabold text-gold-800 dark:bg-gold-950/70 dark:text-gold-300">
                  Target Tercapai
                </span>
              )}
              <span className="font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums">
                {progressPct}%
              </span>
            </div>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isTargetReached
                  ? 'bg-gold-500 dark:bg-gold-400'
                  : 'bg-emerald-600 dark:bg-emerald-400'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Footer Stats & Target Picker */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <BookCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>{readSurahsCount} / 114 surah dibaca</span>
          </span>

          <label htmlFor="daily-target-select" className="sr-only">
            Pilih target ayat harian
          </label>
          <select
            id="daily-target-select"
            value={target}
            onChange={(e) => onChangeDailyTarget(Number(e.target.value))}
            className="min-h-[36px] rounded-lg border border-emerald-200 bg-emerald-50/40 px-2 text-xs font-bold text-slate-700 focus:border-emerald-600 focus:outline-none dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-slate-200 cursor-pointer"
          >
            {DAILY_TARGET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white text-slate-900 dark:bg-surface-dark dark:text-slate-100">
                Target: {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
