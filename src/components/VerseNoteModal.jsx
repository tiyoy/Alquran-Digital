'use client';

import { useEffect, useState } from 'react';
import { X, StickyNote, Trash2, Save } from 'lucide-react';
import { cleanArabicText } from '@/lib/arabic';

export default function VerseNoteModal({
  isOpen,
  surah,
  ayat,
  existingNote,
  onSave,
  onDelete,
  onClose,
}) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setText(existingNote?.text || '');
    }
  }, [isOpen, existingNote]);

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

  if (!isOpen || !surah || !ayat) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = text.trim();
    if (!cleaned) {
      if (existingNote) {
        onDelete(surah.nomor, ayat.nomorAyat);
      }
      onClose();
      return;
    }
    onSave({
      surahNumber: surah.nomor,
      surahName: surah.namaLatin,
      verseNumber: ayat.nomorAyat,
      text: cleaned,
      snippet: ayat.teksIndonesia?.slice(0, 80) || '',
      updatedAt: Date.now(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verse-note-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-emerald-200/80 bg-white shadow-2xl dark:border-emerald-900/70 dark:bg-surface-modal sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4 dark:border-emerald-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <StickyNote className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="verse-note-title"
                className="truncate text-base font-extrabold text-slate-900 dark:text-slate-100"
              >
                Catatan &amp; Tadabbur Pribadi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                QS. {surah.namaLatin} ({surah.nomor}) : Ayat {ayat.nomorAyat}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup catatan ayat"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-emerald-950 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5 space-y-4">
          {/* Verse reference preview */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <p
              className="arabic-text text-right text-xl text-slate-900 dark:text-slate-100 line-clamp-2"
              lang="ar"
              dir="rtl"
            >
              {cleanArabicText(ayat.teksArab)}
            </p>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              &ldquo;{ayat.teksIndonesia}&rdquo;
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="verse-note-textarea"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
            >
              Tulis Refleksi / Hikmah / Pengingat Pribadi
            </label>
            <textarea
              id="verse-note-textarea"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Contoh: Ayat ini mengingatkan untuk selalu bersabar dan bertawakal saat menghadapi ujian..."
              className="w-full rounded-2xl border border-emerald-200 bg-emerald-50/20 p-3.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-900 dark:bg-surface-dark dark:text-slate-100 dark:focus:border-emerald-400"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Disimpan secara lokal &amp; privat di perangkat Anda</span>
              <span className="tabular-nums">{text.length} karakter</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {existingNote ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(surah.nomor, ayat.nomorAyat);
                  onClose();
                }}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Hapus</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] rounded-xl px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-emerald-950 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 cursor-pointer"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                <span>Simpan Catatan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
