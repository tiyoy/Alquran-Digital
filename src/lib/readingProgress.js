/**
 * Mesin Pelacakan Progres Bacaan Al-Qur'an per Ayat & Target Bacaan Harian
 * - Mencatat ayat yang sudah dibaca dalam setiap surah (`readVersesBySurah`)
 * - Menentukan posisi "Terakhir Dibaca" (`lastRead`) secara akurat
 * - Menghitung target bacaan harian dari ayat unik yang dibaca hari ini (`todayReadVerseKeys`)
 * - Otomatis menandai surah selesai (`readSurahs`) saat seluruh ayatnya telah dibaca
 */

export function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function getYesterdayDateKey(date = new Date()) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() - 1);
  return getDateKey(d);
}

export const DEFAULT_READING_STATS = {
  dailyTarget: 20,
  todayKey: '',
  todayVerses: 0,
  todayReadVerseKeys: [],
  readVersesBySurah: {},
  lastReadDateKey: '',
  streak: 0,
  readSurahs: [],
};

function makeVerseKey(surahNumber, verseNumber) {
  return `${surahNumber}:${verseNumber}`;
}

function normalizePositiveIntList(list) {
  if (!Array.isArray(list)) return [];
  const set = new Set();
  for (const item of list) {
    const num = Number(item);
    if (Number.isInteger(num) && num > 0) {
      set.add(num);
    }
  }
  return [...set].sort((a, b) => a - b);
}

function normalizeReadVersesMap(rawMap) {
  const result = {};
  if (!rawMap || typeof rawMap !== 'object') return result;
  for (const [surahKey, verses] of Object.entries(rawMap)) {
    const surahNum = Number(surahKey);
    if (!Number.isInteger(surahNum) || surahNum < 1 || surahNum > 114) continue;
    const normalized = normalizePositiveIntList(verses);
    if (normalized.length > 0) {
      result[String(surahNum)] = normalized;
    }
  }
  return result;
}

function computeNextStreak(prev, todayKey, yesterdayKey, hasActivityToday) {
  const currentStreak = Number(prev?.streak) || 0;
  if (!hasActivityToday) {
    return {
      streak: currentStreak,
      lastReadDateKey: prev?.lastReadDateKey || '',
    };
  }
  if (prev?.lastReadDateKey === todayKey) {
    return {
      streak: Math.max(1, currentStreak),
      lastReadDateKey: todayKey,
    };
  }
  return {
    streak: prev?.lastReadDateKey === yesterdayKey ? currentStreak + 1 : 1,
    lastReadDateKey: todayKey,
  };
}

/**
 * Memulihkan & memigrasikan data readingStats dari localStorage secara aman
 */
export function hydrateReadingStats(
  raw,
  todayKey = getDateKey(),
  yesterdayKey = getYesterdayDateKey()
) {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_READING_STATS, todayKey };
  }

  const sameDay = raw.todayKey === todayKey;
  const validStreak =
    raw.lastReadDateKey === todayKey || raw.lastReadDateKey === yesterdayKey
      ? Number(raw.streak) || 0
      : 0;

  let todayReadVerseKeys = [];
  if (sameDay) {
    if (Array.isArray(raw.todayReadVerseKeys)) {
      todayReadVerseKeys = [...new Set(raw.todayReadVerseKeys.filter((k) => typeof k === 'string' && k.length > 0))];
    } else {
      // Migrasi data versi lama yang belum menyimpan todayReadVerseKeys
      const legacyCount = Math.max(0, Number(raw.todayVerses) || 0);
      todayReadVerseKeys = Array.from(
        { length: legacyCount },
        (_, idx) => `legacy:${idx + 1}`
      );
    }
  }

  return {
    ...DEFAULT_READING_STATS,
    dailyTarget: Math.max(1, Number(raw.dailyTarget) || DEFAULT_READING_STATS.dailyTarget),
    todayKey,
    todayReadVerseKeys,
    todayVerses: todayReadVerseKeys.length,
    readVersesBySurah: normalizeReadVersesMap(raw.readVersesBySurah),
    lastReadDateKey: validStreak > 0 ? raw.lastReadDateKey : '',
    streak: validStreak,
    readSurahs: normalizePositiveIntList(raw.readSurahs),
  };
}

/**
 * Mencatat 1 ayat yang terbaca secara otomatis (scroll dwell atau audio ayat selesai)
 */
export function recordVerseRead({
  stats,
  lastRead,
  surah,
  verseNumber,
  todayKey = getDateKey(),
  yesterdayKey = getYesterdayDateKey(),
  timestamp = Date.now(),
}) {
  const safeStats = stats || { ...DEFAULT_READING_STATS, todayKey };
  const surahNum = Number(surah?.nomor);
  const totalVerses = Math.max(1, Number(surah?.jumlahAyat) || 1);
  const verseNum = Number(verseNumber);

  if (
    !Number.isInteger(surahNum) ||
    !Number.isInteger(verseNum) ||
    verseNum < 1 ||
    verseNum > totalVerses
  ) {
    return {
      stats: safeStats,
      lastRead,
      addedTodayCount: 0,
      newlyCompletedSurah: false,
      changed: false,
    };
  }

  const surahKey = String(surahNum);
  const isNewDay = safeStats.todayKey !== todayKey;
  const baseTodayKeys = isNewDay ? [] : [...(safeStats.todayReadVerseKeys || [])];
  const todayKeySet = new Set(baseTodayKeys);

  const prevReadMap = safeStats.readVersesBySurah || {};
  const prevSurahVerses = prevReadMap[surahKey] || [];
  const wasUnreadInSurah = !prevSurahVerses.includes(verseNum);
  const wasSurahCompleted =
    (safeStats.readSurahs || []).includes(surahNum) ||
    prevSurahVerses.length >= totalVerses;

  const nextSurahVerses = wasUnreadInSurah
    ? [...prevSurahVerses, verseNum].sort((a, b) => a - b)
    : prevSurahVerses;

  const verseKey = makeVerseKey(surahNum, verseNum);
  const addedTodayCount = todayKeySet.has(verseKey) ? 0 : 1;
  if (addedTodayCount > 0) {
    todayKeySet.add(verseKey);
  }

  const nextTodayKeys = [...todayKeySet];
  const nextReadSurahsSet = new Set(safeStats.readSurahs || []);
  const hadSurahBefore = nextReadSurahsSet.has(surahNum);
  if (nextSurahVerses.length >= totalVerses) {
    nextReadSurahsSet.add(surahNum);
  }
  const newlyCompletedSurah = !hadSurahBefore && nextReadSurahsSet.has(surahNum);

  const { streak, lastReadDateKey } = computeNextStreak(
    safeStats,
    todayKey,
    yesterdayKey,
    addedTodayCount > 0
  );

  // Tentukan pembaruan Terakhir Dibaca secara cerdas (tidak memundurkan progres saat menengok ayat sebelumnya)
  let nextLastRead = lastRead;
  const shouldUpdateLastRead =
    !lastRead ||
    (lastRead.surahNumber === surahNum
      ? verseNum > lastRead.verseNumber ||
        (wasSurahCompleted && isNewDay && addedTodayCount > 0)
      : wasUnreadInSurah || addedTodayCount > 0);

  if (shouldUpdateLastRead) {
    nextLastRead = {
      surahNumber: surahNum,
      surahName: surah.namaLatin,
      verseNumber: verseNum,
      timestamp,
    };
  }

  const changed =
    isNewDay ||
    wasUnreadInSurah ||
    addedTodayCount > 0 ||
    newlyCompletedSurah ||
    nextLastRead !== lastRead;

  const nextStats = {
    ...safeStats,
    todayKey,
    todayReadVerseKeys: nextTodayKeys,
    todayVerses: nextTodayKeys.length,
    readVersesBySurah: wasUnreadInSurah
      ? { ...prevReadMap, [surahKey]: nextSurahVerses }
      : prevReadMap,
    lastReadDateKey,
    streak,
    readSurahs: [...nextReadSurahsSet].sort((a, b) => a - b),
  };

  return {
    stats: nextStats,
    lastRead: nextLastRead,
    addedTodayCount,
    newlyCompletedSurah,
    changed,
  };
}

/**
 * Penandaan manual oleh user pada ayat ke-N dalam 1 surah:
 * - Menandai ayat 1..N sebagai sudah dibaca & menetapkan Terakhir Dibaca = N
 * - Jika N < batas terbaca saat ini di surah tersebut -> koreksi mundur ke 1..N
 * - Jika N adalah persis posisi Terakhir Dibaca saat ini -> batal tanda pada ayat N
 */
export function setManualLastReadVerse({
  stats,
  lastRead,
  surah,
  verseNumber,
  todayKey = getDateKey(),
  yesterdayKey = getYesterdayDateKey(),
  timestamp = Date.now(),
}) {
  const safeStats = stats || { ...DEFAULT_READING_STATS, todayKey };
  const surahNum = Number(surah?.nomor);
  const totalVerses = Math.max(1, Number(surah?.jumlahAyat) || 1);
  const verseNum = Number(verseNumber);

  if (
    !Number.isInteger(surahNum) ||
    !Number.isInteger(verseNum) ||
    verseNum < 1 ||
    verseNum > totalVerses
  ) {
    return {
      stats: safeStats,
      lastRead,
      action: 'noop',
      addedTodayCount: 0,
      newlyCompletedSurah: false,
    };
  }

  const surahKey = String(surahNum);
  const isNewDay = safeStats.todayKey !== todayKey;
  const todayKeySet = new Set(isNewDay ? [] : safeStats.todayReadVerseKeys || []);
  const prevReadMap = safeStats.readVersesBySurah || {};
  const prevSurahVerses = prevReadMap[surahKey] || [];
  const nextReadSurahsSet = new Set(safeStats.readSurahs || []);
  const hadSurahBefore = nextReadSurahsSet.has(surahNum);

  const isExactCurrentLastRead =
    lastRead?.surahNumber === surahNum &&
    lastRead?.verseNumber === verseNum &&
    prevSurahVerses.includes(verseNum);

  // Kasus 1: Toggle batal pada ayat yang saat ini menjadi Terakhir Dibaca
  if (isExactCurrentLastRead) {
    const nextSurahVerses = prevSurahVerses.filter((v) => v !== verseNum);
    todayKeySet.delete(makeVerseKey(surahNum, verseNum));

    const nextReadMap = { ...prevReadMap };
    if (nextSurahVerses.length > 0) {
      nextReadMap[surahKey] = nextSurahVerses;
    } else {
      delete nextReadMap[surahKey];
    }

    if (nextSurahVerses.length < totalVerses) {
      nextReadSurahsSet.delete(surahNum);
    }

    const nextTodayKeys = [...todayKeySet];
    const nextLastRead =
      nextSurahVerses.length > 0
        ? {
            surahNumber: surahNum,
            surahName: surah.namaLatin,
            verseNumber: nextSurahVerses[nextSurahVerses.length - 1],
            timestamp,
          }
        : null;

    return {
      stats: {
        ...safeStats,
        todayKey,
        todayReadVerseKeys: nextTodayKeys,
        todayVerses: nextTodayKeys.length,
        readVersesBySurah: nextReadMap,
        readSurahs: [...nextReadSurahsSet].sort((a, b) => a - b),
      },
      lastRead: nextLastRead,
      action: 'unmarked',
      addedTodayCount: 0,
      newlyCompletedSurah: false,
    };
  }

  // Kasus 2 & 3: Tandai kumulatif 1..N (maju atau koreksi mundur)
  const isBackwardCorrection = prevSurahVerses.some((v) => v > verseNum);
  const nextSurahVerses = Array.from({ length: verseNum }, (_, idx) => idx + 1);

  if (isBackwardCorrection) {
    for (const v of prevSurahVerses) {
      if (v > verseNum) {
        todayKeySet.delete(makeVerseKey(surahNum, v));
      }
    }
  }

  let addedTodayCount = 0;
  for (const v of nextSurahVerses) {
    const key = makeVerseKey(surahNum, v);
    if (!todayKeySet.has(key)) {
      todayKeySet.add(key);
      addedTodayCount += 1;
    }
  }

  if (nextSurahVerses.length >= totalVerses) {
    nextReadSurahsSet.add(surahNum);
  } else {
    nextReadSurahsSet.delete(surahNum);
  }
  const newlyCompletedSurah = !hadSurahBefore && nextReadSurahsSet.has(surahNum);

  const nextTodayKeys = [...todayKeySet];
  const { streak, lastReadDateKey } = computeNextStreak(
    safeStats,
    todayKey,
    yesterdayKey,
    nextTodayKeys.length > 0 && addedTodayCount > 0
  );

  return {
    stats: {
      ...safeStats,
      todayKey,
      todayReadVerseKeys: nextTodayKeys,
      todayVerses: nextTodayKeys.length,
      readVersesBySurah: {
        ...prevReadMap,
        [surahKey]: nextSurahVerses,
      },
      lastReadDateKey,
      streak,
      readSurahs: [...nextReadSurahsSet].sort((a, b) => a - b),
    },
    lastRead: {
      surahNumber: surahNum,
      surahName: surah.namaLatin,
      verseNumber: verseNum,
      timestamp,
    },
    action: isBackwardCorrection ? 'corrected' : 'marked',
    addedTodayCount,
    newlyCompletedSurah,
  };
}

/**
 * Menandai seluruh ayat dalam 1 surah selesai dibaca (hanya menambahkan ayat yang belum tercatat hari ini)
 */
export function markSurahFullyRead({
  stats,
  lastRead,
  surah,
  todayKey = getDateKey(),
  yesterdayKey = getYesterdayDateKey(),
  timestamp = Date.now(),
}) {
  const safeStats = stats || { ...DEFAULT_READING_STATS, todayKey };
  const surahNum = Number(surah?.nomor);
  const totalVerses = Math.max(1, Number(surah?.jumlahAyat) || 1);

  if (!Number.isInteger(surahNum)) {
    return {
      stats: safeStats,
      lastRead,
      addedTodayCount: 0,
      newlyCompletedSurah: false,
    };
  }

  const surahKey = String(surahNum);
  const isNewDay = safeStats.todayKey !== todayKey;
  const todayKeySet = new Set(isNewDay ? [] : safeStats.todayReadVerseKeys || []);
  const allVerses = Array.from({ length: totalVerses }, (_, idx) => idx + 1);

  let addedTodayCount = 0;
  for (const v of allVerses) {
    const key = makeVerseKey(surahNum, v);
    if (!todayKeySet.has(key)) {
      todayKeySet.add(key);
      addedTodayCount += 1;
    }
  }

  const nextTodayKeys = [...todayKeySet];
  const nextReadSurahsSet = new Set(safeStats.readSurahs || []);
  const hadSurahBefore = nextReadSurahsSet.has(surahNum);
  nextReadSurahsSet.add(surahNum);
  const newlyCompletedSurah = !hadSurahBefore;

  const { streak, lastReadDateKey } = computeNextStreak(
    safeStats,
    todayKey,
    yesterdayKey,
    addedTodayCount > 0
  );

  return {
    stats: {
      ...safeStats,
      todayKey,
      todayReadVerseKeys: nextTodayKeys,
      todayVerses: nextTodayKeys.length,
      readVersesBySurah: {
        ...(safeStats.readVersesBySurah || {}),
        [surahKey]: allVerses,
      },
      lastReadDateKey,
      streak,
      readSurahs: [...nextReadSurahsSet].sort((a, b) => a - b),
    },
    lastRead: {
      surahNumber: surahNum,
      surahName: surah.namaLatin,
      verseNumber: totalVerses,
      timestamp,
    },
    addedTodayCount,
    newlyCompletedSurah,
  };
}

export function resetAllReadingStats(prevStats, todayKey = getDateKey()) {
  return {
    ...DEFAULT_READING_STATS,
    dailyTarget: prevStats?.dailyTarget || DEFAULT_READING_STATS.dailyTarget,
    todayKey,
  };
}

export function getSurahReadProgress(stats, surahNumber, totalVerses) {
  const total = Math.max(1, Number(totalVerses) || 1);
  const surahNum = Number(surahNumber);
  const readVerses = stats?.readVersesBySurah?.[String(surahNum)] || [];
  const readCount = readVerses.length;
  const isCompleted =
    (stats?.readSurahs || []).includes(surahNum) || readCount >= total;
  const effectiveCount = isCompleted ? Math.max(readCount, total) : Math.min(readCount, total);
  const percent = Math.min(100, Math.round((effectiveCount / total) * 100));

  return {
    readVerses,
    readCount: effectiveCount,
    totalVerses: total,
    percent,
    isCompleted,
  };
}
