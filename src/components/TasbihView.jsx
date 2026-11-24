'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Vibrate,
  RotateCcw,
  Minus,
  Plus,
  Sparkles,
  Check,
  CheckCircle2,
  CircleDot,
  Repeat,
  Trash2,
  Target,
} from 'lucide-react';
import { cleanArabicText } from '@/lib/arabic';
import { STORAGE_KEYS } from '@/lib/constants';
import {
  KNOCK_SOUNDS,
  TASBIH_PRESETS,
  TASBIH_TARGETS,
} from '@/lib/tasbihPresets';
import {
  playTargetCompleteChime,
  playTasbihKnock,
  triggerTasbihHaptic,
} from '@/lib/tasbihAudio';

function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

const DEFAULT_TASBIH_STATE = {
  activePresetId: 'subhanallah',
  count: 0,
  cycles: 0,
  target: 33,
  soundEnabled: true,
  soundType: 'wood',
  hapticEnabled: true,
  autoChainAfterPrayer: false,
  todayDateKey: '',
  todayTotal: 0,
  allTimeTotal: 0,
  perPresetCounts: {},
  customPresets: [],
};

const BEAD_RING_COUNT = 33;

export default function TasbihView({ onNotify }) {
  const [state, setState] = useState(() => ({
    ...DEFAULT_TASBIH_STATE,
    todayDateKey: getTodayDateKey(),
  }));
  const [hydrated, setHydrated] = useState(false);

  // Tactile animation states
  const [pulseKey, setPulseKey] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [justCompletedTarget, setJustCompletedTarget] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Custom target & custom dzikir form states
  const [customTargetInput, setCustomTargetInput] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customArabic, setCustomArabic] = useState('');
  const [customMeaning, setCustomMeaning] = useState('');
  const [customDefaultTarget, setCustomDefaultTarget] = useState('33');

  const completeTimerRef = useRef(null);
  const confirmResetTimerRef = useRef(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Hydrate persisted tasbih state from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.TASBIH);
      const todayKey = getTodayDateKey();
      if (raw) {
        const parsed = JSON.parse(raw);
        const sameDay = parsed.todayDateKey === todayKey;
        setState({
          ...DEFAULT_TASBIH_STATE,
          ...parsed,
          todayDateKey: todayKey,
          todayTotal: sameDay ? Number(parsed.todayTotal) || 0 : 0,
        });
      }
    } catch {
      // Gunakan default state
    }
    setHydrated(true);
  }, []);

  // Persist changes to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.TASBIH, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
      if (confirmResetTimerRef.current) clearTimeout(confirmResetTimerRef.current);
    };
  }, []);

  const allPresets = useMemo(
    () => [...TASBIH_PRESETS, ...(state.customPresets || [])],
    [state.customPresets]
  );

  const activePreset = useMemo(
    () =>
      allPresets.find((p) => p.id === state.activePresetId) || TASBIH_PRESETS[0],
    [allPresets, state.activePresetId]
  );

  const handleTap = useCallback(() => {
    const curr = stateRef.current;
    const todayKey = getTodayDateKey();
    const baseToday = curr.todayDateKey === todayKey ? curr.todayTotal : 0;
    const hasTarget = curr.target > 0;
    const isRollingOver =
      !curr.autoChainAfterPrayer && hasTarget && curr.count >= curr.target;

    const nextCountRaw = isRollingOver ? 1 : curr.count + 1;
    const reachedTarget = !isRollingOver && hasTarget && nextCountRaw >= curr.target;

    // Suara & getar ketukan tasbih
    if (reachedTarget) {
      if (curr.soundEnabled) playTargetCompleteChime();
      if (curr.hapticEnabled) triggerTasbihHaptic(true);
    } else {
      if (curr.soundEnabled) playTasbihKnock(curr.soundType);
      if (curr.hapticEnabled) triggerTasbihHaptic(false);
    }

    setPulseKey((k) => k + 1);
    setConfirmReset(false);

    if (reachedTarget) {
      setJustCompletedTarget(true);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
      completeTimerRef.current = setTimeout(() => setJustCompletedTarget(false), 1600);
    } else {
      setJustCompletedTarget(false);
    }

    let nextPresetId = curr.activePresetId;
    let nextTarget = curr.target;
    let nextCount = nextCountRaw;
    let nextCycles = curr.cycles;
    let completionToast = '';

    if (reachedTarget) {
      nextCycles = curr.cycles + 1;
      if (curr.autoChainAfterPrayer) {
        if (curr.activePresetId === 'subhanallah') {
          nextPresetId = 'alhamdulillah';
          nextTarget = 33;
          nextCount = 0;
          completionToast = 'Alhamdulillah! 33× Subhanallah selesai → Lanjut Alhamdulillah';
        } else if (curr.activePresetId === 'alhamdulillah') {
          nextPresetId = 'allahuakbar';
          nextTarget = 33;
          nextCount = 0;
          completionToast = 'Alhamdulillah! 33× Alhamdulillah selesai → Lanjut Allahu Akbar';
        } else if (curr.activePresetId === 'allahuakbar') {
          nextPresetId = 'subhanallah';
          nextTarget = 33;
          nextCount = 0;
          completionToast = 'MasyaAllah! Rangkaian 3×33 dzikir setelah shalat telah lengkap';
        } else {
          nextCount = 0;
          completionToast = `Target ${curr.target}× tercapai (Putaran ke-${nextCycles})`;
        }
      } else {
        nextCount = curr.target;
        completionToast = `Alhamdulillah! Target ${curr.target}× tercapai (Putaran ke-${nextCycles})`;
      }
    }

    const prevPresetCount = curr.perPresetCounts?.[curr.activePresetId] || 0;

    setState({
      ...curr,
      activePresetId: nextPresetId,
      target: nextTarget,
      count: nextCount,
      cycles: nextCycles,
      todayDateKey: todayKey,
      todayTotal: baseToday + 1,
      allTimeTotal: (curr.allTimeTotal || 0) + 1,
      perPresetCounts: {
        ...(curr.perPresetCounts || {}),
        [curr.activePresetId]: prevPresetCount + 1,
      },
    });

    if (completionToast) {
      onNotify?.(completionToast);
    }
  }, [onNotify]);

  // Desktop Spacebar shortcut for comfortable dzikir tapping
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== 'Space' || e.repeat) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        tag === 'button' ||
        tag === 'a'
      ) {
        return;
      }
      e.preventDefault();
      setIsPressed(true);
      handleTap();
    };
    const onKeyUp = (e) => {
      if (e.code === 'Space') setIsPressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleTap]);

  const handleDecrement = () => {
    if (state.count <= 0) return;
    setState((prev) => ({
      ...prev,
      count: Math.max(0, prev.count - 1),
    }));
  };

  const handleReset = () => {
    if (state.count > 5 && !confirmReset) {
      setConfirmReset(true);
      if (confirmResetTimerRef.current) clearTimeout(confirmResetTimerRef.current);
      confirmResetTimerRef.current = setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    setConfirmReset(false);
    setJustCompletedTarget(false);
    setState((prev) => ({
      ...prev,
      count: 0,
      cycles: 0,
    }));
    onNotify?.('Hitungan tasbih direset ke 0');
  };

  const handleSelectPreset = (preset) => {
    setConfirmReset(false);
    setJustCompletedTarget(false);
    setState((prev) => ({
      ...prev,
      activePresetId: preset.id,
      count: 0,
      target: preset.defaultTarget ?? prev.target,
    }));
  };

  const handleSelectSoundType = (soundId) => {
    setState((prev) => ({ ...prev, soundType: soundId, soundEnabled: true }));
    playTasbihKnock(soundId);
  };

  const handleCustomTargetSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(customTargetInput, 10);
    if (Number.isNaN(val) || val < 1 || val > 100000) {
      onNotify?.('Masukkan target antara 1 sampai 100.000');
      return;
    }
    setState((prev) => ({ ...prev, target: val, count: Math.min(prev.count, val) }));
    setCustomTargetInput('');
    onNotify?.(`Target tasbih diubah ke ${val}×`);
  };

  const handleAddCustomPreset = (e) => {
    e.preventDefault();
    const name = customName.trim();
    if (!name) {
      onNotify?.('Masukkan nama dzikir kustom terlebih dahulu');
      return;
    }
    const targetNum = Math.max(0, parseInt(customDefaultTarget, 10) || 33);
    const newPreset = {
      id: `custom_${Date.now()}`,
      name,
      arabic: customArabic.trim() || 'ذِكْرُ اللّٰهِ',
      latin: name,
      meaning: customMeaning.trim() || 'Dzikir pribadi',
      defaultTarget: targetNum,
      isCustom: true,
    };
    setState((prev) => ({
      ...prev,
      customPresets: [...(prev.customPresets || []), newPreset],
      activePresetId: newPreset.id,
      target: targetNum,
      count: 0,
    }));
    setCustomName('');
    setCustomArabic('');
    setCustomMeaning('');
    setCustomDefaultTarget('33');
    setShowCustomForm(false);
    onNotify?.(`Dzikir "${name}" ditambahkan`);
  };

  const handleDeleteCustomPreset = (presetId) => {
    setState((prev) => {
      const nextCustom = (prev.customPresets || []).filter((p) => p.id !== presetId);
      const nextActive =
        prev.activePresetId === presetId ? 'subhanallah' : prev.activePresetId;
      return {
        ...prev,
        customPresets: nextCustom,
        activePresetId: nextActive,
        count: prev.activePresetId === presetId ? 0 : prev.count,
      };
    });
    onNotify?.('Dzikir kustom dihapus');
  };

  // Progress geometry for circular SVG ring
  const radius = 114;
  const circumference = 2 * Math.PI * radius;
  const progressRatio =
    state.target > 0
      ? Math.min(state.count / state.target, 1)
      : (state.count % 33) / 33;
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Active rotating bead index (0..32)
  const activeBeadIndex = state.count > 0 ? (state.count - 1) % BEAD_RING_COUNT : -1;

  return (
    <div className="space-y-5">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-5 sm:p-6 text-white shadow-soft dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-950">
        <div className="islamic-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-50">
              <CircleDot className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
              <span>Tasbih Digital • Suara Ketukan &amp; Getar Haptik</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tasbih &amp; Dzikir Harian
            </h1>
            <p className="text-sm text-emerald-50/90">
              Ketuk tombol tasbih atau tekan <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-bold">Spasi</kbd> untuk berdzikir dengan suara ketukan yang menenangkan.
            </p>
          </div>

          {/* Daily & Total Stats Pill */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 backdrop-blur-sm text-center min-w-[100px]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-200">
                Hari Ini
              </p>
              <p className="text-xl font-extrabold tabular-nums text-white">
                {state.todayTotal.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 backdrop-blur-sm text-center min-w-[100px]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">
                Total Dzikir
              </p>
              <p className="text-xl font-extrabold tabular-nums text-white">
                {state.allTimeTotal.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Preset Dzikir Chips */}
      <section aria-label="Pilihan bacaan dzikir" className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pilih Bacaan Dzikir
          </h2>
          <button
            type="button"
            onClick={() => setShowCustomForm((v) => !v)}
            className="inline-flex min-h-[38px] items-center gap-1 rounded-xl px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Dzikir Kustom</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label="Daftar preset dzikir">
          {allPresets.map((preset) => {
            const isSelected = preset.id === activePreset.id;
            return (
              <button
                key={preset.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleSelectPreset(preset)}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950'
                    : 'border border-emerald-200/80 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-emerald-900/70 dark:bg-surface-dark dark:text-slate-200 dark:hover:border-emerald-600'
                }`}
              >
                <span>{preset.name}</span>
                {preset.defaultTarget > 0 && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white dark:bg-emerald-950/20 dark:text-emerald-950'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {preset.defaultTarget}×
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add Custom Dzikir Inline Form */}
        {showCustomForm && (
          <form
            onSubmit={handleAddCustomPreset}
            className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900/70 dark:bg-surface-dark space-y-3"
          >
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Tambah Bacaan Dzikir Pribadi
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="custom-dzikir-name" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nama / Latin *
                </label>
                <input
                  id="custom-dzikir-name"
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Contoh: Hasbunallah wa Ni'mal Wakil"
                  className="w-full min-h-[44px] rounded-xl border border-emerald-200 bg-emerald-50/30 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="custom-dzikir-arabic" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Teks Arab (opsional)
                </label>
                <input
                  id="custom-dzikir-arabic"
                  type="text"
                  dir="rtl"
                  value={customArabic}
                  onChange={(e) => setCustomArabic(e.target.value)}
                  placeholder="حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيْلُ"
                  className="w-full min-h-[44px] rounded-xl border border-emerald-200 bg-emerald-50/30 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="custom-dzikir-meaning" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Arti / Makna (opsional)
                </label>
                <input
                  id="custom-dzikir-meaning"
                  type="text"
                  value={customMeaning}
                  onChange={(e) => setCustomMeaning(e.target.value)}
                  placeholder="Cukuplah Allah menjadi penolong kami"
                  className="w-full min-h-[44px] rounded-xl border border-emerald-200 bg-emerald-50/30 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="custom-dzikir-target" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Target Default (0 = Bebas)
                </label>
                <input
                  id="custom-dzikir-target"
                  type="number"
                  min={0}
                  max={100000}
                  value={customDefaultTarget}
                  onChange={(e) => setCustomDefaultTarget(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-emerald-200 bg-emerald-50/30 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="min-h-[44px] rounded-xl px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-emerald-950 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="min-h-[44px] rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 cursor-pointer"
              >
                Simpan &amp; Pakai
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Main Two-Column Tasbih Interactive Area */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left / Primary Column: Active Dzikir + Tactile Circular Tap Counter */}
        <section className="lg:col-span-7 flex flex-col items-center rounded-3xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-soft dark:border-emerald-900/60 dark:bg-surface-dark dark:shadow-soft-dark">
          {/* Active Dzikir Display */}
          <div className="w-full text-center space-y-1.5 border-b border-emerald-50 pb-5 dark:border-emerald-900/50">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {activePreset.name}
              </span>
              {activePreset.isCustom && (
                <button
                  type="button"
                  onClick={() => handleDeleteCustomPreset(activePreset.id)}
                  aria-label={`Hapus dzikir kustom ${activePreset.name}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            <p
              className="arabic-text text-3xl sm:text-4xl text-emerald-950 dark:text-emerald-50 px-2"
              lang="ar"
              dir="rtl"
            >
              {cleanArabicText(activePreset.arabic)}
            </p>
            <p className="text-sm font-semibold italic text-emerald-700 dark:text-emerald-300">
              {activePreset.latin}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              &ldquo;{activePreset.meaning}&rdquo;
            </p>
          </div>

          {/* Interactive Tasbih Bead Ring & Counter Pad */}
          <div className="relative my-6 flex items-center justify-center select-none">
            {/* Subtle Expanding Knock Ripple Ring */}
            {pulseKey > 0 && (
              <span
                key={pulseKey}
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 rounded-full border-2 animate-ping opacity-30 ${
                  justCompletedTarget
                    ? 'border-gold-400'
                    : 'border-emerald-400'
                }`}
                style={{ animationIterationCount: 1, animationDuration: '420ms' }}
              />
            )}

            <button
              type="button"
              onClick={handleTap}
              onPointerDown={() => setIsPressed(true)}
              onPointerUp={() => setIsPressed(false)}
              onPointerLeave={() => setIsPressed(false)}
              aria-label={`Ketuk tasbih untuk ${activePreset.name}, hitungan saat ini ${state.count}${
                state.target > 0 ? ` dari ${state.target}` : ''
              }`}
              className={`group relative flex h-[264px] w-[264px] sm:h-[286px] sm:w-[286px] items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50 cursor-pointer transition-transform duration-100 ${
                isPressed ? 'scale-[0.96]' : 'scale-100'
              }`}
            >
              {/* SVG Circular Bead Ring & Progress Track */}
              <svg
                viewBox="0 0 260 260"
                className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
                aria-hidden="true"
              >
                {/* Track circle */}
                <circle
                  cx="130"
                  cy="130"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-emerald-100 dark:text-emerald-950"
                />
                {/* Progress arc */}
                <circle
                  cx="130"
                  cy="130"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className={`transition-all duration-200 ${
                    justCompletedTarget ||
                    (state.target > 0 && state.count >= state.target)
                      ? 'text-gold-500'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                />

                {/* 33 Decorative Tasbih Beads around outer perimeter */}
                {Array.from({ length: BEAD_RING_COUNT }).map((_, i) => {
                  const angle = (i / BEAD_RING_COUNT) * 2 * Math.PI;
                  const bx = 130 + 124 * Math.cos(angle);
                  const by = 130 + 124 * Math.sin(angle);
                  const isActiveBead = i === activeBeadIndex;
                  const isPassed = activeBeadIndex >= 0 && i <= activeBeadIndex;
                  return (
                    <circle
                      key={i}
                      cx={bx}
                      cy={by}
                      r={isActiveBead ? 4.4 : 2.3}
                      className={
                        isActiveBead
                          ? 'fill-gold-500 transition-all duration-150'
                          : isPassed
                          ? 'fill-emerald-500/80 dark:fill-emerald-400/80'
                          : 'fill-emerald-200/80 dark:fill-emerald-900'
                      }
                    />
                  );
                })}
              </svg>

              {/* Inner Tactile Button Surface */}
              <div
                className={`flex h-[206px] w-[206px] sm:h-[224px] sm:w-[224px] flex-col items-center justify-center rounded-full border-2 shadow-inner transition-colors duration-200 ${
                  justCompletedTarget ||
                  (state.target > 0 && state.count >= state.target)
                    ? 'border-gold-300 bg-gradient-to-b from-gold-50 to-amber-100/70 dark:border-gold-600/70 dark:from-gold-950/50 dark:to-surface-dark'
                    : 'border-emerald-200/90 bg-gradient-to-b from-emerald-50/90 via-white to-emerald-50/40 group-hover:from-emerald-100/70 dark:border-emerald-800/70 dark:from-emerald-950/70 dark:via-surface-dark dark:to-canvas-dark'
                }`}
              >
                {justCompletedTarget ||
                (state.target > 0 && state.count >= state.target) ? (
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-gold-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Target Tercapai</span>
                  </span>
                ) : (
                  <span className="mb-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700/80 dark:text-emerald-400/90">
                    Ketuk Dzikir
                  </span>
                )}

                <span className="text-6xl sm:text-7xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white leading-none">
                  {state.count}
                </span>

                <span className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                  {state.target > 0 ? `Target ${state.target}×` : 'Mode Tanpa Batas'}
                  {state.cycles > 0 ? ` • Putaran #${state.cycles}` : ''}
                </span>
              </div>
            </button>
          </div>

          {/* Primary Counter Controls Row (Undo, Sound, Haptic, Reset) */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={state.count <= 0}
              aria-label="Kurangi 1 hitungan"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-emerald-900 dark:bg-canvas-dark dark:text-slate-200 cursor-pointer"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
              <span>-1</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !state.soundEnabled;
                setState((prev) => ({ ...prev, soundEnabled: next }));
                if (next) playTasbihKnock(state.soundType);
              }}
              aria-pressed={state.soundEnabled}
              aria-label={
                state.soundEnabled
                  ? 'Matikan suara ketukan tasbih'
                  : 'Aktifkan suara ketukan tasbih'
              }
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                state.soundEnabled
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              {state.soundEnabled ? (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Ketukan {state.soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !state.hapticEnabled;
                setState((prev) => ({ ...prev, hapticEnabled: next }));
                if (next) triggerTasbihHaptic(false);
              }}
              aria-pressed={state.hapticEnabled}
              aria-label={
                state.hapticEnabled
                  ? 'Matikan getar ketukan'
                  : 'Aktifkan getar ketukan'
              }
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                state.hapticEnabled
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              <Vibrate className="h-4 w-4" aria-hidden="true" />
              <span>Getar {state.hapticEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset hitungan tasbih"
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                confirmReset
                  ? 'border-red-500 bg-red-600 text-white hover:bg-red-700'
                  : 'border-emerald-200 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-emerald-900 dark:bg-canvas-dark dark:text-slate-200 dark:hover:border-red-800 dark:hover:text-red-400'
              }`}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>{confirmReset ? 'Yakin Reset?' : 'Reset'}</span>
            </button>
          </div>
        </section>

        {/* Right Column: Knock Sound Selector, Target Settings & Dzikir Chain Mode */}
        <aside className="lg:col-span-5 space-y-4">
          {/* Jenis Suara Ketukan */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5 shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                <Volume2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>Jenis Suara Ketukan</span>
              </h2>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Ketuk untuk uji suara
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {KNOCK_SOUNDS.map((sound) => {
                const selected = state.soundType === sound.id;
                return (
                  <button
                    key={sound.id}
                    type="button"
                    onClick={() => handleSelectSoundType(sound.id)}
                    aria-pressed={selected}
                    className={`flex min-h-[50px] items-center justify-between rounded-xl border px-3.5 py-2 text-left transition-colors cursor-pointer ${
                      selected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/70 dark:text-emerald-100'
                        : 'border-emerald-100 bg-emerald-50/20 text-slate-700 hover:border-emerald-300 dark:border-emerald-900/50 dark:bg-canvas-dark/50 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold">{sound.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {sound.desc}
                      </p>
                    </div>
                    {selected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-400 dark:text-emerald-950">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pengaturan Target Hitungan */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5 shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
              <Target className="h-4 w-4 text-gold-600 dark:text-gold-400" aria-hidden="true" />
              <span>Target Hitungan</span>
            </h2>

            <div className="flex flex-wrap gap-2">
              {TASBIH_TARGETS.map((t) => {
                const active = state.target === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        target: t.value,
                        count: t.value > 0 ? Math.min(prev.count, t.value) : prev.count,
                      }))
                    }
                    className={`min-h-[44px] rounded-xl px-3.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950'
                        : 'border border-emerald-200/80 bg-white text-slate-700 hover:border-emerald-400 dark:border-emerald-900/70 dark:bg-canvas-dark dark:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleCustomTargetSubmit} className="flex items-center gap-2 pt-1">
              <label htmlFor="tasbih-custom-target" className="sr-only">
                Target kustom
              </label>
              <input
                id="tasbih-custom-target"
                type="number"
                min={1}
                max={100000}
                inputMode="numeric"
                value={customTargetInput}
                onChange={(e) => setCustomTargetInput(e.target.value)}
                placeholder="Target kustom (mis. 70)"
                className="flex-1 min-h-[44px] rounded-xl border border-emerald-200 bg-emerald-50/30 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-slate-100"
              />
              <button
                type="submit"
                className="min-h-[44px] rounded-xl bg-gold-500 px-4 text-xs sm:text-sm font-bold text-white hover:bg-gold-600 cursor-pointer"
              >
                Atur
              </button>
            </form>
          </div>

          {/* Mode Rangkaian Dzikir Setelah Shalat (33-33-33) */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5 shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark">
            <button
              type="button"
              role="switch"
              aria-checked={state.autoChainAfterPrayer}
              onClick={() => {
                const next = !state.autoChainAfterPrayer;
                setState((prev) => ({
                  ...prev,
                  autoChainAfterPrayer: next,
                  ...(next
                    ? { activePresetId: 'subhanallah', target: 33, count: 0 }
                    : {}),
                }));
                onNotify?.(
                  next
                    ? 'Mode Dzikir Setelah Shalat aktif (Subhanallah → Alhamdulillah → Allahu Akbar 33×)'
                    : 'Mode Dzikir Setelah Shalat dinonaktifkan'
                );
              }}
              className="flex w-full min-h-[52px] items-center justify-between gap-3 text-left cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-600 dark:bg-gold-950/50 dark:text-gold-400">
                  <Repeat className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Auto-Lanjut Dzikir Ba&apos;da Shalat
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Otomatis berpindah Subhanallah (33×) → Alhamdulillah (33×) → Allahu Akbar (33×)
                  </p>
                </div>
              </div>
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  state.autoChainAfterPrayer
                    ? 'bg-emerald-600 dark:bg-emerald-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    state.autoChainAfterPrayer ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          </div>

          {/* Catatan Pencapaian per Dzikir */}
          {Object.keys(state.perPresetCounts || {}).length > 0 && (
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5 shadow-sm dark:border-emerald-900/60 dark:bg-surface-dark space-y-2.5">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>Riwayat Dzikir Tersimpan</span>
              </h2>
              <div className="divide-y divide-emerald-50 dark:divide-emerald-900/40">
                {Object.entries(state.perPresetCounts)
                  .filter(([, total]) => total > 0)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([presetId, total]) => {
                    const presetObj = allPresets.find((p) => p.id === presetId);
                    if (!presetObj) return null;
                    return (
                      <div
                        key={presetId}
                        className="flex items-center justify-between py-2 text-xs sm:text-sm"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate pr-2">
                          {presetObj.name}
                        </span>
                        <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-0.5 font-extrabold tabular-nums text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {total.toLocaleString('id-ID')}×
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
