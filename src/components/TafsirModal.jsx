'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  X,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { fetchSurahTafsir } from '@/lib/api';
import { cleanArabicText } from '@/lib/arabic';

export default function TafsirModal({ isOpen, surah, initialVerse, onClose }) {
  const [tafsirData, setTafsirData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedVerse, setSelectedVerse] = useState(initialVerse || 1);
  const [viewAll, setViewAll] = useState(initialVerse === null);

  useEffect(() => {
    if (!isOpen || !surah) return;
    setSelectedVerse(initialVerse || 1);
    setViewAll(initialVerse === null);
  }, [isOpen, surah, initialVerse]);

  const loadTafsir = async () => {
    if (!surah) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchSurahTafsir(surah.nomor);
      setTafsirData(data);
    } catch (err) {
      setError(err.message || 'Gagal memuat tafsir Kemenag RI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !surah) return;
    loadTafsir();
  }, [isOpen, surah?.nomor]);

  // Escape key handler & body scroll lock
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

  const activeAyatObj = useMemo(() => {
    if (!surah?.ayat) return null;
    return surah.ayat.find((a) => a.nomorAyat === selectedVerse) || null;
  }, [surah, selectedVerse]);

  const activeTafsirObj = useMemo(() => {
    if (!tafsirData?.tafsir) return null;
    return tafsirData.tafsir.find((t) => t.ayat === selectedVerse) || null;
  }, [tafsirData, selectedVerse]);

  if (!isOpen || !surah) return null;

  const formatParagraphs = (text) =>
    (text || '')
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tafsir-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-emerald-200/80 bg-white shadow-2xl dark:border-emerald-900/70 dark:bg-surface-modal sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-emerald-100 px-5 py-4 dark:border-emerald-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <BookOpenText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="tafsir-modal-title"
                className="truncate text-base font-extrabold text-slate-900 dark:text-slate-100"
              >
                Tafsir Kemenag RI — {surah.namaLatin}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {viewAll
                  ? `Seluruh Ayat (${surah.jumlahAyat} Ayat)`
                  : `QS. ${surah.nomor} : Ayat ${selectedVerse} dari ${surah.jumlahAyat}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal tafsir"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-emerald-950 dark:hover:text-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Mode Switcher & Ayat Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-50 bg-emerald-50/40 px-5 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-emerald-100 dark:bg-surface-dark dark:ring-emerald-900/60">
            <button
              type="button"
              onClick={() => setViewAll(false)}
              className={`min-h-[38px] rounded-lg px-3 text-xs font-bold transition-colors cursor-pointer ${
                !viewAll
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950'
                  : 'text-slate-600 hover:text-emerald-700 dark:text-slate-300'
              }`}
            >
              Per-Ayat
            </button>
            <button
              type="button"
              onClick={() => setViewAll(true)}
              className={`min-h-[38px] rounded-lg px-3 text-xs font-bold transition-colors cursor-pointer ${
                viewAll
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950'
                  : 'text-slate-600 hover:text-emerald-700 dark:text-slate-300'
              }`}
            >
              Semua Ayat
            </button>
          </div>

          {!viewAll && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={selectedVerse <= 1}
                onClick={() => setSelectedVerse((v) => Math.max(1, v - 1))}
                aria-label="Tafsir ayat sebelumnya"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50 disabled:opacity-40 dark:border-emerald-800 dark:bg-surface-dark dark:text-slate-200 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>

              <label htmlFor="tafsir-verse-select" className="sr-only">
                Pilih nomor ayat
              </label>
              <select
                id="tafsir-verse-select"
                value={selectedVerse}
                onChange={(e) => setSelectedVerse(Number(e.target.value))}
                className="min-h-[40px] rounded-xl border border-emerald-200 bg-white px-2.5 text-xs font-bold text-slate-800 focus:border-emerald-600 focus:outline-none dark:border-emerald-800 dark:bg-surface-dark dark:text-slate-100 cursor-pointer"
              >
                {Array.from({ length: surah.jumlahAyat }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Ayat {num}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={selectedVerse >= surah.jumlahAyat}
                onClick={() => setSelectedVerse((v) => Math.min(surah.jumlahAyat, v + 1))}
                aria-label="Tafsir ayat berikutnya"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50 disabled:opacity-40 dark:border-emerald-800 dark:bg-surface-dark dark:text-slate-200 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {loading && (
            <div className="space-y-3 animate-pulse" aria-busy="true">
              <div className="h-14 rounded-xl bg-emerald-100/80 dark:bg-emerald-950" />
              <div className="h-4 w-full rounded bg-slate-200 dark:bg-emerald-900/50" />
              <div className="h-4 w-11/12 rounded bg-slate-200 dark:bg-emerald-900/50" />
              <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-emerald-900/50" />
              <div className="h-4 w-full rounded bg-slate-200 dark:bg-emerald-900/50" />
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p>
              <button
                type="button"
                onClick={loadTafsir}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}

          {!loading && !error && !viewAll && activeTafsirObj && (
            <div className="space-y-5">
              {activeAyatObj && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                  <p
                    className="arabic-text text-right text-2xl text-slate-900 dark:text-slate-100"
                    lang="ar"
                    dir="rtl"
                  >
                    {cleanArabicText(activeAyatObj.teksArab)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    &ldquo;{activeAyatObj.teksIndonesia}&rdquo;
                  </p>
                </div>
              )}

              <div className="space-y-3.5 text-sm sm:text-[15px] leading-7 text-slate-700 dark:text-slate-200">
                {formatParagraphs(activeTafsirObj.teks).map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>
          )}

          {!loading && !error && viewAll && tafsirData?.tafsir && (
            <div className="space-y-6">
              {tafsirData.tafsir.map((item) => (
                <section
                  key={item.ayat}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/25 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/25 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white dark:bg-emerald-500 dark:text-emerald-950">
                      Ayat {item.ayat}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVerse(item.ayat);
                        setViewAll(false);
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400 cursor-pointer"
                    >
                      Fokus Ayat Ini
                    </button>
                  </div>
                  <div className="space-y-2.5 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {formatParagraphs(item.teks).map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
