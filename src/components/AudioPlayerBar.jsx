'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Volume2,
  Loader2,
  Repeat,
  HardDrive,
} from 'lucide-react';
import { QARIS } from '@/lib/constants';
import { getCachedAudioObjectUrl, hasCachedAudioUrl } from '@/lib/offlineAudio';
import { shouldSyncPlaybackEffect } from '@/lib/audioPlayback';

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5];
// Repeat modes for Hifz (per-verse mode): 1 = auto-next normal, 3 = repeat 3x, 5 = repeat 5x, 0 = infinite loop
const REPEAT_MODES = [1, 3, 5, 0];

function formatAudioTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AudioPlayerBar({
  audioState,
  qariId,
  onChangeQari,
  onTogglePlayPause,
  onPrevVerse,
  onNextVerse,
  onAudioEnded,
  onClose,
  onSyncPlayState,
  onJumpToPlaying,
  onNotify,
}) {
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);
  const repeatCounterRef = useRef(0);
  const sourceReadyRef = useRef(false);
  const switchingSourceRef = useRef(false);
  const wantPlayRef = useRef(audioState.isPlaying);
  const playbackRateRef = useRef(1);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isOfflineSource, setIsOfflineSource] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [repeatTarget, setRepeatTarget] = useState(1); // 1, 3, 5, or 0 (infinite)

  wantPlayRef.current = audioState.isPlaying;
  playbackRateRef.current = playbackRate;

  // Reset repeat count whenever verse/track changes
  useEffect(() => {
    repeatCounterRef.current = 0;
  }, [audioState.url, audioState.playNonce]);

  // Sync audio source (fast synchronous path for online audio, Cache Storage for offline downloads)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioState.active || !audioState.url) return;

    let cancelled = false;
    setCurrentTime(0);
    setDuration(0);
    setIsBuffering(true);
    setIsOfflineSource(false);

    const startPlayback = (srcUrl, offlineFlag) => {
      if (cancelled) return;
      switchingSourceRef.current = true;
      setIsOfflineSource(offlineFlag);
      audio.src = srcUrl;
      audio.playbackRate = playbackRateRef.current;
      sourceReadyRef.current = true;
      audio.load();

      if (wantPlayRef.current) {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise
            .then(() => {
              if (!cancelled) {
                switchingSourceRef.current = false;
              }
            })
            .catch((err) => {
              if (!cancelled) {
                switchingSourceRef.current = false;
                if (err.name !== 'AbortError') {
                  setIsBuffering(false);
                  onSyncPlayState(false);
                }
              }
            });
        } else {
          switchingSourceRef.current = false;
        }
      } else {
        switchingSourceRef.current = false;
        setIsBuffering(false);
      }
    };

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    // Fast path: jika URL tidak tercatat di cache offline, pasang src & play SECARA SINKRON
    if (!hasCachedAudioUrl(audioState.url)) {
      startPlayback(audioState.url, false);
      return () => {
        cancelled = true;
      };
    }

    // Offline cache path: tandai source belum siap selama lookup async agar efek play/pause tidak mendahului
    sourceReadyRef.current = false;
    switchingSourceRef.current = true;

    (async () => {
      const cachedObjUrl = await getCachedAudioObjectUrl(audioState.url);
      if (cancelled) {
        if (cachedObjUrl) URL.revokeObjectURL(cachedObjUrl);
        return;
      }

      if (cachedObjUrl) {
        objectUrlRef.current = cachedObjUrl;
        startPlayback(cachedObjUrl, true);
      } else {
        startPlayback(audioState.url, false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [audioState.active, audioState.url, audioState.playNonce, onSyncPlayState]);

  // Sync playback speed live
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Sync play/pause toggle without reloading source (only after source is ready)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const action = shouldSyncPlaybackEffect({
      isActive: audioState.active,
      hasUrl: Boolean(audioState.url),
      isSourceReady: sourceReadyRef.current,
      isPlaying: audioState.isPlaying,
      audioPaused: audio.paused,
    });

    if (action === 'play') {
      audio.playbackRate = playbackRate;
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          if (err?.name !== 'AbortError') {
            onSyncPlayState(false);
          }
        });
      }
    } else if (action === 'pause') {
      audio.pause();
    }
  }, [audioState.isPlaying, audioState.active, audioState.url, playbackRate, onSyncPlayState]);

  // Cleanup on close/unmount
  useEffect(() => {
    if (!audioState.active && audioRef.current) {
      sourceReadyRef.current = false;
      switchingSourceRef.current = false;
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    }
  }, [audioState.active]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handleInternalEnded = () => {
    if (!audioState.active) return;
    const audio = audioRef.current;
    // Support repeat loop for Hifz (both verse & full surah)
    if (repeatTarget === 0 && audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    if (repeatTarget > 1 && audio) {
      repeatCounterRef.current += 1;
      if (repeatCounterRef.current < repeatTarget) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      repeatCounterRef.current = 0;
    }
    onAudioEnded?.();
  };

  const audioElement = (
    <audio
      ref={audioRef}
      preload="auto"
      className="hidden"
      onTimeUpdate={(e) => {
        if (!audioState.active) return;
        setCurrentTime(e.currentTarget.currentTime);
      }}
      onLoadedMetadata={(e) => {
        if (!audioState.active) return;
        setDuration(e.currentTarget.duration || 0);
        setIsBuffering(false);
      }}
      onCanPlay={() => {
        if (!audioState.active) return;
        setIsBuffering(false);
      }}
      onWaiting={() => {
        if (!audioState.active) return;
        setIsBuffering(true);
      }}
      onPlaying={() => {
        if (!audioState.active) return;
        switchingSourceRef.current = false;
        setIsBuffering(false);
        onSyncPlayState(true);
      }}
      onPause={(e) => {
        if (
          !audioState.active ||
          !sourceReadyRef.current ||
          switchingSourceRef.current ||
          e.currentTarget.ended
        ) {
          return;
        }
        onSyncPlayState(false);
      }}
      onEnded={handleInternalEnded}
      onError={() => {
        if (!audioState.active) return;
        switchingSourceRef.current = false;
        setIsBuffering(false);
        onSyncPlayState(false);
        onNotify?.('Audio murottal gagal dimuat. Pastikan koneksi aktif atau unduh audio untuk mode offline.');
      }}
    />
  );

  if (!audioState.active) {
    return <>{audioElement}</>;
  }

  const activeQari = QARIS.find((q) => q.id === qariId) || QARIS[0];
  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const handleSeek = (e) => {
    const val = Number(e.target.value);
    if (audioRef.current && Number.isFinite(val)) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleCycleSpeed = () => {
    const idx = PLAYBACK_RATES.indexOf(playbackRate);
    const next = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length];
    setPlaybackRate(next);
    onNotify?.(`Kecepatan audio ${next}×`);
  };

  const handleCycleRepeat = () => {
    const idx = REPEAT_MODES.indexOf(repeatTarget);
    const next = REPEAT_MODES[(idx + 1) % REPEAT_MODES.length];
    setRepeatTarget(next);
    repeatCounterRef.current = 0;
    const label = next === 0 ? 'Ulang Tanpa Batas (∞)' : next === 1 ? 'Normal (Auto-Next)' : `Ulang ${next}× per Ayat (Hifz)`;
    onNotify?.(`Mode pengulangan: ${label}`);
  };

  const repeatLabel = repeatTarget === 0 ? '∞' : `${repeatTarget}×`;

  return (
    <>
      {audioElement}
      <aside
        aria-label="Pemutar Audio Murottal"
        className="fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom,0px))] z-40 mx-auto max-w-4xl px-3 md:bottom-4 md:px-4"
      >

      <div className="overflow-hidden rounded-2xl border border-emerald-200/90 bg-white/95 shadow-xl backdrop-blur-lg dark:border-emerald-800/80 dark:bg-surface-modal/95">
        {/* Top thin seek bar */}
        <div className="relative flex items-center px-3 pt-2">
          <span className="w-9 text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
            {formatAudioTime(currentTime)}
          </span>
          <div className="relative mx-2 flex-1">
            <input
              type="range"
              aria-label="Progres pemutaran audio"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="quran-slider w-full cursor-pointer bg-emerald-100 dark:bg-emerald-950"
              style={{
                background: `linear-gradient(to right, rgb(var(--primary-600)) ${progressPercent}%, rgb(var(--primary-500) / 0.22) ${progressPercent}%)`,
              }}
            />
          </div>
          <span className="w-9 text-right text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
            {formatAudioTime(duration)}
          </span>
        </div>

        {/* Main controls row */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-2.5 pt-1.5 sm:px-4">
          {/* Track info */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    onJumpToPlaying?.(audioState.surahNumber, audioState.verseNumber)
                  }
                  className="truncate text-left text-sm font-bold text-slate-900 hover:text-emerald-700 hover:underline dark:text-slate-100 dark:hover:text-emerald-300 cursor-pointer"
                >
                  {audioState.surahName}
                </button>
                <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200">
                  {audioState.mode === 'full'
                    ? 'Full Surah'
                    : `Ayat ${audioState.verseNumber}/${audioState.totalVerses}`}
                </span>
                {isOfflineSource && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-gold-100 px-1.5 py-0.5 text-[10px] font-bold text-gold-800 dark:bg-gold-950/70 dark:text-gold-300">
                    <HardDrive className="h-2.5 w-2.5" aria-hidden="true" />
                    Offline
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <label htmlFor="player-qari-select" className="sr-only">
                  Pilih Qari Murottal
                </label>
                <select
                  id="player-qari-select"
                  value={qariId}
                  onChange={(e) => onChangeQari(e.target.value)}
                  className="max-w-[165px] sm:max-w-[220px] truncate rounded-md bg-transparent py-0.5 text-xs font-medium text-slate-600 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-300 dark:hover:text-emerald-300 cursor-pointer"
                >
                  {QARIS.map((q) => (
                    <option key={q.id} value={q.id} className="bg-white text-slate-900 dark:bg-surface-dark dark:text-slate-100">
                      {q.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Playback + Hifz Loop + Speed buttons */}
          <div className="flex items-center gap-1">
            {/* Speed toggle (0.75x - 1.5x) */}
            <button
              type="button"
              onClick={handleCycleSpeed}
              aria-label={`Kecepatan putar audio ${playbackRate} kali`}
              title="Ubah kecepatan audio"
              className={`hidden sm:inline-flex h-10 min-w-[42px] items-center justify-center rounded-xl px-2 text-xs font-extrabold tabular-nums transition-colors cursor-pointer ${
                playbackRate !== 1
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'text-slate-600 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-950'
              }`}
            >
              {playbackRate}×
            </button>

            {/* Hifz Repeat Loop toggle (1x / 3x / 5x / ∞) */}
            <button
              type="button"
              onClick={handleCycleRepeat}
              aria-label={`Mode ulangi ayat: ${repeatLabel}`}
              title="Ulangi ayat untuk Mode Hafalan (1× / 3× / 5× / ∞)"
              className={`inline-flex h-10 min-w-[44px] items-center justify-center gap-0.5 rounded-xl px-2 text-xs font-extrabold transition-colors cursor-pointer ${
                repeatTarget !== 1
                  ? 'bg-gold-100 text-gold-800 dark:bg-gold-950/70 dark:text-gold-300'
                  : 'text-slate-600 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-950'
              }`}
            >
              <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{repeatLabel}</span>
            </button>

            {audioState.mode === 'verse' && (
              <button
                type="button"
                onClick={onPrevVerse}
                disabled={audioState.verseNumber <= 1}
                aria-label="Ayat sebelumnya"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-35 disabled:cursor-not-allowed dark:text-slate-200 dark:hover:bg-emerald-950 cursor-pointer"
              >
                <SkipBack className="h-4 w-4 fill-current" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              onClick={onTogglePlayPause}
              aria-label={
                audioState.isPlaying
                  ? `Jeda murottal ${activeQari.shortName}`
                  : `Putar murottal ${activeQari.shortName}`
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {isBuffering ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : audioState.isPlaying ? (
                <Pause className="h-5 w-5 fill-current" aria-hidden="true" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" aria-hidden="true" />
              )}
            </button>

            {audioState.mode === 'verse' && (
              <button
                type="button"
                onClick={onNextVerse}
                disabled={audioState.verseNumber >= audioState.totalVerses}
                aria-label="Ayat berikutnya"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-35 disabled:cursor-not-allowed dark:text-slate-200 dark:hover:bg-emerald-950 cursor-pointer"
              >
                <SkipForward className="h-4 w-4 fill-current" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pemutar audio"
              className="ml-0.5 flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 cursor-pointer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
