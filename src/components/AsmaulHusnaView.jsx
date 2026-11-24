'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Sparkles,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ASMAUL_HUSNA } from '@/lib/asmaulHusna';
import { cleanArabicText, toArabicDigits } from '@/lib/arabic';

export default function AsmaulHusnaView({ onNotify }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [copiedNum, setCopiedNum] = useState(null);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ASMAUL_HUSNA;
    return ASMAUL_HUSNA.filter(
      (item) =>
        String(item.number) === q ||
        item.latin.toLowerCase().includes(q) ||
        item.latin.toLowerCase().replace(/[-'\s]/g, '').includes(q.replace(/[-'\s]/g, '')) ||
        item.meaning.toLowerCase().includes(q) ||
        item.arabic.includes(searchQuery.trim())
    );
  }, [searchQuery]);

  // Escape & arrow keyboard support for detail modal
  useEffect(() => {
    if (!selectedItem) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedItem(null);
      if (e.key === 'ArrowLeft' && selectedItem.number > 1) {
        setSelectedItem(ASMAUL_HUSNA[selectedItem.number - 2]);
      }
      if (e.key === 'ArrowRight' && selectedItem.number < 99) {
        setSelectedItem(ASMAUL_HUSNA[selectedItem.number]);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedItem]);

  const handleCopy = async (item, e) => {
    e?.stopPropagation();
    const text = `${item.number}. ${cleanArabicText(item.arabic)} — ${item.latin} (${item.meaning})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNum(item.number);
      onNotify?.(`${item.latin} disalin ke clipboard`);
      setTimeout(() => setCopiedNum(null), 1600);
    } catch {
      onNotify?.('Gagal menyalin Asmaul Husna');
    }
  };

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-5 sm:p-7 text-white shadow-soft dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-950">
        <div className="islamic-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-50">
              <Sparkles className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
              <span>99 Nama Agung Allah SWT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Asmaul Husna
            </h1>
            <p className="max-w-xl text-sm text-emerald-50/90">
              Kenali, hafalkan, dan renungi 99 nama indah Allah SWT beserta arti bahasa Indonesia. Ketuk kartu untuk melihat tampilan fokus.
            </p>
          </div>
          <p
            className="arabic-heading text-3xl sm:text-4xl text-gold-200 self-end sm:self-center"
            lang="ar"
            dir="rtl"
          >
            {cleanArabicText('أَسْمَاءُ اللّٰهِ الْحُسْنَى')}
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <div className="relative">
        <label htmlFor="asmaul-search-input" className="sr-only">
          Cari 99 Asmaul Husna
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id="asmaul-search-input"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari Asmaul Husna (contoh: Ar-Rahman, Pengampun, 99)..."
          className="w-full min-h-[48px] rounded-xl border border-emerald-200/80 bg-white pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-900/70 dark:bg-surface-dark dark:text-slate-100 dark:focus:border-emerald-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Hapus pencarian Asmaul Husna"
            className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-emerald-950 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Empty Search State */}
      {filteredList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/80 p-10 text-center dark:border-emerald-900/60 dark:bg-surface-dark/60">
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">
            Asmaul Husna tidak ditemukan
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
          >
            Tampilkan Semua 99 Nama
          </button>
        </div>
      ) : (
        /* Interactive Grid Card */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((item) => {
            const isCopied = copiedNum === item.number;
            return (
              <article
                key={item.number}
                className="group relative flex flex-col justify-between rounded-2xl border border-emerald-100/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-emerald-400 hover:shadow-soft dark:border-emerald-900/60 dark:bg-surface-dark dark:hover:border-emerald-600 dark:hover:shadow-soft-dark"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-8 min-w-[36px] items-center justify-center rounded-lg bg-emerald-50 px-2 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800">
                    {item.number}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleCopy(item, e)}
                    aria-label={`Salin ${item.latin}`}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 cursor-pointer"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="mt-1 flex flex-col items-center py-2 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
                >
                  <p
                    className="arabic-heading text-3xl sm:text-4xl font-normal text-emerald-900 transition-colors group-hover:text-emerald-600 dark:text-emerald-100 dark:group-hover:text-emerald-300"
                    lang="ar"
                    dir="rtl"
                  >
                    {cleanArabicText(item.arabic)}
                  </p>
                  <h2 className="mt-2 text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {item.latin}
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {item.meaning}
                  </p>
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* Focused Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="asmaul-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItem(null);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-2xl dark:border-emerald-800 dark:bg-surface-modal">
            <div className="relative bg-gradient-to-br from-emerald-700 to-teal-700 p-6 text-center text-white dark:from-emerald-900 dark:to-teal-950">
              <div className="islamic-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
              <div className="relative z-10 flex items-center justify-between">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-gold-200">
                  #{selectedItem.number} dari 99 ({toArabicDigits(selectedItem.number)})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  aria-label="Tutup detail Asmaul Husna"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <p
                className="arabic-heading relative z-10 mt-6 text-5xl sm:text-6xl font-normal text-white drop-shadow-sm"
                lang="ar"
                dir="rtl"
              >
                {cleanArabicText(selectedItem.arabic)}
              </p>
              <h2
                id="asmaul-detail-title"
                className="relative z-10 mt-4 text-2xl font-extrabold text-white"
              >
                {selectedItem.latin}
              </h2>
              <p className="relative z-10 mt-1 text-sm font-medium text-emerald-100">
                {selectedItem.meaning}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 p-4">
              <button
                type="button"
                disabled={selectedItem.number <= 1}
                onClick={() => setSelectedItem(ASMAUL_HUSNA[selectedItem.number - 2])}
                aria-label="Asmaul Husna sebelumnya"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 text-slate-700 hover:bg-emerald-50 disabled:opacity-35 dark:border-emerald-800 dark:text-slate-200 dark:hover:bg-emerald-950 cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => handleCopy(selectedItem)}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 cursor-pointer"
              >
                {copiedNum === selectedItem.number ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    <span>Salin Asmaul Husna</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={selectedItem.number >= 99}
                onClick={() => setSelectedItem(ASMAUL_HUSNA[selectedItem.number])}
                aria-label="Asmaul Husna berikutnya"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 text-slate-700 hover:bg-emerald-50 disabled:opacity-35 dark:border-emerald-800 dark:text-slate-200 dark:hover:bg-emerald-950 cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
