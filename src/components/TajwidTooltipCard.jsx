'use client';

import { useEffect, useState } from 'react';
import { X, BookOpen, Volume2, Sparkles } from 'lucide-react';
import { getTajwidRuleById } from '@/lib/tajwid';

export default function TajwidTooltipCard({
  activeTajwid,
  hasActiveAudio,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) {
  const [viewport, setViewport] = useState({ width: 1024, height: 768 });

  useEffect(() => {
    const syncViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  if (!activeTajwid || !activeTajwid.detail) return null;

  const { ruleId, text, detail, pinned, rect } = activeTajwid;
  const ruleMeta = getTajwidRuleById(ruleId);
  const accentColor = ruleMeta?.lightColor || '#059669';
  const isDesktop = viewport.width >= 640 && Boolean(rect);

  let desktopStyle = undefined;
  if (isDesktop && rect) {
    const cardWidth = Math.min(352, viewport.width - 24);
    const preferredLeft = rect.left + rect.width / 2 - cardWidth / 2;
    const clampedLeft = Math.min(
      Math.max(preferredLeft, 12),
      viewport.width - cardWidth - 12
    );

    const showAbove = rect.top > 270;
    desktopStyle = {
      width: `${cardWidth}px`,
      left: `${clampedLeft}px`,
      ...(showAbove
        ? { bottom: `${Math.max(12, viewport.height - rect.top + 10)}px` }
        : { top: `${Math.min(rect.bottom + 10, viewport.height - 260)}px` }),
    };
  }

  return (
    <div
      role="dialog"
      aria-label={`Keterangan tajwid ${detail.hukum}`}
      data-tajwid-popover="true"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => e.stopPropagation()}
      style={desktopStyle}
      className={
        isDesktop
          ? 'fixed z-50 overflow-hidden rounded-2xl border border-emerald-200/90 bg-white/95 shadow-2xl backdrop-blur-md dark:border-emerald-800/80 dark:bg-surface-modal/95'
          : `fixed inset-x-3 z-50 overflow-hidden rounded-2xl border border-emerald-200/90 bg-white/95 shadow-2xl backdrop-blur-md dark:border-emerald-800/80 dark:bg-surface-modal/95 ${
              hasActiveAudio
                ? 'bottom-[calc(176px+env(safe-area-inset-bottom,0px))]'
                : 'bottom-[calc(76px+env(safe-area-inset-bottom,0px))]'
            }`
      }
    >
      {/* Colored Accent Bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} aria-hidden="true" />

      <div className="p-4 space-y-3">
        {/* Header: Arabic Snippet + Hukum + Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              dir="rtl"
              lang="ar"
              className={`arabic-heading shrink-0 rounded-xl bg-emerald-50/80 px-3 py-0.5 text-2xl font-normal ring-1 ring-emerald-200/70 dark:bg-emerald-950/70 dark:ring-emerald-800/60 tajwid-${ruleId}`}
            >
              {text}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-extrabold leading-tight tajwid-${ruleId}`}>
                {detail.hukum}
              </p>
              <span className="mt-1 inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                {detail.tempo}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup keterangan tajwid"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-emerald-950 dark:hover:text-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Detail Rows: Jenis, Hukum, Cara Baca */}
        <dl className="space-y-2 text-xs leading-relaxed">
          <div className="rounded-xl bg-emerald-50/50 px-3 py-2 dark:bg-canvas-dark/70">
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Jenis Tajwid</span>
            </dt>
            <dd className="mt-0.5 font-bold text-slate-800 dark:text-slate-100">
              {detail.jenis}
            </dd>
          </div>

          <div className="rounded-xl bg-emerald-50/50 px-3 py-2 dark:bg-canvas-dark/70">
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <BookOpen className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Hukum Tajwid</span>
            </dt>
            <dd className="mt-0.5 text-slate-800 dark:text-slate-100">
              <span className="font-bold">{detail.hukum}</span>
              {detail.triggerText && (
                <span className="text-slate-600 dark:text-slate-300">
                  {' '}— {detail.triggerText}
                </span>
              )}
            </dd>
          </div>

          <div className="rounded-xl bg-emerald-50/50 px-3 py-2 dark:bg-canvas-dark/70">
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Volume2 className="h-3 w-3 text-gold-600 dark:text-gold-400" aria-hidden="true" />
              <span>Cara Baca</span>
            </dt>
            <dd className="mt-0.5 text-slate-700 dark:text-slate-200">
              {detail.caraBaca}
            </dd>
          </div>
        </dl>

        {isDesktop && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {pinned
              ? 'Disematkan • Klik area luar atau tekan Esc untuk menutup'
              : 'Klik huruf untuk menyematkan keterangan ini'}
          </p>
        )}
      </div>
    </div>
  );
}
