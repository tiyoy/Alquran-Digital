import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_READING_STATS,
  getSurahReadProgress,
  hydrateReadingStats,
  markSurahFullyRead,
  recordVerseRead,
  resetAllReadingStats,
  setManualLastReadVerse,
} from '../src/lib/readingProgress.js';

const SURAH_FATIHAH = { nomor: 1, namaLatin: 'Al-Fatihah', jumlahAyat: 7 };
const SURAH_BAQARAH = { nomor: 2, namaLatin: 'Al-Baqarah', jumlahAyat: 286 };
const SURAH_IKHLAS = { nomor: 112, namaLatin: 'Al-Ikhlas', jumlahAyat: 4 };

const TODAY = '2026-11-25';
const YESTERDAY = '2026-11-24';
const TOMORROW = '2026-11-26';

test('recordVerseRead tracks individual verses in a surah, updates lastRead, daily target, and streak without double-counting', () => {
  let stats = { ...DEFAULT_READING_STATS, todayKey: TODAY };
  let lastRead = null;

  // Read verses 1, 2, 3 of Al-Baqarah
  for (const v of [1, 2, 3]) {
    const res = recordVerseRead({
      stats,
      lastRead,
      surah: SURAH_BAQARAH,
      verseNumber: v,
      todayKey: TODAY,
      yesterdayKey: YESTERDAY,
      timestamp: 1000 + v,
    });
    stats = res.stats;
    lastRead = res.lastRead;
    assert.equal(res.addedTodayCount, 1);
  }

  assert.equal(stats.todayVerses, 3);
  assert.deepEqual(stats.readVersesBySurah['2'], [1, 2, 3]);
  assert.equal(stats.streak, 1);
  assert.equal(stats.lastReadDateKey, TODAY);
  assert.equal(lastRead.surahNumber, 2);
  assert.equal(lastRead.verseNumber, 3);

  // Re-reading verse 2 on the same day must NOT double-count and must NOT regress lastRead backwards
  const repeatRes = recordVerseRead({
    stats,
    lastRead,
    surah: SURAH_BAQARAH,
    verseNumber: 2,
    todayKey: TODAY,
    yesterdayKey: YESTERDAY,
    timestamp: 2000,
  });

  assert.equal(repeatRes.addedTodayCount, 0);
  assert.equal(repeatRes.stats.todayVerses, 3);
  assert.equal(repeatRes.lastRead.verseNumber, 3);
});

test('recordVerseRead automatically marks surah completed when all verses are read and increments streak across consecutive days', () => {
  let stats = {
    ...DEFAULT_READING_STATS,
    todayKey: YESTERDAY,
    todayVerses: 5,
    todayReadVerseKeys: ['1:1', '1:2', '1:3', '1:4', '1:5'],
    readVersesBySurah: { '1': [1, 2, 3, 4, 5] },
    lastReadDateKey: YESTERDAY,
    streak: 2,
    readSurahs: [],
  };
  let lastRead = { surahNumber: 1, surahName: 'Al-Fatihah', verseNumber: 5, timestamp: 100 };

  // Next day (TODAY): read Al-Ikhlas verses 1..4
  let completedFlag = false;
  for (const v of [1, 2, 3, 4]) {
    const res = recordVerseRead({
      stats,
      lastRead,
      surah: SURAH_IKHLAS,
      verseNumber: v,
      todayKey: TODAY,
      yesterdayKey: YESTERDAY,
      timestamp: 500 + v,
    });
    stats = res.stats;
    lastRead = res.lastRead;
    if (res.newlyCompletedSurah) completedFlag = true;
  }

  assert.equal(completedFlag, true);
  assert.equal(stats.todayKey, TODAY);
  assert.equal(stats.todayVerses, 4); // Rolled over cleanly from yesterday's 5
  assert.equal(stats.streak, 3); // Incremented from 2 -> 3
  assert.deepEqual(stats.readSurahs, [112]);
  assert.equal(lastRead.surahNumber, 112);
  assert.equal(lastRead.verseNumber, 4);

  // Re-reading Al-Ikhlas verse 1 TOMORROW counts toward tomorrow's daily target
  const nextDayRes = recordVerseRead({
    stats,
    lastRead,
    surah: SURAH_IKHLAS,
    verseNumber: 1,
    todayKey: TOMORROW,
    yesterdayKey: TODAY,
    timestamp: 900,
  });
  assert.equal(nextDayRes.stats.todayVerses, 1);
  assert.equal(nextDayRes.stats.streak, 4);
  assert.equal(nextDayRes.lastRead.verseNumber, 1);
});

test('setManualLastReadVerse marks verses 1..N cumulatively, allows backward correction, and toggles off when clicked again', () => {
  let stats = { ...DEFAULT_READING_STATS, todayKey: TODAY };
  let lastRead = null;

  // Manually mark verse 10 of Al-Baqarah -> marks 1..10
  const r1 = setManualLastReadVerse({
    stats,
    lastRead,
    surah: SURAH_BAQARAH,
    verseNumber: 10,
    todayKey: TODAY,
    yesterdayKey: YESTERDAY,
    timestamp: 100,
  });
  stats = r1.stats;
  lastRead = r1.lastRead;

  assert.equal(r1.action, 'marked');
  assert.equal(stats.readVersesBySurah['2'].length, 10);
  assert.equal(stats.todayVerses, 10);
  assert.equal(lastRead.surahNumber, 2);
  assert.equal(lastRead.verseNumber, 10);

  // Advance manually to verse 15 -> only adds 5 new verses (total 15, no double-counting)
  const r2 = setManualLastReadVerse({
    stats,
    lastRead,
    surah: SURAH_BAQARAH,
    verseNumber: 15,
    todayKey: TODAY,
    yesterdayKey: YESTERDAY,
    timestamp: 200,
  });
  stats = r2.stats;
  lastRead = r2.lastRead;

  assert.equal(r2.action, 'marked');
  assert.equal(r2.addedTodayCount, 5);
  assert.equal(stats.todayVerses, 15);
  assert.equal(lastRead.verseNumber, 15);

  // Backward correction to verse 7 -> trims 8..15 and updates daily count & lastRead to 7
  const r3 = setManualLastReadVerse({
    stats,
    lastRead,
    surah: SURAH_BAQARAH,
    verseNumber: 7,
    todayKey: TODAY,
    yesterdayKey: YESTERDAY,
    timestamp: 300,
  });
  stats = r3.stats;
  lastRead = r3.lastRead;

  assert.equal(r3.action, 'corrected');
  assert.deepEqual(stats.readVersesBySurah['2'], [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(stats.todayVerses, 7);
  assert.equal(lastRead.verseNumber, 7);

  // Clicking verse 7 again toggles verse 7 off and moves lastRead back to verse 6
  const r4 = setManualLastReadVerse({
    stats,
    lastRead,
    surah: SURAH_BAQARAH,
    verseNumber: 7,
    todayKey: TODAY,
    yesterdayKey: YESTERDAY,
    timestamp: 400,
  });
  assert.equal(r4.action, 'unmarked');
  assert.deepEqual(r4.stats.readVersesBySurah['2'], [1, 2, 3, 4, 5, 6]);
  assert.equal(r4.stats.todayVerses, 6);
  assert.equal(r4.lastRead.verseNumber, 6);
});

test('markSurahFullyRead only counts remaining unread verses today without inflating daily target', () => {
  let stats = { ...DEFAULT_READING_STATS, todayKey: TODAY };
  let lastRead = null;

  // First read verses 1..5 of Al-Fatihah
  const partial = setManualLastReadVerse({
    stats,
    lastRead,
    surah: SURAH_FATIHAH,
    verseNumber: 5,
    todayKey: TODAY,
    yesterdayKey: YESTERDAY,
  });
  stats = partial.stats;
  lastRead = partial.lastRead;
  assert.equal(stats.todayVerses, 5);

  // Now click "Tandai Selesai Dibaca" -> should add ONLY +2 (verses 6 and 7), total 7
  const done = markSurahFullyRead({
    stats,
    lastRead,
    surah: SURAH_FATIHAH,
    todayKey: TODAY,
    yesterdayKey: YESTERDAY,
  });
  assert.equal(done.addedTodayCount, 2);
  assert.equal(done.stats.todayVerses, 7);
  assert.deepEqual(done.stats.readSurahs, [1]);
  assert.equal(done.lastRead.verseNumber, 7);

  // Clicking "Tandai Selesai Dibaca" a second time today does NOT double-count!
  const doneAgain = markSurahFullyRead({
    stats: done.stats,
    lastRead: done.lastRead,
    surah: SURAH_FATIHAH,
    todayKey: TODAY,
    yesterdayKey: YESTERDAY,
  });
  assert.equal(doneAgain.addedTodayCount, 0);
  assert.equal(doneAgain.stats.todayVerses, 7);
});

test('hydrateReadingStats migrates legacy storage cleanly and resetAllReadingStats clears all progress while keeping dailyTarget', () => {
  const legacySameDay = {
    dailyTarget: 50,
    todayKey: TODAY,
    todayVerses: 12,
    lastReadDateKey: TODAY,
    streak: 4,
    readSurahs: [1, 112],
  };

  const hydrated = hydrateReadingStats(legacySameDay, TODAY, YESTERDAY);
  assert.equal(hydrated.dailyTarget, 50);
  assert.equal(hydrated.todayVerses, 12);
  assert.equal(hydrated.todayReadVerseKeys.length, 12);
  assert.equal(hydrated.streak, 4);
  assert.deepEqual(hydrated.readSurahs, [1, 112]);

  // Adding 1 new verse after legacy hydration increments 12 -> 13 instead of dropping
  const afterOne = recordVerseRead({
    stats: hydrated,
    lastRead: null,
    surah: SURAH_BAQARAH,
    verseNumber: 1,
    todayKey: TODAY,
    yesterdayKey: YESTERDAY,
  });
  assert.equal(afterOne.stats.todayVerses, 13);

  const progress = getSurahReadProgress(afterOne.stats, 2, 286);
  assert.equal(progress.readCount, 1);
  assert.equal(progress.isCompleted, false);

  const reset = resetAllReadingStats(afterOne.stats, TODAY);
  assert.equal(reset.dailyTarget, 50);
  assert.equal(reset.todayVerses, 0);
  assert.deepEqual(reset.todayReadVerseKeys, []);
  assert.deepEqual(reset.readVersesBySurah, {});
  assert.deepEqual(reset.readSurahs, []);
  assert.equal(reset.streak, 0);
});
