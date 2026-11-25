import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_TASBIH_STATE,
  hasTasbihTotalsOrHistory,
  resetTasbihTotalsAndHistory,
} from '../src/lib/tasbihState.js';

test('resetTasbihTotalsAndHistory resets totals, active count, and clears reading history while preserving preferences', () => {
  const populated = {
    ...DEFAULT_TASBIH_STATE,
    activePresetId: 'istighfar',
    count: 17,
    cycles: 2,
    target: 100,
    soundEnabled: false,
    soundType: 'soft',
    hapticEnabled: false,
    autoChainAfterPrayer: true,
    todayDateKey: '2026-11-24',
    todayTotal: 83,
    allTimeTotal: 420,
    perPresetCounts: {
      subhanallah: 150,
      alhamdulillah: 120,
      istighfar: 150,
    },
    customPresets: [
      { id: 'custom_1', name: 'Shalawat', arabic: 'صَلَّى اللّٰهُ', defaultTarget: 33, isCustom: true },
    ],
  };

  const reset = resetTasbihTotalsAndHistory(populated, '2026-11-25');

  assert.equal(reset.count, 0);
  assert.equal(reset.cycles, 0);
  assert.equal(reset.todayTotal, 0);
  assert.equal(reset.allTimeTotal, 0);
  assert.deepEqual(reset.perPresetCounts, {});
  assert.equal(reset.todayDateKey, '2026-11-25');

  assert.equal(reset.activePresetId, 'istighfar');
  assert.equal(reset.target, 100);
  assert.equal(reset.soundEnabled, false);
  assert.equal(reset.soundType, 'soft');
  assert.equal(reset.hapticEnabled, false);
  assert.equal(reset.autoChainAfterPrayer, true);
  assert.equal(reset.customPresets.length, 1);
});

test('hasTasbihTotalsOrHistory reflects whether any total, active count, or history is present', () => {
  assert.equal(hasTasbihTotalsOrHistory(DEFAULT_TASBIH_STATE), false);
  assert.equal(
    hasTasbihTotalsOrHistory({ ...DEFAULT_TASBIH_STATE, allTimeTotal: 1 }),
    true
  );
  assert.equal(
    hasTasbihTotalsOrHistory({ ...DEFAULT_TASBIH_STATE, todayTotal: 5 }),
    true
  );
  assert.equal(
    hasTasbihTotalsOrHistory({
      ...DEFAULT_TASBIH_STATE,
      perPresetCounts: { subhanallah: 3 },
    }),
    true
  );
  assert.equal(
    hasTasbihTotalsOrHistory({
      ...DEFAULT_TASBIH_STATE,
      perPresetCounts: { subhanallah: 0 },
    }),
    false
  );
});
