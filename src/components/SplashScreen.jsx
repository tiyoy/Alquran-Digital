'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { cleanArabicText } from '@/lib/arabic';

const STATUS_MESSAGES = [
  'Menyiapkan mushaf & tipografi Arab HD...',
  'Memuat 114 surah & preferensi Anda...',
  'Siap menemani ibadah hari ini',
];

export default function SplashScreen({ isReady }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(18);
  const [minDelayDone, setMinDelayDone] = useState(false);

  const dismiss = () => {
    setProgress(100);
    setExiting(true);
  };

  // Kunci scroll halaman selama splash aktif
  useEffect(() => {
    if (!visible) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [visible]);

  // Progres intuitif & durasi minimum singkat (~1.15s) + batas maksimum (~2.5s) agar tidak pernah macet
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const t1 = setTimeout(() => setProgress((p) => Math.max(p, 52)), prefersReduced ? 120 : 320);
    const t2 = setTimeout(() => setProgress((p) => Math.max(p, 82)), prefersReduced ? 280 : 760);
    const tMin = setTimeout(() => setMinDelayDone(true), prefersReduced ? 450 : 1150);
    const tMax = setTimeout(() => dismiss(), prefersReduced ? 900 : 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(tMin);
      clearTimeout(tMax);
    };
  }, []);

  // Keluar halus segera setelah data aplikasi siap & durasi minimum terpenuhi
  useEffect(() => {
    if (isReady && minDelayDone && !exiting) {
      setProgress(100);
      const t = setTimeout(() => setExiting(true), 240);
      return () => clearTimeout(t);
    }
  }, [isReady, minDelayDone, exiting]);

  // Unmount total setelah transisi fade-out selesai (480ms)
  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => setVisible(false), 480);
    return () => clearTimeout(t);
  }, [exiting]);

  if (!visible) return null;

  const statusText =
    progress >= 100
      ? STATUS_MESSAGES[2]
      : progress >= 50
      ? STATUS_MESSAGES[1]
      : STATUS_MESSAGES[0];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat Al-Qur'an Digital Indonesia"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-950 px-6 py-8 text-white transition-all duration-500 ease-out dark:from-canvas-dark dark:via-emerald-950 dark:to-teal-950 ${
        exiting ? 'pointer-events-none opacity-0 scale-[1.03]' : 'opacity-100 scale-100'
      }`}
    >
      {/* Pattern & ambient gold glow */}
      <div className="islamic-pattern pointer-events-none absolute inset-0 opacity-45" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/15 blur-3xl"
        aria-hidden="true"
      />

      {/* Top subtle skip button for instant access */}
      <div className="relative z-10 flex w-full max-w-md items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-emerald-50/90 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
          <span>Kemenag RI • PWA</span>
        </span>

        <button
          type="button"
          onClick={dismiss}
          className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-white/10 px-3.5 text-xs font-bold text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 cursor-pointer"
        >
          <span>Lewati</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Center Emblem, Basmalah & Brand */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md splash-fade-up">
        {/* Animated 8-Point Islamic Star + Mushaf Emblem */}
        <div className="relative mb-6 flex h-32 w-32 items-center justify-center">
          {/* Outer slow-rotating geometric Rub el Hizb star */}
          <svg
            viewBox="0 0 120 120"
            className="splash-spin-slow absolute inset-0 h-full w-full text-gold-300/75"
            aria-hidden="true"
          >
            <rect
              x="22"
              y="22"
              width="76"
              height="76"
              rx="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <rect
              x="22"
              y="22"
              width="76"
              height="76"
              rx="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              transform="rotate(45 60 60)"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 6"
              opacity="0.6"
            />
          </svg>

          {/* Center Core Badge */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-gold-300/50 bg-white/15 shadow-2xl backdrop-blur-md">
            <BookOpen className="h-9 w-9 text-gold-200" aria-hidden="true" />
          </div>
        </div>

        {/* Basmalah Calligraphy */}
        <p
          className="arabic-heading text-2xl sm:text-3xl font-normal text-gold-200 drop-shadow-sm"
          lang="ar"
          dir="rtl"
        >
          {cleanArabicText('بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ')}
        </p>

        {/* App Title */}
        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Al-Qur&apos;an Digital Indonesia
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
          Mushaf Uthmani HD • Warna Tajwid • Mode Hafalan • Jadwal Shalat &amp; Kiblat
        </p>

        {/* Intuitive Progress Indicator */}
        <div className="mt-8 w-full max-w-xs space-y-2.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/15 p-0.5 backdrop-blur-sm">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-300 via-gold-400 to-emerald-300 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-emerald-100/90">
            <span className="inline-flex items-center gap-1.5 truncate font-medium">
              {progress >= 100 && (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gold-300" aria-hidden="true" />
              )}
              <span className="truncate">{statusText}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums text-gold-200">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Feature Highlights Strip */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-medium text-emerald-100/75">
        <span>114 Surah &amp; 30 Juz</span>
        <span aria-hidden="true">•</span>
        <span>5 Qari Offline</span>
        <span aria-hidden="true">•</span>
        <span>Tasbih &amp; Doa Harian</span>
      </div>
    </div>
  );
}
