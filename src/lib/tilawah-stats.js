export const DAILY_VERSE_GOAL_OPTIONS = Object.freeze([5, 10, 20, 30, 50, 100]);
export const DEFAULT_DAILY_VERSE_GOAL = 20;
export const MIN_DAILY_VERSE_GOAL = 1;
export const MAX_DAILY_VERSE_GOAL = 200;

export function normalizeDailyVerseGoal(value, fallback = DEFAULT_DAILY_VERSE_GOAL) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < MIN_DAILY_VERSE_GOAL || numeric > MAX_DAILY_VERSE_GOAL) return fallback;
  return numeric;
}

function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function dateKeyToDate(key) {
  return new Date(`${key}T00:00:00.000Z`);
}

function dateToKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(key, delta) {
  const date = dateKeyToDate(key);
  date.setUTCDate(date.getUTCDate() + delta);
  return dateToKey(date);
}

function isValidVerseKey(value) {
  const match = /^(\d{1,3}):(\d{1,3})$/.exec(String(value));
  if (!match) return false;
  const surah = Number(match[1]);
  const verse = Number(match[2]);
  return surah >= 1 && surah <= 114 && verse >= 1 && verse <= 286;
}

function countValidVerseKeys(value) {
  if (!Array.isArray(value)) return 0;
  return new Set(value.filter(isValidVerseKey).map(String)).size;
}

function activeDateKeys(readingDays) {
  if (!readingDays || typeof readingDays !== 'object' || Array.isArray(readingDays)) return [];
  return Object.entries(readingDays)
    .filter(([date, keys]) => isValidDateKey(date) && countValidVerseKeys(keys) > 0)
    .map(([date]) => date)
    .sort();
}

function formatDateLabel(dateKey, options = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Intl.DateTimeFormat('id-ID', { ...options, timeZone: 'UTC' }).format(dateKeyToDate(dateKey));
}

function activityCount(readingDays, dateKey) {
  return countValidVerseKeys(readingDays?.[dateKey]);
}

function calculateCurrentStreak(activeDates, todayKey) {
  const active = new Set(activeDates);
  const start = active.has(todayKey) ? todayKey : (active.has(addDays(todayKey, -1)) ? addDays(todayKey, -1) : null);
  if (!start) return 0;
  let streak = 0;
  let cursor = start;
  while (active.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function calculateBestStreak(activeDates) {
  if (!activeDates.length) return 0;
  const active = new Set(activeDates);
  let best = 0;
  let current = 0;
  let previous = null;
  for (const date of activeDates) {
    if (previous && addDays(previous, 1) === date) current += 1;
    else current = 1;
    best = Math.max(best, current);
    previous = date;
  }
  // Validate membership explicitly to avoid best-streak calculations depending on missing calendar dates.
  return Math.min(best, active.size);
}

export function getTilawahStats(readingDays, readVerseKeys, dailyVerseGoal = DEFAULT_DAILY_VERSE_GOAL, todayKey = new Date().toISOString().slice(0, 10)) {
  const target = normalizeDailyVerseGoal(dailyVerseGoal);
  const today = isValidDateKey(todayKey) ? todayKey : new Date().toISOString().slice(0, 10);
  const activeDates = activeDateKeys(readingDays).filter((date) => date <= today);
  const todayCount = activityCount(readingDays, today);
  const last7 = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    return {
      date,
      label: formatDateLabel(date, { weekday: 'short' }).replace('.', ''),
      shortDate: formatDateLabel(date, { day: 'numeric', month: 'short' }),
      count: activityCount(readingDays, date),
      isToday: date === today
    };
  });
  const last30 = Array.from({ length: 30 }, (_, index) => {
    const date = addDays(today, index - 29);
    return { date, count: activityCount(readingDays, date), isToday: date === today, label: formatDateLabel(date, { weekday: 'long', day: 'numeric', month: 'long' }) };
  });
  const weekStart = addDays(today, -6);
  const monthStart = addDays(today, -29);
  const activeDatesLast7 = activeDates.filter((date) => date >= weekStart && date <= today).length;
  const activeDatesLast30 = activeDates.filter((date) => date >= monthStart && date <= today).length;
  const versesReadLast7 = last7.reduce((total, item) => total + item.count, 0);
  const versesReadLast30 = last30.reduce((total, item) => total + item.count, 0);
  const activeDays = activeDates.length;
  const averagePerActiveDay30 = activeDatesLast30 ? Math.round(versesReadLast30 / activeDatesLast30) : 0;
  const completedVerseCount = Math.min(6236, Array.isArray(readVerseKeys) ? new Set(readVerseKeys.filter(isValidVerseKey).map(String)).size : 0);
  const currentStreak = calculateCurrentStreak(activeDates, today);
  const bestStreak = calculateBestStreak(activeDates);
  const dailyGoalPercent = Math.min(100, Math.round((todayCount / target) * 100));
  const remainingVerses = Math.max(0, 6236 - completedVerseCount);
  const estimatedDaysToFinish = remainingVerses ? Math.ceil(remainingVerses / target) : 0;
  const peakDayCount = Math.max(1, ...last7.map((day) => day.count));
  return {
    todayKey: today,
    todayCount,
    dailyVerseGoal: target,
    dailyGoalPercent,
    remainingForToday: Math.max(0, target - todayCount),
    completedVerseCount,
    overallPercent: Math.min(100, Math.round((completedVerseCount / 6236) * 100)),
    remainingVerses,
    estimatedDaysToFinish,
    activeDaysLast7: activeDatesLast7,
    activeDaysLast30: activeDatesLast30,
    currentStreak,
    bestStreak,
    versesReadLast7,
    versesReadLast30,
    averagePerActiveDay30,
    activeDaysInHistory: activeDays,
    last7,
    last30,
    peakDayCount,
    isGoalComplete: todayCount >= target,
    todayLabel: formatDateLabel(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  };
}
