'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Download,
  WifiOff,
  X,
  Smartphone,
  CheckCircle2,
  Share,
  MoreVertical,
} from 'lucide-react';

export function usePwa(onNotify) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installGuideOpen, setInstallGuideOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOffline(!navigator.onLine);

    const ua = window.navigator.userAgent || '';
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIos(iosDevice);

    if (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      } else {
        // Di mode development (npm run dev), bersihkan SW & shell cache lama
        // agar Turbopack HMR tidak pernah menyajikan JS chunk usang (hydration mismatch)
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => Promise.all(regs.map((r) => r.unregister())))
          .catch(() => {});
        if ('caches' in window) {
          caches
            .keys()
            .then((keys) =>
              Promise.all(
                keys
                  .filter((k) => k.startsWith('aqdi-shell-'))
                  .map((k) => caches.delete(k))
              )
            )
            .catch(() => {});
        }
      }
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallGuideOpen(false);
      onNotify?.("Aplikasi Al-Qur'an Digital berhasil dipasang!");
    };

    const handleOnline = () => {
      setIsOffline(false);
      onNotify?.('Koneksi internet kembali terhubung');
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onNotify]);

  const handleInstallClick = useCallback(async () => {
    if (isInstalled) {
      onNotify?.("Al-Qur'an Digital sudah terpasang sebagai aplikasi PWA");
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
        }
        return;
      } catch {
        // Fallback ke panduan manual jika prompt dibatalkan browser
      }
    }

    setInstallGuideOpen(true);
  }, [deferredPrompt, isInstalled, onNotify]);

  return {
    isOffline,
    isInstalled,
    isIos,
    canPromptInstall: Boolean(deferredPrompt),
    installGuideOpen,
    setInstallGuideOpen,
    handleInstallClick,
  };
}

export function OfflineBanner({ isOffline }) {
  if (!isOffline) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-6">
      <div
        role="status"
        className="flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 dark:border-amber-600/60 dark:bg-[#241A0B] dark:text-amber-200"
      >
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Mode Offline Aktif — Surah, jadwal shalat &amp; audio yang sudah tersimpan tetap dapat diakses.
        </span>
      </div>
    </div>
  );
}

export function PwaInstallModal({
  isOpen,
  isIos,
  isInstalled,
  canPromptInstall,
  onTriggerNativeInstall,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl border border-emerald-200/80 bg-white shadow-2xl dark:border-emerald-900/70 dark:bg-surface-modal sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4 dark:border-emerald-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Smartphone className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="pwa-modal-title"
                className="text-base font-extrabold text-slate-900 dark:text-slate-100"
              >
                Install Aplikasi (PWA)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Akses instan dari layar utama &amp; mode offline
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan install PWA"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-emerald-950 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-sm text-slate-700 dark:text-slate-200">
          {isInstalled ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <p className="text-xs sm:text-sm font-semibold">
                Al-Qur&apos;an Digital Indonesia sudah terpasang di perangkat Anda.
              </p>
            </div>
          ) : canPromptInstall ? (
            <button
              type="button"
              onClick={onTriggerNativeInstall}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 cursor-pointer"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Pasang Sekarang</span>
            </button>
          ) : isIos ? (
            <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Cara Install di iPhone / iPad (Safari)
              </p>
              <ol className="space-y-2 text-xs sm:text-sm leading-relaxed list-decimal list-inside">
                <li>
                  Ketuk tombol <strong className="inline-flex items-center gap-1"><Share className="inline h-3.5 w-3.5" aria-hidden="true" /> Bagikan (Share)</strong> di bar bawah Safari.
                </li>
                <li>
                  Pilih menu <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                </li>
                <li>
                  Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Cara Install di Android / Chrome / Edge
              </p>
              <ol className="space-y-2 text-xs sm:text-sm leading-relaxed list-decimal list-inside">
                <li>
                  Di HP Android: ketuk menu <strong className="inline-flex items-center"><MoreVertical className="inline h-3.5 w-3.5" aria-hidden="true" /> titik tiga</strong> kanan atas browser lalu pilih <strong>Install aplikasi / Tambahkan ke layar utama</strong>.
                </li>
                <li>
                  Di PC/Laptop: klik ikon <strong>Install (⊕ / layar dengan panah)</strong> di sisi kanan bilah alamat Chrome atau Edge.
                </li>
              </ol>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Setelah terpasang, aplikasi tampil penuh seperti aplikasi native dan mendukung akses offline untuk surah, jadwal shalat, serta audio murottal yang sudah diunduh.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-emerald-100 px-5 py-3.5 text-right dark:border-emerald-900/60">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 cursor-pointer"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
