export function getTodayDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export const DEFAULT_TASBIH_STATE = {
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

export function hasTasbihTotalsOrHistory(state) {
  if (!state) return false;
  if (
    (Number(state.allTimeTotal) || 0) > 0 ||
    (Number(state.todayTotal) || 0) > 0 ||
    (Number(state.count) || 0) > 0 ||
    (Number(state.cycles) || 0) > 0
  ) {
    return true;
  }
  return Object.values(state.perPresetCounts || {}).some(
    (total) => Number(total) > 0
  );
}

export function resetTasbihTotalsAndHistory(prev, todayKey = getTodayDateKey()) {
  return {
    ...DEFAULT_TASBIH_STATE,
    ...prev,
    count: 0,
    cycles: 0,
    todayDateKey: todayKey,
    todayTotal: 0,
    allTimeTotal: 0,
    perPresetCounts: {},
  };
}
