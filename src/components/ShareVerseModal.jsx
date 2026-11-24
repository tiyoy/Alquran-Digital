'use client';

import { useEffect, useState } from 'react';
import { X, Download, Share2, Image as ImageIcon } from 'lucide-react';
import { cleanArabicText } from '@/lib/arabic';

const CARD_STYLES = [
  {
    id: 'emerald',
    label: 'Zamrud',
    bgFrom: '#065F46',
    bgTo: '#022C22',
    accent: '#FBBF24',
    text: '#FFFFFF',
    sub: '#D1FAE5',
  },
  {
    id: 'sapphire',
    label: 'Safir',
    bgFrom: '#0369A1',
    bgTo: '#082F49',
    accent: '#FCD34D',
    text: '#FFFFFF',
    sub: '#E0F2FE',
  },
  {
    id: 'mushaf',
    label: 'Mushaf Emas',
    bgFrom: '#FAF3E0',
    bgTo: '#EFE2C2',
    accent: '#B45309',
    text: '#1C1917',
    sub: '#57534E',
  },
  {
    id: 'obsidian',
    label: 'Malam Elegan',
    bgFrom: '#1E1B4B',
    bgTo: '#09090B',
    accent: '#F59E0B',
    text: '#F8FAFC',
    sub: '#CBD5E1',
  },
];

function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function renderVerseCardToBlob({ surah, ayat, style, includeLatin }) {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, style.bgFrom);
  grad.addColorStop(1, style.bgTo);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle decorative dot pattern
  ctx.fillStyle = style.id === 'mushaf' ? 'rgba(180, 83, 9, 0.06)' : 'rgba(255,255,255,0.06)';
  for (let x = 40; x < width; x += 48) {
    for (let y = 40; y < height; y += 48) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ornate inner double frame
  ctx.strokeStyle = style.accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, width - 96, height - 96);
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(64, 64, width - 128, height - 128);
  ctx.globalAlpha = 1;

  // Top Surah Pill
  ctx.fillStyle = style.accent;
  ctx.font = 'bold 28px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`QS. ${surah.namaLatin.toUpperCase()} : AYAT ${ayat.nomorAyat}`, width / 2, 148);

  // Decorative divider
  ctx.fillStyle = style.accent;
  ctx.fillRect(width / 2 - 90, 174, 180, 3);

  // Arabic text (auto-fit size for long vs short verses)
  const arabicClean = cleanArabicText(ayat.teksArab);
  const arabicFontSize = arabicClean.length > 260 ? 38 : arabicClean.length > 140 ? 48 : 58;
  ctx.font = `${arabicFontSize}px "Amiri Quran", "Scheherazade New", "Noto Naskh Arabic", serif`;
  ctx.fillStyle = style.text;
  ctx.direction = 'rtl';
  const arabicLines = wrapCanvasText(ctx, arabicClean, width - 200).slice(0, 8);

  const arabicLineHeight = arabicFontSize * 2.05;
  let y = 290;
  for (const line of arabicLines) {
    ctx.fillText(line, width / 2, y);
    y += arabicLineHeight;
  }

  ctx.direction = 'ltr';

  // Optional Latin transliteration
  if (includeLatin && ayat.teksLatin) {
    y += 16;
    ctx.font = 'italic 26px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = style.accent;
    const latinLines = wrapCanvasText(ctx, ayat.teksLatin.trim(), width - 210).slice(0, 4);
    for (const line of latinLines) {
      ctx.fillText(line, width / 2, y);
      y += 38;
    }
  }

  // Indonesian Translation
  y += 28;
  const transText = `"${(ayat.teksIndonesia || '').trim()}"`;
  const transSize = transText.length > 260 ? 26 : 30;
  ctx.font = `500 ${transSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillStyle = style.sub;
  const transLines = wrapCanvasText(ctx, transText, width - 210).slice(0, 7);
  for (const line of transLines) {
    ctx.fillText(line, width / 2, y);
    y += transSize * 1.5;
  }

  // Footer Watermark
  ctx.fillStyle = style.accent;
  ctx.globalAlpha = 0.85;
  ctx.font = '600 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText("Al-Qur'an Digital Indonesia • Terjemahan Kemenag RI", width / 2, height - 102);
  ctx.globalAlpha = 1;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
}

export default function ShareVerseModal({ isOpen, surah, ayat, onClose, onNotify }) {
  const [selectedStyleId, setSelectedStyleId] = useState('emerald');
  const [includeLatin, setIncludeLatin] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const activeStyle = CARD_STYLES.find((s) => s.id === selectedStyleId) || CARD_STYLES[0];

  const handleDownloadPng = async () => {
    setExporting(true);
    try {
      const blob = await renderVerseCardToBlob({
        surah,
        ayat,
        style: activeStyle,
        includeLatin,
      });
      if (!blob) throw new Error('Gagal membuat gambar');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QS-${surah.namaLatin}-${ayat.nomorAyat}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      onNotify?.('Kartu ayat PNG berhasil diunduh');
    } catch {
      onNotify?.('Gagal mengekspor kartu ayat');
    } finally {
      setExporting(false);
    }
  };

  const handleNativeShare = async () => {
    setExporting(true);
    try {
      const blob = await renderVerseCardToBlob({
        surah,
        ayat,
        style: activeStyle,
        includeLatin,
      });
      const file = new File([blob], `QS-${surah.namaLatin}-${ayat.nomorAyat}.png`, {
        type: 'image/png',
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `QS. ${surah.namaLatin} : ${ayat.nomorAyat}`,
          text: `${ayat.teksIndonesia} — QS. ${surah.namaLatin}:${ayat.nomorAyat}`,
          files: [file],
        });
        onNotify?.('Kartu ayat dibagikan');
      } else {
        await handleDownloadPng();
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        await handleDownloadPng();
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-verse-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-emerald-200/80 bg-white shadow-2xl dark:border-emerald-900/70 dark:bg-surface-modal sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4 dark:border-emerald-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <ImageIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="share-verse-title"
                className="text-base font-extrabold text-slate-900 dark:text-slate-100"
              >
                Bagikan Kartu Ayat
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Siap unggah ke WhatsApp Status &amp; Instagram Story (PNG HD)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup bagikan kartu ayat"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-emerald-950 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Preview & Controls */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Live HTML Preview matching Canvas Output */}
          <div
            className="relative overflow-hidden rounded-2xl p-6 text-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${activeStyle.bgFrom}, ${activeStyle.bgTo})`,
              border: `2px solid ${activeStyle.accent}`,
            }}
          >
            <p
              className="text-xs font-extrabold uppercase tracking-widest"
              style={{ color: activeStyle.accent }}
            >
              QS. {surah.namaLatin} : Ayat {ayat.nomorAyat}
            </p>
            <div
              className="mx-auto my-3 h-0.5 w-16 rounded-full"
              style={{ backgroundColor: activeStyle.accent }}
            />
            <p
              className="arabic-text text-2xl sm:text-3xl leading-[2.2]"
              style={{ color: activeStyle.text }}
              lang="ar"
              dir="rtl"
            >
              {cleanArabicText(ayat.teksArab)}
            </p>
            {includeLatin && ayat.teksLatin && (
              <p
                className="mt-2 text-xs italic leading-relaxed"
                style={{ color: activeStyle.accent }}
              >
                {ayat.teksLatin.trim()}
              </p>
            )}
            <p
              className="mt-3 text-xs sm:text-sm leading-relaxed"
              style={{ color: activeStyle.sub }}
            >
              &ldquo;{ayat.teksIndonesia?.trim()}&rdquo;
            </p>
            <p
              className="mt-5 text-[10px] font-semibold opacity-80"
              style={{ color: activeStyle.accent }}
            >
              Al-Qur&apos;an Digital Indonesia • Kemenag RI
            </p>
          </div>

          {/* Style Picker */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tema Kartu
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CARD_STYLES.map((st) => {
                const active = st.id === selectedStyleId;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyleId(st.id)}
                    className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-100'
                        : 'border-emerald-100 bg-white text-slate-700 dark:border-emerald-900 dark:bg-surface-dark dark:text-slate-200'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full ring-1 ring-black/15"
                      style={{ backgroundColor: st.bgFrom }}
                      aria-hidden="true"
                    />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Include Latin Checkbox */}
          <label className="flex min-h-[44px] items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={includeLatin}
              onChange={(e) => setIncludeLatin(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-600"
            />
            <span>Sertakan teks pelafalan Latin pada kartu</span>
          </label>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center gap-2 border-t border-emerald-100 px-5 py-3.5 dark:border-emerald-900/60">
          <button
            type="button"
            disabled={exporting}
            onClick={handleDownloadPng}
            className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 cursor-pointer"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>{exporting ? 'Memproses...' : 'Unduh PNG'}</span>
          </button>

          <button
            type="button"
            disabled={exporting}
            onClick={handleNativeShare}
            className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:text-emerald-950 cursor-pointer"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span>Bagikan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
