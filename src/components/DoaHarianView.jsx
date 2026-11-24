'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Copy,
  Check,
  X,
  HeartHandshake,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { fetchDailyDuas } from '@/lib/api';
import { cleanArabicText } from '@/lib/arabic';

const PAGE_SIZE = 20;

export default function DoaHarianView({ arabicSize, latinSize, translationSize, onNotify }) {
  const [duas, setDuas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Semua');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedSourceId, setExpandedSourceId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchDailyDuas()
      .then((list) => {
        if (active) setDuas(list);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const groups = useMemo(() => {
    const counts = new Map();
    for (const d of duas) {
      const g = (d.grup || 'Doa Harian').trim();
      counts.set(g, (counts.get(g) || 0) + 1);
    }
    const topGroups = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name]) => name);
    return ['Semua', ...topGroups];
  }, [duas]);

  const filteredDuas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return duas.filter((d) => {
      if (selectedGroup !== 'Semua' && (d.grup || '').trim() !== selectedGroup) {
        return false;
      }
      if (!q) return true;
      return (
        (d.nama || '').toLowerCase().includes(q) ||
        (d.grup || '').toLowerCase().includes(q) ||
        (d.tr || '').toLowerCase().includes(q) ||
        (d.idn || '').toLowerCase().includes(q) ||
        (d.ar || '').includes(searchQuery.trim())
      );
    });
  }, [duas, searchQuery, selectedGroup]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedGroup]);

  const displayedDuas = filteredDuas.slice(0, visibleCount);

  const handleCopyDua = async (dua) => {
    const text = [
      dua.nama,
      cleanArabicText(dua.ar),
      dua.tr,
      `"${dua.idn}"`,
      dua.tentang ? `Sumber: ${dua.tentang.split('\n')[0]}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(dua.id);
      onNotify?.(`"${dua.nama}" disalin ke clipboard`);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      onNotify?.('Gagal menyalin doa');
    }
  };

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-5 sm:p-7 text-white shadow-soft dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-950">
        <div className="islamic-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-50">
            <HeartHandshake className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
            <span>Kumpulan Doa Sehari-hari • Arab, Latin &amp; Terjemahan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Doa Harian Muslim
          </h1>
          <p className="max-w-xl text-sm text-emerald-50/90">
            {loading
              ? 'Memuat kumpulan doa harian otentik...'
              : `${duas.length} doa pilihan sehari-hari lengkap dengan teks Arab Uthmani HD, transliterasi Latin, dan artinya.`}
          </p>
        </div>
      </section>

      {/* Search & Category Filters */}
      <section className="space-y-3" aria-label="Pencarian doa harian">
        <div className="relative">
          <label htmlFor="doa-search-input" className="sr-only">
            Cari doa harian
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="doa-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari doa (contoh: tidur, makan, perjalanan, orang tua, istighfar)..."
            className="w-full min-h-[48px] rounded-xl border border-emerald-200/80 bg-white pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-900/70 dark:bg-surface-dark dark:text-slate-100 dark:focus:border-emerald-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian doa"
              className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-emerald-950 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {!loading && groups.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label="Kategori doa">
            {groups.map((group) => {
              const active = selectedGroup === group;
              return (
                <button
                  key={group}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedGroup(group)}
                  className={`min-h-[44px] shrink-0 rounded-xl px-3.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950'
                      : 'border border-emerald-200/70 bg-white text-slate-700 hover:border-emerald-400 dark:border-emerald-900/70 dark:bg-surface-dark dark:text-slate-200'
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Skeleton Loading */}
      {loading && (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="space-y-3 rounded-2xl border border-emerald-100 bg-white p-5 dark:border-emerald-900/50 dark:bg-surface-dark animate-pulse"
            >
              <div className="h-5 w-48 rounded bg-slate-200 dark:bg-emerald-900/50" />
              <div className="ml-auto h-9 w-4/5 rounded bg-emerald-100 dark:bg-emerald-950" />
              <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-emerald-900/40" />
              <div className="h-4 w-full rounded bg-slate-100 dark:bg-emerald-900/40" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDuas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/80 p-10 text-center dark:border-emerald-900/60 dark:bg-surface-dark/60">
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">
            Doa tidak ditemukan
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Coba kata kunci lain atau ubah kategori doa.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedGroup('Semua');
            }}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* Dua Cards */}
      {!loading && displayedDuas.length > 0 && (
        <div className="space-y-4">
          {displayedDuas.map((dua) => {
            const isCopied = copiedId === dua.id;
            const isExpanded = expandedSourceId === dua.id;

            return (
              <article
                key={dua.id}
                className="rounded-2xl border border-emerald-100/90 bg-white p-4 sm:p-6 shadow-sm transition-colors hover:border-emerald-300 dark:border-emerald-900/60 dark:bg-surface-dark dark:hover:border-emerald-700"
              >
                <div className="mb-3 flex items-start justify-between gap-3 border-b border-emerald-50 pb-3 dark:border-emerald-900/40">
                  <div className="min-w-0 space-y-1">
                    {dua.grup && (
                      <span className="inline-block rounded-md bg-gold-50 px-2 py-0.5 text-[11px] font-bold text-gold-700 dark:bg-gold-950/60 dark:text-gold-300">
                        {dua.grup}
                      </span>
                    )}
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      {dua.nama}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyDua(dua)}
                    aria-label={`Salin ${dua.nama}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 cursor-pointer"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {/* Arabic */}
                <p
                  className="arabic-text mb-4 text-right text-slate-900 dark:text-slate-50"
                  style={{ fontSize: `${Math.min(Math.max(arabicSize - 4, 24), 40)}px` }}
                  lang="ar"
                  dir="rtl"
                >
                  {cleanArabicText(dua.ar)}
                </p>

                {/* Latin */}
                {dua.tr && (
                  <p
                    className="mb-2 font-medium italic text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed max-w-3xl"
                    style={{ fontSize: `${latinSize ?? 14}px` }}
                  >
                    {dua.tr}
                  </p>
                )}

                {/* Indonesian Translation */}
                {dua.idn && (
                  <p
                    className="text-slate-700 dark:text-slate-200 leading-relaxed max-w-3xl"
                    style={{ fontSize: `${translationSize}px` }}
                  >
                    {dua.idn}
                  </p>
                )}

                {/* Reference / Keterangan */}
                {dua.tentang && (
                  <div className="mt-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedSourceId(isExpanded ? null : dua.id)}
                      aria-expanded={isExpanded}
                      className="inline-flex min-h-[38px] items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Sembunyikan Referensi Hadis' : 'Lihat Referensi & Keutamaan'}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                    {isExpanded && (
                      <p className="mt-2 whitespace-pre-line rounded-xl bg-emerald-50/60 p-3 text-xs leading-relaxed text-slate-600 dark:bg-emerald-950/40 dark:text-slate-300">
                        {dua.tentang.trim()}
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}

          {filteredDuas.length > visibleCount && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="inline-flex min-h-[48px] items-center rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 cursor-pointer"
              >
                Muat Lebih Banyak ({filteredDuas.length - visibleCount} doa tersisa)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
