'use client';

import { useEffect } from 'react';
import {
  X,
  SlidersHorizontal,
  Minus,
  Plus,
  RotateCcw,
  Volume2,
  Eye,
  EyeOff,
  Palette,
  Check,
} from 'lucide-react';
import {
  ARABIC_SIZE_RANGE,
  COLOR_THEMES,
  DEFAULT_SETTINGS,
  LATIN_SIZE_RANGE,
  QARIS,
  TRANSLATION_SIZE_RANGE,
} from '@/lib/constants';
import { cleanArabicText } from '@/lib/arabic';

export default function ReaderSettingsModal({
  isOpen,
  settings,
  onUpdateSettings,
  colorTheme,
  onChangeColorTheme,
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const latinSize = settings.latinSize ?? DEFAULT_SETTINGS.latinSize;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-emerald-200/80 bg-white shadow-2xl dark:border-emerald-900/70 dark:bg-surface-modal sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4 dark:border-emerald-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="settings-modal-title"
                className="text-base font-extrabold text-slate-900 dark:text-slate-100"
              >
                Tampilan, Tema, Hifz &amp; Qari
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preferensi otomatis tersimpan di perangkat Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-emerald-950 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Live Preview */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Pratinjau Tipografi Arab, Latin &amp; Terjemahan
            </p>
            {settings.showArabic ? (
              <p
                className="arabic-text text-right text-slate-900 dark:text-slate-100"
                style={{ fontSize: `${settings.arabicSize}px` }}
                lang="ar"
                dir="rtl"
              >
                {cleanArabicText('بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ')}
              </p>
            ) : (
              <p className="py-2 text-center text-xs italic text-slate-500 dark:text-slate-400">
                Teks Arab disembunyikan (Mode Hafalan)
              </p>
            )}
            {settings.showLatin && (
              <p
                className="mt-1 italic text-emerald-800 dark:text-emerald-300 leading-relaxed"
                style={{ fontSize: `${latinSize}px` }}
              >
                Bismillāhir-raḥmānir-raḥīm(i).
              </p>
            )}
            {settings.showTranslation && (
              <p
                className="mt-1 text-slate-700 dark:text-slate-200 leading-relaxed"
                style={{ fontSize: `${settings.translationSize}px` }}
              >
                Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang.
              </p>
            )}
          </div>

          {/* Tema Warna Aplikasi */}
          <div className="space-y-2.5">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Palette className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tema Warna Aplikasi</span>
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {COLOR_THEMES.map((theme) => {
                const isSelected = colorTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onChangeColorTheme?.(theme.id)}
                    aria-pressed={isSelected}
                    className={`flex min-h-[52px] items-center justify-between gap-2.5 rounded-xl border px-3.5 py-2 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/30 dark:border-emerald-400 dark:bg-emerald-950/70 dark:text-emerald-100'
                        : 'border-emerald-100 bg-white text-slate-700 hover:border-emerald-300 dark:border-emerald-900/60 dark:bg-surface-dark dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm ring-2 ring-white dark:ring-slate-900"
                        style={{ backgroundColor: theme.swatch }}
                        aria-hidden="true"
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{theme.name}</p>
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {theme.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Hafalan (Hifz Visibility Toggles) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mode Hafalan (Hifz Visibility)
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  key: 'showArabic',
                  label: 'Teks Arab Uthmani',
                  desc: 'Sembunyikan untuk menguji hafalan dari terjemahan',
                },
                {
                  key: 'showLatin',
                  label: 'Transliterasi / Pelafalan Latin',
                  desc: 'Panduan pelafalan bacaan dalam aksara Latin',
                },
                {
                  key: 'showTranslation',
                  label: 'Terjemahan Indonesia',
                  desc: 'Terjemahan resmi standar Kemenag RI',
                },
                {
                  key: 'showTajwid',
                  label: 'Warna Tajwid Digital',
                  desc: 'Sorot warna hukum Ghunnah, Qalqalah, Ikhfa, Idgham, Iqlab & Mad',
                },
              ].map((item) => {
                const enabled = settings[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => onUpdateSettings({ [item.key]: !enabled })}
                    className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-left transition-colors hover:border-emerald-300 dark:border-emerald-900/60 dark:bg-surface-dark cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {enabled ? (
                        <Eye className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      ) : (
                        <EyeOff className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        enabled ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size Controls */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ukuran Teks
            </h3>

            {/* Arabic Size (20px - 52px) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="arabic-size-slider" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Ukuran Teks Arab
                </label>
                <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold tabular-nums text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {settings.arabicSize}px
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      arabicSize: Math.max(ARABIC_SIZE_RANGE.min, settings.arabicSize - 2),
                    })
                  }
                  aria-label="Perkecil teks Arab"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-surface-dark dark:text-slate-200 cursor-pointer"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <input
                  id="arabic-size-slider"
                  type="range"
                  min={ARABIC_SIZE_RANGE.min}
                  max={ARABIC_SIZE_RANGE.max}
                  step={1}
                  value={settings.arabicSize}
                  onChange={(e) =>
                    onUpdateSettings({ arabicSize: Number(e.target.value) })
                  }
                  className="quran-slider flex-1 bg-emerald-100 dark:bg-emerald-950"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      arabicSize: Math.min(ARABIC_SIZE_RANGE.max, settings.arabicSize + 2),
                    })
                  }
                  aria-label="Perbesar teks Arab"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-surface-dark dark:text-slate-200 cursor-pointer"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Latin / Pelafalan Size (12px - 26px) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="latin-size-slider" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Ukuran Pelafalan / Latin
                </label>
                <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold tabular-nums text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {latinSize}px
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      latinSize: Math.max(LATIN_SIZE_RANGE.min, latinSize - 1),
                    })
                  }
                  aria-label="Perkecil teks pelafalan latin"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-surface-dark dark:text-slate-200 cursor-pointer"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <input
                  id="latin-size-slider"
                  type="range"
                  min={LATIN_SIZE_RANGE.min}
                  max={LATIN_SIZE_RANGE.max}
                  step={1}
                  value={latinSize}
                  onChange={(e) =>
                    onUpdateSettings({ latinSize: Number(e.target.value) })
                  }
                  className="quran-slider flex-1 bg-emerald-100 dark:bg-emerald-950"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      latinSize: Math.min(LATIN_SIZE_RANGE.max, latinSize + 1),
                    })
                  }
                  aria-label="Perbesar teks pelafalan latin"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-surface-dark dark:text-slate-200 cursor-pointer"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Translation Size (12px - 24px) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="translation-size-slider" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Ukuran Teks Terjemahan
                </label>
                <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold tabular-nums text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {settings.translationSize}px
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      translationSize: Math.max(
                        TRANSLATION_SIZE_RANGE.min,
                        settings.translationSize - 1
                      ),
                    })
                  }
                  aria-label="Perkecil teks terjemahan"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-surface-dark dark:text-slate-200 cursor-pointer"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <input
                  id="translation-size-slider"
                  type="range"
                  min={TRANSLATION_SIZE_RANGE.min}
                  max={TRANSLATION_SIZE_RANGE.max}
                  step={1}
                  value={settings.translationSize}
                  onChange={(e) =>
                    onUpdateSettings({ translationSize: Number(e.target.value) })
                  }
                  className="quran-slider flex-1 bg-emerald-100 dark:bg-emerald-950"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      translationSize: Math.min(
                        TRANSLATION_SIZE_RANGE.max,
                        settings.translationSize + 1
                      ),
                    })
                  }
                  aria-label="Perbesar teks terjemahan"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-surface-dark dark:text-slate-200 cursor-pointer"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* 5 Qari Selector */}
          <div className="space-y-2.5">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Pilihan Qari / Imam Murottal (5 Qari)</span>
            </h3>
            <div className="space-y-2">
              {QARIS.map((qari) => {
                const selected = settings.qariId === qari.id;
                return (
                  <button
                    key={qari.id}
                    type="button"
                    onClick={() => onUpdateSettings({ qariId: qari.id })}
                    className={`flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-colors cursor-pointer ${
                      selected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/30 dark:border-emerald-400 dark:bg-emerald-950/70 dark:text-emerald-100'
                        : 'border-emerald-100 bg-white text-slate-700 hover:border-emerald-300 dark:border-emerald-900/60 dark:bg-surface-dark dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold">{qari.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {qari.origin}
                      </p>
                    </div>
                    <span
                      className={`h-4 w-4 rounded-full border-2 ${
                        selected
                          ? 'border-emerald-600 bg-emerald-600 dark:border-emerald-400 dark:bg-emerald-400'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-emerald-100 px-5 py-3.5 dark:border-emerald-900/60">
          <button
            type="button"
            onClick={() => {
              onUpdateSettings(DEFAULT_SETTINGS);
              onChangeColorTheme?.('emerald');
            }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-emerald-950 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
